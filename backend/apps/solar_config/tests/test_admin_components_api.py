"""Admin Components & Accessories API — permissions (tenancy), CRUD, and the
relationship with packages (usage reporting, price cascade, delete cleanup)."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.shop.models import Brand, Category, Product
from apps.solar_config.models import (
    PackageComponent, SolarComponent, SolarPackageTemplate,
)

User = get_user_model()

BASE = '/api/v1/solar-config/admin/components/'


class _Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email='admin@taqon.co.zw', password='x', role='admin', is_staff=True,
        )
        cls.customer = User.objects.create_user(
            email='cust@example.com', password='x', role='customer',
        )
        cls.component = SolarComponent.objects.create(
            name='5kVA Inverter', category='inverter', brand='Sunsynk',
            price=Decimal('500.00'),
        )
        cls.package = SolarPackageTemplate.objects.create(name='Home 5kVA')
        PackageComponent.objects.create(
            package=cls.package, component=cls.component, quantity=2,
        )
        cls.package.recalculate_price()

    def admin_client(self):
        c = APIClient(); c.force_authenticate(self.admin); return c

    def customer_client(self):
        c = APIClient(); c.force_authenticate(self.customer); return c


class ComponentMaterialLinkTests(_Base):
    def _material_with_prices(self):
        from apps.inventory.models import MaterialCategory, Material, Supplier, SupplierPrice
        cat, _ = MaterialCategory.objects.get_or_create(name='Electrical')
        mat = Material.objects.create(name='Tracked Inverter', category=cat, brand='Sunsynk')
        SupplierPrice.objects.create(supplier=Supplier.objects.create(name='A'), material=mat, price=Decimal('100'))
        SupplierPrice.objects.create(supplier=Supplier.objects.create(name='B'), material=mat, price=Decimal('200'))
        return mat

    def test_create_component_linked_to_material_exposes_avg(self):
        mat = self._material_with_prices()
        c = self.admin_client()
        resp = c.post(BASE + 'create/', {
            'name': 'Inv from inventory', 'category': 'inverter', 'price': '150', 'material': str(mat.id),
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        comp = SolarComponent.objects.get(name='Inv from inventory')
        self.assertEqual(comp.material_id, mat.id)
        # Listed with the material's average (mean of latest two: 100, 200 -> 150).
        row = next(r for r in self.admin_client().get(BASE).json()['results'] if r['id'] == str(comp.id))
        self.assertEqual(row['material_avg_price'], '150.00')
        self.assertEqual(row['material_name'], 'Tracked Inverter')

    def test_exclude_product_filters_out_product_components(self):
        from apps.shop.models import Category, Product
        cat, _ = Category.objects.get_or_create(name='Inverters')
        prod = Product.objects.create(name='Shop Inv', sku='SI-1', category=cat, price=Decimal('900'))
        SolarComponent.objects.update_or_create(
            name='Product Comp', defaults={'category': 'inverter', 'price': Decimal('900'), 'product': prod})
        all_rows = self.admin_client().get(BASE).json()['results']
        self.assertTrue(any(r.get('product') for r in all_rows))  # ≥1 product-linked exists
        filtered = self.admin_client().get(BASE, {'exclude_product': 1}).json()['results']
        self.assertTrue(all(not r.get('product') for r in filtered))  # none are product-linked
        self.assertIn('5kVA Inverter', [r['name'] for r in filtered])  # plain component stays


class TenancyTests(_Base):
    """Only admins may touch the component endpoints."""

    def test_anonymous_is_denied(self):
        c = APIClient()
        self.assertIn(c.get(BASE).status_code, (401, 403))
        self.assertIn(c.post(f'{BASE}create/', {}, format='json').status_code, (401, 403))
        self.assertIn(c.patch(f'{BASE}{self.component.slug}/', {}, format='json').status_code, (401, 403))
        self.assertIn(c.delete(f'{BASE}{self.component.slug}/delete/').status_code, (401, 403))

    def test_customer_is_forbidden(self):
        c = self.customer_client()
        self.assertEqual(c.get(BASE).status_code, 403)
        self.assertEqual(c.post(f'{BASE}create/', {'name': 'X', 'category': 'cable', 'price': '1'}, format='json').status_code, 403)
        self.assertEqual(c.patch(f'{BASE}{self.component.slug}/', {'price': '9'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{BASE}{self.component.slug}/delete/').status_code, 403)
        # And no write leaked through.
        self.component.refresh_from_db()
        self.assertEqual(self.component.price, Decimal('500.00'))

    def test_admin_is_allowed(self):
        self.assertEqual(self.admin_client().get(BASE).status_code, 200)


class CrudTests(_Base):
    def test_create(self):
        resp = self.admin_client().post(
            f'{BASE}create/',
            {'name': '450W Panel', 'category': 'panel', 'brand': 'Jinko', 'price': '95.00'},
            format='json',
        )
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(SolarComponent.objects.filter(name='450W Panel', is_deleted=False).exists())

    def test_list_and_retrieve_with_usage(self):
        c = self.admin_client()
        lst = c.get(BASE)
        self.assertEqual(lst.status_code, 200)
        row = next(r for r in lst.json()['results'] if r['slug'] == self.component.slug)
        self.assertEqual(row['package_count'], 1)
        self.assertEqual(row['used_in_packages'][0]['name'], 'Home 5kVA')

        detail = c.get(f'{BASE}{self.component.slug}/')
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json()['package_count'], 1)

    def test_update(self):
        resp = self.admin_client().patch(
            f'{BASE}{self.component.slug}/', {'brand': 'Growatt'}, format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.component.refresh_from_db()
        self.assertEqual(self.component.brand, 'Growatt')

    def test_search_and_category_filter(self):
        c = self.admin_client()
        SolarComponent.objects.create(name='Deep Cycle Battery', category='battery', brand='Pylontech', price=Decimal('400'))
        self.assertEqual(c.get(f'{BASE}?category=battery').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}?category=inverter').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}?search=Pylontech').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}?search=nomatchxyz').json()['count'], 0)


class PackageRelationshipTests(_Base):
    def test_price_update_cascades_to_package(self):
        # 2 x 500 = 1000 before.
        self.assertEqual(self.package.material_cost, Decimal('1000.00'))
        resp = self.admin_client().patch(
            f'{BASE}{self.component.slug}/', {'price': '800.00'}, format='json',
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.package.refresh_from_db()
        # 2 x 800 = 1600 after — the package recalculated via the cascade signal.
        self.assertEqual(self.package.material_cost, Decimal('1600.00'))

    def test_delete_removes_from_package_and_recalculates(self):
        resp = self.admin_client().delete(f'{BASE}{self.component.slug}/delete/')
        self.assertEqual(resp.status_code, 204)
        # Component soft-deleted, the through row removed, package recalculated.
        self.component.refresh_from_db()
        self.assertTrue(self.component.is_deleted)
        self.assertFalse(PackageComponent.objects.filter(component=self.component).exists())
        self.package.refresh_from_db()
        self.assertEqual(self.package.material_cost, Decimal('0.00'))
        # And it no longer appears in the admin list.
        names = [r['slug'] for r in self.admin_client().get(BASE).json()['results']]
        self.assertNotIn(self.component.slug, names)
