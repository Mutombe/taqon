from rest_framework import serializers
from .models import (
    SolarComponent, SolarPackageTemplate, PackageComponent,
    SolarConfiguration, ConfigurationItem,
    PackageFamily, Appliance,
    InstantQuoteDownload, RecommendationSession,
)


# ── Components ──

class SolarComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolarComponent
        fields = [
            'id', 'name', 'slug', 'category', 'brand', 'model_number',
            'description', 'image_url', 'price', 'currency',
            'wattage', 'voltage', 'capacity_ah', 'capacity_kwh',
            'efficiency', 'warranty_years', 'weight_kg',
            'compatible_voltages', 'specifications',
            'is_featured', 'shop_visible', 'sort_order',
        ]
        read_only_fields = fields


class SolarComponentListSerializer(serializers.ModelSerializer):
    """Compact list view."""

    class Meta:
        model = SolarComponent
        fields = [
            'id', 'name', 'slug', 'category', 'brand',
            'price', 'currency', 'wattage', 'voltage',
            'capacity_kwh', 'efficiency', 'warranty_years',
            'image_url', 'is_featured', 'shop_visible',
        ]
        read_only_fields = fields


# ── Appliances ──

class ApplianceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appliance
        fields = [
            'id', 'name', 'slug', 'category', 'icon_name',
            'typical_wattage', 'power_points', 'energy_points',
            'concurrency_factor', 'night_use_factor',
            'smart_load_eligible', 'description', 'sort_order',
        ]
        read_only_fields = fields


class ApplianceSelectionSerializer(serializers.Serializer):
    """Single appliance selection in a recommendation request."""
    appliance_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UserPreferencesSerializer(serializers.Serializer):
    """User preferences for recommendation tuning."""
    priority = serializers.ChoiceField(
        choices=['lowest_cost', 'balanced', 'max_comfort'],
        default='balanced', required=False,
    )
    willing_to_manage = serializers.BooleanField(default=False, required=False)
    use_style = serializers.ChoiceField(
        choices=['backup', 'backup_solar', 'independence'],
        default='backup_solar', required=False,
    )
    wants_smart = serializers.BooleanField(default=False, required=False)


class RecommendRequestSerializer(serializers.Serializer):
    """Request body for the recommendation endpoint."""
    appliances = ApplianceSelectionSerializer(many=True)
    distance_km = serializers.DecimalField(
        max_digits=8, decimal_places=1, required=False, default=10,
    )
    preferences = UserPreferencesSerializer(required=False)


class PriceBreakdownSerializer(serializers.Serializer):
    """Price breakdown for a package."""
    material = serializers.DecimalField(max_digits=12, decimal_places=2)
    sundries = serializers.DecimalField(max_digits=10, decimal_places=2)
    labour = serializers.DecimalField(max_digits=10, decimal_places=2)
    transport = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


# ── Package Templates ──

class PackageComponentSerializer(serializers.ModelSerializer):
    component = SolarComponentListSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PackageComponent
        fields = ['id', 'component', 'quantity', 'notes', 'line_total']
        read_only_fields = fields


class SolarPackageTemplateSerializer(serializers.ModelSerializer):
    items = PackageComponentSerializer(many=True, read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True, default=None)
    family_slug = serializers.CharField(source='family.slug', read_only=True, default=None)

    class Meta:
        model = SolarPackageTemplate
        fields = [
            'id', 'name', 'slug', 'tier', 'description', 'short_description',
            'image_url', 'system_size_kw', 'inverter_rating_va', 'inverter_kva',
            'battery_capacity_kwh', 'estimated_daily_output_kwh', 'backup_hours',
            'panel_count', 'phase', 'variant_name',
            'price', 'compare_at_price', 'currency',
            'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost',
            'distance_km',
            'features', 'suitable_for',
            'family', 'family_name', 'family_slug',
            'items', 'created_at',
            # Status + capability bands (needed by admin dashboard)
            'is_active', 'is_popular', 'sort_order',
            'variant_code', 'pp_min', 'pp_max', 'ep_min', 'ep_max',
            'smart_load_supported', 'inverter_brand',
            'recharge_class', 'comfort_class', 'management_tolerance',
        ]
        read_only_fields = fields


