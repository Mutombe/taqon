"""Internal / test accounts must not be recorded in customer analytics.

Covers the three tracked entry points: instant-quote downloads, public
inquiries, and Solar Advisor (recommendation) sessions.
"""
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.constants import is_internal_email, is_internal_actor
from apps.inquiries.models import Inquiry
from apps.solar_config.models import (
    SolarComponent, SolarPackageTemplate, PackageComponent, InstantQuoteDownload,
)

INTERNAL = 'admin@taqon.co.zw'
CUSTOMER = 'realcustomer@example.com'


class InternalAccountExclusionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        inv = SolarComponent.objects.create(
            name='5kVA Hybrid', slug='5kva-hybrid-x', category='inverter',
            price=Decimal('900.00'),
        )
        cls.package = SolarPackageTemplate.objects.create(
            name='Home Luxury 5kVA', slug='home-luxury-5kva-x',
        )
        PackageComponent.objects.create(package=cls.package, component=inv, quantity=1)

    def setUp(self):
        self.client = APIClient()

    # ── sanity ─────────────────────────────────────────────────────
    def test_email_list_matches_request(self):
        for e in [
            'admin@taqon.co.zw', 'smutombe98@gmail.com',
            'simbarashemutombe1@gmail.com', 'publish@bgfi.global',
            'mcdonaldmatiki@gmail.com',
        ]:
            self.assertTrue(is_internal_email(e), e)
        self.assertFalse(is_internal_email(CUSTOMER))

    def test_actor_detects_authenticated_internal_user(self):
        """The advisor-session gate keys off request.user (no email at the
        recommendation step) — so a logged-in internal admin is detected."""
        class _User:
            def __init__(self, email):
                self.is_authenticated = True
                self.email = email

        class _Req:
            def __init__(self, email):
                self.user = _User(email)

        self.assertTrue(is_internal_actor(_Req(INTERNAL)))
        self.assertFalse(is_internal_actor(_Req('someone@else.com')))

        class _Anon:
            user = type('A', (), {'is_authenticated': False, 'email': ''})()
        self.assertFalse(is_internal_actor(_Anon()))

    # ── inquiries ──────────────────────────────────────────────────
    def test_internal_inquiry_not_recorded(self):
        resp = self.client.post('/api/v1/inquiries/', {
            'name': 'Admin Test', 'email': INTERNAL, 'message': 'testing',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertIsNone(resp.data.get('id'))
        self.assertEqual(Inquiry.objects.filter(email=INTERNAL).count(), 0)

    def test_customer_inquiry_is_recorded(self):
        resp = self.client.post('/api/v1/inquiries/', {
            'name': 'Real Person', 'email': CUSTOMER, 'message': 'interested',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Inquiry.objects.filter(email=CUSTOMER).count(), 1)

    # ── download log (record_download) ─────────────────────────────
    def test_internal_download_log_skipped(self):
        from apps.downloads.services import record_download
        from apps.downloads.models import Download
        before = Download.objects.count()
        record_download(None, kind='instant_quote', customer_email=INTERNAL)
        self.assertEqual(Download.objects.count(), before)  # not logged

    def test_customer_download_log_recorded(self):
        from apps.downloads.services import record_download
        from apps.downloads.models import Download
        before = Download.objects.count()
        record_download(None, kind='instant_quote', customer_email=CUSTOMER)
        self.assertEqual(Download.objects.count(), before + 1)

    # ── instant-quote downloads ────────────────────────────────────
    def _download(self, email):
        return self.client.post('/api/v1/solar-config/instant-quote/', {
            'package_slug': self.package.slug,
            'customer_name': 'Tester',
            'customer_email': email,
            'distance_km': 72,
        }, format='json')

    def test_internal_download_not_recorded(self):
        resp = self._download(INTERNAL)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(InstantQuoteDownload.objects.filter(customer_email=INTERNAL).count(), 0)

    def test_customer_download_is_recorded(self):
        resp = self._download(CUSTOMER)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(InstantQuoteDownload.objects.filter(customer_email=CUSTOMER).count(), 1)
