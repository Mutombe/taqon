from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel


class PageView(TimeStampedModel):
    """Tracks page views for analytics."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='page_views',
    )
    path = models.CharField(max_length=500, db_index=True)
    referrer = models.URLField(max_length=1000, blank=True, default='')
    user_agent = models.CharField(max_length=500, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    session_key = models.CharField(max_length=64, blank=True, default='')
    device_type = models.CharField(
        max_length=10,
        choices=[('desktop', 'Desktop'), ('tablet', 'Tablet'), ('mobile', 'Mobile')],
        default='desktop',
    )
    country = models.CharField(max_length=2, blank=True, default='')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['path', 'created_at']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.path} @ {self.created_at:%Y-%m-%d %H:%M}"


class DailySnapshot(models.Model):
    """Pre-aggregated daily stats for fast dashboard loading."""
    date = models.DateField(unique=True, db_index=True)

    # Users
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)

    # Orders
    total_orders = models.PositiveIntegerField(default=0)
    new_orders = models.PositiveIntegerField(default=0)
    completed_orders = models.PositiveIntegerField(default=0)
    cancelled_orders = models.PositiveIntegerField(default=0)

    # Revenue
    revenue_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payments_count = models.PositiveIntegerField(default=0)

    # Quotations
    new_quotations = models.PositiveIntegerField(default=0)
    accepted_quotations = models.PositiveIntegerField(default=0)

    # Support
    new_tickets = models.PositiveIntegerField(default=0)
    resolved_tickets = models.PositiveIntegerField(default=0)

    # Courses
    new_enrollments = models.PositiveIntegerField(default=0)
    completed_courses = models.PositiveIntegerField(default=0)

    # Page views
    page_views = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Snapshot {self.date}"
