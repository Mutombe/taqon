from django.contrib import admin
from .models import Payment, PaymentWebhookLog


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'reference', 'gateway', 'method', 'status',
        'amount', 'currency', 'user', 'paid_at', 'created_at',
    ]
    list_filter = ['gateway', 'method', 'status', 'currency', 'created_at']
    search_fields = [
        'reference', 'gateway_reference', 'stripe_payment_intent_id',
        'phone_number', 'user__email',
    ]
    readonly_fields = [
        'id', 'reference', 'gateway_reference', 'gateway_poll_url',
        'gateway_redirect_url', 'stripe_payment_intent_id',
        'stripe_client_secret', 'paynow_poll_url',
        'ip_address', 'paid_at', 'created_at', 'updated_at',
        'content_type', 'object_id', 'metadata',
    ]
    ordering = ['-created_at']

    fieldsets = (
        (None, {
            'fields': ('reference', 'user', 'status', 'amount', 'currency'),
        }),
        ('Gateway', {
            'fields': (
                'gateway', 'method', 'phone_number',
                'gateway_reference', 'gateway_redirect_url', 'gateway_poll_url',
            ),
        }),
        ('Stripe', {
            'fields': ('stripe_payment_intent_id', 'stripe_client_secret'),
            'classes': ('collapse',),
        }),
        ('Paynow', {
            'fields': ('paynow_poll_url',),
            'classes': ('collapse',),
        }),
        ('Linked Object', {
            'fields': ('content_type', 'object_id'),
        }),
        ('Details', {
            'fields': ('failure_reason', 'ip_address', 'metadata', 'paid_at', 'created_at', 'updated_at'),
        }),
    )


@admin.register(PaymentWebhookLog)
class PaymentWebhookLogAdmin(admin.ModelAdmin):
    list_display = ['gateway', 'event_type', 'payment_reference', 'processed', 'created_at']
    list_filter = ['gateway', 'processed', 'created_at']
    search_fields = ['payment_reference', 'event_type']
    readonly_fields = [
        'id', 'gateway', 'event_type', 'payment_reference',
        'raw_payload', 'headers', 'ip_address',
        'processed', 'processing_error', 'created_at',
    ]
    ordering = ['-created_at']
