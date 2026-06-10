"""Bidirectional Product <-> SolarComponent field cascade (price/name/desc/brand)."""
from decimal import Decimal

from django.test import TestCase

from apps.shop.models import Brand, Category, Product
from apps.solar_config.models import (
    PackageComponent, SolarComponent, SolarPackageTemplate,
)


class ProductComponentCascadeTests(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name='Inverters')
        self.brand = Brand.objects.create(name='Sunsynk')
        self.product = Product.objects.create(
            name='5kVA Hybrid Inverter', sku='INV-5K', category=self.cat,
            brand=self.brand, description='Reliable hybrid inverter.',
            price=Decimal('1000.00'),
        )
        self.component = SolarComponent.objects.create(
            name='5kVA Hybrid Inverter', category='inverter',
            brand='Sunsynk', description='Reliable hybrid inverter.',
            price=Decimal('1000.00'), product=self.product,
        )
        self.package = SolarPackageTemplate.objects.create(name='Home 5kVA')
        PackageComponent.objects.create(
            package=self.package, component=self.component, quantity=2,
        )
        self.package.recalculate_price()

    def _reload(self):
        self.component.refresh_from_db()
        self.product.refresh_from_db()
        self.package.refresh_from_db()

    def test_product_edit_cascades_to_component(self):
        new_brand = Brand.objects.create(name='Growatt')
        self.product.brand = new_brand
        self.product.name = '5kVA Hybrid Inverter MAX'
        self.product.description = 'Upgraded model.'
        self.product.price = Decimal('1200.00')
        self.product.save()

        self._reload()
        self.assertEqual(self.component.brand, 'Growatt')
        self.assertEqual(self.component.name, '5kVA Hybrid Inverter MAX')
        self.assertEqual(self.component.description, 'Upgraded model.')
        self.assertEqual(self.component.price, Decimal('1200.00'))
        # Package price recalculated from the new component price (2 x 1200 = 2400 + markups).
        self.assertGreater(self.package.material_cost, Decimal('2399.99'))

    def test_component_edit_cascades_back_to_product(self):
        self.component.brand = 'MUST'
        self.component.name = 'Edited On Component'
        self.component.description = 'Edited there.'
        self.component.save()

        self._reload()
        self.assertEqual(self.product.name, 'Edited On Component')
        self.assertEqual(self.product.description, 'Edited there.')
        # Brand text → Brand FK, auto-created.
        self.assertIsNotNone(self.product.brand)
        self.assertEqual(self.product.brand.name, 'MUST')
        self.assertTrue(Brand.objects.filter(name='MUST').exists())

    def test_no_runaway_loop_and_idempotent(self):
        # Saving with identical values changes nothing and terminates.
        self.product.save()
        self._reload()
        self.assertEqual(self.component.name, self.product.name)
        self.assertEqual(self.component.brand, 'Sunsynk')

    def test_relink_adopts_product_fields(self):
        other = Product.objects.create(
            name='Different Inverter', sku='INV-OTHER', category=self.cat,
            brand=Brand.objects.create(name='Deye'),
            description='Other desc.', price=Decimal('1500.00'),
        )
        self.component.product = other
        self.component.save()

        self._reload()
        # On (re)link the component adopts the product's fields (product is source).
        self.assertEqual(self.component.name, 'Different Inverter')
        self.assertEqual(self.component.brand, 'Deye')
        self.assertEqual(self.component.price, Decimal('1500.00'))

    # ── Edge cases ────────────────────────────────────────────────────────

    def test_unlinked_component_never_touches_a_product(self):
        """Standalone components (no product) are intentional — editing one must
        not create or modify any Product, but must still recalc its packages."""
        standalone = SolarComponent.objects.create(
            name='Generic Rail', category='mounting', brand='NoName',
            price=Decimal('50.00'),
        )
        pkg = SolarPackageTemplate.objects.create(name='With Rail')
        PackageComponent.objects.create(package=pkg, component=standalone, quantity=4)
        pkg.recalculate_price()

        before = Product.objects.count()
        standalone.brand = 'Renamed'
        standalone.price = Decimal('80.00')
        standalone.save()

        self.assertEqual(Product.objects.count(), before)  # no Brand/Product churn
        pkg.refresh_from_db()
        self.assertGreater(pkg.material_cost, Decimal('319.99'))  # 4 x 80

    def test_product_with_no_components_does_not_crash(self):
        lone = Product.objects.create(
            name='Unused', sku='UNUSED-1', category=self.cat, price=Decimal('5.00'),
        )
        lone.price = Decimal('9.00')
        lone.save()  # should be a no-op cascade, no error
        lone.refresh_from_db()
        self.assertEqual(lone.price, Decimal('9.00'))

    def test_multiple_components_linked_to_same_product_all_sync(self):
        twin = SolarComponent.objects.create(
            name='5kVA Hybrid Inverter', category='inverter', brand='Sunsynk',
            price=Decimal('1000.00'), product=self.product,
        )
        self.product.brand = Brand.objects.create(name='Growatt')
        self.product.save()
        self.component.refresh_from_db()
        twin.refresh_from_db()
        self.assertEqual(self.component.brand, 'Growatt')
        self.assertEqual(twin.brand, 'Growatt')

    def test_price_change_recalcs_every_package_using_the_component(self):
        pkg2 = SolarPackageTemplate.objects.create(name='Second Pkg')
        PackageComponent.objects.create(package=pkg2, component=self.component, quantity=1)
        pkg2.recalculate_price()

        self.product.price = Decimal('2000.00')
        self.product.save()

        self.package.refresh_from_db()
        pkg2.refresh_from_db()
        self.assertGreater(self.package.material_cost, Decimal('3999.99'))  # 2 x 2000
        self.assertGreater(pkg2.material_cost, Decimal('1999.99'))          # 1 x 2000

    def test_removing_product_brand_clears_component_brand(self):
        self.product.brand = None
        self.product.save()
        self.component.refresh_from_db()
        self.assertEqual(self.component.brand, '')

    def test_unlink_stops_syncing_without_error(self):
        self.component.product = None
        self.component.save()
        # Editing the now-unlinked component must not touch the old product.
        self.component.name = 'Free Agent'
        self.component.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, '5kVA Hybrid Inverter')

    def test_partial_product_save_still_cascades(self):
        self.product.brand = Brand.objects.create(name='Deye')
        self.product.save(update_fields=['brand', 'updated_at'])
        self.component.refresh_from_db()
        self.assertEqual(self.component.brand, 'Deye')
