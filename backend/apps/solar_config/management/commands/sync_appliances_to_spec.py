"""
Sync appliances to match the updated algorithm PDF Table A exactly.
Deactivates appliances not in the spec, keeps only the canonical list.
"""
from django.core.management.base import BaseCommand
from apps.solar_config.models import Appliance

# Canonical appliance names from the PDF Table A (pages 11-12)
# Mapped to room categories
SPEC_APPLIANCES = {
    # LOUNGE
    'LED Light': 'lounge',
    'Lights Group (5-10)': 'lounge',
    'TV (Small)': 'lounge',
    'Home Theatre': 'lounge',
    'WiFi Router': 'lounge',
    'Ceiling Fan': 'lounge',
    'Pedestal Fan': 'lounge',
    'AC 9000 BTU': 'lounge',
    'AC 18000 BTU': 'lounge',
    'Electric Heater': 'lounge',
    'Gaming Console': 'lounge',
    'Projector': 'lounge',
    'Decoder': 'lounge',

    # KITCHEN
    'Fridge': 'kitchen',
    'Deep Freezer': 'kitchen',
    'Microwave': 'kitchen',
    'Kettle': 'kitchen',
    'Toaster': 'kitchen',
    'Electric Frying Pan': 'kitchen',
    'Blender': 'kitchen',
    'Coffee Machine': 'kitchen',
    'Dishwasher': 'kitchen',
    'Electric Stove Plate': 'kitchen',
    'Electric Oven': 'kitchen',
    'Under-counter Fridge': 'kitchen',
    'Ice Maker': 'kitchen',

    # BEDROOM
    'Phone Chargers': 'bedroom',
    'Laptop': 'bedroom',

    # BATHROOM
    'Hair Dryer': 'bathroom',
    'Geyser (Electric)': 'bathroom',
    'Solar Geyser Booster': 'bathroom',

    # LAUNDRY
    'Washing Machine': 'laundry',
    'Iron': 'laundry',
    'Tumble Dryer': 'laundry',

    # OFFICE
    'Desktop Computer': 'office',
    'Printer (Small)': 'office',
    'Photocopier': 'office',
    'Server / NAS': 'office',
    'POS System': 'office',

    # GARAGE
    'Workshop Tools': 'garage',
    'Angle Grinder': 'garage',
    'Welder': 'garage',

    # OUTDOOR
    'Booster Pump (Small)': 'outdoor',
    'Borehole Pump': 'outdoor',
    'Pool Pump': 'outdoor',
    'Filtration System': 'outdoor',
    'Water Purifier': 'outdoor',
    'Garden Irrigation': 'outdoor',
    'Security Lights': 'outdoor',

    # SECURITY
    'CCTV System': 'security',
    'Alarm System': 'security',
    'Gate Motor': 'security',
    'Garage Door Motor': 'security',
    'Electric Fence': 'security',
}


class Command(BaseCommand):
    help = 'Deactivate appliances not in the updated algorithm spec'

    def handle(self, *args, **options):
        spec_names = set(SPEC_APPLIANCES.keys())
        all_appliances = Appliance.objects.filter(is_deleted=False)

        kept = 0
        deactivated = 0

        for a in all_appliances:
            if a.name in spec_names:
                # Ensure correct category
                expected_cat = SPEC_APPLIANCES[a.name]
                if a.category != expected_cat or not a.is_active:
                    a.category = expected_cat
                    a.is_active = True
                    a.save(update_fields=['category', 'is_active', 'updated_at'])
                kept += 1
                self.stdout.write(f'  KEEP: {a.name} ({a.category})')
            else:
                if a.is_active:
                    a.is_active = False
                    a.save(update_fields=['is_active', 'updated_at'])
                    self.stdout.write(self.style.WARNING(f'  DEACTIVATED: {a.name}'))
                deactivated += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nKept {kept} appliances, deactivated {deactivated}. '
            f'Spec has {len(spec_names)} appliances.'
        ))

        # Check for missing appliances from spec
        existing_names = set(all_appliances.values_list('name', flat=True))
        missing = spec_names - existing_names
        if missing:
            self.stdout.write(self.style.WARNING(f'\nMissing from DB (need to create): {missing}'))
