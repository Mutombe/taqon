from django.db import models

from apps.core.models import AuditableModel


class Inquiry(AuditableModel):
    """A customer inquiry submitted via the public /get-quote form.

    Captures everything we need to size a system + reach back: contact
    details, target installation area, monthly grid bill, the appliance
    selection, and any free-form notes. Admins triage from the dashboard
    Inquiries tab; the same record can later be converted into a
    formal Quotation via existing endpoints.
    """

    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('quoted', 'Quoted'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('archived', 'Archived'),
    ]

    SOURCE_CHOICES = [
        ('public_form', 'Public form'),
        ('whatsapp_link', 'WhatsApp link'),
        ('email_link', 'Email link'),
        ('shop_request', 'Shop checkout request'),
        ('other', 'Other'),
    ]

    # Customer contact
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=64, blank=True)

    # Installation site
    area = models.CharField(max_length=200, blank=True, help_text='Suburb / town the system will be installed.')
    distance_km = models.PositiveIntegerField(null=True, blank=True, help_text='Distance from Taqon HQ.')

    # Demand context
    monthly_grid_bill = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text='Approximate current monthly electricity bill (USD).',
    )
    appliances = models.JSONField(
        default=list, blank=True,
        help_text='Selected appliances and quantities — same shape as Solar Advisor.',
    )
    message = models.TextField(blank=True, help_text='Free-form notes from the customer.')

    # Triage
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='public_form')
    admin_notes = models.TextField(blank=True, help_text='Internal notes — never shown to the customer.')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer Inquiry'
        verbose_name_plural = 'Customer Inquiries'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f'{self.name} <{self.email}> [{self.status}]'

    @property
    def appliance_count(self):
        if isinstance(self.appliances, list):
            return sum(int(item.get('quantity', 1) or 1) for item in self.appliances if isinstance(item, dict))
        return 0
