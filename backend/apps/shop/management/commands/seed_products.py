from django.core.management.base import BaseCommand
from apps.shop.models import Category, Brand, Product, ProductImage


CATEGORIES = [
    {'name': 'Solar Panels', 'slug': 'panels', 'description': 'High-efficiency monocrystalline and polycrystalline solar panels'},
    {'name': 'Batteries', 'slug': 'batteries', 'description': 'Lithium-ion and lead-acid solar storage batteries'},
    {'name': 'Inverters', 'slug': 'inverters', 'description': 'Hybrid and off-grid solar inverters'},
]

BRANDS = [
    {'name': 'Kodak', 'slug': 'kodak', 'description': 'Reliable solar inverters'},
    {'name': 'Deye', 'slug': 'deye', 'description': 'Hybrid inverters and batteries'},
    {'name': 'Pylontech', 'slug': 'pylontech', 'description': 'Leading lithium battery storage solutions'},
    {'name': 'Dyness', 'slug': 'dyness', 'description': 'Innovative energy storage systems'},
    {'name': 'Jinko Solar', 'slug': 'jinko', 'description': 'World-leading solar panel manufacturer'},
    {'name': 'JA Solar', 'slug': 'ja-solar', 'description': 'Premium solar panel technology'},
]

# Exact products from siteData.js with their real image paths
PRODUCTS = [
    {
        'name': 'Kodak 5.6KVA /48V High Voltage Inverter OGS5.6',
        'sku': 'INV-KDK-56',
        'category': 'inverters',
        'brand': 'Kodak',
        'price': 750,
        'compare_at_price': None,
        'is_on_sale': False,
        'warranty_period': '5 Years',
        'stock_quantity': 15,
        'image': '/image.jpg',
        'specs': {'output': '5.6KVA', 'voltage': '48V DC', 'type': 'High Voltage', 'mppt': 'Built-in MPPT Charge Controller'},
        'description': 'The Kodak OGS5.6 is a reliable 5.6KVA hybrid inverter designed for residential solar systems. Features built-in MPPT charge controller and supports high voltage battery configurations.',
    },
    {
        'name': 'Deye 104ah/51.2v Lithium-ion Solar Battery',
        'sku': 'BAT-DEY-104',
        'category': 'batteries',
        'brand': 'Deye',
        'price': 1250,
        'compare_at_price': 1350,
        'is_on_sale': True,
        'warranty_period': '5 Years',
        'stock_quantity': 8,
        'image': '/1.jpg',
        'specs': {'capacity': '104Ah', 'voltage': '51.2V', 'chemistry': 'Lithium-ion', 'cycle_life': 'Long Cycle Life'},
        'description': 'Deye 104Ah lithium-ion solar battery with advanced BMS. Designed for long cycle life and reliable energy storage for residential systems.',
    },
    {
        'name': 'Pylontech Lithium Battery 24V UP2500',
        'sku': 'BAT-PYL-2500',
        'category': 'batteries',
        'brand': 'Pylontech',
        'price': 1100,
        'compare_at_price': None,
        'is_on_sale': False,
        'warranty_period': '5 Years',
        'stock_quantity': 12,
        'image': '/image.png',
        'specs': {'system_voltage': '24V', 'capacity': '2.5kWh', 'chemistry': 'LiFePO4', 'design': 'Stackable Design'},
        'description': 'Pylontech UP2500 LiFePO4 battery with stackable design for 24V systems. Reliable, maintenance-free, and built for daily cycling.',
    },
    {
        'name': 'Pylontech Lithium Ion US3000 Solar Batteries',
        'sku': 'BAT-PYL-3000',
        'category': 'batteries',
        'brand': 'Pylontech',
        'price': 1250,
        'compare_at_price': None,
        'is_on_sale': False,
        'warranty_period': '5 Years',
        'stock_quantity': 10,
        'image': '/image.png',
        'specs': {'system_voltage': '48V', 'capacity': '3.5kWh', 'cycles': '6000+ Cycles', 'design_life': '10 Year Design Life'},
        'description': 'Industry-leading US3000 battery with 6000+ cycle life and 10 year design life. Perfect for daily cycling in residential and commercial systems.',
    },
    {
        'name': 'Pylontech Lithium Ion UP5000 Solar Batteries',
        'sku': 'BAT-PYL-5000',
        'category': 'batteries',
        'brand': 'Pylontech',
        'price': 1350,
        'compare_at_price': 1450,
        'is_on_sale': True,
        'warranty_period': '5 Years',
        'stock_quantity': 7,
        'image': '/2.jpg',
        'specs': {'system_voltage': '48V', 'capacity': '4.8kWh', 'scalable': 'Yes', 'bms': 'Smart BMS'},
        'description': 'High-capacity 4.8kWh battery with smart BMS. Scalable up to 16 units in parallel for large residential and commercial systems.',
    },
    {
        'name': 'Dyness 100ah/48v Lithium ion Solar Battery',
        'sku': 'BAT-DYN-100',
        'category': 'batteries',
        'brand': 'Dyness',
        'price': 1250,
        'compare_at_price': 1350,
        'is_on_sale': True,
        'warranty_period': '5 Years',
        'stock_quantity': 9,
        'image': '/4.jpg',
        'specs': {'capacity': '100Ah', 'voltage': '48V', 'chemistry': 'Lithium-ion', 'mounting': 'Wall Mount'},
        'description': 'Compact wall-mountable Dyness 100Ah battery. Space-saving design with reliable performance and long cycle life.',
    },
    {
        'name': '415w Jinko Solar Panel',
        'sku': 'PAN-JNK-415',
        'category': 'panels',
        'brand': 'Jinko Solar',
        'price': 90,
        'compare_at_price': 130,
        'is_on_sale': True,
        'warranty_period': '25 Years',
        'stock_quantity': 50,
        'image': '/5.jpg',
        'specs': {'wattage': '415W', 'type': 'Mono-crystalline', 'technology': 'Half-cell', 'warranty': '25 Year Warranty'},
        'description': 'Jinko 415W monocrystalline half-cell panel with 25-year performance warranty. Excellent value for residential installations.',
        'is_featured': True,
    },
    {
        'name': '555w JA Solar Panel',
        'sku': 'PAN-JAS-555',
        'category': 'panels',
        'brand': 'JA Solar',
        'price': 135,
        'compare_at_price': 140,
        'is_on_sale': True,
        'warranty_period': '25 Years',
        'stock_quantity': 40,
        'image': '/6.jpg',
        'specs': {'wattage': '555W', 'type': 'Mono-crystalline', 'technology': 'Bi-facial', 'efficiency': 'High Efficiency'},
        'description': 'High-efficiency 555W bifacial panel from JA Solar. Industry-leading power output for maximum energy harvest.',
        'is_featured': True,
    },
    {
        'name': 'Kodak 6.2KVA /48V OG PLUS6.2 High Voltage Inverter',
        'sku': 'INV-KDK-62',
        'category': 'inverters',
        'brand': 'Kodak',
        'price': 650,
        'compare_at_price': 800,
        'is_on_sale': True,
        'warranty_period': '5 Years',
        'stock_quantity': 12,
        'image': '/image.jpg',
        'specs': {'output': '6.2KVA', 'voltage': '48V DC', 'series': 'OG PLUS Series', 'mppt': 'Dual MPPT'},
        'description': 'Kodak OG PLUS6.2 with dual MPPT for optimal solar harvesting. Great for medium-sized homes seeking reliable inverter performance.',
    },
]


