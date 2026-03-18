from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel


class Comment(TimeStampedModel):
    """Comment on a blog post or project, supporting both authenticated and guest users."""

    CONTENT_TYPE_CHOICES = [
        ('blog_post', 'Blog Post'),
        ('project', 'Project'),
    ]

    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content_slug = models.CharField(max_length=320, db_index=True)

    # Threading — null means top-level comment
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='replies',
    )

    # Author — null for guest comments
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='comments',
    )
    guest_name = models.CharField(max_length=100, blank=True)
    guest_email = models.EmailField(blank=True)

    text = models.TextField()
    likes = models.PositiveIntegerField(default=0)
    is_approved = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'content_slug']),
        ]

    @property
    def author_name(self):
        if self.user:
            full = f"{self.user.first_name} {self.user.last_name}".strip()
            return full or self.user.email
        return self.guest_name or 'Anonymous'

    def __str__(self):
        text_preview = self.text[:50] + ('...' if len(self.text) > 50 else '')
        return f"{self.author_name}: {text_preview}"