class SolarPackageListSerializer(serializers.ModelSerializer):
    """Compact list without items."""
    family_name = serializers.CharField(source='family.name', read_only=True, default=None)
    family_slug = serializers.CharField(source='family.slug', read_only=True, default=None)

    class Meta:
        model = SolarPackageTemplate
        fields = [
            'id', 'name', 'slug', 'tier', 'short_description',
            'system_size_kw', 'inverter_rating_va', 'inverter_kva',
            'battery_capacity_kwh', 'backup_hours',
            'panel_count', 'phase', 'variant_name',
            'price', 'currency',
            'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost',
            'features', 'suitable_for', 'is_popular',
            'family', 'family_name', 'family_slug',
            'variant_code', 'pp_min', 'pp_max', 'ep_min', 'ep_max',
            'smart_load_supported', 'inverter_brand',
            'recharge_class', 'comfort_class', 'management_tolerance',
        ]
        read_only_fields = fields


# ── Package Families ──

class PackageFamilyListSerializer(serializers.ModelSerializer):
    """Compact family list with package count and price range."""
    package_count = serializers.SerializerMethodField()
    price_min = serializers.SerializerMethodField()
    price_max = serializers.SerializerMethodField()

    class Meta:
        model = PackageFamily
        fields = [
            'id', 'name', 'slug', 'kva_rating', 'family_code',
            'short_description', 'image_url', 'suitable_for',
            'sort_order', 'package_count', 'price_min', 'price_max',
        ]
        read_only_fields = fields

    def get_package_count(self, obj):
        return obj.packages.filter(is_active=True, is_deleted=False).count()

    def get_price_min(self, obj):
        pkg = obj.packages.filter(is_active=True, is_deleted=False).order_by('price').first()
        return str(pkg.price) if pkg else None

    def get_price_max(self, obj):
        pkg = obj.packages.filter(is_active=True, is_deleted=False).order_by('-price').first()
        return str(pkg.price) if pkg else None


class PackageFamilySerializer(serializers.ModelSerializer):
    """Full family detail with nested packages."""
    packages = serializers.SerializerMethodField()

    class Meta:
        model = PackageFamily
        fields = [
            'id', 'name', 'slug', 'kva_rating', 'family_code',
            'description', 'short_description', 'image_url',
            'suitable_for', 'sort_order', 'packages',
        ]
        read_only_fields = fields

    def get_packages(self, obj):
        pkgs = obj.packages.filter(is_active=True, is_deleted=False).order_by('price')
        return SolarPackageListSerializer(pkgs, many=True).data


# ── Recommendation Response ──

class RecommendTierSerializer(serializers.Serializer):
    """Single tier in a recommendation response."""
    package = SolarPackageListSerializer(read_only=True, allow_null=True)
    inverter_kva = serializers.DecimalField(max_digits=6, decimal_places=1)
    battery_kwh = serializers.DecimalField(max_digits=8, decimal_places=2)
    adjusted_pp = serializers.DecimalField(max_digits=8, decimal_places=2)
    adjusted_ep = serializers.DecimalField(max_digits=8, decimal_places=2)
    price_breakdown = PriceBreakdownSerializer(allow_null=True)


class RecommendResponseSerializer(serializers.Serializer):
    """Full recommendation response."""
    total_pp = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_ep = serializers.DecimalField(max_digits=8, decimal_places=2)
    distance_km = serializers.DecimalField(max_digits=8, decimal_places=1)
    tiers = serializers.DictField(child=RecommendTierSerializer())


# ── User Configurations ──

class ConfigurationItemSerializer(serializers.ModelSerializer):
    component = SolarComponentListSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ConfigurationItem
        fields = ['id', 'component', 'quantity', 'line_total']
        read_only_fields = ['id', 'line_total']


class ConfigurationItemCreateSerializer(serializers.Serializer):
    component_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class SolarConfigurationSerializer(serializers.ModelSerializer):
    items = ConfigurationItemSerializer(many=True, read_only=True)

    class Meta:
        model = SolarConfiguration
        fields = [
            'id', 'name', 'description', 'based_on_template',
            'total_price', 'total_wattage', 'system_voltage',
            'estimated_daily_kwh', 'estimated_backup_hours',
            'battery_capacity_kwh',
            'status', 'has_warnings', 'warnings',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'total_price', 'total_wattage',
            'estimated_daily_kwh', 'estimated_backup_hours',
            'battery_capacity_kwh',
            'has_warnings', 'warnings',
            'created_at', 'updated_at',
        ]


class SolarConfigurationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolarConfiguration
        fields = [
            'id', 'name', 'total_price', 'total_wattage',
            'system_voltage', 'estimated_daily_kwh',
            'estimated_backup_hours', 'status',
            'has_warnings', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class CreateConfigurationSerializer(serializers.Serializer):
    """Create a new configuration, optionally from a package template."""

    name = serializers.CharField(max_length=200, default='My Solar System')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    template_id = serializers.UUIDField(required=False, allow_null=True)
    system_voltage = serializers.ChoiceField(choices=[12, 24, 48], default=48)
    items = ConfigurationItemCreateSerializer(many=True, required=False)


class UpdateConfigItemsSerializer(serializers.Serializer):
    """Replace all items in a configuration."""

    items = ConfigurationItemCreateSerializer(many=True)


# ── Admin Package Item Management ──

class AdminPackageItemSerializer(serializers.Serializer):
    """Add or update a component within a package."""
    component_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


# ── Admin Package Create/Update ──

class AdminSolarPackageCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin package CRUD."""

    class Meta:
        model = SolarPackageTemplate
        fields = [
            'name', 'slug', 'tier', 'description', 'short_description',
            'image_url', 'system_size_kw', 'inverter_rating_va', 'inverter_kva',
            'battery_capacity_kwh', 'estimated_daily_output_kwh', 'backup_hours',
            'panel_count', 'phase', 'variant_name', 'family',
            'price', 'compare_at_price', 'currency',
            'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost',
            'distance_km',
            'features', 'suitable_for', 'is_popular', 'is_active', 'sort_order',
            # Capability bands
            'variant_code', 'pp_min', 'pp_max', 'ep_min', 'ep_max',
            'smart_load_supported', 'inverter_brand',
            'recharge_class', 'comfort_class', 'management_tolerance',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = SolarPackageTemplate.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A solar package with this slug already exists.'
            )
        return value


# ── Admin Component Create/Update ──

class AdminSolarComponentCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin component CRUD."""

    class Meta:
        model = SolarComponent
        fields = [
            'name', 'slug', 'category', 'brand', 'model_number',
            'description', 'image_url', 'price', 'currency',
            'product',
            'wattage', 'voltage', 'capacity_ah', 'capacity_kwh',
            'efficiency', 'warranty_years', 'weight_kg',
            'compatible_voltages', 'specifications',
            'shop_visible', 'xlsx_row_key',
            'is_active', 'is_featured', 'sort_order',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = SolarComponent.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A solar component with this slug already exists.'
            )
        return value


# ── Admin Appliance ──

class AdminApplianceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appliance
        fields = [
            'name', 'slug', 'category', 'icon_name',
            'typical_wattage', 'power_points', 'energy_points',
            'concurrency_factor', 'night_use_factor',
            'smart_load_eligible', 'description',
            'is_active', 'sort_order',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = Appliance.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'An appliance with this slug already exists.'
            )
        return value


class AdminPackageFamilyCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageFamily
        fields = [
            'name', 'slug', 'kva_rating', 'family_code',
            'description', 'short_description', 'image_url',
            'suitable_for', 'is_active', 'sort_order',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = PackageFamily.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'A package family with this slug already exists.'
            )
        return value


# ── Tracking Serializers ──

class InstantQuoteDownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstantQuoteDownload
        fields = [
            'id', 'package_name', 'tier_label', 'distance_km', 'total_price',
            'customer_name', 'customer_email', 'customer_phone', 'customer_address',
            'created_at',
        ]
        read_only_fields = fields


class RecommendationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendationSession
        fields = [
            'id', 'total_pp', 'total_ep', 'distance_km', 'appliance_count',
            'budget_package', 'good_fit_package', 'excellent_package',
            'priority', 'use_style', 'ip_address', 'created_at',
        ]
        read_only_fields = fields
