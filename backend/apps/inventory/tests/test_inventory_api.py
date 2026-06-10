"""Supplier inventory & pricing API — tenancy, CRUD, price-history logging,
cross-supplier averages/comparison, and quotation uploads."""
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.inventory.models import (
    MaterialCategory, Supplier, Material, SupplierPrice, PriceHistory, AuditLog,
)

User = get_user_model()
BASE = '/api/v1/inventory/'


class _Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin = User.objects.create_user(email='a@taqon.co.zw', password='x', role='admin', is_staff=True)
        cls.customer = User.objects.create_user(email='c@example.com', password='x', role='customer')
        cls.cat = MaterialCategory.objects.get(name='Plumbing')  # seeded by migration
        cls.supA = Supplier.objects.create(name='Halsteds')
        cls.supB = Supplier.objects.create(name='Electrosales')
        cls.material = Material.objects.create(category=cls.cat, name='20mm PVC Pipe', unit='m')

    def admin_client(self):
        c = APIClient(); c.force_authenticate(self.admin); return c

    def set_price(self, supplier, price, client=None):
        client = client or self.admin_client()
        return client.post(f'{BASE}prices/', {
            'supplier': str(supplier.id), 'material': str(self.material.id), 'price': str(price),
        }, format='json')


class TenancyTests(_Base):
    def test_anonymous_denied(self):
        c = APIClient()
        self.assertIn(c.get(f'{BASE}materials/').status_code, (401, 403))
        self.assertIn(c.get(f'{BASE}suppliers/').status_code, (401, 403))
        self.assertIn(c.get(f'{BASE}summary/').status_code, (401, 403))

    def test_customer_forbidden(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(f'{BASE}materials/').status_code, 403)
        self.assertEqual(c.get(f'{BASE}price-history/').status_code, 403)
        self.assertEqual(self.set_price(self.supA, 10, client=c).status_code, 403)

    def test_admin_allowed(self):
        self.assertEqual(self.admin_client().get(f'{BASE}materials/').status_code, 200)


class MaterialCrudTests(_Base):
    def test_create_material_autoslug(self):
        resp = self.admin_client().post(f'{BASE}materials/', {
            'category': str(self.cat.id), 'name': '2.5mm Twin & Earth Cable', 'unit': 'roll',
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(Material.objects.filter(name='2.5mm Twin & Earth Cable').exists())

    def test_category_filter_and_search(self):
        c = self.admin_client()
        elec = MaterialCategory.objects.get(name='Electrical')
        Material.objects.create(category=elec, name='Circuit Breaker', brand='Cafca')
        self.assertEqual(c.get(f'{BASE}materials/?category=plumbing').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}materials/?category=electrical').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}materials/?search=breaker').json()['count'], 1)


