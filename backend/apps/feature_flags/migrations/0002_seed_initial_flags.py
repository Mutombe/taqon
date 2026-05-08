"""Seed the six platform feature flags.

Defaults reflect what's actually built today: existing surfaces (technician
portal, courses, shop) are ON so the deploy doesn't disrupt customers;
unbuilt features (installer quoting tools, technical portals, industry
subscriptions) are OFF and admin will flip them when ready.
"""
from django.db import migrations


SEED = [
    # (key, name, description, is_enabled, enabled_for_staff_only)
    ('installer_accounts',     'Installer Accounts',
     'Self-serve sign-up and dashboards for installer / technician partners.',
     True,  False),
    ('installer_quoting_tools','Installer Quoting Tools',
     'Quote-builder and pricing tools available to installer accounts.',
     False, False),
    ('solar_training_courses', 'Solar Training Courses',
     'Public catalogue of solar training courses, lessons, and certificates.',
     True,  False),
    ('equipment_marketplace',  'Equipment Marketplace',
     'Public shop for solar panels, batteries, inverters, and accessories.',
     True,  False),
    ('technical_portals',      'Technical Portals',
     'Authenticated portals for partners (datasheets, install manuals, B2B tools).',
     False, False),
    ('industry_subscriptions', 'Industry Subscriptions',
     'Paid subscriptions to industry research, reports, and newsletters.',
     False, False),
]


def seed_flags(apps, schema_editor):
    FeatureFlag = apps.get_model('feature_flags', 'FeatureFlag')
    for key, name, desc, enabled, staff_only in SEED:
        FeatureFlag.objects.update_or_create(
            key=key,
            defaults={
                'name': name,
                'description': desc,
                'is_enabled': enabled,
                'enabled_for_staff_only': staff_only,
            },
        )


def unseed_flags(apps, schema_editor):
    FeatureFlag = apps.get_model('feature_flags', 'FeatureFlag')
    FeatureFlag.objects.filter(key__in=[k for k, *_ in SEED]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('feature_flags', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_flags, unseed_flags),
    ]
