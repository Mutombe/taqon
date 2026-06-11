from decimal import Decimal

from rest_framework import serializers

from .models import (
    MaterialCategory, Supplier, Material, SupplierPrice,
    PriceHistory, SupplierQuotation, AuditLog,
)


class MaterialCategorySerializer(serializers.ModelSerializer):
    material_count = serializers.SerializerMethodField()

    class Meta:
        model = MaterialCategory
        fields = ['id', 'name', 'slug', 'description', 'sort_order', 'material_count']
        read_only_fields = ['id', 'slug', 'material_count']

    def get_material_count(self, obj):
        return getattr(obj, 'material_count', None)


class SupplierSerializer(serializers.ModelSerializer):
    price_count = serializers.SerializerMethodField()
    quotation_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'slug', 'contact_person', 'phone', 'email',
            'address', 'website', 'notes', 'is_active',
            'price_count', 'quotation_count', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'price_count', 'quotation_count', 'created_at']

    def get_price_count(self, obj):
        return getattr(obj, 'price_count', None)

    def get_quotation_count(self, obj):
        return getattr(obj, 'quotation_count', None)


class SupplierPriceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    quotation_title = serializers.CharField(source='source_quotation.title', read_only=True, default=None)

    class Meta:
        model = SupplierPrice
        fields = [
            'id', 'supplier', 'supplier_name', 'material', 'material_name',
            'price', 'currency', 'source_quotation', 'quotation_title',
            'note', 'quoted_at', 'updated_at',
        ]
        read_only_fields = ['id', 'supplier_name', 'material_name', 'quotation_title', 'updated_at']


class MaterialSerializer(serializers.ModelSerializer):
    """Read view with cross-supplier price stats so suppliers can be compared."""

    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    prices = serializers.SerializerMethodField()
    avg_price = serializers.SerializerMethodField()
    avg_basis = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    supplier_count = serializers.SerializerMethodField()
    cheapest_supplier = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)
    product_slug = serializers.CharField(source='product.slug', read_only=True, default=None)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True, default=None)
    in_shop = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'category_slug',
            'specification', 'brand', 'unit', 'notes', 'is_active',
            'prices', 'avg_price', 'avg_basis', 'min_price', 'max_price', 'supplier_count',
            'cheapest_supplier', 'created_at',
            'product', 'product_name', 'product_slug', 'product_price', 'in_shop', 'markup_pct',
        ]
        read_only_fields = fields

    def get_in_shop(self, obj):
        return bool(obj.product_id and getattr(obj.product, 'is_active', False))

    def _live_prices(self, obj):
        return [p for p in obj.supplier_prices.all() if not p.is_deleted]

    def get_prices(self, obj):
        return SupplierPriceSerializer(
            sorted(self._live_prices(obj), key=lambda p: p.price), many=True,
        ).data

    def _values(self, obj):
        return [p.price for p in self._live_prices(obj)]

    def get_avg_price(self, obj):
        # The benchmark price = the mean of the TWO most recently updated supplier
        # prices for this material. Each supplier has one current price, so the
        # latest two are inherently from two different suppliers.
        latest_two = sorted(self._live_prices(obj), key=lambda p: p.updated_at, reverse=True)[:2]
        vals = [p.price for p in latest_two]
        return (sum(vals) / len(vals)).quantize(Decimal('0.01')) if vals else None

    def get_avg_basis(self, obj):
        latest_two = sorted(self._live_prices(obj), key=lambda p: p.updated_at, reverse=True)[:2]
        return [{'supplier': p.supplier.name, 'price': p.price} for p in latest_two]

    def get_min_price(self, obj):
        vals = self._values(obj)
        return min(vals) if vals else None

    def get_max_price(self, obj):
        vals = self._values(obj)
        return max(vals) if vals else None

    def get_supplier_count(self, obj):
        return len(self._live_prices(obj))

    def get_cheapest_supplier(self, obj):
        live = self._live_prices(obj)
        if not live:
            return None
        cheapest = min(live, key=lambda p: p.price)
        return {'supplier': cheapest.supplier.name, 'price': cheapest.price}


class MaterialWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'slug', 'category', 'specification', 'brand', 'unit', 'notes', 'is_active', 'product', 'markup_pct']
        read_only_fields = ['id']
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
            'product': {'required': False, 'allow_null': True},
            'markup_pct': {'required': False},
        }


class PriceHistorySerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    category_name = serializers.CharField(source='material.category.name', read_only=True, default=None)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PriceHistory
        fields = [
            'id', 'supplier', 'supplier_name', 'material', 'material_name',
            'category_name', 'price', 'previous_price', 'change_pct', 'currency',
            'source_quotation', 'note', 'recorded_by_name', 'created_at',
        ]
        read_only_fields = fields

    def get_recorded_by_name(self, obj):
        u = obj.recorded_by
        if not u:
            return None
        return getattr(u, 'full_name', '') or u.email


class SupplierQuotationSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = SupplierQuotation
        fields = [
            'id', 'supplier', 'supplier_name', 'title', 'file', 'file_url',
            'reference', 'quote_date', 'total_amount', 'currency', 'notes',
            'items', 'item_count', 'created_at',
        ]
        read_only_fields = ['id', 'supplier_name', 'file_url', 'items', 'item_count', 'created_at']

    def _items(self, obj):
        return [p for p in obj.priced_items.all() if not p.is_deleted]

    def get_items(self, obj):
        return [
            {'id': str(p.id), 'material': p.material.name, 'price': p.price, 'currency': p.currency}
            for p in sorted(self._items(obj), key=lambda p: p.material.name)
        ]

    def get_item_count(self, obj):
        return len(self._items(obj))

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        try:
            url = obj.file.url
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'action_display', 'target_type', 'target_type_display',
            'target_name', 'target_id', 'summary', 'changes', 'actor_name', 'created_at',
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        u = obj.actor
        if not u:
            return None
        return getattr(u, 'full_name', '') or u.email
