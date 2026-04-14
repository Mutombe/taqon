"""
Seed the 33 colored appliances from Taqon_Appliances_Current.xlsx.
Also soft-deletes POS System and Server / NAS per client request.

Data is embedded inline (not read from XLSX) so this runs on Render too.
Idempotent — safe to run multiple times.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.solar_config.models import Appliance


# 33 appliances from the colored rows of Taqon_Appliances_Current.xlsx
# (name, category, pp, ep, concurrency, night_use, smart_load, wattage)
NEW_APPLIANCES = [
    # Bathroom
    ('LED LIGHT', 'bathroom', '0.1', '0.15', '0.8', '1', False, 10),
    ('MIRROR LIGHT', 'bathroom', '0.1', '0.15', '0.8', '1', False, 10),
    ('HAIR DRYER', 'bathroom', '4', '0.2', '0.1', '0.05', False, 1800),
    ('SHAVER UNIT', 'bathroom', '0.1', '0.15', '0.1', '0.05', False, 10),
    ('HAIR STRAIGHTENER', 'bathroom', '1', '1', '0.45', '0.05', False, 200),
    ('EXHAUST FAN', 'bathroom', '0.4', '0.7', '0.7', '0.6', False, 75),

    # Bedroom
    ('LED LIGHT', 'bedroom', '0.1', '0.15', '0.8', '1', False, 10),
    ('LIGHTS GROUP (2-4)', 'bedroom', '0.4', '0.8', '0.6', '0.85', False, 60),
    ('BEDSIDE LAMP', 'bedroom', '0.1', '0.15', '0.8', '1', False, 10),
    ('BEDSIDE RADIO', 'bedroom', '0.3', '0.5', '0.4', '0.5', False, 45),
    ('AC 12000 BTU', 'bedroom', '6.5', '6.25', '0.4', '0.5', True, 1200),
    ('AC 9000 BTU', 'bedroom', '5', '4.5', '0.4', '0.5', True, 900),
    ('PEDESTAL FAN', 'bedroom', '0.3', '0.6', '0.7', '0.6', False, 55),
    ('CEILING FAN', 'bedroom', '0.4', '0.7', '0.7', '0.6', False, 75),
    ('ELECTRIC BLANKET', 'bedroom', '0.9', '1', '0.4', '0.3', False, 120),
    ('TV medium', 'bedroom', '0.7', '0.8', '0.6', '0.65', False, 110),
    ('TV small', 'bedroom', '0.5', '0.7', '0.6', '0.65', False, 80),
    ('TV LARGE', 'bedroom', '0.8', '0.9', '0.6', '0.65', False, 180),
    ('LAPTOP', 'bedroom', '0.4', '0.3', '0.5', '0.3', False, 65),
    ('HAIR DRYER', 'bedroom', '4', '0.2', '0.1', '0.05', False, 1800),
    ('SMALL FRIDGE', 'bedroom', '0.8', '1.4', '0.5', '0.5', False, 100),
    ('HAIR STRAIGHTENER', 'bedroom', '1', '1', '0.45', '0.05', False, 200),

    # Kitchen
    ('air fryer', 'kitchen', '6', '1.5', '0.2', '0.1', False, 2000),
    ('rice cooker', 'kitchen', '3.5', '1.5', '0.2', '0.1', True, 1200),
    ('pressure cooker', 'kitchen', '4', '1.5', '0.2', '0.1', True, 1400),

    # Lounge
    ('AC 12000 BTU', 'lounge', '6.5', '6.25', '0.4', '0.5', True, 1200),
    ('TV (MEDIUM0', 'lounge', '0.7', '0.8', '0.6', '0.65', False, 110),
    ('TV (LARGE)', 'lounge', '0.8', '0.9', '0.6', '0.65', False, 180),
    ('sound bar', 'lounge', '1', '1', '0.4', '0.5', False, 200),
    ('desktop', 'lounge', '1.5', '2.2', '0.5', '0.3', False, 300),
    ('smart home hub', 'lounge', '0.1', '0.4', '1', '1', False, 12),
    ('laptop', 'lounge', '0.4', '0.3', '0.5', '0.3', False, 65),

    # Outdoor
    ('LAWN MOWER', 'outdoor', '6', '0.4', '0.4', '0.03', True, 2000),
]


CATEGORY_ICONS = {
    'bathroom': 'Bathtub',
    'bedroom': 'Bed',
    'kitchen': 'CookingPot',
    'lounge': 'Couch',
    'office': 'Desktop',
    'garage': 'Wrench',
    'outdoor': 'Tree',
    'laundry': 'TShirt',
    'security': 'ShieldCheck',
    'other': 'DotsThree',
}

DELETE_APPLIANCES = ['POS System', 'Server / NAS']


class Command(BaseCommand):
    help = 'Seed 33 new appliances and remove POS/Server (idempotent)'

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for name, category, pp, ep, conc, night, smart, wattage in NEW_APPLIANCES:
            icon = CATEGORY_ICONS.get(category, 'DotsThree')

            existing = Appliance.objects.filter(
                name__iexact=name, category=category, is_deleted=False,
            ).first()

            if existing:
                existing.power_points = Decimal(pp)
                existing.energy_points = Decimal(ep)
                existing.concurrency_factor = Decimal(conc)
                existing.night_use_factor = Decimal(night)
                existing.smart_load_eligible = smart
                existing.typical_wattage = wattage
                existing.icon_name = icon
                existing.is_active = True
                existing.save()
                updated += 1
                self.stdout.write(f'  UPDATED: {name} ({category})')
            else:
                base_slug = slugify(f'{name}-{category}')[:220]
                slug = base_slug
                counter = 1
                while Appliance.objects.filter(slug=slug).exists():
                    slug = f'{base_slug}-{counter}'[:220]
                    counter += 1

                Appliance.objects.create(
                    name=name,
                    slug=slug,
                    category=category,
                    icon_name=icon,
                    typical_wattage=wattage,
                    power_points=Decimal(pp),
                    energy_points=Decimal(ep),
                    concurrency_factor=Decimal(conc),
                    night_use_factor=Decimal(night),
                    smart_load_eligible=smart,
                    is_active=True,
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(f'  CREATED: {name} ({category})'))

        # Soft-delete POS + Server
        deleted = 0
        for name in DELETE_APPLIANCES:
            for a in Appliance.objects.filter(name__iexact=name, is_deleted=False):
                a.soft_delete()
                deleted += 1
                self.stdout.write(self.style.WARNING(f'  DELETED: {a.name}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Summary: {created} created, {updated} updated, {deleted} soft-deleted'
        ))
