from django.db import models

from apps.core.models import AuditableModel


# Canonical keys for the platform-level features the dashboard can lock/unlock.
# Adding a new key here makes the seed migration register it; admins flip it
# from /admin/feature-flags after deploy.
PLATFORM_FEATURES = [
    ('installer_accounts',     'Installer Accounts',        'Self-serve sign-up and dashboards for installer / technician partners.'),
    ('installer_quoting_tools','Installer Quoting Tools',   'Quote-builder and pricing tools available to installer accounts.'),
    ('solar_training_courses', 'Solar Training Courses',    'Public catalogue of solar training courses, lessons, and certificates.'),
    ('equipment_marketplace',  'Equipment Marketplace',     'Public shop for solar panels, batteries, inverters, and accessories.'),
    ('technical_portals',      'Technical Portals',         'Authenticated portals for partners (datasheets, install manuals, B2B tools).'),
    ('industry_subscriptions', 'Industry Subscriptions',    'Paid subscriptions to industry research, reports, and newsletters.'),
]


class FeatureFlag(AuditableModel):
    """A single platform-level feature toggle.

    The `key` is the stable machine identifier the frontend gates against.
    The flag is read by the public `/api/v1/feature-flags/` endpoint (cached
    aggressively) and updated by admin staff via the admin endpoint.

    `enabled_for_staff_only` lets us soft-launch a feature: customers see
    the off state, but staff users can still access the live feature for
    QA before flipping it fully on.
    """

    key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text='Stable machine identifier — referenced by frontend gates.',
    )
    name = models.CharField(
        max_length=128,
        help_text='Human-readable name shown in the admin dashboard.',
    )
    description = models.TextField(
        blank=True,
        help_text='What this feature does — shown to admins as context.',
    )
    is_enabled = models.BooleanField(
        default=False,
        help_text='Master switch. If false, the feature is locked for everyone.',
    )
    enabled_for_staff_only = models.BooleanField(
        default=False,
        help_text='If true, only authenticated staff users see the feature live.',
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Feature Flag'
        verbose_name_plural = 'Feature Flags'

    def __str__(self):
        state = 'ON' if self.is_enabled else 'OFF'
        if self.enabled_for_staff_only and self.is_enabled:
            state = 'STAFF-ONLY'
        return f'{self.name} [{state}]'

    def is_visible_to(self, user):
        """Resolve the flag for a specific user request context."""
        if not self.is_enabled:
            return False
        if self.enabled_for_staff_only:
            return bool(user and user.is_authenticated and user.is_staff)
        return True
