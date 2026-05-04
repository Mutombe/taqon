"""Reconcile the Home Luxury family + its variants with their actual inverter kVA.

Some Home Luxury packages ship with the Growatt 6kVA inverter rather than the
5kVA. Family-level showcase reads "Home Luxury 5/6kVA" (covers both ratings)
while each individual variant reflects its real inverter kVA — 5 or 6 — both
in `inverter_kva` and in the package name suffix.

Idempotent. Run with `--dry-run` to preview.
"""
import re
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.solar_config.models import PackageFamily, SolarPackageTemplate


FAMILY_SLUG = 'home-luxury-5kva'
NEW_FAMILY_NAME = 'Home Luxury 5kVA/6kVA'

# Matches a "5KVA" / "6KVA" / "5/6KVA" suffix in a package name (case-insensitive).
KVA_SUFFIX = re.compile(r'\b(\d+(?:/\d+)?)\s*KVA\b', re.IGNORECASE)


def kva_label(kva):
    """Format a Decimal kVA as a name-suffix token: 5KVA, 6KVA, 5.5KVA."""
    if kva == kva.to_integral_value():
        return f'{int(kva)}KVA'
    return f'{kva.normalize()}KVA'


class Command(BaseCommand):
    help = (
        'Reconcile Home Luxury family + variant kVA labels with actual inverter '
        'components. Family becomes "Home Luxury 5/6kVA"; each variant reflects '
        'its real inverter rating (5 or 6 kVA).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without writing to the database.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options['dry_run']

        family = PackageFamily.objects.filter(slug=FAMILY_SLUG).first()
        if not family:
            self.stdout.write(self.style.WARNING(
                f'No PackageFamily with slug {FAMILY_SLUG!r} — nothing to do.'
            ))
            return

        # 1. Family display name covers both ratings.
        if family.name != NEW_FAMILY_NAME:
            self.stdout.write(f'family: {family.name!r} -> {NEW_FAMILY_NAME!r}')
            family.name = NEW_FAMILY_NAME
            if not dry_run:
                family.save(update_fields=['name', 'updated_at'])
        else:
            self.stdout.write(f'family already named {NEW_FAMILY_NAME!r}')

        # 2. Each variant — derive kVA from the largest inverter component
        #    in its bill of materials, then sync `inverter_kva` and the name
        #    suffix to that real value.
        renamed = 0
        kva_synced = 0
        skipped = 0

        packages = (
            SolarPackageTemplate.objects
            .filter(family=family, is_deleted=False)
            .prefetch_related('items__component')
        )

        # Match a leading "<n>KVA" or "<n.n>KVA" token in a component name,
        # e.g. "6KVA GROWATT HYBRID INVERTER 48V" -> "6".
        kva_in_name = re.compile(r'^\s*(\d+(?:\.\d+)?)\s*KVA\b', re.IGNORECASE)

        def detect_kva(component):
            """Return the inverter's kVA as a Decimal, or None if undetectable.
            Prefers `wattage` (VA) when set; falls back to parsing the leading
            "NKVA" token from the component name (current data has it there)."""
            if component.wattage and int(component.wattage) > 0:
                return Decimal(int(component.wattage)) / Decimal(1000)
            m = kva_in_name.search(component.name or '')
            if m:
                return Decimal(m.group(1))
            return None

        for pkg in packages:
            inverter_items = [i for i in pkg.items.all() if i.component.category == 'inverter']
            if not inverter_items:
                self.stdout.write(self.style.WARNING(
                    f'  {pkg.slug}: no inverter component, skipped'
                ))
                skipped += 1
                continue

            # Largest inverter wins (handles parallel-stacked configs).
            kvas = [k for k in (detect_kva(i.component) for i in inverter_items) if k is not None]
            if not kvas:
                self.stdout.write(self.style.WARNING(
                    f'  {pkg.slug}: inverter kVA undetectable from wattage or name, skipped'
                ))
                skipped += 1
                continue

            actual_kva = max(kvas)
            updates = {}

            if pkg.inverter_kva != actual_kva:
                self.stdout.write(
                    f'  {pkg.slug}: inverter_kva {pkg.inverter_kva} -> {actual_kva}'
                )
                pkg.inverter_kva = actual_kva
                updates['inverter_kva'] = True
                kva_synced += 1

            new_suffix = kva_label(actual_kva)
            new_name = KVA_SUFFIX.sub(new_suffix, pkg.name)
            if new_name != pkg.name:
                self.stdout.write(f'  {pkg.slug}: name {pkg.name!r} -> {new_name!r}')
                pkg.name = new_name
                updates['name'] = True
                renamed += 1

            if updates and not dry_run:
                fields = list(updates.keys()) + ['updated_at']
                pkg.save(update_fields=fields)

        verb = 'Would update' if dry_run else 'Updated'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb}: {kva_synced} variant kVA sync(s), {renamed} rename(s); '
            f'{skipped} skipped.'
        ))

        if dry_run:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING('Dry run — no changes committed.'))
