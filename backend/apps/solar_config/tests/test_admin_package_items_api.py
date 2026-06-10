"""End-to-end API tests for editing a package's components (the high-stakes path):
add, swap (UUID route), change quantity, remove — each recalculating — plus
component-create returning an id and admin-only access."""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.solar_config.models import SolarComponent, SolarPackageTemplate, PackageComponent

User = get_user_model()


def items_url(slug):
    return f'/api/v1/solar-config/admin/packages/{slug}/items/'


def item_url(slug, item_id):
    return f'/api/v1/solar-config/admin/packages/{slug}/items/{item_id}/'


class _Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')
        cls.inv5 = SolarComponent.objects.create(name='5kVA Inverter', category='inverter', wattage=5000, price=Decimal('900'))
        cls.inv8 = SolarComponent.objects.create(name='8kVA Inverter', category='inverter', wattage=8000, price=Decimal('1400'))
        cls.panel = SolarComponent.objects.create(name='585W Panel', category='panel', wattage=585, price=Decimal('110'))
        cls.pkg = SolarPackageTemplate.objects.create(name='Home 5kVA')

    def admin_client(self):
        c = APIClient(); c.force_authenticate(self.admin); return c

    def add_item(self, component, qty=1, client=None):
        client = client or self.admin_client()
        return client.post(items_url(self.pkg.slug), {'component_id': str(component.id), 'quantity': qty}, format='json')


class TenancyTests(_Base):
    def test_customer_cannot_edit_items(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(items_url(self.pkg.slug)).status_code, 403)
        self.assertEqual(self.add_item(self.inv5, client=c).status_code, 403)


class PackageItemsApiTests(_Base):
    def test_add_component_recalculates(self):
        resp = self.add_item(self.inv5)
        self.assertEqual(resp.status_code, 201, resp.content)
        self.pkg.refresh_from_db()
        self.assertGreater(self.pkg.price, Decimal('0'))
        self.assertEqual(self.pkg.material_cost, Decimal('900'))

    def test_swap_component_via_uuid_route(self):
        """The bug: item id is a UUID, route was <int>. This must NOT 404."""
        added = self.add_item(self.inv5).json()
        item_id = added['id']
        c = self.admin_client()
        resp = c.patch(item_url(self.pkg.slug, item_id), {'component_id': str(self.inv8.id)}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)  # was 404 before the fix
        item = PackageComponent.objects.get(pk=item_id)
        self.assertEqual(item.component_id, self.inv8.id)
        # Swap cascades to the package rating.
        self.pkg.refresh_from_db()
        self.assertEqual(float(self.pkg.inverter_kva), 8.0)
        self.assertEqual(self.pkg.material_cost, Decimal('1400'))

    def test_update_quantity(self):
        added = self.add_item(self.panel, qty=1).json()
        c = self.admin_client()
        resp = c.patch(item_url(self.pkg.slug, added['id']), {'quantity': 4}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.pkg.refresh_from_db()
        self.assertEqual(self.pkg.panel_count, 4)
        self.assertEqual(self.pkg.material_cost, Decimal('440'))  # 110 x 4

    def test_remove_component(self):
        added = self.add_item(self.inv5).json()
        c = self.admin_client()
        resp = c.delete(item_url(self.pkg.slug, added['id']))
        self.assertEqual(resp.status_code, 204, resp.content)
        self.assertFalse(PackageComponent.objects.filter(pk=added['id']).exists())
        self.pkg.refresh_from_db()
        self.assertEqual(self.pkg.material_cost, Decimal('0'))

    def test_swap_to_duplicate_is_rejected(self):
        a = self.add_item(self.inv5).json()
        self.add_item(self.inv8)
        c = self.admin_client()
        # Swapping inv5's row to inv8 (already present) should 400, not corrupt.
        resp = c.patch(item_url(self.pkg.slug, a['id']), {'component_id': str(self.inv8.id)}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_component_create_returns_id(self):
        """The picker needs the new component's id to attach it to the package."""
        c = self.admin_client()
        resp = c.post('/api/v1/solar-config/admin/components/create/',
                      {'name': 'New Battery', 'category': 'battery', 'price': '800', 'capacity_kwh': '5.12'},
                      format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertIn('id', resp.json())
        new_id = resp.json()['id']
        # And it can be added to the package immediately.
        add = self.admin_client().post(items_url(self.pkg.slug), {'component_id': new_id, 'quantity': 2}, format='json')
        self.assertEqual(add.status_code, 201, add.content)
        self.pkg.refresh_from_db()
        self.assertEqual(float(self.pkg.battery_capacity_kwh), 10.24)  # 5.12 x 2
