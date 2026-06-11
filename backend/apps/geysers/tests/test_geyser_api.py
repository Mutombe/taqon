"""Geyser package API: public list/detail/filter + admin CRUD + seed presence."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.geysers.models import GeyserPackage

User = get_user_model()
LIST = '/api/v1/geysers/packages/'
ADMIN = '/api/v1/geysers/admin/packages/'


class GeyserPublicTests(TestCase):
    def test_seed_loaded_all_16(self):
        self.assertEqual(GeyserPackage.objects.count(), 16)
        self.assertEqual(GeyserPackage.objects.filter(system_type='pressure').count(), 8)
        self.assertEqual(GeyserPackage.objects.filter(is_smart=True).count(), 8)

    def test_public_list_open(self):
        resp = APIClient().get(LIST)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 16)

    def test_filter_by_system_and_variant(self):
        c = APIClient()
        self.assertEqual(len(c.get(LIST, {'system_type': 'gravity'}).json()), 8)
        self.assertEqual(len(c.get(LIST, {'variant': 'smart'}).json()), 8)

    def test_public_detail(self):
        resp = APIClient().get(f'{LIST}100l-pressure-smart/')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body['name'], '100L Pressure Smart')
        self.assertEqual(Decimal(str(body['price'])), Decimal('2237.66'))
        self.assertTrue(body['is_smart'])
        self.assertTrue(len(body['whats_included']) > 0)
        # The internal bill of materials is NOT exposed on the public detail.
        self.assertNotIn('components', body)

    def test_inactive_hidden(self):
        p = GeyserPackage.objects.first()
        p.is_active = False
        p.save(update_fields=['is_active'])
        self.assertEqual(len(APIClient().get(LIST).json()), 15)


class GeyserAdminTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')

    def admin_client(self):
        c = APIClient(); c.force_authenticate(self.admin); return c

    def test_admin_list_requires_admin(self):
        self.assertEqual(APIClient().get(ADMIN).status_code, 401)
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(ADMIN).status_code, 403)
        self.assertEqual(self.admin_client().get(ADMIN).status_code, 200)

    def test_admin_can_edit_price(self):
        c = self.admin_client()
        resp = c.patch(f'{ADMIN}100l-gravity-standard/', {'price': '850.00'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(GeyserPackage.objects.get(slug='100l-gravity-standard').price, Decimal('850.00'))

    def test_admin_can_create_and_smart_is_derived(self):
        c = self.admin_client()
        resp = c.post(ADMIN, {
            'name': '500L Pressure Smart', 'system_type': 'pressure', 'capacity_litres': 500,
            'variant': 'smart', 'price': '4000', 'brand': 'Suntask',
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(GeyserPackage.objects.get(slug='500l-pressure-smart').is_smart)

    def test_admin_soft_delete(self):
        c = self.admin_client()
        resp = c.delete(f'{ADMIN}300l-pressure-smart/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(GeyserPackage.objects.filter(slug='300l-pressure-smart', is_deleted=False).exists())
