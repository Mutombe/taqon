"""Admin product duplication: clone a product into a new inactive draft."""
from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.shop.models import Product, Category, Brand, ProductImage

User = get_user_model()


class ProductDuplicateTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(
            email='boss@taqon.co.zw', password='x', role='admin', is_staff=True,
        )
        cls.category = Category.objects.create(name='Inverters', slug='inverters')
        cls.brand = Brand.objects.create(name='Sunsynk', slug='sunsynk')
        cls.product = Product.objects.create(
            name='5kVA Hybrid Inverter', slug='5kva-hybrid-inverter', sku='INV-5K',
            category=cls.category, brand=cls.brand, price=Decimal('999.00'),
            description='Long desc', short_description='Short', warranty_period='2 years',
            specifications={'voltage': '48V'}, stock_quantity=7,
            is_active=True, is_featured=True, average_rating=Decimal('4.50'),
            total_reviews=12,
        )
        ProductImage.objects.create(product=cls.product, image_url='/x.jpg', is_primary=True, order=0)
        ProductImage.objects.create(product=cls.product, image_url='/y.jpg', order=1)

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_duplicate_creates_independent_draft(self):
        resp = self.client.post('/api/v1/shop/admin/products/5kva-hybrid-inverter/duplicate/')
        self.assertEqual(resp.status_code, 201, resp.content)
        data = resp.json()

        dup = Product.objects.get(slug=data['slug'])
        # Distinct identity
        self.assertNotEqual(dup.pk, self.product.pk)
        self.assertNotEqual(dup.slug, self.product.slug)
        self.assertNotEqual(dup.sku, self.product.sku)
        self.assertIn('COPY', dup.sku)
        self.assertEqual(dup.name, '5kVA Hybrid Inverter (Copy)')
        # Copied fields
        self.assertEqual(dup.price, self.product.price)
        self.assertEqual(dup.description, self.product.description)
        self.assertEqual(dup.specifications, self.product.specifications)
        self.assertEqual(dup.category_id, self.product.category_id)
        self.assertEqual(dup.brand_id, self.product.brand_id)
        # Reset fields — draft, no stock, no inherited reviews
        self.assertFalse(dup.is_active)
        self.assertFalse(dup.is_featured)
        self.assertEqual(dup.stock_quantity, 0)
        self.assertEqual(dup.total_reviews, 0)
        self.assertEqual(dup.average_rating, 0)
        # Images copied
        self.assertEqual(dup.images.count(), 2)
        # Original untouched
        self.product.refresh_from_db()
        self.assertTrue(self.product.is_active)
        self.assertEqual(self.product.stock_quantity, 7)
        self.assertEqual(self.product.images.count(), 2)

    def test_duplicate_twice_gets_unique_skus(self):
        r1 = self.client.post('/api/v1/shop/admin/products/5kva-hybrid-inverter/duplicate/')
        r2 = self.client.post('/api/v1/shop/admin/products/5kva-hybrid-inverter/duplicate/')
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertNotEqual(r1.json()['sku'], r2.json()['sku'])
        self.assertNotEqual(r1.json()['slug'], r2.json()['slug'])

    def test_duplicate_missing_product_404(self):
        resp = self.client.post('/api/v1/shop/admin/products/nope/duplicate/')
        self.assertEqual(resp.status_code, 404)
