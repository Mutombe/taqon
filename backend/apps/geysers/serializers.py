from rest_framework import serializers

from .models import GeyserPackage


class GeyserPackageListSerializer(serializers.ModelSerializer):
    """Lean card view for the public packages grid."""

    class Meta:
        model = GeyserPackage
        fields = [
            'id', 'name', 'slug', 'system_type', 'capacity_litres', 'variant',
            'is_smart', 'brand', 'short_description', 'price', 'currency',
            'image_url', 'is_featured', 'sort_order',
        ]


class GeyserPackageDetailSerializer(serializers.ModelSerializer):
    """Full public detail: specs, what's included, price build-up (no internal BOM)."""

    class Meta:
        model = GeyserPackage
        fields = [
            'id', 'name', 'slug', 'system_type', 'capacity_litres', 'variant',
            'is_smart', 'brand', 'geyser_unit', 'short_description', 'description',
            'price', 'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost',
            'distance_km', 'currency', 'whats_included', 'features', 'specifications',
            'image_url', 'is_featured',
        ]


class AdminGeyserPackageSerializer(serializers.ModelSerializer):
    """Admin read/write — includes the bill of materials."""

    class Meta:
        model = GeyserPackage
        fields = [
            'id', 'name', 'slug', 'system_type', 'capacity_litres', 'variant',
            'is_smart', 'brand', 'geyser_unit', 'short_description', 'description',
            'price', 'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost',
            'distance_km', 'currency', 'whats_included', 'features', 'specifications',
            'components', 'image_url', 'is_active', 'is_featured', 'sort_order',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_smart', 'created_at', 'updated_at']
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}
