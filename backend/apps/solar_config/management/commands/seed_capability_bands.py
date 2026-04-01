"""
Seed capability bands for the 28 solar packages.
Maps each package to its PP/EP ranges, smart-load support, inverter brand, etc.
Data from the updated algorithm PDF.
"""
from django.core.management.base import BaseCommand
from apps.solar_config.models import SolarPackageTemplate

# variant_code → package name pattern → capability data
CAPABILITY_MAP = {
    # Home Economy (3kVA Must)
    'HE-1': {
        'name_contains': 'economy', 'kva': 3,
        'pp_min': 0, 'pp_max': 3.2, 'ep_min': 0, 'ep_max': 3.0,
        'inverter_brand': 'must', 'smart_load_supported': False,
        'recharge_class': 'basic', 'comfort_class': 'budget', 'management_tolerance': 'high',
    },
    # Home Luxury (5/6kVA)
    'HL-1': {
        'name_contains': 'luxury', 'variant_hint': '1', 'brand_hint': 'growatt', 'panels': 4,
        'pp_min': 2.8, 'pp_max': 4.8, 'ep_min': 3.0, 'ep_max': 5.5,
        'inverter_brand': 'growatt', 'smart_load_supported': False,
        'recharge_class': 'basic', 'comfort_class': 'budget', 'management_tolerance': 'high',
    },
    'HL-2': {
        'name_contains': 'luxury', 'brand_hint': 'growatt', 'panels': 6,
        'pp_min': 3.2, 'pp_max': 5.2, 'ep_min': 3.5, 'ep_max': 6.5,
        'inverter_brand': 'growatt', 'smart_load_supported': False,
        'recharge_class': 'moderate', 'comfort_class': 'budget', 'management_tolerance': 'high',
    },
    'HL-3': {
        'name_contains': 'luxury', 'brand_hint': 'growatt', 'panels': 8,
        'pp_min': 4.0, 'pp_max': 6.2, 'ep_min': 6.0, 'ep_max': 9.5,
        'inverter_brand': 'growatt', 'smart_load_supported': False,
        'recharge_class': 'moderate', 'comfort_class': 'balanced', 'management_tolerance': 'medium',
    },
    'HL-4': {
        'name_contains': 'luxury', 'brand_hint': 'sunsynk', 'panels': 6,
        'pp_min': 3.5, 'pp_max': 5.8, 'ep_min': 3.5, 'ep_max': 6.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'moderate', 'comfort_class': 'balanced', 'management_tolerance': 'medium',
    },
    'HL-5': {
        'name_contains': 'luxury', 'brand_hint': 'sunsynk', 'panels': 8,
        'pp_min': 4.5, 'pp_max': 6.8, 'ep_min': 6.5, 'ep_max': 10.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'balanced', 'management_tolerance': 'medium',
    },
    'HL-6': {
        'name_contains': 'luxury', 'brand_hint': 'sunsynk', 'panels': 10,
        'pp_min': 5.5, 'pp_max': 7.8, 'ep_min': 9.5, 'ep_max': 13.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Home Deluxe (8kVA Sunsynk)
    'HD-1': {
        'name_contains': 'deluxe', 'panels': 10,
        'pp_min': 6.5, 'pp_max': 8.8, 'ep_min': 8.5, 'ep_max': 12.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'HD-2': {
        'name_contains': 'deluxe', 'panels': 12,
        'pp_min': 7.0, 'pp_max': 9.5, 'ep_min': 10.5, 'ep_max': 14.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'balanced', 'management_tolerance': 'medium',
    },
    'HD-3': {
        'name_contains': 'deluxe', 'panels': 14,
        'pp_min': 8.0, 'pp_max': 10.8, 'ep_min': 13.5, 'ep_max': 18.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'HD-4': {
        'name_contains': 'deluxe', 'panels': 16,
        'pp_min': 9.0, 'pp_max': 11.8, 'ep_min': 15.5, 'ep_max': 21.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Ultra Power (10kVA Sunsynk)
    'UP-1': {
        'name_contains': 'ultra', 'panels': 14,
        'pp_min': 9.5, 'pp_max': 12.2, 'ep_min': 10.5, 'ep_max': 15.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'UP-2': {
        'name_contains': 'ultra', 'panels': 16,
        'pp_min': 10.5, 'pp_max': 13.2, 'ep_min': 14.0, 'ep_max': 19.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'UP-3': {
        'name_contains': 'ultra', 'panels': 21,
        'pp_min': 11.5, 'pp_max': 14.5, 'ep_min': 18.0, 'ep_max': 24.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Premium Power (12kVA Sunsynk 1P)
    'PP-1': {
        'name_contains': 'premium', 'panels': 14, 'phase': '1P',
        'pp_min': 12.0, 'pp_max': 14.8, 'ep_min': 10.5, 'ep_max': 16.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'PP-2': {
        'name_contains': 'premium', 'panels': 18, 'phase': '1P',
        'pp_min': 13.0, 'pp_max': 16.2, 'ep_min': 15.0, 'ep_max': 20.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'PP-3': {
        'name_contains': 'premium', 'panels': 24, 'phase': '1P',
        'pp_min': 14.0, 'pp_max': 17.5, 'ep_min': 20.0, 'ep_max': 28.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Premium Power (12kVA Sunsynk 3P)
    'PP-4': {
        'name_contains': 'premium', 'panels': 14, 'phase': '3P',
        'pp_min': 12.0, 'pp_max': 14.8, 'ep_min': 10.5, 'ep_max': 16.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'PP-5': {
        'name_contains': 'premium', 'panels': 18, 'phase': '3P',
        'pp_min': 13.0, 'pp_max': 16.2, 'ep_min': 15.0, 'ep_max': 20.5,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'PP-6': {
        'name_contains': 'premium', 'panels': 24, 'phase': '3P',
        'pp_min': 14.0, 'pp_max': 17.5, 'ep_min': 20.0, 'ep_max': 28.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Pro Power (16kVA Sunsynk)
    'PRO-1': {
        'name_contains': 'pro', 'panels': 18,
        'pp_min': 17.0, 'pp_max': 20.5, 'ep_min': 16.0, 'ep_max': 22.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'PRO-2': {
        'name_contains': 'pro', 'panels': 21,
        'pp_min': 18.0, 'pp_max': 21.5, 'ep_min': 20.0, 'ep_max': 26.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'PRO-3': {
        'name_contains': 'pro', 'panels': 27,
        'pp_min': 20.0, 'pp_max': 23.5, 'ep_min': 24.0, 'ep_max': 32.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    'PRO-4': {
        'name_contains': 'pro', 'panels': 30,
        'pp_min': 21.0, 'pp_max': 24.5, 'ep_min': 28.0, 'ep_max': 36.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    # Master Power (20kVA Sunsynk)
    'MP-1': {
        'name_contains': 'master', 'panels': 24,
        'pp_min': 23.0, 'pp_max': 26.5, 'ep_min': 22.0, 'ep_max': 30.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'balanced', 'comfort_class': 'budget', 'management_tolerance': 'medium',
    },
    'MP-2': {
        'name_contains': 'master', 'panels': 32,
        'pp_min': 25.0, 'pp_max': 29.0, 'ep_min': 28.0, 'ep_max': 38.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'strong', 'comfort_class': 'balanced', 'management_tolerance': 'low',
    },
    'MP-3': {
        'name_contains': 'master', 'panels': 40,
        'pp_min': 27.0, 'pp_max': 31.0, 'ep_min': 36.0, 'ep_max': 46.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
    'MP-4': {
        'name_contains': 'master', 'panels': 52,
        'pp_min': 29.0, 'pp_max': 32.0, 'ep_min': 44.0, 'ep_max': 55.0,
        'inverter_brand': 'sunsynk', 'smart_load_supported': True,
        'recharge_class': 'premium', 'comfort_class': 'premium', 'management_tolerance': 'low',
    },
}


class Command(BaseCommand):
    help = 'Seed capability band data for the 28 solar packages'

    def handle(self, *args, **options):
        packages = list(SolarPackageTemplate.objects.select_related('family').filter(
            is_active=True, is_deleted=False, family__isnull=False,
        ).order_by('family__kva_rating', 'price'))

        self.stdout.write(f'Found {len(packages)} active packages with families')

        # Group by family
        by_family = {}
        for pkg in packages:
            fname = pkg.family.name.lower()
            if fname not in by_family:
                by_family[fname] = []
            by_family[fname].append(pkg)

        assigned = 0
        for code, data in CAPABILITY_MAP.items():
            name_hint = data['name_contains'].lower()

            # Find candidates matching family name
            candidates = []
            for fname, pkgs in by_family.items():
                if name_hint in fname:
                    candidates.extend(pkgs)

            if not candidates:
                self.stdout.write(self.style.WARNING(f'  {code}: No family matching "{name_hint}"'))
                continue

            # Narrow by panel count if specified
            if 'panels' in data:
                narrowed = [p for p in candidates if p.panel_count == data['panels']]
                if narrowed:
                    candidates = narrowed

            # Narrow by phase if specified
            if 'phase' in data:
                narrowed = [p for p in candidates if p.phase == data['phase']]
                if narrowed:
                    candidates = narrowed

            # Narrow by brand hint in name
            if 'brand_hint' in data:
                narrowed = [p for p in candidates if data['brand_hint'].lower() in p.name.lower()]
                if narrowed:
                    candidates = narrowed

            # Narrow by kVA
            if 'kva' in data:
                narrowed = [p for p in candidates if float(p.inverter_kva) == data['kva']]
                if narrowed:
                    candidates = narrowed

            if not candidates:
                self.stdout.write(self.style.WARNING(f'  {code}: No match after filtering'))
                continue

            # Pick the first match (cheapest due to ordering)
            pkg = candidates[0]
            pkg.variant_code = code
            pkg.pp_min = data['pp_min']
            pkg.pp_max = data['pp_max']
            pkg.ep_min = data['ep_min']
            pkg.ep_max = data['ep_max']
            pkg.smart_load_supported = data['smart_load_supported']
            pkg.inverter_brand = data['inverter_brand']
            pkg.recharge_class = data['recharge_class']
            pkg.comfort_class = data['comfort_class']
            pkg.management_tolerance = data['management_tolerance']
            pkg.save(update_fields=[
                'variant_code', 'pp_min', 'pp_max', 'ep_min', 'ep_max',
                'smart_load_supported', 'inverter_brand',
                'recharge_class', 'comfort_class', 'management_tolerance', 'updated_at',
            ])
            assigned += 1
            self.stdout.write(f'  {code} → {pkg.name} (panels={pkg.panel_count}, phase={pkg.phase})')

        self.stdout.write(self.style.SUCCESS(f'\nAssigned capability bands to {assigned}/28 packages'))
