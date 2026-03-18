from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from apps.core.models import TimeStampedModel, AuditableModel


# ── Quotation Request (captures wizard submissions) ──

class QuotationRequest(TimeStampedModel):
    """
    Captures data from the QuoteWizard form.
    May or may not be linked to a registered user.
    """

    PROPERTY_TYPE_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('institutional', 'Institutional'),
        ('farm', 'Farm / Agricultural'),
    ]

    ROOF_TYPE_CHOICES = [
        ('pitched', 'Pitched / Gable'),
        ('flat', 'Flat Roof'),
        ('ground', 'Ground Mount'),
    ]

    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('quoted', 'Quotation Sent'),
        ('converted', 'Converted to Order'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='quote_requests',
    )

    # Contact info (always required, even if logged in)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    message = models.TextField(blank=True)

    # Wizard data
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    roof_type = models.CharField(max_length=20, choices=ROOF_TYPE_CHOICES)
    monthly_bill = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    appliances = models.JSONField(default=list, blank=True)
    budget_range = models.CharField(max_length=50, blank=True)

    # Calculated recommendation
    recommended_system_kw = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    recommended_panels = models.PositiveIntegerField(default=0)
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Admin
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    admin_notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_quote_requests',
    )

    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Quote Request - {self.name} ({self.property_type})"


# ── Quotation (formal quote from admin) ──

class Quotation(AuditableModel):
    """
    A formal quotation prepared by admin/sales, possibly from a QuotationRequest.
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
        ('revised', 'Revised'),
    ]

    quotation_number = models.CharField(max_length=20, unique=True, db_index=True)
    request = models.ForeignKey(
        QuotationRequest, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='quotations',
    )

    # Customer
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='quotations',
    )
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_address = models.TextField(blank=True)

    # Project details
    title = models.CharField(max_length=300, default='Solar Installation Quotation')
    description = models.TextField(blank=True)
    project_type = models.CharField(max_length=20, blank=True)
    system_size_kw = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # Pricing
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Tax percentage (e.g. 15)')
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_description = models.CharField(max_length=200, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')

    # Status & validity
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    valid_until = models.DateField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    viewed_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Terms
    terms_and_conditions = models.TextField(
        blank=True,
        default=(
            'This quotation is valid for 30 days from the date of issue. '
            'Prices are subject to change based on market conditions. '
            'Installation timeline will be confirmed upon acceptance. '
            'A 50% deposit is required to commence work. '
            'Warranty terms apply as per product specifications.'
        ),
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
        ]

    def __str__(self):
        return f"Quotation {self.quotation_number}"

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            self.quotation_number = self._generate_quotation_number()
        super().save(*args, **kwargs)

    def _generate_quotation_number(self):
        from django.utils import timezone
        year = timezone.now().year
        last = Quotation.objects.filter(
            quotation_number__startswith=f'QUO-{year}'
        ).order_by('-quotation_number').first()
        if last:
            num = int(last.quotation_number.split('-')[-1]) + 1
        else:
            num = 1
        return f'QUO-{year}-{num:05d}'

    def recalculate_totals(self):
        """Recalculate subtotal, tax, and total from items."""
        items = self.items.all()
        self.subtotal = sum(item.total_price for item in items)
        self.tax_amount = (self.subtotal * self.tax_rate / 100) if self.tax_rate else 0
        self.total = self.subtotal + self.tax_amount - self.discount_amount
        self.save(update_fields=['subtotal', 'tax_amount', 'total', 'updated_at'])


class QuotationItem(TimeStampedModel):
    """Line item in a quotation."""

    ITEM_TYPE_CHOICES = [
        ('product', 'Product'),
        ('service', 'Service'),
        ('labour', 'Labour'),
        ('other', 'Other'),
    ]

    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(
        'shop.Product', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='quotation_items',
    )

    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, default='product')
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    warranty = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


# ── Invoice ──

class Invoice(AuditableModel):
    """
    Invoice generated from an Order or Quotation.
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    invoice_number = models.CharField(max_length=20, unique=True, db_index=True)

    # Generic link to Order or Quotation
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    # Customer
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name='invoices',
    )
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_address = models.TextField(blank=True)

    # Pricing
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')

    # Status & dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    # PDF
    pdf_file = models.FileField(upload_to='invoices/pdfs/', blank=True)

    notes = models.TextField(blank=True)
    terms = models.TextField(
        blank=True,
        default='Payment is due within 14 days of invoice date. Thank you for your business.',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['content_type', 'object_id']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_invoice_number()
        self.amount_due = self.total - self.amount_paid
        super().save(*args, **kwargs)

    def _generate_invoice_number(self):
        from django.utils import timezone
        year = timezone.now().year
        last = Invoice.objects.filter(
            invoice_number__startswith=f'INV-{year}'
        ).order_by('-invoice_number').first()
        if last:
            num = int(last.invoice_number.split('-')[-1]) + 1
        else:
            num = 1
        return f'INV-{year}-{num:05d}'


class InvoiceItem(TimeStampedModel):
    """Line item on an invoice."""

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.name} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
