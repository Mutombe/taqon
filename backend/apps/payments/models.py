import uuid
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from apps.core.models import TimeStampedModel


class Payment(TimeStampedModel):
    """
    Tracks a single payment attempt against any payable object (Order, Quotation, etc.)
    via GenericForeignKey.
    """

    GATEWAY_CHOICES = [
        ('paynow', 'Paynow'),
        ('stripe', 'Stripe'),
        ('cash', 'Cash'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('awaiting_redirect', 'Awaiting Redirect'),
        ('processing', 'Processing'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]

    METHOD_CHOICES = [
        ('ecocash', 'EcoCash'),
        ('onemoney', 'OneMoney'),
        ('innbucks', 'InnBucks'),
        ('bank_transfer', 'Bank Transfer'),
        ('zimswitch', 'ZimSwitch'),
        ('card', 'Card'),
        ('cash', 'Cash'),
    ]

    CURRENCY_CHOICES = [
        ('USD', 'US Dollar'),
        ('ZWG', 'Zimbabwe Gold'),
    ]

    # Link to any payable model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.UUIDField()
    content_object = GenericForeignKey('content_type', 'object_id')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='payments',
    )

    reference = models.CharField(max_length=50, unique=True, db_index=True)
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    method = models.CharField(max_length=30, choices=METHOD_CHOICES)
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending', db_index=True)

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='USD')

    # Gateway-specific references
    gateway_reference = models.CharField(max_length=255, blank=True, db_index=True)
    gateway_poll_url = models.URLField(blank=True)
    gateway_redirect_url = models.URLField(blank=True)

    # Stripe specific
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, db_index=True)
    stripe_client_secret = models.CharField(max_length=255, blank=True)

    # Paynow specific
    paynow_poll_url = models.URLField(blank=True)

    # Phone for mobile money
    phone_number = models.CharField(max_length=20, blank=True)

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['gateway', 'status']),
        ]

    def __str__(self):
        return f"Payment {self.reference} - {self.gateway} - {self.status}"


class PaymentWebhookLog(TimeStampedModel):
    """
    Logs every webhook call from Paynow/Stripe for auditing and debugging.
    """

    GATEWAY_CHOICES = [
        ('paynow', 'Paynow'),
        ('stripe', 'Stripe'),
    ]

    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES)
    event_type = models.CharField(max_length=100, blank=True)
    payment_reference = models.CharField(max_length=255, blank=True, db_index=True)
    raw_payload = models.JSONField(default=dict)
    headers = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Webhook Log'
        verbose_name_plural = 'Webhook Logs'

    def __str__(self):
        return f"{self.gateway} webhook - {self.event_type or 'unknown'} - {self.created_at}"
