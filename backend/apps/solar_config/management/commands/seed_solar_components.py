from django.core.management.base import BaseCommand
from apps.solar_config.models import SolarComponent, SolarPackageTemplate, PackageComponent


COMPONENTS = [
    # ── Panels ──
    {
        'name': 'JA Solar 550W Mono PERC',
        'category': 'panel', 'brand': 'JA Solar', 'model_number': 'JAM72S30-550/MR',
        'price': 185, 'wattage': 550, 'voltage': 41.5, 'efficiency': 21.3, 'warranty_years': 25, 'weight_kg': 28.9,
        'compatible_voltages': [24, 48],
        'specifications': {'type': 'Monocrystalline PERC', 'cells': 144, 'voc': '49.72V', 'isc': '14.03A', 'dimensions': '2278x1134x30mm'},
        'is_featured': True,
    },
    {
        'name': 'Canadian Solar 545W BiHiKu',
        'category': 'panel', 'brand': 'Canadian Solar', 'model_number': 'CS6W-545MS',
        'price': 175, 'wattage': 545, 'voltage': 41.2, 'efficiency': 21.0, 'warranty_years': 25, 'weight_kg': 28.2,
        'compatible_voltages': [24, 48],
        'specifications': {'type': 'Monocrystalline', 'cells': 144, 'voc': '49.4V', 'isc': '13.98A'},
    },
    {
        'name': 'LONGi 540W Hi-MO 5',
        'category': 'panel', 'brand': 'LONGi', 'model_number': 'LR5-72HBD-540M',
        'price': 170, 'wattage': 540, 'voltage': 41.0, 'efficiency': 20.9, 'warranty_years': 25, 'weight_kg': 27.5,
        'compatible_voltages': [24, 48],
        'specifications': {'type': 'Monocrystalline PERC', 'cells': 144},
    },
    {
        'name': 'Jinko Solar 460W Tiger Neo',
        'category': 'panel', 'brand': 'Jinko Solar', 'model_number': 'JKM460N-60HL4',
        'price': 145, 'wattage': 460, 'voltage': 37.5, 'efficiency': 21.48, 'warranty_years': 25, 'weight_kg': 23.2,
        'compatible_voltages': [24, 48],
        'specifications': {'type': 'N-type TOPCon', 'cells': 120},
    },
    {
        'name': 'Trina Solar 400W Vertex S',
        'category': 'panel', 'brand': 'Trina Solar', 'model_number': 'TSM-400DE09.08',
        'price': 125, 'wattage': 400, 'voltage': 34.2, 'efficiency': 20.4, 'warranty_years': 25, 'weight_kg': 21.0,
        'compatible_voltages': [24, 48],
        'specifications': {'type': 'Monocrystalline', 'cells': 108},
    },
    # ── Inverters ──
    {
        'name': 'Deye 5kW Hybrid Inverter',
        'category': 'inverter', 'brand': 'Deye', 'model_number': 'SUN-5K-SG03LP1-EU',
        'price': 850, 'wattage': 5000, 'voltage': 48, 'efficiency': 97.6, 'warranty_years': 5, 'weight_kg': 21.5,
        'compatible_voltages': [48],
        'specifications': {'type': 'Hybrid', 'phase': 'Single', 'mppt': 2, 'max_pv': '6500W', 'grid_tie': True},
        'is_featured': True,
    },
    {
        'name': 'Deye 8kW Hybrid Inverter',
        'category': 'inverter', 'brand': 'Deye', 'model_number': 'SUN-8K-SG01LP1-EU',
        'price': 1200, 'wattage': 8000, 'voltage': 48, 'efficiency': 97.8, 'warranty_years': 5, 'weight_kg': 28.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'Hybrid', 'phase': 'Single', 'mppt': 2, 'max_pv': '10400W', 'grid_tie': True},
    },
    {
        'name': 'Deye 12kW Three-Phase Hybrid',
        'category': 'inverter', 'brand': 'Deye', 'model_number': 'SUN-12K-SG04LP3-EU',
        'price': 2200, 'wattage': 12000, 'voltage': 48, 'efficiency': 97.6, 'warranty_years': 5, 'weight_kg': 35.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'Hybrid', 'phase': 'Three', 'mppt': 2, 'max_pv': '16000W', 'grid_tie': True},
    },
    {
        'name': 'Growatt 3kW SPF 3000TL',
        'category': 'inverter', 'brand': 'Growatt', 'model_number': 'SPF-3000TL-HVM',
        'price': 550, 'wattage': 3000, 'voltage': 24, 'efficiency': 93.0, 'warranty_years': 5, 'weight_kg': 13.5,
        'compatible_voltages': [24],
        'specifications': {'type': 'Off-Grid', 'phase': 'Single', 'mppt': 1, 'max_pv': '4000W'},
    },
    {
        'name': 'Must 5kVA PWM Inverter',
        'category': 'inverter', 'brand': 'Must', 'model_number': 'PV1800-5KVA',
        'price': 420, 'wattage': 5000, 'voltage': 48, 'efficiency': 93.0, 'warranty_years': 2, 'weight_kg': 14.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'Off-Grid', 'phase': 'Single', 'mppt': 0, 'charge_type': 'PWM'},
    },
    # ── Batteries ──
    {
        'name': 'Pylontech US5000 4.8kWh',
        'category': 'battery', 'brand': 'Pylontech', 'model_number': 'US5000',
        'price': 1100, 'wattage': 0, 'voltage': 48, 'capacity_ah': 100, 'capacity_kwh': 4.8,
        'warranty_years': 10, 'weight_kg': 46.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'LiFePO4', 'dod': '95%', 'cycles': 6000, 'stackable': True, 'max_parallel': 16},
        'is_featured': True,
    },
    {
        'name': 'Pylontech US3000C 3.55kWh',
        'category': 'battery', 'brand': 'Pylontech', 'model_number': 'US3000C',
        'price': 850, 'wattage': 0, 'voltage': 48, 'capacity_ah': 74, 'capacity_kwh': 3.55,
        'warranty_years': 10, 'weight_kg': 36.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'LiFePO4', 'dod': '95%', 'cycles': 6000, 'stackable': True},
    },
    {
        'name': 'Hubble AM-2 5.12kWh',
        'category': 'battery', 'brand': 'Hubble', 'model_number': 'AM-2',
        'price': 1050, 'wattage': 0, 'voltage': 51.2, 'capacity_ah': 100, 'capacity_kwh': 5.12,
        'warranty_years': 10, 'weight_kg': 47.0,
        'compatible_voltages': [48],
        'specifications': {'type': 'LiFePO4', 'dod': '95%', 'cycles': 6000, 'stackable': True},
    },
    {
        'name': 'Felicity 200Ah Gel Battery',
        'category': 'battery', 'brand': 'Felicity', 'model_number': 'FL-G200',
        'price': 280, 'wattage': 0, 'voltage': 12, 'capacity_ah': 200, 'capacity_kwh': 2.4,
        'warranty_years': 3, 'weight_kg': 58.0,
        'compatible_voltages': [12, 24, 48],
        'specifications': {'type': 'Gel', 'dod': '50%', 'cycles': 1500},
    },
    # ── Charge Controllers ──
    {
        'name': 'Victron SmartSolar 150/35 MPPT',
        'category': 'charger', 'brand': 'Victron', 'model_number': 'SCC115035210',
        'price': 320, 'wattage': 0, 'voltage': 48, 'efficiency': 98.0, 'warranty_years': 5, 'weight_kg': 1.9,
        'compatible_voltages': [12, 24, 48],
        'specifications': {'type': 'MPPT', 'max_pv_voltage': '150V', 'charge_current': '35A', 'bluetooth': True},
    },
    {
        'name': 'Epever 60A MPPT Controller',
        'category': 'charger', 'brand': 'Epever', 'model_number': 'Tracer6415AN',
        'price': 180, 'wattage': 0, 'voltage': 48, 'efficiency': 99.0, 'warranty_years': 2, 'weight_kg': 4.5,
        'compatible_voltages': [12, 24, 48],
        'specifications': {'type': 'MPPT', 'max_pv_voltage': '150V', 'charge_current': '60A'},
    },
    # ── Mounting & Accessories ──
    {
        'name': 'Roof Mounting Kit (per panel)',
        'category': 'mounting', 'brand': 'Generic', 'model_number': 'RMK-01',
        'price': 35, 'wattage': 0, 'voltage': 0, 'warranty_years': 10, 'weight_kg': 5.0,
        'specifications': {'type': 'Pitched Roof', 'material': 'Anodized Aluminium', 'wind_rating': '160km/h'},
    },
    {
        'name': 'Ground Mount Frame (per panel)',
        'category': 'mounting', 'brand': 'Generic', 'model_number': 'GMF-01',
        'price': 55, 'wattage': 0, 'voltage': 0, 'warranty_years': 15, 'weight_kg': 8.0,
        'specifications': {'type': 'Ground Mount', 'material': 'Hot-dip Galvanized Steel', 'adjustable_angle': True},
    },
    {
        'name': '6mm² Solar Cable (per meter)',
        'category': 'cable', 'brand': 'Generic', 'model_number': 'SC-6MM',
        'price': 3, 'wattage': 0, 'voltage': 0, 'warranty_years': 25,
        'specifications': {'type': 'PV Cable', 'gauge': '6mm²', 'rating': '1000V DC', 'uv_resistant': True},
    },
    {
        'name': 'DC Isolator Switch 1000V',
        'category': 'accessory', 'brand': 'Generic', 'model_number': 'DCI-1000',
        'price': 25, 'wattage': 0, 'voltage': 0, 'warranty_years': 5,
        'specifications': {'type': 'DC Isolator', 'rating': '1000V / 32A'},
    },
    {
        'name': 'AC Distribution Board',
        'category': 'accessory', 'brand': 'Generic', 'model_number': 'ACDB-01',
        'price': 120, 'wattage': 0, 'voltage': 0, 'warranty_years': 5,
        'specifications': {'type': 'Distribution Board', 'ways': 12, 'surge_protection': True},
    },
    {
        'name': 'Lightning Arrester',
        'category': 'accessory', 'brand': 'Generic', 'model_number': 'LA-01',
        'price': 65, 'wattage': 0, 'voltage': 0, 'warranty_years': 5,
        'specifications': {'type': 'Type II SPD', 'max_discharge': '40kA'},
    },
]


