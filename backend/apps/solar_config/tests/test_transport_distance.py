"""Regression test for location-driven transport pricing.

A Bulawayo customer was being billed Harare's transport because the
frontend sent distance_km=10 regardless of location. The backend was
always correct — transport scales with distance — so this locks that in
and, crucially, verifies the algebraic identity the deposit modal relies
on to adjust the displayed total for a chosen area:

    total(d2) == total(d1) + (d2 - d1) * transport_per_km
"""
from decimal import Decimal

from django.test import TestCase

from apps.solar_config.models import SolarComponent, SolarPackageTemplate, PackageComponent
from apps.solar_config.engine.pricing import calculate_price
from apps.solar_config.engine.constants import PRICING


class TransportDistanceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        panel = SolarComponent.objects.create(
            name='450W Mono Panel', slug='450w-mono', category='panel',
            price=Decimal('120.00'),
        )
        inverter = SolarComponent.objects.create(
            name='5kVA Hybrid', slug='5kva-hybrid', category='inverter',
            price=Decimal('900.00'),
        )
        cls.package = SolarPackageTemplate.objects.create(
            name='Home Luxury 5kVA', slug='home-luxury-5kva',
        )
        PackageComponent.objects.create(package=cls.package, component=panel, quantity=6)
        PackageComponent.objects.create(package=cls.package, component=inverter, quantity=1)

    def test_transport_scales_with_distance(self):
        per_km = PRICING['transport_per_km']
        harare = calculate_price(self.package, distance_km=10)
        bulawayo = calculate_price(self.package, distance_km=440)

        self.assertEqual(harare['transport'], Decimal('10') * per_km)
        self.assertEqual(bulawayo['transport'], Decimal('440') * per_km)
        # The whole point: they must NOT be equal.
        self.assertNotEqual(harare['transport'], bulawayo['transport'])
        # Material/sundries/labour are distance-independent.
        self.assertEqual(harare['material'], bulawayo['material'])
        self.assertEqual(harare['labour'], bulawayo['labour'])

    def test_total_delta_matches_frontend_adjustment(self):
        """The deposit modal computes total(area) as
        base_total + (area_km - base_km) * perKm. Confirm that equals a
        full recompute at area_km, so the displayed deposit matches what
        the backend independently charges."""
        per_km = PRICING['transport_per_km']
        base_km, area_km = Decimal('10'), Decimal('440')

        base = calculate_price(self.package, distance_km=base_km)
        recomputed = calculate_price(self.package, distance_km=area_km)

        frontend_adjusted = base['total'] + (area_km - base_km) * per_km
        self.assertEqual(frontend_adjusted, recomputed['total'])
