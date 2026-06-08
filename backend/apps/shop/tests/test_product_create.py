"""Admin product create: name + category + price should be enough."""
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.shop.models import Product, Category

User = get_user_model()


class ProductCreateTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email='boss2@taqon.co.zw', password='x', role='admin', is_staff=True,
        )
        cls.category = Category.objects.create(name='Panels', slug='panels')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def _create(self, **over):
        payload = {'name': 'New Panel', 'category': str(self.category.id), 'price': '120.00'}
        payload.update(over)
        return self.client.post('/api/v1/shop/admin/products/create/', payload, format='json')

    def test_minimal_create_succeeds(self):
        """No slug, no sku — both auto-generated."""
        resp = self._create()
        self.assertEqual(resp.status_code, 201, resp.content)
        p = Product.objects.get(name='New Panel')
        self.assertTrue(p.slug)             # generated from name
        self.assertTrue(p.sku)              # generated unique
        self.assertEqual(p.category_id, self.category.id)

    def test_two_minimal_creates_get_distinct_skus(self):
        r1 = self._create(name='Panel A')
        r2 = self._create(name='Panel B')
        self.assertEqual(r1.status_code, 201, r1.content)
        self.assertEqual(r2.status_code, 201, r2.content)
        self.assertNotEqual(r1.json()['sku'], r2.json()['sku'])

    def test_same_name_creates_unique_sku_and_slug(self):
        r1 = self._create(name='Duplicate Name')
        r2 = self._create(name='Duplicate Name')
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertNotEqual(r1.json()['sku'], r2.json()['sku'])
        self.assertNotEqual(r1.json()['slug'], r2.json()['slug'])

    def test_missing_category_is_rejected_clearly(self):
        resp = self._create(category=None)
        self.assertEqual(resp.status_code, 400)
        # Field errors are wrapped under "details" by the custom handler.
        body = resp.json()
        errors = body.get('details', body)
        self.assertIn('category', errors)
