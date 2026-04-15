"""
Enforce Taqon_Appliances_Current.xlsx as the single source of truth for
PP / EP / Concurrency / NightUse / smart-load / wattage on every Appliance
in the DB.

Runs on every deploy after the seed/clean steps so the recommendation
engine always sees the engineered values regardless of any drift from
seeds, admin edits, or partial scripts.

Idempotent — values that already match are left alone.

Usage:
    python manage.py apply_xlsx_appliances
    python manage.py apply_xlsx_appliances --dry-run
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from apps.solar_config.models import Appliance


# Verbatim from Taqon_Appliances_Current (1).xlsx — the engineering team's
# calibrated values. Key is (name, category). Do NOT edit without an updated
# xlsx + sign-off — these numbers feed the entire recommendation mapping.
TABLE = {
    ('LED LIGHT', 'bathroom'):                 {'pp': '0.1',  'ep': '0.15', 'cf': '0.8',  'nu': '1',    'smart': False, 'w': 10},
    ('MIRROR LIGHT', 'bathroom'):              {'pp': '0.1',  'ep': '0.15', 'cf': '0.8',  'nu': '1',    'smart': False, 'w': 10},
    ('HAIR DRYER', 'bathroom'):                {'pp': '4',    'ep': '0.2',  'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 1800},
    ('SHAVER UNIT', 'bathroom'):               {'pp': '0.1',  'ep': '0.15', 'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 10},
    ('HAIR STRAIGHTENER', 'bathroom'):         {'pp': '1',    'ep': '1',    'cf': '0.45', 'nu': '0.05', 'smart': False, 'w': 200},
    ('EXHAUST FAN', 'bathroom'):               {'pp': '0.4',  'ep': '0.7',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 75},
    ('Geyser (Electric)', 'bathroom'):         {'pp': '10',   'ep': '7',    'cf': '0.4',  'nu': '0.2',  'smart': True,  'w': 3000},
    ('Hair Dryer', 'bathroom'):                {'pp': '4',    'ep': '0.2',  'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 1800},

    ('LED LIGHT', 'bedroom'):                  {'pp': '0.1',  'ep': '0.15', 'cf': '0.8',  'nu': '1',    'smart': False, 'w': 10},
    ('LIGHTS GROUP (2-4)', 'bedroom'):         {'pp': '0.4',  'ep': '0.8',  'cf': '0.6',  'nu': '0.85', 'smart': False, 'w': 60},
    ('BEDSIDE LAMP', 'bedroom'):               {'pp': '0.1',  'ep': '0.15', 'cf': '0.8',  'nu': '1',    'smart': False, 'w': 10},
    ('BEDSIDE RADIO', 'bedroom'):              {'pp': '0.3',  'ep': '0.5',  'cf': '0.4',  'nu': '0.5',  'smart': False, 'w': 45},
    ('AC 12000 BTU', 'bedroom'):               {'pp': '6.5',  'ep': '6.25', 'cf': '0.4',  'nu': '0.5',  'smart': True,  'w': 1200},
    ('AC 9000 BTU', 'bedroom'):                {'pp': '5',    'ep': '4.5',  'cf': '0.4',  'nu': '0.5',  'smart': True,  'w': 900},
    ('PEDESTAL FAN', 'bedroom'):               {'pp': '0.3',  'ep': '0.6',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 55},
    ('CEILING FAN', 'bedroom'):                {'pp': '0.4',  'ep': '0.7',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 75},
    ('ELECTRIC BLANKET', 'bedroom'):           {'pp': '0.9',  'ep': '1',    'cf': '0.4',  'nu': '0.3',  'smart': False, 'w': 120},
    ('TV medium', 'bedroom'):                  {'pp': '0.7',  'ep': '0.8',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 110},
    ('TV small', 'bedroom'):                   {'pp': '0.5',  'ep': '0.7',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 80},
    ('TV LARGE', 'bedroom'):                   {'pp': '0.8',  'ep': '0.9',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 180},
    ('LAPTOP', 'bedroom'):                     {'pp': '0.4',  'ep': '0.3',  'cf': '0.5',  'nu': '0.3',  'smart': False, 'w': 65},
    ('HAIR DRYER', 'bedroom'):                 {'pp': '4',    'ep': '0.2',  'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 1800},
    ('SMALL FRIDGE', 'bedroom'):               {'pp': '0.8',  'ep': '1.4',  'cf': '0.5',  'nu': '0.5',  'smart': False, 'w': 100},
    ('HAIR STRAIGHTENER', 'bedroom'):          {'pp': '1',    'ep': '1',    'cf': '0.45', 'nu': '0.05', 'smart': False, 'w': 200},
    ('Phone Chargers', 'bedroom'):             {'pp': '0.1',  'ep': '0.2',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 25},

    ('Angle Grinder', 'garage'):               {'pp': '4',    'ep': '1',    'cf': '0.2',  'nu': '0.1',  'smart': False, 'w': 2000},
    ('Welder', 'garage'):                      {'pp': '10',   'ep': '2',    'cf': '0.1',  'nu': '0.1',  'smart': False, 'w': 5000},
    ('Workshop Tools', 'garage'):              {'pp': '2',    'ep': '1',    'cf': '0.3',  'nu': '0.1',  'smart': False, 'w': 800},

    ('Blender', 'kitchen'):                    {'pp': '1.5',  'ep': '0.1',  'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 500},
    ('Coffee Machine', 'kitchen'):             {'pp': '2.5',  'ep': '0.2',  'cf': '0.15', 'nu': '0.05', 'smart': False, 'w': 1000},
    ('Deep Freezer', 'kitchen'):               {'pp': '1.5',  'ep': '2.6',  'cf': '0.35', 'nu': '0.5',  'smart': False, 'w': 200},
    ('Dishwasher', 'kitchen'):                 {'pp': '3',    'ep': '0.8',  'cf': '0.2',  'nu': '0.08', 'smart': True,  'w': 1800},
    ('air fryer', 'kitchen'):                  {'pp': '6',    'ep': '1.5',  'cf': '0.2',  'nu': '0.1',  'smart': False, 'w': 2000},
    ('rice cooker', 'kitchen'):                {'pp': '3.5',  'ep': '1.5',  'cf': '0.2',  'nu': '0.1',  'smart': True,  'w': 1200},
    ('pressure cooker', 'kitchen'):            {'pp': '4',    'ep': '1.5',  'cf': '0.2',  'nu': '0.1',  'smart': True,  'w': 1400},
    ('Electric Frying Pan', 'kitchen'):        {'pp': '4',    'ep': '0.5',  'cf': '0.15', 'nu': '0.15', 'smart': False, 'w': 1500},
    ('Electric Oven', 'kitchen'):              {'pp': '10',   'ep': '2',    'cf': '0.15', 'nu': '0.1',  'smart': False, 'w': 3000},
    ('Electric Stove Plate', 'kitchen'):       {'pp': '8',    'ep': '1.5',  'cf': '0.2',  'nu': '0.1',  'smart': False, 'w': 2000},
    ('Fridge', 'kitchen'):                     {'pp': '1.5',  'ep': '2.1',  'cf': '0.45', 'nu': '0.5',  'smart': False, 'w': 150},
    ('Ice Maker', 'kitchen'):                  {'pp': '1',    'ep': '1',    'cf': '0.4',  'nu': '0.3',  'smart': False, 'w': 200},
    ('Kettle', 'kitchen'):                     {'pp': '5',    'ep': '0.15', 'cf': '0.1',  'nu': '0.1',  'smart': False, 'w': 2000},
    ('Microwave', 'kitchen'):                  {'pp': '4',    'ep': '0.25', 'cf': '0.18', 'nu': '0.2',  'smart': False, 'w': 1200},
    ('Toaster', 'kitchen'):                    {'pp': '2.5',  'ep': '0.1',  'cf': '0.1',  'nu': '0.05', 'smart': False, 'w': 800},
    ('Under-counter/ small Fridge', 'kitchen'): {'pp': '0.8', 'ep': '1.4',  'cf': '0.5',  'nu': '0.5',  'smart': False, 'w': 100},

    ('Iron', 'laundry'):                       {'pp': '4',    'ep': '0.5',  'cf': '0.15', 'nu': '0.1',  'smart': False, 'w': 2000},
    ('Tumble Dryer', 'laundry'):               {'pp': '7',    'ep': '1.5',  'cf': '0.15', 'nu': '0.05', 'smart': True,  'w': 3000},
    ('Washing Machine', 'laundry'):            {'pp': '2.5',  'ep': '0.3',  'cf': '0.25', 'nu': '0.1',  'smart': True,  'w': 500},

    ('AC 18000 BTU', 'lounge'):                {'pp': '8',    'ep': '8',    'cf': '0.4',  'nu': '0.5',  'smart': True,  'w': 1800},
    ('AC 12000 BTU', 'lounge'):                {'pp': '6.5',  'ep': '6.25', 'cf': '0.4',  'nu': '0.5',  'smart': True,  'w': 1200},
    ('AC 9000 BTU', 'lounge'):                 {'pp': '5',    'ep': '4.5',  'cf': '0.4',  'nu': '0.5',  'smart': True,  'w': 900},
    ('Ceiling Fan', 'lounge'):                 {'pp': '0.4',  'ep': '0.7',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 75},
    ('Decoder', 'lounge'):                     {'pp': '0.15', 'ep': '0.3',  'cf': '0.8',  'nu': '0.65', 'smart': False, 'w': 30},
    ('Electric Heater', 'lounge'):             {'pp': '7',    'ep': '6',    'cf': '0.5',  'nu': '0.8',  'smart': False, 'w': 2000},
    ('Gaming Console', 'lounge'):              {'pp': '1',    'ep': '0.7',  'cf': '0.5',  'nu': '0.55', 'smart': False, 'w': 200},
    ('Home Theatre', 'lounge'):                {'pp': '1',    'ep': '1',    'cf': '0.4',  'nu': '0.5',  'smart': False, 'w': 200},
    ('LED Light', 'lounge'):                   {'pp': '0.1',  'ep': '0.15', 'cf': '0.8',  'nu': '1',    'smart': False, 'w': 10},
    ('Lights Group (5-10)', 'lounge'):         {'pp': '0.5',  'ep': '1',    'cf': '0.7',  'nu': '0.85', 'smart': False, 'w': 80},
    ('Pedestal Fan', 'lounge'):                {'pp': '0.3',  'ep': '0.6',  'cf': '0.7',  'nu': '0.6',  'smart': False, 'w': 55},
    ('Projector', 'lounge'):                   {'pp': '1.5',  'ep': '0.8',  'cf': '0.3',  'nu': '0.45', 'smart': False, 'w': 300},
    ('TV (MEDIUM0', 'lounge'):                 {'pp': '0.7',  'ep': '0.8',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 110},
    ('TV (Small)', 'lounge'):                  {'pp': '0.5',  'ep': '0.7',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 80},
    ('TV (LARGE)', 'lounge'):                  {'pp': '0.8',  'ep': '0.9',  'cf': '0.6',  'nu': '0.65', 'smart': False, 'w': 180},
    ('sound bar', 'lounge'):                   {'pp': '1',    'ep': '1',    'cf': '0.4',  'nu': '0.5',  'smart': False, 'w': 200},
    ('desktop', 'lounge'):                     {'pp': '1.5',  'ep': '2.2',  'cf': '0.5',  'nu': '0.3',  'smart': False, 'w': 300},
    ('smart home hub', 'lounge'):              {'pp': '0.1',  'ep': '0.4',  'cf': '1',    'nu': '1',    'smart': False, 'w': 12},
    ('laptop', 'lounge'):                      {'pp': '0.4',  'ep': '0.3',  'cf': '0.5',  'nu': '0.3',  'smart': False, 'w': 65},
    ('WiFi Router', 'lounge'):                 {'pp': '0.1',  'ep': '0.4',  'cf': '1',    'nu': '1',    'smart': False, 'w': 12},

    ('Desktop Computer', 'office'):            {'pp': '1.5',  'ep': '2.2',  'cf': '0.5',  'nu': '0.3',  'smart': False, 'w': 300},
    ('Laptop', 'office'):                      {'pp': '0.4',  'ep': '0.3',  'cf': '0.5',  'nu': '0.3',  'smart': False, 'w': 65},
    ('POS System', 'office'):                  {'pp': '1',    'ep': '2',    'cf': '1',    'nu': '0.8',  'smart': False, 'w': 100},
    ('Photocopier', 'office'):                 {'pp': '3',    'ep': '1',    'cf': '0.2',  'nu': '0.1',  'smart': False, 'w': 1500},
    ('Printer (Small)', 'office'):             {'pp': '1',    'ep': '0.5',  'cf': '0.3',  'nu': '0.2',  'smart': False, 'w': 300},
    ('Server / NAS', 'office'):                {'pp': '2',    'ep': '4',    'cf': '1',    'nu': '1',    'smart': False, 'w': 300},

    ('Booster Pump (Small)', 'outdoor'):       {'pp': '2.5',  'ep': '0.3',  'cf': '0.3',  'nu': '0.15', 'smart': True,  'w': 750},
    ('Borehole Pump', 'outdoor'):              {'pp': '6',    'ep': '0.1',  'cf': '0.2',  'nu': '0.03', 'smart': True,  'w': 1500},
    ('LAWN MOWER', 'outdoor'):                 {'pp': '6',    'ep': '0.4',  'cf': '0.4',  'nu': '0.03', 'smart': True,  'w': 2000},
    ('Filtration System', 'outdoor'):          {'pp': '2',    'ep': '0.3',  'cf': '0.2',  'nu': '0.1',  'smart': True,  'w': 500},
    ('Garden Irrigation', 'outdoor'):          {'pp': '0.5',  'ep': '0.1',  'cf': '0.2',  'nu': '0.05', 'smart': True,  'w': 50},
    ('Pool Pump', 'outdoor'):                  {'pp': '3',    'ep': '0.2',  'cf': '0.15', 'nu': '0.03', 'smart': True,  'w': 1100},
    ('Security Lights', 'outdoor'):            {'pp': '0.5',  'ep': '2.5',  'cf': '0.6',  'nu': '0.9',  'smart': False, 'w': 100},
    ('Solar Geyser Booster', 'outdoor'):       {'pp': '0.5',  'ep': '0.5',  'cf': '0.8',  'nu': '0.5',  'smart': False, 'w': 100},
    ('Water Purifier', 'outdoor'):             {'pp': '0.3',  'ep': '0.2',  'cf': '0.3',  'nu': '0.2',  'smart': False, 'w': 50},

    ('Alarm System', 'security'):              {'pp': '0.3',  'ep': '1.5',  'cf': '1',    'nu': '1',    'smart': False, 'w': 30},
    ('CCTV System', 'security'):               {'pp': '0.5',  'ep': '2',    'cf': '1',    'nu': '1',    'smart': False, 'w': 50},
    ('Electric Fence', 'security'):            {'pp': '0.5',  'ep': '1',    'cf': '1',    'nu': '1',    'smart': False, 'w': 30},
    ('Garage Door Motor', 'security'):         {'pp': '0.5',  'ep': '0.05', 'cf': '0.08', 'nu': '0.08', 'smart': False, 'w': 500},
    ('Gate Motor', 'security'):                {'pp': '0.5',  'ep': '0.05', 'cf': '0.08', 'nu': '0.08', 'smart': False, 'w': 500},
}


def _d(s):
    return Decimal(str(s))


class Command(BaseCommand):
    help = 'Enforce Taqon_Appliances_Current.xlsx values on every Appliance row.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Show what would change without writing to the DB.',
        )

    def handle(self, *args, **options):
        dry = options['dry_run']

        ok = []
        updated = []
        missing = []
        extras = []

        # Fetch DB rows once. Match on (name, category) — case-insensitive
        # for name to forgive seed casing inconsistencies. Category is the
        # lowercased model value already.
        all_db = list(Appliance.objects.filter(is_deleted=False))

        # Build a lookup keyed by (lowercased name, category)
        db_map = {}
        for a in all_db:
            db_map.setdefault((a.name.lower().strip(), a.category), []).append(a)

        seen_db = set()
        for (name, cat), target in TABLE.items():
            key = (name.lower().strip(), cat)
            matches = db_map.get(key, [])
            if not matches:
                missing.append(f'{name} [{cat}]')
                continue

            target_pp    = _d(target['pp'])
            target_ep    = _d(target['ep'])
            target_cf    = _d(target['cf'])
            target_nu    = _d(target['nu'])
            target_smart = bool(target['smart'])
            target_w     = int(target['w'])

            for appliance in matches:
                seen_db.add(appliance.id)
                diffs = []
                if appliance.power_points != target_pp:
                    diffs.append(f'PP {appliance.power_points}->{target_pp}')
                if appliance.energy_points != target_ep:
                    diffs.append(f'EP {appliance.energy_points}->{target_ep}')
                if appliance.concurrency_factor != target_cf:
                    diffs.append(f'cf {appliance.concurrency_factor}->{target_cf}')
                if appliance.night_use_factor != target_nu:
                    diffs.append(f'nu {appliance.night_use_factor}->{target_nu}')
                if appliance.smart_load_eligible != target_smart:
                    diffs.append(f'smart {appliance.smart_load_eligible}->{target_smart}')
                if appliance.typical_wattage != target_w:
                    diffs.append(f'W {appliance.typical_wattage}->{target_w}')

                if not diffs:
                    ok.append(f'{appliance.name} [{cat}]')
                    continue

                if not dry:
                    appliance.power_points = target_pp
                    appliance.energy_points = target_ep
                    appliance.concurrency_factor = target_cf
                    appliance.night_use_factor = target_nu
                    appliance.smart_load_eligible = target_smart
                    appliance.typical_wattage = target_w
                    appliance.save(update_fields=[
                        'power_points', 'energy_points', 'concurrency_factor',
                        'night_use_factor', 'smart_load_eligible', 'typical_wattage',
                        'updated_at',
                    ])
                updated.append(f'{appliance.name} [{cat}]: ' + ', '.join(diffs))

        # Anything in the DB that wasn't in the xlsx — flagged but not modified
        for a in all_db:
            if a.id not in seen_db:
                extras.append(f'{a.name} [{a.category}]')

        # ── Report ──
        verb = 'WOULD UPDATE' if dry else 'UPDATED'
        self.stdout.write(self.style.SUCCESS(f'\n{verb} {len(updated)}:'))
        for line in updated:
            self.stdout.write(f'  [+] {line}')

        self.stdout.write(self.style.NOTICE(f'\nAlready matching xlsx {len(ok)}:'))
        for n in ok:
            self.stdout.write(f'  [.] {n}')

        if missing:
            self.stdout.write(self.style.WARNING(
                f'\nIn xlsx but missing from DB {len(missing)}:'
            ))
            for n in missing:
                self.stdout.write(f'  [?] {n}')

        if extras:
            self.stdout.write(self.style.WARNING(
                f'\nIn DB but not in xlsx (left untouched) {len(extras)}:'
            ))
            for n in extras:
                self.stdout.write(f'  [!] {n}')

        self.stdout.write(self.style.SUCCESS(
            f'\n== xlsx sync: {len(ok)} ok, {len(updated)} {verb.lower()}, '
            f'{len(missing)} missing, {len(extras)} extras =='
        ))