class PriceAndHistoryTests(_Base):
    def test_setting_price_logs_history(self):
        r = self.set_price(self.supA, 10)
        self.assertEqual(r.status_code, 201, r.content)
        h = PriceHistory.objects.filter(supplier=self.supA, material=self.material)
        self.assertEqual(h.count(), 1)
        self.assertIsNone(h.first().previous_price)

    def test_updating_price_upserts_and_logs_change(self):
        self.set_price(self.supA, 10)
        self.set_price(self.supA, 12)  # same pair → upsert
        # Still one current price row for the pair...
        self.assertEqual(SupplierPrice.objects.filter(supplier=self.supA, material=self.material, is_deleted=False).count(), 1)
        # ...but two history rows, the latest showing +20%.
        hist = PriceHistory.objects.filter(supplier=self.supA, material=self.material).order_by('created_at')
        self.assertEqual(hist.count(), 2)
        latest = hist.last()
        self.assertEqual(float(latest.previous_price), 10.0)
        self.assertEqual(float(latest.change_pct), 20.0)

    def test_material_reports_avg_min_max_and_cheapest(self):
        self.set_price(self.supA, 12)
        self.set_price(self.supB, 8)
        data = self.admin_client().get(f'{BASE}materials/{self.material.slug}/').json()
        self.assertEqual(float(data['avg_price']), 10.0)
        self.assertEqual(float(data['min_price']), 8.0)
        self.assertEqual(float(data['max_price']), 12.0)
        self.assertEqual(data['supplier_count'], 2)
        self.assertEqual(data['cheapest_supplier']['supplier'], 'Electrosales')
        self.assertEqual(len(data['prices']), 2)

    def test_average_uses_latest_two_suppliers(self):
        # Three suppliers price the same material, in order A=10, B=20, C=30.
        self.set_price(self.supA, 10)
        self.set_price(self.supB, 20)
        supC = Supplier.objects.create(name='Cafca')
        self.admin_client().post(f'{BASE}prices/', {
            'supplier': str(supC.id), 'material': str(self.material.id), 'price': '30',
        }, format='json')
        data = self.admin_client().get(f'{BASE}materials/{self.material.slug}/').json()
        # Average is the mean of the latest two (C=30, B=20) — A is excluded.
        self.assertEqual(float(data['avg_price']), 25.0)
        self.assertEqual(len(data['avg_basis']), 2)
        # Full range still spans all three.
        self.assertEqual(float(data['min_price']), 10.0)
        self.assertEqual(float(data['max_price']), 30.0)

    def test_price_history_endpoint_filters_by_material(self):
        self.set_price(self.supA, 10)
        self.set_price(self.supB, 9)
        resp = self.admin_client().get(f'{BASE}price-history/?material={self.material.id}')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['count'], 2)


class SummaryAndQuotationTests(_Base):
    def test_summary_rolls_up_by_category(self):
        self.set_price(self.supA, 10)
        resp = self.admin_client().get(f'{BASE}summary/')
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        plumbing = next(c for c in body['categories'] if c['name'] == 'Plumbing')
        self.assertEqual(plumbing['material_count'], 1)
        self.assertEqual(plumbing['priced_count'], 1)
        self.assertEqual(float(plumbing['avg_price']), 10.0)
        self.assertEqual(body['totals']['suppliers'], 2)

    def test_quotation_upload(self):
        f = SimpleUploadedFile('quote.pdf', b'%PDF-1.4 fake', content_type='application/pdf')
        resp = self.admin_client().post(f'{BASE}quotations/', {
            'supplier': str(self.supA.id), 'title': 'June Plumbing Quote', 'file': f,
        }, format='multipart')
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(resp.json()['file_url'])


class AuditTrailTests(_Base):
    def test_audit_endpoint_is_admin_only(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.get(f'{BASE}audit/').status_code, 403)
        self.assertIn(APIClient().get(f'{BASE}audit/').status_code, (401, 403))

    def test_creating_supplier_writes_audit(self):
        self.admin_client().post(f'{BASE}suppliers/', {'name': 'Cafca'}, format='json')
        entry = AuditLog.objects.filter(target_type='supplier', action='created', target_name='Cafca').first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.actor, self.admin)

    def test_updating_material_records_field_diff(self):
        c = self.admin_client()
        c.patch(f'{BASE}materials/{self.material.slug}/', {'brand': 'Marley'}, format='json')
        entry = AuditLog.objects.filter(target_type='material', action='updated').order_by('-created_at').first()
        self.assertIsNotNone(entry)
        self.assertIn('brand', entry.changes)
        self.assertEqual(entry.changes['brand']['to'], 'Marley')

    def test_price_change_writes_audit(self):
        self.set_price(self.supA, 10)
        self.set_price(self.supA, 12)
        entries = AuditLog.objects.filter(target_type='price')
        self.assertEqual(entries.count(), 2)
        self.assertEqual(entries.filter(action='updated').count(), 1)

    def test_delete_writes_audit(self):
        c = self.admin_client()
        c.delete(f'{BASE}materials/{self.material.slug}/')
        self.assertTrue(AuditLog.objects.filter(target_type='material', action='deleted').exists())

    def test_audit_feed_filters_by_target_type(self):
        c = self.admin_client()
        c.post(f'{BASE}suppliers/', {'name': 'NewSup'}, format='json')
        self.set_price(self.supA, 10)
        self.assertEqual(c.get(f'{BASE}audit/?target_type=supplier').json()['count'], 1)
        self.assertEqual(c.get(f'{BASE}audit/?target_type=price').json()['count'], 1)


