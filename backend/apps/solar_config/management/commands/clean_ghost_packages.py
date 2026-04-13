"""
Soft-delete legacy packages that don't match the 28 real packages
from packages draft.xlsx.

Safe to run multiple times — idempotent.
"""
from django.core.management.base import BaseCommand
from apps.solar_config.models import SolarPackageTemplate, PackageComponent


# The 28 canonical package names from packages draft.xlsx
REAL_PACKAGES = {
    'Home ECONOMY 3KVA',
    'HOME LUXURY 1.0 5KVA',
    'HOME LUXURY 1.1 5KVA',
    'HOME LUXURY 1.2 5KVA',
    'HOME LUXURY 2.0 5KVA',
    'HOME LUXURY 2.1 5KVA',
    'HOME LUXURY PERFORMANCE 5KVA',
    'HOME DELUX 2.0 8KVA',
    'HOME DELUXE 2.1 8KVA',
    'HOME DELUX V2.2  8KVA',
    'HOME DELUX PERFORMANCE 8KVA',
    'ULTRA POWER V2.0 10KVA',
    'ULTRA POWER V2.1 10KVA',
    'ULTRA POWER PERFORMANCE 10KVA',
    'PREMUIM POWER 1.0 12KVA',
    'PREMIUM POWER 1.1 12KVA',
    'PREMIUM POWER V1 PERFORMANCE 12KVA',
    'PREMIUM POWER 2.0 12KVA',
    'PREMIUM POWER 2.1 12KVA',
    'PREMIUM POWER V2 PERFORMANCE 12KVA',
    'PRO POWER 1.0',
    'PRO POWER 1.1',
    'PRO POWER V1.2',
    'PRO POWER PERFORMANCE',
    'MASTER POWER V1.0',
    'MASTER POWER V1.2',
    'MASTER POWER V1.3',
    'MASTER POWER PERFORMANCE',
}


class Command(BaseCommand):
    help = 'Soft-delete legacy/ghost packages not in packages draft.xlsx'

    def handle(self, *args, **options):
        ghosts = [
            p for p in SolarPackageTemplate.objects.filter(is_deleted=False)
            if p.name not in REAL_PACKAGES
        ]

        for g in ghosts:
            self.stdout.write(f'  Soft-deleting: {g.name} (${g.price})')
            g.soft_delete()

        # Hard-delete PackageComponent rows pointing to soft-deleted packages
        # (soft-deleted packages are invisible but their child rows linger and
        # break joins in engine queries).
        orphans = [
            pc for pc in PackageComponent.objects.select_related('package').all()
            if pc.package.is_deleted
        ]
        for o in orphans:
            o.delete()

        remaining = SolarPackageTemplate.objects.filter(is_deleted=False).count()
        if ghosts or orphans:
            self.stdout.write(self.style.SUCCESS(
                f'\nDeleted {len(ghosts)} ghost packages and {len(orphans)} orphaned item rows. '
                f'{remaining} real packages remaining.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('Database is clean — nothing to do.'))
