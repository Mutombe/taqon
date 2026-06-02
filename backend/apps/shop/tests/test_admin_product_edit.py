"""Regression tests for the admin product edit flow.

Covers the bug where the edit modal was fed by the compact list serializer:
the detail read omitted content fields, and partial saves silently wiped
description / specifications / warranty back to blank.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from apps.shop.models import Product, Category, Brand
from apps.shop.admin_serializers import (
    AdminProductDetailSerializer,
    AdminProductCreateUpdateSerializer,
)


class AdminProductEditFlowTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name='Inverters', slug='inverters')
        cls.brand = Brand.objects.create(name='Sunsynk', slug='sunsynk')
        cls.product = Product.objects.create(
            name='5kVA Hybrid Inverter',
            slug='5kva-hybrid-inverter',
            sku='INV-5K',
            category=cls.category,
            brand=cls.brand,
            price=Decimal('999.00'),
            description='Full long description that must survive edits.',
            short_description='Reliable 5kVA hybrid.',
            warranty_period='2 years',
            specifications={'voltage': '48V', 'mppt': '2'},
            stock_quantity=7,
            is_active=True,
        )

    def test_detail_serializer_exposes_all_editable_fields(self):
        """The edit modal must receive every field it lets you edit."""
        data = AdminProductDetailSerializer(self.product).data
        for field in [
            'description', 'short_description', 'warranty_period',
            'specifications', 'is_active', 'is_featured',
            'compare_at_price', 'stock_quantity', 'images',
            'meta_title', 'meta_description',
        ]:
            self.assertIn(field, data, f'detail serializer dropped {field!r}')
        self.assertEqual(data['short_description'], 'Reliable 5kVA hybrid.')
        self.assertEqual(data['specifications'], {'voltage': '48V', 'mppt': '2'})
        # category/brand carry id so the form selects can preselect them
        self.assertEqual(str(data['category']['id']), str(self.category.id))

    def test_partial_update_persists_changed_field(self):
        """Editing one field saves it."""
        serializer = AdminProductCreateUpdateSerializer(
            self.product,
            data={'short_description': 'Now with bigger battery.'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.short_description, 'Now with bigger battery.')

    def test_partial_update_does_not_wipe_untouched_fields(self):
        """The core bug: a partial save must NOT blank fields it didn't send."""
        serializer = AdminProductCreateUpdateSerializer(
            self.product,
            data={'short_description': 'Edited.'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.product.refresh_from_db()
        # These were never in the payload — they must be untouched.
        self.assertEqual(
            self.product.description,
            'Full long description that must survive edits.',
        )
        self.assertEqual(self.product.warranty_period, '2 years')
        self.assertEqual(self.product.specifications, {'voltage': '48V', 'mppt': '2'})

    def test_full_form_payload_round_trips(self):
        """Simulate the real modal payload (full form) and confirm it sticks."""
        payload = {
            'name': '5kVA Hybrid Inverter',
            'sku': 'INV-5K',
            'category': self.category.id,
            'brand': self.brand.id,
            'price': '1050.00',
            'is_on_sale': False,
            'description': 'Updated description.',
            'short_description': 'Updated short.',
            'warranty_period': '3 years',
            'specifications': {'voltage': '48V', 'mppt': '3'},
            'stock_quantity': 12,
            'is_active': True,
            'is_featured': True,
        }
        serializer = AdminProductCreateUpdateSerializer(
            self.product, data=payload, partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.warranty_period, '3 years')
        self.assertEqual(self.product.specifications, {'voltage': '48V', 'mppt': '3'})
        self.assertEqual(self.product.price, Decimal('1050.00'))
        self.assertTrue(self.product.is_featured)
