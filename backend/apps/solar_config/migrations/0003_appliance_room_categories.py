"""Re-categorize appliances from function-based to room-based categories."""
from django.db import migrations

# Mapping: appliance name → new room category
ROOM_MAP = {
    # LOUNGE — entertainment, fans, lighting, heating
    'TV (Small)': 'lounge', 'TV (Large)': 'lounge', '2 TVs': 'lounge',
    'Decoder': 'lounge', 'Home Theatre': 'lounge', 'Sound Bar': 'lounge',
    'Gaming Console': 'lounge', 'Projector': 'lounge',
    'WiFi Router': 'lounge', 'Internet Modem': 'lounge',
    'Ceiling Fan': 'lounge', 'Pedestal Fan': 'lounge',
    'AC 9000 BTU': 'lounge', 'AC 12000 BTU': 'lounge', 'AC 18000 BTU': 'lounge',
    'Electric Heater': 'lounge', 'Oil Heater': 'lounge',
    'LED Light': 'lounge', 'Lights Group (5-10)': 'lounge', 'Lights Group (10-20)': 'lounge',

    # KITCHEN — all cooking, food storage, preparation
    'Fridge': 'kitchen', 'Large Fridge': 'kitchen', 'Bar Fridge': 'kitchen',
    'Under-counter Fridge': 'kitchen', 'Shop Display Fridge': 'kitchen',
    'Chest Freezer': 'kitchen', 'Deep Freezer': 'kitchen',
    'Microwave': 'kitchen', 'Kettle': 'kitchen', 'Toaster': 'kitchen',
    'Blender': 'kitchen', 'Coffee Machine': 'kitchen', 'Rice Cooker': 'kitchen',
    'Slow Cooker': 'kitchen', 'Air Fryer': 'kitchen', 'Sandwich Maker': 'kitchen',
    'Electric Frying Pan': 'kitchen', 'Electric Oven': 'kitchen',
    'Electric Stove Plate': 'kitchen', 'Four-plate Stove + Oven': 'kitchen',
    'Cooker Hood': 'kitchen', 'Dishwasher': 'kitchen', 'Ice Maker': 'kitchen',
    'Water Dispenser': 'kitchen', 'Baby Bottle Warmer': 'kitchen',

    # BEDROOM — personal items, sleeping
    'Electric Blanket': 'bedroom', 'Phone Chargers': 'bedroom',
    'Tablet': 'bedroom', 'CPAP Machine': 'bedroom',

    # BATHROOM — water heating, grooming
    'Geyser (Electric)': 'bathroom', 'Hair Dryer': 'bathroom',
    'Exhaust Fan': 'bathroom', 'Evaporative Cooler': 'bathroom',

    # LAUNDRY — washing, ironing
    'Washing Machine': 'laundry', 'Tumble Dryer': 'laundry', 'Iron': 'laundry',

    # OFFICE — computing, work equipment
    'Desktop Computer': 'office', 'Laptop': 'office', 'Monitor': 'office',
    'Printer (Small)': 'office', 'Printer (Large)': 'office',
    'Photocopier': 'office', 'Server / NAS': 'office', 'POS System': 'office',
    'Sewing Machine': 'office',

    # GARAGE & WORKSHOP — power tools
    'Drill': 'garage', 'Angle Grinder': 'garage', 'Compressor': 'garage',
    'Welder': 'garage', 'Workshop Tools': 'garage',

    # OUTDOOR — garden, pool, water
    'Borehole Pump': 'outdoor', 'Booster Pump (Small)': 'outdoor',
    'Booster Pump (Large)': 'outdoor', 'Pool Pump': 'outdoor',
    'Pressure Pump': 'outdoor', 'Fountain Pump': 'outdoor',
    'Garden Irrigation': 'outdoor', 'Solar Geyser Booster': 'outdoor',
    'Filtration System': 'outdoor', 'Water Purifier': 'outdoor',
    'Security Lights': 'outdoor',

    # SECURITY — alarms, cameras, gates
    'CCTV System': 'security', 'Alarm System': 'security',
    'Electric Fence': 'security', 'Gate Motor': 'security',
    'Garage Door Motor': 'security', 'Intercom': 'security',
    'Router + CCTV Combo': 'security',

    # OTHER — medical, specialty
    'Aquarium Pump': 'other', 'Aquarium Heater': 'other',
    'Medical Fridge': 'other', 'Nebulizer': 'other',
}


def remap_categories(apps, schema_editor):
    Appliance = apps.get_model('solar_config', 'Appliance')
    for name, new_cat in ROOM_MAP.items():
        updated = Appliance.objects.filter(name=name).update(category=new_cat)
        if updated:
            print(f"  {name} → {new_cat}")

    # Catch any unmapped appliances
    unmapped = Appliance.objects.exclude(category__in=[
        'lounge', 'kitchen', 'bedroom', 'bathroom', 'laundry',
        'office', 'garage', 'outdoor', 'security', 'other',
    ])
    if unmapped.exists():
        print(f"  WARNING: {unmapped.count()} unmapped appliances → 'other'")
        unmapped.update(category='other')


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('solar_config', '0002_solarcomponent_shop_visible_and_more'),
    ]

    operations = [
        migrations.RunPython(remap_categories, reverse_noop),
    ]