class Command(BaseCommand):
    help = 'Seed the product catalog with real Taqon Electrico products'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing shop data...')
            ProductImage.objects.all().delete()
            Product.all_objects.all().delete()
            Category.all_objects.all().delete()
            Brand.all_objects.all().delete()

        # Create brands
        brand_map = {}
        for b in BRANDS:
            brand, created = Brand.objects.get_or_create(
                slug=b['slug'],
                defaults={'name': b['name'], 'description': b.get('description', '')},
            )
            brand_map[b['name']] = brand
            if created:
                self.stdout.write(f'  Brand: {brand.name}')

        # Create categories
        cat_map = {}
        for c in CATEGORIES:
            cat, created = Category.objects.get_or_create(
                slug=c['slug'],
                defaults={'name': c['name'], 'description': c.get('description', '')},
            )
            cat_map[c['slug']] = cat
            if created:
                self.stdout.write(f'  Category: {cat.name}')

        # Create products
        created_count = 0
        image_count = 0
        for p in PRODUCTS:
            if Product.objects.filter(sku=p['sku']).exists():
                self.stdout.write(f'  Skipped (exists): {p["name"]}')
                continue

            category = cat_map.get(p['category'])
            brand = brand_map.get(p['brand']) if p.get('brand') else None

            product = Product.objects.create(
                name=p['name'],
                sku=p['sku'],
                category=category,
                brand=brand,
                description=p.get('description', ''),
                short_description=p.get('description', '')[:200] if p.get('description') else '',
                price=p['price'],
                compare_at_price=p.get('compare_at_price'),
                is_on_sale=p.get('is_on_sale', False),
                warranty_period=p.get('warranty_period', ''),
                stock_quantity=p.get('stock_quantity', 10),
                specifications=p.get('specs', {}),
                is_featured=p.get('is_featured', False),
                is_active=True,
            )
            created_count += 1
            self.stdout.write(f'  Product: {product.name} (${product.price})')

            # Create product image using the real image path
            ProductImage.objects.create(
                product=product,
                image_url=p['image'],
                alt_text=product.name,
                is_primary=True,
                order=0,
            )
            image_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nSeeding complete: {len(BRANDS)} brands, {len(CATEGORIES)} categories, '
            f'{created_count} products, {image_count} images'
        ))
