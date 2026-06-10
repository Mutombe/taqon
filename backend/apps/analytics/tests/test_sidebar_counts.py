"""Sidebar item-count endpoint — admin-only, returns a count per tab."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.inventory.models import MaterialCategory, Material

User = get_user_model()
URL = '/api/v1/analytics/sidebar-counts/'


class SidebarCountsTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')
        Material.objects.create(category=MaterialCategory.objects.get(name='Plumbing'), name='Pipe')

    def test_anonymous_denied(self):
        self.assertIn(APIClient().get(URL).status_code, (401, 403))

    def test_customer_forbidden(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(URL).status_code, 403)

    def test_admin_gets_counts(self):
        c = APIClient(); c.force_authenticate(self.admin)
        resp = c.get(URL)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        for key in ['products', 'orders', 'packages', 'components', 'inventory',
                    'appliances', 'blog', 'users', 'inquiries']:
            self.assertIn(key, body)
        self.assertEqual(body['inventory'], 1)  # the one material we created
