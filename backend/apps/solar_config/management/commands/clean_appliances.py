"""
Align the Appliance table with Taqon_Appliances_Current.xlsx.

  1. Soft-deletes any appliance NOT in the XLSX (Big Fridge, Display
     Fridge, CPAP Machine, Aquarium Pump, etc.).
  2. Normalizes all remaining names to Title Case, preserving common
     acronyms (TV, AC, BTU, WiFi, CCTV, POS, LED, NAS, CPAP, DVD).
  3. Handles duplicates that form after normalization (keeps one).

Idempotent. Embedded XLSX data (no file dependency on Render).
"""
import re
from django.core.management.base import BaseCommand

from apps.solar_config.models import Appliance


# (name, category) pairs from Taqon_Appliances_Current.xlsx — the source of truth
XLSX_APPLIANCES = [
    # Bathroom
    ('LED LIGHT', 'bathroom'),
    ('MIRROR LIGHT', 'bathroom'),
    ('HAIR DRYER', 'bathroom'),
    ('SHAVER UNIT', 'bathroom'),
    ('HAIR STRAIGHTENER', 'bathroom'),
    ('EXHAUST FAN', 'bathroom'),
    ('Geyser (Electric)', 'bathroom'),
    # Bedroom
    ('LED LIGHT', 'bedroom'),
    ('LIGHTS GROUP (2-4)', 'bedroom'),
    ('BEDSIDE LAMP', 'bedroom'),
    ('BEDSIDE RADIO', 'bedroom'),
    ('AC 12000 BTU', 'bedroom'),
    ('AC 9000 BTU', 'bedroom'),
    ('PEDESTAL FAN', 'bedroom'),
    ('CEILING FAN', 'bedroom'),
    ('ELECTRIC BLANKET', 'bedroom'),
    ('TV medium', 'bedroom'),
    ('TV small', 'bedroom'),
    ('TV LARGE', 'bedroom'),
    ('LAPTOP', 'bedroom'),
    ('HAIR DRYER', 'bedroom'),
    ('SMALL FRIDGE', 'bedroom'),
    ('HAIR STRAIGHTENER', 'bedroom'),
    ('Phone Chargers', 'bedroom'),
    # Garage
    ('Angle Grinder', 'garage'),
    ('Welder', 'garage'),
    ('Workshop Tools', 'garage'),
    # Kitchen
    ('Blender', 'kitchen'),
    ('Coffee Machine', 'kitchen'),
    ('Deep Freezer', 'kitchen'),
    ('Dishwasher', 'kitchen'),
    ('air fryer', 'kitchen'),
    ('rice cooker', 'kitchen'),
    ('pressure cooker', 'kitchen'),
    ('Electric Frying Pan', 'kitchen'),
    ('Electric Oven', 'kitchen'),
    ('Electric Stove Plate', 'kitchen'),
    ('Fridge', 'kitchen'),
    ('Ice Maker', 'kitchen'),
    ('Kettle', 'kitchen'),
    ('Microwave', 'kitchen'),
    ('Toaster', 'kitchen'),
    ('Under-counter/ small Fridge', 'kitchen'),
    # Laundry
    ('Iron', 'laundry'),
    ('Tumble Dryer', 'laundry'),
    ('Washing Machine', 'laundry'),
    # Lounge
    ('AC 18000 BTU', 'lounge'),
    ('AC 12000 BTU', 'lounge'),
    ('AC 9000 BTU', 'lounge'),
    ('Ceiling Fan', 'lounge'),
    ('Decoder', 'lounge'),
    ('Electric Heater', 'lounge'),
    ('Gaming Console', 'lounge'),
    ('Home Theatre', 'lounge'),
    ('LED Light', 'lounge'),
    ('Lights Group (5-10)', 'lounge'),
    ('Pedestal Fan', 'lounge'),
    ('Projector', 'lounge'),
    ('TV (MEDIUM0', 'lounge'),  # XLSX typo — we normalize to "TV (Medium)"
    ('TV (Small)', 'lounge'),
    ('TV (LARGE)', 'lounge'),
    ('sound bar', 'lounge'),
    ('desktop', 'lounge'),
    ('smart home hub', 'lounge'),
    ('laptop', 'lounge'),
    ('WiFi Router', 'lounge'),
    # Office
    ('Desktop Computer', 'office'),
    ('Laptop', 'office'),
    ('Photocopier', 'office'),
    ('Printer (Small)', 'office'),
    # Outdoor
    ('Booster Pump (Small)', 'outdoor'),
    ('Borehole Pump', 'outdoor'),
    ('LAWN MOWER', 'outdoor'),
    ('Filtration System', 'outdoor'),
    ('Garden Irrigation', 'outdoor'),
    ('Pool Pump', 'outdoor'),
    ('Security Lights', 'outdoor'),
    ('Solar Geyser Booster', 'outdoor'),
    ('Water Purifier', 'outdoor'),
    # Security
    ('Alarm System', 'security'),
    ('CCTV System', 'security'),
    ('Electric Fence', 'security'),
    ('Garage Door Motor', 'security'),
    ('Gate Motor', 'security'),
]


