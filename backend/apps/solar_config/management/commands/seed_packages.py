"""
Management command to seed solar packages from the frontend's siteData.js data.
"""
from django.core.management.base import BaseCommand


PACKAGES_DATA = [
    {
        'name': 'Home Quick Access',
        'slug': 'home-quick-access',
        'tier': 'starter',
        'short_description': 'Perfect entry-level solar solution for essential home backup power.',
        'description': (
            'The Home Quick Access package is our starter solar solution, ideal for small '
            'homes or apartments looking for reliable backup power. This package covers '
            'essential lighting, phone charging, and small appliances during outages.'
        ),
        'system_size_kw': '1.00',
        'inverter_rating_va': 1000,
        'battery_capacity_kwh': '1.50',
        'estimated_daily_output_kwh': '4.00',
        'backup_hours': '6.0',
        'price': '1200.00',
        'compare_at_price': None,
        'currency': 'USD',
        'features': [
            '1kW Solar Panels',
            '1kVA Inverter',
            '100Ah Lithium Battery',
            '6+ Hours Backup',
            'Essential Appliances Coverage',
            'Professional Installation',
            '1-Year Warranty',
        ],
        'suitable_for': ['residential', 'apartment'],
        'is_popular': False,
        'is_active': True,
        'sort_order': 1,
    },
    {
        'name': 'Home Luxury',
        'slug': 'home-luxury',
        'tier': 'popular',
        'short_description': 'Our most popular package — complete home solar solution for daily comfort.',
        'description': (
            'The Home Luxury package is our best-selling solar solution. Designed for '
            'average-sized homes, this package powers all essential appliances including '
            'refrigerator, TV, lighting, fans, and device charging — all day, every day.'
        ),
        'system_size_kw': '3.00',
        'inverter_rating_va': 3000,
        'battery_capacity_kwh': '5.00',
        'estimated_daily_output_kwh': '12.00',
        'backup_hours': '12.0',
        'price': '2500.00',
        'compare_at_price': '2800.00',
        'currency': 'USD',
        'features': [
            '3kW Solar Panels (6x 500W)',
            '3kVA Hybrid Inverter',
            '200Ah LiFePO4 Battery Bank',
            '12+ Hours Full Backup',
            'Refrigerator, TV, Lights & Fans',
            'Smart Energy Monitoring',
            'Professional Installation',
            '3-Year System Warranty',
        ],
        'suitable_for': ['residential'],
        'is_popular': True,
        'is_active': True,
        'sort_order': 2,
    },
    {
        'name': 'Home Luxury Beta',
        'slug': 'home-luxury-beta',
        'tier': 'premium',
        'short_description': 'Enhanced home solar system for larger households with higher energy demands.',
        'description': (
            'The Home Luxury Beta package offers enhanced capacity for larger households '
            'or homes with higher energy demands. Power your air conditioning, washing machine, '
            'and all standard appliances without compromise.'
        ),
        'system_size_kw': '5.00',
        'inverter_rating_va': 5000,
        'battery_capacity_kwh': '10.00',
        'estimated_daily_output_kwh': '20.00',
        'backup_hours': '18.0',
        'price': '3500.00',
        'compare_at_price': '4000.00',
        'currency': 'USD',
        'features': [
            '5kW Solar Panels (10x 500W)',
            '5kVA Hybrid Inverter',
            '400Ah LiFePO4 Battery Bank',
            '18+ Hours Full Backup',
            'Air Conditioning Support',
            'Washing Machine & Full Home Coverage',
            'Advanced Energy Management System',
            'Professional Installation',
            '5-Year System Warranty',
        ],
        'suitable_for': ['residential', 'large_home'],
        'is_popular': False,
        'is_active': True,
        'sort_order': 3,
    },
    {
        'name': 'Home Deluxe 5kVA',
        'slug': 'home-deluxe-5kva',
        'tier': 'premium',
        'short_description': 'Premium whole-home solar system with expanded storage for maximum independence.',
        'description': (
            'The Home Deluxe 5kVA is our flagship residential package. With expanded '
            'battery storage and a powerful 5kVA inverter, this system provides true '
            'energy independence for most Zimbabwean homes, even during extended grid outages.'
        ),
        'system_size_kw': '5.00',
        'inverter_rating_va': 5000,
        'battery_capacity_kwh': '20.00',
        'estimated_daily_output_kwh': '20.00',
        'backup_hours': '36.0',
        'price': '5000.00',
        'compare_at_price': '5800.00',
        'currency': 'USD',
        'features': [
            '5kW High-Efficiency Panels',
            '5kVA Hybrid Inverter/Charger',
            '800Ah LiFePO4 Battery Bank',
            '36+ Hours Full Backup',
            'Complete Home Energy Independence',
            'Remote Monitoring App',
            'Generator Integration Ready',
            'Professional Installation',
            '5-Year Comprehensive Warranty',
        ],
        'suitable_for': ['residential', 'large_home'],
        'is_popular': False,
        'is_active': True,
        'sort_order': 4,
    },
    {
        'name': '8KVA Ultra Power',
        'slug': '8kva-ultra-power',
        'tier': 'commercial',
        'short_description': 'Commercial-grade solar system for small businesses and office buildings.',
        'description': (
            'The 8KVA Ultra Power system is engineered for small businesses, offices, '
            'and clinics that need reliable, uninterrupted power. With 8kVA of inverter '
            'capacity and substantial battery storage, this system handles demanding '
            'commercial loads with ease.'
        ),
        'system_size_kw': '8.00',
        'inverter_rating_va': 8000,
        'battery_capacity_kwh': '30.00',
        'estimated_daily_output_kwh': '32.00',
        'backup_hours': '24.0',
        'price': '8000.00',
        'compare_at_price': '9500.00',
        'currency': 'USD',
        'features': [
            '8kW Commercial Solar Array',
            '8kVA Three-Phase Inverter',
            '1,200Ah LiFePO4 Battery Bank',
            '24+ Hours Commercial Backup',
            'Air Conditioning & Heavy Equipment',
            'Commercial Energy Management System',
            'ZESA Net Metering Ready',
            'Remote Management & Monitoring',
            'Professional Commercial Installation',
            '7-Year System Warranty',
        ],
        'suitable_for': ['commercial', 'small_business', 'office'],
        'is_popular': False,
        'is_active': True,
        'sort_order': 5,
    },
    {
        'name': '10KVA Premium Power',
        'slug': '10kva-premium-power',
        'tier': 'commercial',
        'short_description': 'Our most powerful commercial system for large businesses and industrial use.',
        'description': (
            'The 10KVA Premium Power system is Taqon\'s most powerful commercial offering. '
            'Designed for larger businesses, factories, schools, and large residential '
            'complexes, this system delivers reliable power at scale with advanced monitoring '
            'and management capabilities.'
        ),
        'system_size_kw': '10.00',
        'inverter_rating_va': 10000,
        'battery_capacity_kwh': '50.00',
        'estimated_daily_output_kwh': '40.00',
        'backup_hours': '36.0',
        'price': '12000.00',
        'compare_at_price': '14000.00',
        'currency': 'USD',
        'features': [
            '10kW Premium Commercial Array',
            '10kVA Three-Phase Inverter System',
            '2,000Ah LiFePO4 Battery Bank',
            '36+ Hours Heavy Load Backup',
            'Full Industrial Load Capacity',
            'Advanced SCADA Monitoring System',
            'Automatic Generator Switchover',
            'ZESA Net Metering Integration',
            'Dedicated Technical Support Line',
            'Professional Industrial Installation',
            '10-Year Comprehensive Warranty',
        ],
        'suitable_for': ['commercial', 'industrial', 'large_business', 'school'],
        'is_popular': False,
        'is_active': True,
        'sort_order': 6,
    },
]


class Command(BaseCommand):
    help = 'Seed solar packages from siteData.js into SolarPackageTemplate'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing packages before seeding',
        )

    def handle(self, *args, **options):
        from apps.solar_config.models import SolarPackageTemplate

        if options['clear']:
            self.stdout.write('Clearing existing solar packages...')
            SolarPackageTemplate.all_objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared.'))

        created_count = 0
        updated_count = 0

        for pkg_data in PACKAGES_DATA:
            pkg, created = SolarPackageTemplate.objects.update_or_create(
                slug=pkg_data['slug'],
                defaults=pkg_data,
            )

            if created:
                created_count += 1
                self.stdout.write(f'  Created: {pkg.name} ({pkg.tier}) - ${pkg.price}')
            else:
                updated_count += 1
                self.stdout.write(f'  Updated: {pkg.name} ({pkg.tier}) - ${pkg.price}')

        self.stdout.write(self.style.SUCCESS(
            f'Package seeding complete: {created_count} created, {updated_count} updated.'
        ))
