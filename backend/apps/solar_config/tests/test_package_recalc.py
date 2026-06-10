"""Package recalculation derives specs from its components (incl. inverter kVA)."""
from decimal import Decimal

from django.test import TestCase

from apps.solar_config.models import (
    SolarComponent, SolarPackageTemplate, PackageComponent,
)


class PackageRecalcTests(TestCase):
    def setUp(self):
        self.inv5 = SolarComponent.objects.create(name='5kVA Inverter', category='inverter', wattage=5000, price=Decimal('900'))
        self.inv8 = SolarComponent.objects.create(name='8kVA Inverter', category='inverter', wattage=8000, price=Decimal('1400'))
        self.panel = SolarComponent.objects.create(name='585W Panel', category='panel', wattage=585, price=Decimal('110'))
        self.batt = SolarComponent.objects.create(name='5kWh Battery', category='battery', capacity_kwh=Decimal('5.12'), price=Decimal('800'))
        self.pkg = SolarPackageTemplate.objects.create(name='Home 5kVA')

    def _add(self, comp, qty=1):
        PackageComponent.objects.create(package=self.pkg, component=comp, quantity=qty)

    def test_recalc_derives_specs(self):
        self._add(self.inv5)
        self._add(self.panel, qty=6)
        self._add(self.batt, qty=2)
        self.pkg.recalculate_price()
        self.pkg.refresh_from_db()
        self.assertEqual(self.pkg.inverter_rating_va, 5000)
        self.assertEqual(float(self.pkg.inverter_kva), 5.0)
        self.assertEqual(self.pkg.panel_count, 6)
        self.assertEqual(float(self.pkg.system_size_kw), 3.51)  # 585 * 6 / 1000
        self.assertEqual(float(self.pkg.battery_capacity_kwh), 10.24)  # 5.12 * 2

    def test_swapping_inverter_updates_kva(self):
        item = PackageComponent.objects.create(package=self.pkg, component=self.inv5, quantity=1)
        self.pkg.recalculate_price()
        self.pkg.refresh_from_db()
        self.assertEqual(float(self.pkg.inverter_kva), 5.0)
        # Swap the inverter component for the 8kVA one.
        item.component = self.inv8
        item.save()
        self.pkg.recalculate_price()
        self.pkg.refresh_from_db()
        self.assertEqual(float(self.pkg.inverter_kva), 8.0)
        self.assertEqual(self.pkg.inverter_rating_va, 8000)
