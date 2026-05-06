"""Seed customer-facing feature copy on every package, keyed by inverter brand.

Each feature is stored as a dict so the frontend can show a clean title in
the list and reveal the description on demand:

    {"title": "...", "description": "..."}

Brand is detected from the package's inverter component name. Idempotent —
safe to re-run; existing features are overwritten with the latest copy.
"""
import re

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.solar_config.models import SolarPackageTemplate


SUNSYNK_FEATURES = [
    {
        'title': 'Smart Energy Management',
        'description': 'Automatically balances solar, battery, and grid power to reduce costs and maximise efficiency.',
    },
    {
        'title': 'Net Metering Ready',
        'description': 'Supports exporting excess solar energy back to the grid where applicable.',
    },
    {
        'title': 'Quiet Operation',
        'description': 'Designed for low noise performance, ideal for indoor installations (especially 5kVA systems).',
    },
    {
        'title': 'Parallel Expansion Ready',
        'description': 'Easily expand your system by adding more inverters as your energy needs grow.',
    },
    {
        'title': 'Advanced Remote Monitoring',
        'description': 'Track and control your system in real-time from your phone or computer.',
    },
    {
        'title': 'Intelligent Programming',
        'description': 'Customise when and how your system uses solar, battery, or grid power.',
    },
]

GROWATT_FEATURES = [
    {
        'title': 'Reliable Backup Power',
        'description': 'Keeps your home running during outages using stored battery energy.',
    },
    {
        'title': 'Efficient Solar Utilisation',
        'description': 'Uses solar power during the day to reduce reliance on the grid.',
    },
    {
        'title': 'Remote Monitoring',
        'description': 'Monitor system performance through a mobile app or web portal.',
    },
    {
        'title': 'Flexible Battery Compatibility',
        'description': 'Works with a wide range of battery types, offering flexible system options.',
    },
    {
        'title': 'Simple and Stable Operation',
        'description': 'Designed for dependable performance with straightforward setup and use.',
    },
    {
        'title': 'Cost-Effective Solution',
        'description': 'An affordable entry point into solar energy without compromising reliability.',
    },
]

MUST_FEATURES = [
    {
        'title': 'Reliable Backup Power',
        'description': 'Provides consistent power during outages using battery storage.',
    },
    {
        'title': 'Direct and Simple Operation',
        'description': 'Straightforward system design without complex programming or automation.',
    },
    {
        'title': 'Stable Performance',
        'description': 'Delivers dependable power for essential household appliances.',
    },
    {
        'title': 'Fast Changeover',
        'description': 'Quickly switches to battery power when the grid goes down.',
    },
    {
        'title': 'Wide Compatibility',
        'description': 'Works with common battery types and basic solar configurations.',
    },
    {
        'title': 'Cost-Effective Solution',
        'description': 'An affordable option for essential backup power needs.',
    },
]

BRAND_FEATURES = {
    'sunsynk': SUNSYNK_FEATURES,
    'growatt': GROWATT_FEATURES,
    'must': MUST_FEATURES,
}

BRAND_PATTERN = re.compile(r'\b(SUNSYNK|GROWATT|MUST)\b', re.IGNORECASE)


def detect_brand(inverter_components):
    """Return 'sunsynk' / 'growatt' / 'must' from any matching inverter name."""
    for comp in inverter_components:
        m = BRAND_PATTERN.search(comp.name or '')
        if m:
            return m.group(1).lower()
        if comp.brand:
            m = BRAND_PATTERN.search(comp.brand)
            if m:
                return m.group(1).lower()
    return None


class Command(BaseCommand):
    help = (
        'Populate package.features with brand-specific marketing copy. '
        'Each entry is a {title, description} dict.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Preview without saving.')

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options['dry_run']

        packages = (
            SolarPackageTemplate.objects
            .filter(is_deleted=False)
            .prefetch_related('items__component')
        )

        applied = 0
        skipped = 0

        for pkg in packages:
            inverters = [i.component for i in pkg.items.all() if i.component.category == 'inverter']
            if not inverters:
                self.stdout.write(self.style.WARNING(
                    f'  {pkg.slug}: no inverter component, skipped'
                ))
                skipped += 1
                continue

            brand = detect_brand(inverters)
            if brand is None:
                self.stdout.write(self.style.WARNING(
                    f'  {pkg.slug}: brand undetectable from inverter name(s), skipped'
                ))
                skipped += 1
                continue

            new_features = BRAND_FEATURES[brand]
            if pkg.features == new_features:
                continue  # already up to date

            self.stdout.write(f'  {pkg.slug}: brand={brand} -> {len(new_features)} features')
            pkg.features = new_features
            if not dry_run:
                pkg.save(update_fields=['features', 'updated_at'])
            applied += 1

        verb = 'Would update' if dry_run else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb} {applied} package(s); {skipped} skipped.'
        ))

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING('Dry run — no changes committed.'))
