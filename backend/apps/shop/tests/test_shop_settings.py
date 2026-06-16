"""Shop default product ordering setting — drives the public list + admin CRUD."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.shop.models import Category, Product, ShopSetting

User = get_user_model()
LIST = '/api/v1/shop/products/'
SETTINGS = '/api/v1/shop/admin/settings/'


class ShopSettingTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')
        cls.cat = Category.objects.create(name='Inverters')
        # Created oldest→newest: cheap, mid, dear
        cls.cheap = Product.objects.create(name='Cheap', sku='C1', category=cls.cat, price=Decimal('100'), is_active=True)
        cls.mid = Product.objects.create(name='Mid', sku='M1', category=cls.cat, price=Decimal('300'), is_active=True)
        cls.dear = Product.objects.create(name='Dear', sku='D1', category=cls.cat, price=Decimal('900'), is_active=True)

    def names(self, resp):
        body = resp.json()
        return [r['name'] for r in (body.get('results', body))]

    def test_default_is_newest_first(self):
        names = self.names(APIClient().get(LIST))
        self.assertEqual(names[:3], ['Dear', 'Mid', 'Cheap'])  # -created_at

    def test_setting_changes_public_default_order(self):
        s = ShopSetting.load(); s.default_product_ordering = 'price_asc'; s.save()
        self.assertEqual(self.names(APIClient().get(LIST))[:3], ['Cheap', 'Mid', 'Dear'])
        s.default_product_ordering = 'price_desc'; s.save()
        self.assertEqual(self.names(APIClient().get(LIST))[:3], ['Dear', 'Mid', 'Cheap'])

    def test_explicit_ordering_param_overrides_setting(self):
        s = ShopSetting.load(); s.default_product_ordering = 'price_desc'; s.save()
        # Visitor's explicit sort still wins.
        self.assertEqual(self.names(APIClient().get(LIST, {'ordering': 'price'}))[:3], ['Cheap', 'Mid', 'Dear'])

    def test_admin_can_read_and_update(self):
        c = APIClient(); c.force_authenticate(self.admin)
        g = c.get(SETTINGS)
        self.assertEqual(g.status_code, 200)
        self.assertIn('ordering_options', g.json())
        r = c.patch(SETTINGS, {'default_product_ordering': 'featured'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(ShopSetting.load().default_product_ordering, 'featured')

    def test_settings_admin_only(self):
        self.assertEqual(APIClient().get(SETTINGS).status_code, 401)
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(SETTINGS).status_code, 403)