class CategoryTests(_Base):
    def test_add_category(self):
        resp = self.admin_client().post(f'{BASE}categories/', {'name': 'Roofing'}, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertTrue(MaterialCategory.objects.filter(name='Roofing').exists())

    def test_rename_category(self):
        cat = MaterialCategory.objects.create(name='Tools', slug='tools')
        resp = self.admin_client().patch(f'{BASE}categories/{cat.slug}/', {'name': 'Hand Tools'}, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        cat.refresh_from_db()
        self.assertEqual(cat.name, 'Hand Tools')

    def test_delete_empty_category(self):
        cat = MaterialCategory.objects.create(name='Spare', slug='spare')
        resp = self.admin_client().delete(f'{BASE}categories/{cat.slug}/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(MaterialCategory.objects.filter(slug='spare').exists())

    def test_cannot_delete_category_with_materials(self):
        # self.cat (Plumbing) has self.material
        resp = self.admin_client().delete(f'{BASE}categories/{self.cat.slug}/')
        self.assertEqual(resp.status_code, 400)
        self.assertTrue(MaterialCategory.objects.filter(pk=self.cat.pk).exists())

    def test_category_endpoints_admin_only(self):
        c = APIClient(); c.force_authenticate(self.customer)
        self.assertEqual(c.post(f'{BASE}categories/', {'name': 'X'}, format='json').status_code, 403)


class BatchPriceTests(_Base):
    def test_batch_without_quotation_logs_verbal_prices(self):
        resp = self.admin_client().post(f'{BASE}prices/batch/', {
            'supplier': str(self.supA.id),
            'items': [
                {'material': str(self.material.id), 'price': '3.20'},
                {'material_name': 'Cement 32.5N', 'category': 'construction', 'price': '11.50', 'unit': 'bag'},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        body = resp.json()
        self.assertEqual(body['created'], 2)
        self.assertIsNone(body['quotation_id'])  # no document — verbal prices
        self.assertTrue(Material.objects.filter(name='Cement 32.5N').exists())  # inline create
        self.assertEqual(SupplierPrice.objects.filter(supplier=self.supA, is_deleted=False).count(), 2)

    def test_batch_with_quotation_links_items(self):
        resp = self.admin_client().post(f'{BASE}prices/batch/', {
            'supplier': str(self.supB.id),
            'quotation_title': 'June Quote',
            'items': [{'material': str(self.material.id), 'price': '4.00'}],
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        qid = resp.json()['quotation_id']
        self.assertIsNotNone(qid)
        detail = self.admin_client().get(f'{BASE}quotations/{qid}/').json()
        self.assertEqual(detail['item_count'], 1)
        self.assertEqual(detail['items'][0]['material'], self.material.name)

    def test_batch_requires_supplier_and_items(self):
        c = self.admin_client()
        self.assertEqual(c.post(f'{BASE}prices/batch/', {'items': []}, format='json').status_code, 400)
        self.assertEqual(c.post(f'{BASE}prices/batch/', {'supplier': str(self.supA.id), 'items': []}, format='json').status_code, 400)

    def test_batch_admin_only(self):
        c = APIClient(); c.force_authenticate(self.customer)
        r = c.post(f'{BASE}prices/batch/', {'supplier': str(self.supA.id), 'items': [{'material': str(self.material.id), 'price': '1'}]}, format='json')
        self.assertEqual(r.status_code, 403)
