from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.core.constants import NOTIFICATION_TYPES


class Notification(TimeStampedModel):
    """
    In-app notification for a user. Created by system events
    (order updates, ticket replies, job assignments, etc.).
    """

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=300)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Navigation
    action_url = models.CharField(max_length=500, blank=True, help_text='Frontend route to navigate to')
    action_label = models.CharField(max_length=100, blank=True, help_text='Button text e.g. "View Order"')

    # Optional links to entities
    order_id = models.UUIDField(null=True, blank=True)
    ticket_id = models.UUIDField(null=True, blank=True)
    job_id = models.UUIDField(null=True, blank=True)
    course_id = models.UUIDField(null=True, blank=True)
    quotation_id = models.UUIDField(null=True, blank=True)

    # Flexible metadata
    metadata = models.JSONField(default=dict, blank=True)

    # Sender info (for admin-sent notifications)
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sent_notifications',
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
            models.Index(fields=['user', 'notification_type']),
        ]

    def __str__(self):
        status = 'read' if self.is_read else 'unread'
        return f"[{status}] {self.title} → {self.user.email}"

    def mark_read(self):
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(TimeStampedModel):
    """
    Per-user notification preferences. Controls which notification
    types the user wants to receive via each channel.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notification_preferences',
    )

    # In-app toggles (all on by default)
    in_app_order_update = models.BooleanField(default=True)
    in_app_payment_received = models.BooleanField(default=True)
    in_app_quote_ready = models.BooleanField(default=True)
    in_app_job_assigned = models.BooleanField(default=True)
    in_app_ticket_reply = models.BooleanField(default=True)
    in_app_course_update = models.BooleanField(default=True)
    in_app_promotion = models.BooleanField(default=True)
    in_app_system = models.BooleanField(default=True)

    # Email toggles
    email_order_update = models.BooleanField(default=True)
    email_payment_received = models.BooleanField(default=True)
    email_quote_ready = models.BooleanField(default=True)
    email_job_assigned = models.BooleanField(default=True)
    email_ticket_reply = models.BooleanField(default=True)
    email_course_update = models.BooleanField(default=False)
    email_promotion = models.BooleanField(default=False)
    email_system = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Notification preferences'

    def __str__(self):
        return f"Preferences for {self.user.email}"

    def is_enabled(self, notification_type, channel='in_app'):
        """Check if a specific notification type is enabled for a channel."""
        field_name = f'{channel}_{notification_type}'
        return getattr(self, field_name, True)


def send_notification(user, notification_type, title, message, **kwargs):
    """
    Helper function for other apps to send notifications.
    Respects user preferences. Returns the Notification or None.

    Usage:
        from apps.notifications.models import send_notification
        send_notification(
            user=customer,
            notification_type='order_update',
            title='Order Confirmed',
            message='Your order ORD-2026-ABCDEF has been confirmed.',
            action_url='/account/orders/ORD-2026-ABCDEF',
            action_label='View Order',
            order_id=order.id,
        )
    """
    # Check preferences
    try:
        prefs = user.notification_preferences
        if not prefs.is_enabled(notification_type, 'in_app'):
            return None
    except NotificationPreference.DoesNotExist:
        pass  # No preferences = all enabled

    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        priority=kwargs.get('priority', 'normal'),
        action_url=kwargs.get('action_url', ''),
        action_label=kwargs.get('action_label', ''),
        order_id=kwargs.get('order_id'),
        ticket_id=kwargs.get('ticket_id'),
        job_id=kwargs.get('job_id'),
        course_id=kwargs.get('course_id'),
        quotation_id=kwargs.get('quotation_id'),
        metadata=kwargs.get('metadata', {}),
        sent_by=kwargs.get('sent_by'),
    )

    return notification
