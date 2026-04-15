"""
Adjust concurrency_factor on a known set of appliances.

Run once after deploy:
    python manage.py tweak_concurrency

Idempotent — re-running just re-applies the same numbers.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.solar_config.models import Appliance


# (name, target concurrency_factor) — names are matched case-insensitively.
# Seed values restored so the recommendation mapping returns to pre-tweak
# behaviour. Only Lawn Mower stays — it's a new appliance, not in the
# original seed, so its value doesn't change any existing recommendation
# until a customer actually selects it.
TWEAKS = [
    ('Kettle',       Decimal('0.30')),
    ('Microwave',    Decimal('0.30')),
    ('Slow Cooker',  Decimal('0.30')),
    ('Rice Cooker',  Decimal('0.30')),
    ('Air Fryer',    Decimal('0.30')),
    ('Ice Maker',    Decimal('0.50')),
    ('Lawn Mower',   Decimal('0.70')),
]


class Command(BaseCommand):
    help = 'Adjust concurrency_factor for kettle, microwave, lawn mower, cookers, air fryer.'

    def handle(self, *args, **options):
        updated = []
        unchanged = []
        missing = []

        for name, target in TWEAKS:
            qs = Appliance.objects.filter(name__iexact=name, is_deleted=False)
            if not qs.exists():
                missing.append(name)
                continue

            for appliance in qs:
                old = appliance.concurrency_factor
                if old == target:
                    unchanged.append(f'{appliance.name} (already {target})')
                    continue
                appliance.concurrency_factor = target
                appliance.save(update_fields=['concurrency_factor', 'updated_at'])
                updated.append(f'{appliance.name}: {old} -> {target}')

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\nUpdated {len(updated)}:'))
        for line in updated:
            self.stdout.write(f'  [+] {line}')

        if unchanged:
            self.stdout.write(self.style.NOTICE(f'\nAlready at target {len(unchanged)}:'))
            for line in unchanged:
                self.stdout.write(f'  [.] {line}')

        if missing:
            self.stdout.write(self.style.WARNING(
                f'\nNot found {len(missing)} '
                f'(rename or add via /admin/appliances if needed):'
            ))
            for name in missing:
                self.stdout.write(f'  [?] {name}')
