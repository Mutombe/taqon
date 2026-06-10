"""Admin Components & Accessories — read serializer surfaces package usage."""
from decimal import Decimal

from django.test import TestCase

from apps.shop.models import Brand, Category, Product
from apps.solar_config.models import (
    PackageComponent, SolarComponent, SolarPackageTemplate,
)
from apps.solar_config.serializers import AdminSolarComponentSerializer


class AdminComponentSerializerTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name='5kVA Inverter', sku='INV-5K',
            category=Category.objects.create(name='Inverters'),
            brand=Brand.objects.create(name='Sunsynk'),
            price=Decimal('1000.00'),
        )
        self.component = SolarComponent.objects.create(
            name='5kVA Inverter', category='inverter', brand='Sunsynk',
            price=Decimal('1000.00'), product=self.product,
        )
        self.p1 = SolarPackageTemplate.objects.create(name='Home 5kVA')
        self.p2 = SolarPackageTemplate.objects.create(name='Home 5kVA Plus')
        PackageComponent.objects.create(package=self.p1, component=self.component, quantity=1)
        PackageComponent.objects.create(package=self.p2, component=self.component, quantity=2)

    def test_serializer_reports_package_usage(self):
        data = AdminSolarComponentSerializer(self.component).data
        self.assertEqual(data['package_count'], 2)
        names = {u['name'] for u in data['used_in_packages']}
        self.assertEqual(names, {'Home 5kVA', 'Home 5kVA Plus'})
        qty = {u['name']: u['quantity'] for u in data['used_in_packages']}
        self.assertEqual(qty['Home 5kVA Plus'], 2)

    def test_serializer_exposes_product_link_and_editable_fields(self):
        data = AdminSolarComponentSerializer(self.component).data
        self.assertEqual(str(data['product']), str(self.product.id))
        self.assertEqual(data['product_name'], '5kVA Inverter')
        for field in ['price', 'brand', 'category', 'wattage', 'shop_visible', 'is_active', 'specifications']:
            self.assertIn(field, data)

    def test_soft_deleted_package_excluded_from_usage(self):
        self.p2.soft_delete()
        data = AdminSolarComponentSerializer(self.component).data
        self.assertEqual(data['package_count'], 1)
        self.assertEqual(data['used_in_packages'][0]['name'], 'Home 5kVA')
