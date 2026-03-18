"""
Seed ~90 appliances with PP/EP scoring from the web development focus PDF.

Usage: python manage.py seed_appliances [--clear]
"""

from django.core.management.base import BaseCommand
from apps.solar_config.models import Appliance


APPLIANCES_DATA = [
    # (name, category, typical_wattage, pp, ep, concurrency, night_use, smart_load, icon_name)

    # ── Lighting ──
    ('LED Light', 'lighting', 10, 0.05, 0.05, 1.0, 0.3, False, 'Lightbulb'),
    ('Lights Group (5-10)', 'lighting', 80, 0.3, 0.3, 1.0, 0.5, False, 'Lightbulb'),
    ('Lights Group (10-20)', 'lighting', 160, 0.6, 0.6, 1.0, 0.5, False, 'Lightbulb'),
    ('Security Lights', 'lighting', 100, 0.4, 0.4, 1.0, 0.8, False, 'FlashlightFill'),

    # ── Entertainment ──
    ('TV (Small)', 'entertainment', 60, 0.3, 0.3, 0.8, 0.3, False, 'Television'),
    ('TV (Large)', 'entertainment', 150, 0.6, 0.5, 0.8, 0.3, False, 'Television'),
    ('2 TVs', 'entertainment', 210, 0.9, 0.7, 0.7, 0.3, False, 'Television'),
    ('Home Theatre', 'entertainment', 300, 0.8, 0.5, 0.5, 0.2, True, 'SpeakerHigh'),
    ('Decoder', 'entertainment', 30, 0.1, 0.15, 1.0, 0.5, False, 'Broadcast'),
    ('WiFi Router', 'entertainment', 15, 0.1, 0.15, 1.0, 1.0, False, 'WifiHigh'),
    ('Internet Modem', 'entertainment', 20, 0.1, 0.15, 1.0, 1.0, False, 'WifiHigh'),
    ('Gaming Console', 'entertainment', 200, 0.6, 0.4, 0.5, 0.2, True, 'GameController'),
    ('Projector', 'entertainment', 300, 0.7, 0.3, 0.3, 0.1, True, 'Projector'),
    ('Sound Bar', 'entertainment', 100, 0.3, 0.2, 0.5, 0.2, True, 'SpeakerHigh'),

    # ── Office & Computing ──
    ('Laptop', 'office', 65, 0.2, 0.3, 0.8, 0.2, False, 'Laptop'),
    ('Desktop Computer', 'office', 300, 0.8, 0.6, 0.7, 0.1, False, 'Desktop'),
    ('Monitor', 'office', 40, 0.15, 0.15, 0.7, 0.1, False, 'Monitor'),
    ('Printer (Small)', 'office', 50, 0.2, 0.1, 0.3, 0.0, True, 'Printer'),
    ('Printer (Large)', 'office', 500, 0.8, 0.3, 0.2, 0.0, True, 'Printer'),
    ('Phone Chargers', 'office', 25, 0.1, 0.1, 1.0, 0.5, False, 'BatteryCharging'),
    ('Tablet', 'office', 15, 0.05, 0.05, 0.8, 0.3, False, 'DeviceTablet'),
    ('Server / NAS', 'office', 200, 0.8, 1.0, 1.0, 1.0, False, 'HardDrives'),
    ('POS System', 'office', 100, 0.4, 0.3, 0.8, 0.0, False, 'CreditCard'),
    ('Photocopier', 'office', 1500, 1.5, 0.5, 0.2, 0.0, True, 'Printer'),
    ('Sewing Machine', 'office', 100, 0.3, 0.2, 0.5, 0.0, True, 'Scissors'),

    # ── Security ──
    ('CCTV System', 'security', 60, 0.3, 0.4, 1.0, 1.0, False, 'SecurityCamera'),
    ('Alarm System', 'security', 30, 0.15, 0.2, 1.0, 1.0, False, 'Bell'),
    ('Electric Fence', 'security', 50, 0.2, 0.3, 1.0, 1.0, False, 'Lightning'),
    ('Gate Motor', 'security', 300, 0.5, 0.2, 0.3, 0.1, True, 'DoorOpen'),
    ('Garage Door Motor', 'security', 400, 0.5, 0.15, 0.2, 0.05, True, 'DoorOpen'),
    ('Intercom', 'security', 20, 0.1, 0.1, 0.8, 0.3, False, 'Phone'),
    ('Router + CCTV Combo', 'security', 80, 0.4, 0.5, 1.0, 1.0, False, 'SecurityCamera'),

    # ── Kitchen ──
    ('Fridge', 'kitchen', 150, 0.6, 0.8, 1.0, 1.0, False, 'Thermometer'),
    ('Large Fridge', 'kitchen', 250, 0.9, 1.2, 1.0, 1.0, False, 'Thermometer'),
    ('Deep Freezer', 'kitchen', 200, 0.7, 1.0, 1.0, 1.0, False, 'Snowflake'),
    ('Chest Freezer', 'kitchen', 180, 0.6, 0.9, 1.0, 1.0, False, 'Snowflake'),
    ('Under-counter Fridge', 'kitchen', 100, 0.4, 0.5, 1.0, 1.0, False, 'Thermometer'),
    ('Bar Fridge', 'kitchen', 80, 0.3, 0.4, 1.0, 1.0, False, 'Thermometer'),
    ('Microwave', 'kitchen', 1200, 1.5, 0.5, 0.3, 0.05, True, 'CookingPot'),
    ('Kettle', 'kitchen', 2000, 2.0, 0.4, 0.3, 0.1, True, 'Coffee'),
    ('Toaster', 'kitchen', 900, 1.0, 0.2, 0.3, 0.05, True, 'Bread'),
    ('Blender', 'kitchen', 400, 0.5, 0.1, 0.3, 0.0, True, 'Blender'),
    ('Coffee Machine', 'kitchen', 1000, 1.2, 0.3, 0.3, 0.05, True, 'Coffee'),
    ('Air Fryer', 'kitchen', 1500, 1.5, 0.4, 0.3, 0.0, True, 'CookingPot'),
    ('Rice Cooker', 'kitchen', 700, 0.8, 0.3, 0.3, 0.0, True, 'CookingPot'),
    ('Slow Cooker', 'kitchen', 250, 0.4, 0.4, 0.3, 0.0, True, 'CookingPot'),
    ('Sandwich Maker', 'kitchen', 750, 0.8, 0.2, 0.3, 0.0, True, 'CookingPot'),
    ('Electric Frying Pan', 'kitchen', 1200, 1.3, 0.4, 0.3, 0.0, True, 'CookingPot'),
    ('Water Dispenser', 'kitchen', 500, 0.6, 0.5, 0.5, 0.3, True, 'Drop'),
    ('Ice Maker', 'kitchen', 150, 0.5, 0.5, 0.5, 0.3, True, 'Snowflake'),
    ('Shop Display Fridge', 'kitchen', 350, 1.2, 1.5, 1.0, 1.0, False, 'Thermometer'),
    ('Electric Stove Plate', 'kitchen', 1500, 2.0, 0.6, 0.3, 0.0, True, 'Fire'),
    ('Electric Oven', 'kitchen', 2000, 2.5, 0.8, 0.3, 0.0, True, 'Fire'),
    ('Four-plate Stove + Oven', 'kitchen', 8000, 6.0, 2.5, 0.3, 0.0, True, 'Fire'),
    ('Cooker Hood', 'kitchen', 200, 0.3, 0.1, 0.3, 0.0, True, 'Fan'),
    ('Dishwasher', 'kitchen', 1800, 1.8, 0.8, 0.3, 0.0, True, 'Drop'),
    ('Baby Bottle Warmer', 'kitchen', 100, 0.2, 0.1, 0.5, 0.2, True, 'Baby'),

    # ── Cooling & Heating ──
    ('Ceiling Fan', 'cooling', 75, 0.3, 0.3, 0.7, 0.5, True, 'Fan'),
    ('Pedestal Fan', 'cooling', 60, 0.2, 0.2, 0.7, 0.3, True, 'Fan'),
    ('Exhaust Fan', 'cooling', 40, 0.15, 0.15, 0.5, 0.1, True, 'Fan'),
    ('AC 9000 BTU', 'cooling', 900, 1.5, 1.5, 0.6, 0.3, True, 'Thermometer'),
    ('AC 12000 BTU', 'cooling', 1200, 2.0, 2.0, 0.6, 0.3, True, 'Thermometer'),
    ('AC 18000 BTU', 'cooling', 1800, 2.5, 2.5, 0.6, 0.3, True, 'Thermometer'),
    ('Evaporative Cooler', 'cooling', 200, 0.5, 0.5, 0.7, 0.3, True, 'Drop'),
    ('Electric Heater', 'cooling', 2000, 2.0, 1.5, 0.5, 0.5, True, 'Fire'),
    ('Oil Heater', 'cooling', 1500, 1.5, 1.5, 0.5, 0.7, True, 'Fire'),
    ('Electric Blanket', 'cooling', 100, 0.2, 0.3, 0.5, 0.8, True, 'Bed'),

    # ── Laundry & Cleaning ──
    ('Washing Machine', 'laundry', 500, 0.8, 0.5, 0.3, 0.0, True, 'TShirt'),
    ('Tumble Dryer', 'laundry', 2500, 2.5, 1.0, 0.2, 0.0, True, 'Wind'),
    ('Iron', 'laundry', 2000, 2.0, 0.5, 0.3, 0.0, True, 'Fire'),
    ('Hair Dryer', 'laundry', 1500, 1.5, 0.3, 0.3, 0.0, True, 'Wind'),

    # ── Water & Pumps ──
    ('Geyser (Electric)', 'water', 3000, 3.0, 2.0, 0.4, 0.3, True, 'Drop'),
    ('Solar Geyser Booster', 'water', 1500, 1.0, 0.5, 0.3, 0.1, True, 'SunDim'),
    ('Borehole Pump', 'water', 750, 1.5, 1.0, 0.5, 0.0, True, 'Drop'),
    ('Pressure Pump', 'water', 750, 1.2, 0.8, 0.5, 0.1, True, 'Drop'),
    ('Booster Pump (Small)', 'water', 370, 0.7, 0.5, 0.5, 0.1, True, 'Drop'),
    ('Booster Pump (Large)', 'water', 1100, 1.5, 1.0, 0.5, 0.1, True, 'Drop'),
    ('Pool Pump', 'water', 1100, 1.5, 1.2, 0.5, 0.0, True, 'SwimmingPool'),
    ('Fountain Pump', 'water', 100, 0.3, 0.3, 0.5, 0.2, True, 'Drop'),
    ('Garden Irrigation', 'water', 200, 0.5, 0.4, 0.3, 0.0, True, 'Plant'),
    ('Water Purifier', 'water', 50, 0.2, 0.2, 0.5, 0.3, False, 'Drop'),
    ('Filtration System', 'water', 100, 0.3, 0.3, 0.5, 0.3, False, 'Funnel'),

    # ── Outdoor & Garden ──
    ('Workshop Tools', 'outdoor', 1500, 1.5, 0.5, 0.3, 0.0, True, 'Wrench'),
    ('Angle Grinder', 'outdoor', 2000, 2.0, 0.4, 0.2, 0.0, True, 'Gear'),
    ('Drill', 'outdoor', 800, 0.8, 0.2, 0.3, 0.0, True, 'Wrench'),
    ('Compressor', 'outdoor', 1500, 1.5, 0.5, 0.3, 0.0, True, 'Gauge'),
    ('Welder', 'outdoor', 5000, 5.0, 1.5, 0.2, 0.0, True, 'Lightning'),

    # ── Other / Medical ──
    ('Aquarium Pump', 'other', 25, 0.1, 0.15, 1.0, 1.0, False, 'Fish'),
    ('Aquarium Heater', 'other', 100, 0.3, 0.4, 0.8, 0.8, False, 'Thermometer'),
    ('CPAP Machine', 'other', 60, 0.3, 0.4, 1.0, 1.0, False, 'Heartbeat'),
    ('Nebulizer', 'other', 50, 0.2, 0.1, 0.3, 0.1, False, 'Heartbeat'),
    ('Medical Fridge', 'other', 150, 0.6, 0.8, 1.0, 1.0, False, 'FirstAid'),
]


class Command(BaseCommand):
    help = 'Seed ~90 appliances with PP/EP scoring for the solar recommendation engine.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Delete all existing appliances before seeding.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            count = Appliance.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {count} existing appliance records.'))

        created_count = 0
        updated_count = 0

        for i, row in enumerate(APPLIANCES_DATA):
            name, category, wattage, pp, ep, concurrency, night_use, smart_load, icon = row

            obj, created = Appliance.objects.update_or_create(
                name=name,
                defaults={
                    'category': category,
                    'typical_wattage': wattage,
                    'power_points': pp,
                    'energy_points': ep,
                    'concurrency_factor': concurrency,
                    'night_use_factor': night_use,
                    'smart_load_eligible': smart_load,
                    'icon_name': icon,
                    'is_active': True,
                    'sort_order': i * 10,
                },
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        total = created_count + updated_count
        self.stdout.write(self.style.SUCCESS(
            f'Done! {total} appliances ({created_count} created, {updated_count} updated).'
        ))