PACKAGES = [
    {
        'name': 'Home Quick Access',
        'tier': 'starter',
        'description': 'Perfect entry-level solar system for basic household needs. Powers lights, TV, phone charging, and small appliances.',
        'short_description': 'Basic lighting and small appliances',
        'system_size_kw': 1.6,
        'inverter_rating_va': 3000,
        'backup_hours': 8,
        'features': ['LED Lights (10 bulbs)', 'TV & Decoder', 'Phone Charging', 'Small Appliances', '8hr Battery Backup'],
        'suitable_for': ['residential'],
        'components': [
            ('Trina Solar 400W Vertex S', 4),
            ('Growatt 3kW SPF 3000TL', 1),
            ('Pylontech US3000C 3.55kWh', 1),
            ('Roof Mounting Kit (per panel)', 4),
            ('6mm² Solar Cable (per meter)', 20),
            ('DC Isolator Switch 1000V', 1),
        ],
    },
    {
        'name': 'Home Luxury',
        'tier': 'popular',
        'description': 'Mid-range system for comfortable living. Powers full lighting, entertainment, fridge, and multiple outlets with extended backup.',
        'short_description': 'Full lighting, fridge, entertainment',
        'system_size_kw': 2.75,
        'inverter_rating_va': 5000,
        'backup_hours': 10,
        'is_popular': True,
        'features': ['Full Home Lighting', 'TV & Entertainment', 'Refrigerator', 'Multiple Outlets', '10hr Battery Backup', 'Washing Machine'],
        'suitable_for': ['residential'],
        'components': [
            ('JA Solar 550W Mono PERC', 5),
            ('Deye 5kW Hybrid Inverter', 1),
            ('Pylontech US5000 4.8kWh', 1),
            ('Roof Mounting Kit (per panel)', 5),
            ('6mm² Solar Cable (per meter)', 30),
            ('DC Isolator Switch 1000V', 1),
            ('AC Distribution Board', 1),
            ('Lightning Arrester', 1),
        ],
    },
    {
        'name': 'Home Deluxe 5kVA',
        'tier': 'premium',
        'description': 'Full-house solar solution powering all household needs including heavy appliances and air conditioning.',
        'short_description': 'Whole-house power with A/C',
        'system_size_kw': 4.4,
        'inverter_rating_va': 5000,
        'backup_hours': 14,
        'features': ['Whole House Power', 'All Appliances', 'Air Conditioning', '5kVA Hybrid Inverter', 'Premium LiFePO4 Batteries', '14hr Backup'],
        'suitable_for': ['residential'],
        'components': [
            ('JA Solar 550W Mono PERC', 8),
            ('Deye 5kW Hybrid Inverter', 1),
            ('Pylontech US5000 4.8kWh', 2),
            ('Roof Mounting Kit (per panel)', 8),
            ('6mm² Solar Cable (per meter)', 40),
            ('DC Isolator Switch 1000V', 2),
            ('AC Distribution Board', 1),
            ('Lightning Arrester', 1),
        ],
    },
    {
        'name': '8KVA Ultra Power',
        'tier': 'commercial',
        'description': 'High-capacity system for large homes and small businesses. Expandable with smart monitoring.',
        'short_description': 'Large home / small business',
        'system_size_kw': 6.6,
        'inverter_rating_va': 8000,
        'backup_hours': 12,
        'features': ['8KVA Capacity', 'Heavy Appliances', 'Multiple Zones', 'Smart Monitoring', 'Expandable', 'Grid-Tie Ready'],
        'suitable_for': ['residential', 'commercial'],
        'components': [
            ('JA Solar 550W Mono PERC', 12),
            ('Deye 8kW Hybrid Inverter', 1),
            ('Pylontech US5000 4.8kWh', 3),
            ('Roof Mounting Kit (per panel)', 12),
            ('6mm² Solar Cable (per meter)', 50),
            ('DC Isolator Switch 1000V', 2),
            ('AC Distribution Board', 1),
            ('Lightning Arrester', 1),
        ],
    },
    {
        'name': '12KVA Commercial Power',
        'tier': 'commercial',
        'description': 'Commercial-grade three-phase system for offices, factories, and institutions.',
        'short_description': 'Offices, factories, institutions',
        'system_size_kw': 11.0,
        'inverter_rating_va': 12000,
        'backup_hours': 10,
        'features': ['12KVA Three-Phase', 'Office Complexes', 'Industrial Use', 'Remote Monitoring', 'Priority Support', 'Grid Export'],
        'suitable_for': ['commercial', 'institutional'],
        'components': [
            ('JA Solar 550W Mono PERC', 20),
            ('Deye 12kW Three-Phase Hybrid', 1),
            ('Pylontech US5000 4.8kWh', 4),
            ('Ground Mount Frame (per panel)', 20),
            ('6mm² Solar Cable (per meter)', 80),
            ('DC Isolator Switch 1000V', 4),
            ('AC Distribution Board', 1),
            ('Lightning Arrester', 2),
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed solar components and package templates'

    def handle(self, *args, **options):
        # Seed components
        component_map = {}
        for data in COMPONENTS:
            comp, created = SolarComponent.objects.update_or_create(
                model_number=data['model_number'],
                defaults=data,
            )
            component_map[comp.name] = comp
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status}: {comp.name}')

        self.stdout.write(self.style.SUCCESS(f'\nSeeded {len(COMPONENTS)} components'))

        # Seed packages
        for pkg_data in PACKAGES:
            components_list = pkg_data.pop('components')
            is_popular = pkg_data.pop('is_popular', False)

            pkg, created = SolarPackageTemplate.objects.update_or_create(
                name=pkg_data['name'],
                defaults={**pkg_data, 'is_popular': is_popular},
            )

            # Clear existing items and re-create
            pkg.items.all().delete()
            for comp_name, qty in components_list:
                comp = component_map.get(comp_name)
                if comp:
                    PackageComponent.objects.create(package=pkg, component=comp, quantity=qty)

            pkg.recalculate_price()
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status}: {pkg.name} - ${pkg.price}')

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(PACKAGES)} packages'))
