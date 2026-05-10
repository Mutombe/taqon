from django.db import models
from django.conf import settings

from apps.core.models import TimeStampedModel


class Download(TimeStampedModel):
    """Single record of a downloadable document leaving the platform.

    Server-rendered PDFs (business profile, catalogue, instant quote)
    write a row from the view itself. Client-rendered brochures (package
    + product, generated via print-window) ping the tracking endpoint
    so we still capture them.

    Captures both data (who, what, when) and metadata (size, duration,
    success/failure, surface), so the admin Downloads tab can show
    counts, conversion funnels, and surface which docs are popular.
    """

    KIND_CHOICES = [
        ('business_profile',  'Business profile'),
        ('packages_catalogue','Packages catalogue'),
        ('instant_quote',    'Instant quote'),
        ('package_brochure', 'Package brochure'),
        ('product_brochure', 'Product brochure'),
        ('other',            'Other'),
    ]

    SURFACE_CHOICES = [
        ('contact_page',      'Contact page'),
        ('about_page',        'About page'),
        ('nav_dropdown',      'Nav dropdown'),
        ('packages_page',     'Packages listing'),
        ('package_detail',    'Package detail'),
        ('product_detail',    'Product detail'),
        ('solar_advisor',     'Solar Advisor'),
        ('package_card',      'Family card'),
        ('admin',             'Admin dashboard'),
        ('direct_link',       'Direct link'),
        ('other',             'Other'),
    ]

    kind = models.CharField(max_length=32, choices=KIND_CHOICES, db_index=True)
    surface = models.CharField(max_length=32, choices=SURFACE_CHOICES, default='other', db_index=True)

    # What was downloaded — slug, family code, package id, ref number, etc.
    target_slug = models.CharField(max_length=200, blank=True, db_index=True)
    target_label = models.CharField(max_length=200, blank=True, help_text='Human-readable name')
    target_id = models.UUIDField(null=True, blank=True, db_index=True)

    # Who — when available (signed-in user OR public form data)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='downloads',
    )
    customer_name = models.CharField(max_length=200, blank=True)
    customer_email = models.EmailField(blank=True)

    # Request metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referer = models.URLField(blank=True, max_length=500)

    # Outcome
    file_size_bytes = models.PositiveIntegerField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    success = models.BooleanField(default=True, db_index=True)
    failure_reason = models.CharField(max_length=200, blank=True)

    # Free-form per-event metadata (e.g. for an instant quote: tier_label,
    # distance_km, system_size_kw — anything we want to surface later
    # without another schema change).
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Download'
        verbose_name_plural = 'Downloads'
        indexes = [
            models.Index(fields=['kind', '-created_at']),
            models.Index(fields=['surface', '-created_at']),
            models.Index(fields=['success', '-created_at']),
        ]

    def __str__(self):
        return f'{self.get_kind_display()} · {self.target_label or self.target_slug or "(none)"} · {self.created_at:%Y-%m-%d %H:%M}'
