"""Rename the Home Luxury family to reflect both 5kVA and 6kVA inverter ratings.

Some Home Luxury variants ship with the Growatt 6kVA inverter rather than the
5kVA, so the family display name should read "5/6kVA". Slugs are left
unchanged to keep existing URLs working.

Idempotent — safe to run repeatedly.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.solar_config.models import PackageFamily, SolarPackageTemplate


OLD_FAMILY_NAME = 'Home Luxury 5kVA'
NEW_FAMILY_NAME = 'Home Luxury 5/6kVA'

OLD_KVA_TOKEN = '5KVA'
NEW_KVA_TOKEN = '5/6KVA'


class Command(BaseCommand):
    help = 'Rename Home Luxury family from "5kVA" to "5/6kVA" everywhere customer-facing.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print changes without committing.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options['dry_run']

        family = PackageFamily.objects.filter(slug='home-luxury-5kva').first()
        if not family:
            self.stdout.write(self.style.WARNING('No PackageFamily with slug "home-luxury-5kva" — nothing to do.'))
            return

        # 1. Family display name
        if family.name != NEW_FAMILY_NAME:
            self.stdout.write(f'  family: {family.name!r} -> {NEW_FAMILY_NAME!r}')
            family.name = NEW_FAMILY_NAME
            if not dry_run:
                family.save(update_fields=['name', 'updated_at'])
        else:
            self.stdout.write(f'  family already named {NEW_FAMILY_NAME!r}')

        # 2. Each package template under that family — rename "5KVA" -> "5/6KVA"
        renamed = 0
        skipped = 0
        for pkg in SolarPackageTemplate.objects.filter(family=family, is_deleted=False):
            if OLD_KVA_TOKEN in pkg.name.upper():
                # Replace case-insensitively but preserve case
                idx = pkg.name.upper().rfind(OLD_KVA_TOKEN)
                if idx >= 0:
                    new_name = pkg.name[:idx] + NEW_KVA_TOKEN + pkg.name[idx + len(OLD_KVA_TOKEN):]
                    self.stdout.write(f'  package: {pkg.name!r} -> {new_name!r}')
                    pkg.name = new_name
                    if not dry_run:
                        pkg.save(update_fields=['name', 'updated_at'])
                    renamed += 1
                    continue
            skipped += 1

        verb = 'Would rename' if dry_run else 'Renamed'
        self.stdout.write(self.style.SUCCESS(
            f'\n{verb} {renamed} package(s); {skipped} unchanged.'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run — no changes committed.'))
            transaction.set_rollback(True)
