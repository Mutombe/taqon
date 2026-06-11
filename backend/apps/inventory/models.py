"""Supplier inventory & pricing intelligence (admin-only).

A pool where the team logs the materials they buy, the suppliers they buy from,
and the prices quoted — so they can compare suppliers, see average prices per
material, attach the supplier quotations the prices came from, and review a full
log of every price change over time.

Models:
  MaterialCategory  – Plumbing / Electrical / Construction (extensible)
  Material          – an item bought from suppliers (pipe, cable, cement, …)
  Supplier          – a vendor
  SupplierPrice     – the current price of a material from a supplier
  PriceHistory      – append-only log of every price set / change
  SupplierQuotation – an uploaded quotation document
"""
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator

from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.utils import generate_unique_slug


class MaterialCategory(TimeStampedModel):
    """High-level grouping for materials — e.g. Plumbing, Electrical, Construction."""

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, db_index=True)
    description = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Material categories'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(MaterialCategory, self.name)
        super().save(*args, **kwargs)


class Supplier(SoftDeleteModel):
    """A vendor the team buys materials from."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    contact_person = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    website = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Supplier, self.name)
        super().save(*args, **kwargs)


class Material(SoftDeleteModel):
    """An item the team purchases — the thing whose price is compared across suppliers."""

    category = models.ForeignKey(
        MaterialCategory, on_delete=models.PROTECT, related_name='materials',
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, db_index=True)
    specification = models.CharField(max_length=200, blank=True, help_text='Size/spec, e.g. 20mm, 2.5mm²')
    brand = models.CharField(max_length=120, blank=True)
    unit = models.CharField(max_length=40, blank=True, help_text='each, m, roll, bag, …')
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    # Optional link to a shop product: the same item may be sold in the shop, and
    # we still want to track its supplier pricing here. A material can be imported
    # from a product, or promoted into one so it appears in the shop.
    product = models.ForeignKey(
        'shop.Product', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inventory_materials',
    )
    # Markup applied to the latest supplier price to get the shop price when this
    # material is published/synced to the shop: shop price = supplier × (1 + %/100).
    markup_pct = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    class Meta:
        ordering = ['category__sort_order', 'name']
        indexes = [models.Index(fields=['category', 'is_active'])]

    def __str__(self):
        return f'{self.name}{f" ({self.specification})" if self.specification else ""}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Material, self.name)
        super().save(*args, **kwargs)


class SupplierQuotation(SoftDeleteModel):
    """An uploaded supplier quotation document the logged prices can reference."""

    supplier = models.ForeignKey(
        Supplier, on_delete=models.CASCADE, related_name='quotations',
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='supplier_quotations/', blank=True, null=True)
    reference = models.CharField(max_length=120, blank=True, help_text='Quote/invoice number')
    quote_date = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-quote_date', '-created_at']

    def __str__(self):
        return f'{self.title} — {self.supplier.name}'


class SupplierPrice(SoftDeleteModel):
    """The current price of a material from a particular supplier.

    Updating the price appends a PriceHistory row (handled by the admin views),
    so the full price trail is preserved.
    """

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='prices')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='supplier_prices')
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    currency = models.CharField(max_length=3, default='USD')
    source_quotation = models.ForeignKey(
        SupplierQuotation, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='priced_items',
    )
    note = models.CharField(max_length=300, blank=True)
    quoted_at = models.DateField(null=True, blank=True, help_text='Date this price was quoted')

    class Meta:
        ordering = ['material__name', 'price']
        constraints = [
            models.UniqueConstraint(
                fields=['supplier', 'material'],
                condition=models.Q(is_deleted=False),
                name='uniq_active_supplier_material_price',
            ),
        ]

    def __str__(self):
        return f'{self.material.name} @ {self.supplier.name}: {self.currency} {self.price}'


class PriceHistory(TimeStampedModel):
    """Append-only log of every price set or changed for a (supplier, material)."""

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='price_history')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='price_history')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    previous_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    change_pct = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='USD')
    source_quotation = models.ForeignKey(
        SupplierQuotation, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='price_logs',
    )
    note = models.CharField(max_length=300, blank=True)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inventory_price_logs',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Price history'
        indexes = [
            models.Index(fields=['material', '-created_at']),
            models.Index(fields=['supplier', '-created_at']),
        ]

    def __str__(self):
        return f'{self.material.name} @ {self.supplier.name}: {self.currency} {self.price} ({self.created_at:%Y-%m-%d})'

    @staticmethod
    def record(*, supplier, material, price, previous_price=None, currency='USD',
               source_quotation=None, note='', user=None):
        """Create a history row, computing the percentage change vs the previous price."""
        change_pct = None
        if previous_price not in (None, '') and Decimal(str(previous_price)) != 0:
            change_pct = ((Decimal(str(price)) - Decimal(str(previous_price)))
                          / Decimal(str(previous_price)) * Decimal('100')).quantize(Decimal('0.01'))
        return PriceHistory.objects.create(
            supplier=supplier, material=material, price=price,
            previous_price=previous_price or None, change_pct=change_pct,
            currency=currency, source_quotation=source_quotation,
            note=note or '', recorded_by=user,
        )


class AuditLog(TimeStampedModel):
    """A unified trail of who changed what (and when) across the inventory module
    — suppliers, materials, prices, quotations, and categories."""

    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
    ]
    TARGET_CHOICES = [
        ('supplier', 'Supplier'),
        ('material', 'Material'),
        ('price', 'Supplier Price'),
        ('quotation', 'Quotation'),
        ('category', 'Category'),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='inventory_audit_logs',
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES, db_index=True)
    target_name = models.CharField(max_length=300)
    target_id = models.CharField(max_length=64, blank=True)
    summary = models.CharField(max_length=400, blank=True)
    # Field-level diff: {field: {"from": ..., "to": ...}}
    changes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_type', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        return f'{self.get_action_display()} {self.target_type} "{self.target_name}"'

    @staticmethod
    def record(*, actor, action, target_type, target_name, target_id='', summary='', changes=None):
        return AuditLog.objects.create(
            actor=actor, action=action, target_type=target_type,
            target_name=str(target_name)[:300], target_id=str(target_id or ''),
            summary=summary or '', changes=changes or {},
        )
