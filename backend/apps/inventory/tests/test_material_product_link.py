"""Material ⇄ shop product linking: import from a product, link, publish, unlink."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.inventory.models import MaterialCategory, Material, Supplier, SupplierPrice
from apps.shop.models import Product, Category, Brand

User = get_user_model()

IMPORT = '/api/v1/inventory/materials/import-from-product/'


def link_url(slug):
    return f'/api/v1/inventory/materials/{slug}/link-product/'


class _Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')
        cls.shop_cat, _ = Category.objects.get_or_create(name='Inverters')
        cls.brand, _ = Brand.objects.get_or_create(name='Sunsynk')
        cls.product = Product.objects.create(
            name='Sunsynk 5kVA Inverter', sku='SS-5KVA', category=cls.shop_cat,
            brand=cls.brand, price=Decimal('900'),
        )
        cls.mat_cat, _ = MaterialCategory.objects.get_or_create(name='Electrical')

    def admin_client(self):
        c = APIClient(); c.force_authenticate(self.admin); return c


class ImportFromProductTests(_Base):
    def test_import_creates_linked_material(self):
        resp = self.admin_client().post(IMPORT, {'product_id': str(self.product.id)}, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        body = resp.json()
        self.assertEqual(str(body['product']), str(self.product.id))
        self.assertEqual(body['product_name'], 'Sunsynk 5kVA Inverter')
        self.assertEqual(body['brand'], 'Sunsynk')
        self.assertTrue(body['in_shop'])
        self.assertTrue(Material.objects.filter(product=self.product).exists())

    def test_import_is_idempotent(self):
        c = self.admin_client()
        first = c.post(IMPORT, {'product_id': str(self.product.id)}, format='json')
        second = c.post(IMPORT, {'product_id': str(self.product.id)}, format='json')
        self.assertEqual(second.status_code, 200, second.content)
        self.assertEqual(first.json()['id'], second.json()['id'])
        self.assertEqual(Material.objects.filter(product=self.product).count(), 1)

    def test_import_requires_admin(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.post(IMPORT, {'product_id': str(self.product.id)}, format='json').status_code, 403)


class LinkAndPublishTests(_Base):
    def _material(self):
        return Material.objects.create(name='5kVA Hybrid Inverter', category=self.mat_cat, brand='Sunsynk')

    def test_link_existing_product(self):
        mat = self._material()
        resp = self.admin_client().post(link_url(mat.slug), {'product_id': str(self.product.id)}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        mat.refresh_from_db()
        self.assertEqual(mat.product_id, self.product.id)
        self.assertTrue(resp.json()['in_shop'])

    def test_publish_material_to_shop_creates_product(self):
        mat = self._material()
        supplier = Supplier.objects.create(name='Halsteds')
        SupplierPrice.objects.create(supplier=supplier, material=mat, price=Decimal('850'))
        resp = self.admin_client().post(link_url(mat.slug), {'create': True}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        mat.refresh_from_db()
        self.assertIsNotNone(mat.product_id)
        prod = mat.product
        self.assertTrue(prod.is_active)
        self.assertEqual(prod.name, '5kVA Hybrid Inverter')
        self.assertEqual(prod.price, Decimal('850'))   # priced from the latest supplier price
        self.assertEqual(prod.brand.name, 'Sunsynk')
        self.assertEqual(prod.category.name, 'Electrical')

    def test_sync_price_updates_linked_product(self):
        mat = self._material()
        mat.product = self.product
        mat.save(update_fields=['product'])
        self.assertEqual(self.product.price, Decimal('900'))
        supplier = Supplier.objects.create(name='Electrosales')
        SupplierPrice.objects.create(supplier=supplier, material=mat, price=Decimal('780'))
        resp = self.admin_client().post(link_url(mat.slug), {'sync_price': True}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, Decimal('780'))

    def test_sync_price_requires_a_link(self):
        mat = self._material()  # not linked
        self.assertEqual(self.admin_client().post(link_url(mat.slug), {'sync_price': True}, format='json').status_code, 400)

    def test_publish_prices_from_average_of_two_suppliers(self):
        mat = self._material()
        SupplierPrice.objects.create(supplier=Supplier.objects.create(name='A'), material=mat, price=Decimal('100'))
        SupplierPrice.objects.create(supplier=Supplier.objects.create(name='B'), material=mat, price=Decimal('200'))
        resp = self.admin_client().post(link_url(mat.slug), {'create': True, 'markup_pct': '10'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        mat.refresh_from_db()
        # avg(100, 200) = 150 → +10% = 165 (NOT 200+10% = 220 from the latest only)
        self.assertEqual(mat.product.price, Decimal('165.00'))

    def test_publish_applies_markup(self):
        mat = self._material()
        supplier = Supplier.objects.create(name='Flint')
        SupplierPrice.objects.create(supplier=supplier, material=mat, price=Decimal('100'))
        resp = self.admin_client().post(link_url(mat.slug), {'create': True, 'markup_pct': '25'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        mat.refresh_from_db()
        self.assertEqual(mat.markup_pct, Decimal('25.00'))
        self.assertEqual(mat.product.price, Decimal('125.00'))  # 100 + 25%

    def test_sync_applies_markup(self):
        mat = self._material()
        mat.product = self.product
        mat.save(update_fields=['product'])
        supplier = Supplier.objects.create(name='Cafca')
        SupplierPrice.objects.create(supplier=supplier, material=mat, price=Decimal('200'))
        resp = self.admin_client().post(link_url(mat.slug), {'sync_price': True, 'markup_pct': '10'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, Decimal('220.00'))  # 200 + 10%

    def test_negative_markup_rejected(self):
        mat = self._material()
        SupplierPrice.objects.create(supplier=Supplier.objects.create(name='X'), material=mat, price=Decimal('100'))
        self.assertEqual(self.admin_client().post(link_url(mat.slug), {'create': True, 'markup_pct': '-5'}, format='json').status_code, 400)

    def test_link_without_args_is_rejected(self):
        mat = self._material()
        self.assertEqual(self.admin_client().post(link_url(mat.slug), {}, format='json').status_code, 400)

    def test_unlink(self):
        mat = self._material()
        mat.product = self.product
        mat.save(update_fields=['product'])
        resp = self.admin_client().delete(link_url(mat.slug))
        self.assertEqual(resp.status_code, 200, resp.content)
        mat.refresh_from_db()
        self.assertIsNone(mat.product_id)
        self.assertFalse(resp.json()['in_shop'])
