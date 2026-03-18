from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.constants import TICKET_CATEGORIES, PRIORITY_LEVELS
from apps.core.utils import generate_reference


class FAQ(TimeStampedModel):
    """
    Frequently asked questions for the chatbot knowledge base
    and the public FAQ page.
    """

    CATEGORY_CHOICES = TICKET_CATEGORIES

    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    keywords = models.JSONField(
        default=list, blank=True,
        help_text='Keywords for chatbot matching',
    )
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    not_helpful_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-is_featured']
        verbose_name = 'FAQ'
        verbose_name_plural = 'FAQs'

    def __str__(self):
        return self.question[:80]


class SupportTicket(SoftDeleteModel):
    """
    A customer support ticket with threaded messages.
    """

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('waiting_customer', 'Waiting on Customer'),
        ('waiting_staff', 'Waiting on Staff'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    ticket_number = models.CharField(max_length=30, unique=True, blank=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='support_tickets',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_tickets',
    )
    subject = models.CharField(max_length=300)
    category = models.CharField(max_length=30, choices=TICKET_CATEGORIES, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    # Optional links to other entities
    order = models.ForeignKey(
        'shop.Order', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tickets',
    )
    job = models.ForeignKey(
        'technicians.Job', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tickets',
    )

    # Resolution
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='resolved_tickets',
    )
    resolution_notes = models.TextField(blank=True)

    # Satisfaction
    satisfaction_rating = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    satisfaction_comment = models.TextField(blank=True)

    # Metadata
    last_reply_at = models.DateTimeField(null=True, blank=True)
    last_reply_by = models.CharField(max_length=20, blank=True, help_text='customer or staff')
    message_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f"{self.ticket_number} — {self.subject[:50]}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = generate_reference('TKT')
        super().save(*args, **kwargs)


class TicketMessage(TimeStampedModel):
    """
    A message within a support ticket thread.
    """

    SENDER_TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('staff', 'Staff'),
        ('system', 'System'),
    ]

    ticket = models.ForeignKey(
        SupportTicket, on_delete=models.CASCADE, related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='ticket_messages',
    )
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False, help_text='Internal note visible only to staff',
    )

    # Attachments
    attachment = models.FileField(upload_to='support/attachments/', blank=True)
    attachment_url = models.URLField(blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type}: {self.content[:60]}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update ticket metadata
        from django.utils import timezone
        SupportTicket.objects.filter(pk=self.ticket_id).update(
            last_reply_at=timezone.now(),
            last_reply_by=self.sender_type,
            message_count=models.F('message_count') + 1,
        )


class ChatSession(TimeStampedModel):
    """
    Persists chatbot conversations server-side for logged-in users.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='chat_sessions',
    )
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    messages = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        user_str = self.user.email if self.user else self.session_key[:12]
        return f"Chat: {user_str} ({len(self.messages)} messages)"
