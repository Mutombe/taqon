"""
Create Shop Products for every solar panel, inverter, and battery used
in packages, link them to their SolarComponent, and set up the price
cascade.  Products are created as inactive by default — an admin can
activate them in the dashboard to make them visible in the shop.

Safe to run multiple times (idempotent via slug matching).
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.shop.models import Product, Category, Brand
from apps.solar_config.models import SolarComponent, PackageComponent


# Brand detection from component name
BRAND_RULES = [
    ('sunsynk', 'Sunsynk'),
    ('growatt', 'Growatt'),
    ('must', 'Must'),
    ('dyness', 'Dyness'),
    ('pylontech', 'Pylontech'),
    ('jinko', 'Jinko Solar'),
    ('ja solar', 'JA Solar'),
    ('trina', 'Trina Solar'),
    ('deye', 'Deye'),
    ('kodak', 'Kodak'),
]

# Map component category to shop category slug
CATEGORY_MAP = {
    'inverter': 'inverters',
    'battery': 'batteries',
    'panel': 'panels',
}


class Command(BaseCommand):
    help = 'Create shop products for package components and link them'

    def handle(self, *args, **options):
        # Ensure brands exist
        brand_cache = {}
        for _, brand_name in BRAND_RULES:
            brand, _ = Brand.objects.get_or_create(
                slug=slugify(brand_name),
                defaults={'name': brand_name},
            )
            brand_cache[brand_name.lower()] = brand

        # Get categories
        cat_cache = {}
        for cat_slug in CATEGORY_MAP.values():
            try:
                cat_cache[cat_slug] = Category.objects.get(slug=cat_slug, is_deleted=False)
            except Category.DoesNotExist:
                self.stderr.write(f'Category "{cat_slug}" not found — skipping')

        # Get all components used in packages that are panels/inverters/batteries
        comp_ids = PackageComponent.objects.values_list('component_id', flat=True).distinct()
        components = SolarComponent.objects.filter(
            id__in=comp_ids,
            is_deleted=False,
            category__in=['inverter', 'battery', 'panel'],
        ).order_by('category', 'name')

        created_count = 0
        linked_count = 0
        skipped_count = 0

        for comp in components:
            cat_slug = CATEGORY_MAP.get(comp.category)
            category = cat_cache.get(cat_slug)
            if not category:
                self.stderr.write(f'  SKIP {comp.name} — no category')
                skipped_count += 1
                continue

            # Detect brand
            brand = None
            name_lower = comp.name.lower()
            for keyword, brand_name in BRAND_RULES:
                if keyword in name_lower:
                    brand = brand_cache.get(brand_name.lower())
                    break

            # Check if component already linked
            if comp.product_id:
                self.stdout.write(f'  ALREADY LINKED: {comp.name} -> {comp.product.name}')
                skipped_count += 1
                continue

            # Try to find existing product by slug
            slug = slugify(comp.name)[:320]
            product = Product.objects.filter(slug=slug, is_deleted=False).first()

            if not product:
                # Build SKU from category + brand + short identifier
                sku_base = f'{comp.category[:3].upper()}-{slug[:30]}'.upper()
                # Ensure unique SKU
                sku = sku_base
                counter = 1
                while Product.objects.filter(sku=sku).exists():
                    sku = f'{sku_base}-{counter}'
                    counter += 1

                # Build description
                specs = []
                if comp.wattage:
                    specs.append(f'{comp.wattage}W')
                if comp.voltage:
                    specs.append(f'{comp.voltage}V')
                if comp.capacity_kwh:
                    specs.append(f'{comp.capacity_kwh} kWh')
                if comp.capacity_ah:
                    specs.append(f'{comp.capacity_ah} Ah')
                spec_str = ' | '.join(specs) if specs else ''

                description = f'{comp.name}'
                if spec_str:
                    description += f' — {spec_str}'
                if comp.warranty_years:
                    description += f'. {comp.warranty_years}-year warranty.'

                product = Product.objects.create(
                    name=comp.name,
                    slug=slug,
                    sku=sku,
                    category=category,
                    brand=brand,
                    price=comp.price,
                    currency=comp.currency or 'USD',
                    description=description,
                    short_description=spec_str,
                    stock_quantity=100,
                    warranty_period=f'{comp.warranty_years} years' if comp.warranty_years else '',
                    specifications={
                        'wattage': str(comp.wattage) if comp.wattage else None,
                        'voltage': str(comp.voltage) if comp.voltage else None,
                        'capacity_kwh': str(comp.capacity_kwh) if comp.capacity_kwh else None,
                        'capacity_ah': str(comp.capacity_ah) if comp.capacity_ah else None,
                    },
                    is_active=False,  # Inactive by default — admin activates
                    is_featured=False,
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(
                    f'  CREATED: {product.name} (${product.price}) [inactive]'
                ))
            else:
                self.stdout.write(f'  EXISTS: {product.name} — linking')

            # Link component to product
            comp.product = product
            comp.save(update_fields=['product', 'updated_at'])
            linked_count += 1
            self.stdout.write(f'    LINKED: component "{comp.name}" -> product "{product.name}"')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done: {created_count} products created, {linked_count} components linked, {skipped_count} skipped'
        ))