def norm_key(name):
    """Canonical lowercase key for matching."""
    # Special typo fix
    s = str(name).replace('(MEDIUM0', '(Medium)').strip()
    return re.sub(r'\s+', ' ', s).lower()


# Acronyms to preserve in uppercase; special case for "WiFi"
ACRONYMS = {'TV', 'AC', 'BTU', 'CCTV', 'POS', 'LED', 'NAS', 'DVD'}
SPECIAL_CASES = {'wifi': 'WiFi'}


def title_case(name):
    """Normalize to Title Case preserving acronyms."""
    # Fix known XLSX typo
    s = name.replace('(MEDIUM0', '(Medium)').strip()
    s = re.sub(r'\s+', ' ', s)
    result = s.title()
    # Fix acronyms (case-insensitive word-boundary replacement)
    for acr in ACRONYMS:
        result = re.sub(r'\b' + re.escape(acr) + r'\b', acr, result, flags=re.IGNORECASE)
    for pattern, replacement in SPECIAL_CASES.items():
        result = re.sub(r'\b' + re.escape(pattern) + r'\b', replacement, result, flags=re.IGNORECASE)
    return result


class Command(BaseCommand):
    help = 'Align appliances with the XLSX: delete ghosts + normalize names to Title Case'

    def handle(self, *args, **options):
        # Build set of canonical XLSX keys
        xlsx_set = {(norm_key(n), c) for n, c in XLSX_APPLIANCES}

        # 1. Soft-delete anything NOT in XLSX
        all_apps = Appliance.objects.filter(is_deleted=False)
        ghosts = [a for a in all_apps if (norm_key(a.name), a.category) not in xlsx_set]

        for a in ghosts:
            self.stdout.write(self.style.WARNING(f'  DELETE: {a.category:10} | {a.name}'))
            a.soft_delete()

        self.stdout.write(f'\nDeleted {len(ghosts)} ghost appliances.\n')

        # 2. Normalize remaining names to Title Case
        renamed = 0
        dedup_deleted = 0
        seen = {}  # (title_case_name, category) -> first appliance id

        for a in Appliance.objects.filter(is_deleted=False).order_by('created_at'):
            new_name = title_case(a.name)
            key = (new_name.lower(), a.category)

            if key in seen:
                # Duplicate after normalization — keep the first, delete this one
                self.stdout.write(self.style.WARNING(
                    f'  DEDUP:   {a.category:10} | {a.name} (duplicates: {new_name})'
                ))
                a.soft_delete()
                dedup_deleted += 1
                continue
            seen[key] = a.id

            if new_name != a.name:
                self.stdout.write(f'  RENAME:  {a.category:10} | {a.name} -> {new_name}')
                a.name = new_name
                a.save(update_fields=['name', 'updated_at'])
                renamed += 1

        remaining = Appliance.objects.filter(is_deleted=False).count()
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Summary: {len(ghosts)} deleted (ghosts), {renamed} renamed (case), '
            f'{dedup_deleted} deduped. {remaining} active appliances remain.'
        ))
