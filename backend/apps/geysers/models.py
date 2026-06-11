from decimal import Decimal

from django.db import models

from apps.core.models import SoftDeleteModel
from apps.core.utils import generate_unique_slug


class GeyserPackage(SoftDeleteModel):
    """A finished solar geyser package (gravity/pressure × 100/150/200/300L ×
    standard/smart). Pricing and the bill of materials come straight from the
    finalized package workbook. Structured to support a future Geyser Advisor
    that recommends a package from a few simple questions."""

    SYSTEM_CHOICES = [
        ('gravity', 'Gravity (Non-Pressure)'),
        ('pressure', 'Pressure'),
    ]
    VARIANT_CHOICES = [
        ('standard', 'Standard'),
        ('smart', 'Smart'),
    ]

    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True, db_index=True)
    system_type = models.CharField(max_length=10, choices=SYSTEM_CHOICES, db_index=True)
    capacity_litres = models.PositiveIntegerField(db_index=True)
    variant = models.CharField(max_length=10, choices=VARIANT_CHOICES, db_index=True)
    is_smart = models.BooleanField(default=False, db_index=True)
    brand = models.CharField(max_length=80, blank=True)
    geyser_unit = models.CharField(max_length=160, blank=True, help_text='The main collector/tank')

    short_description = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)

    # Price build-up (from the workbook): price = material + sundries + labour + transport.
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sundries_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    distance_km = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('10'))
    currency = models.CharField(max_length=3, default='USD')

    whats_included = models.JSONField(default=list, blank=True)
    features = models.JSONField(default=list, blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    components = models.JSONField(default=list, blank=True, help_text='Bill of materials: [{name, qty, unit_price}]')

    image_url = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'system_type', 'capacity_litres', 'variant']
        indexes = [
            models.Index(fields=['system_type', 'capacity_litres']),
            models.Index(fields=['is_active', 'sort_order']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(GeyserPackage, self.name)
        self.is_smart = self.variant == 'smart'
        super().save(*args, **kwargs)
