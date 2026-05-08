from rest_framework import serializers

from .models import FeatureFlag


class FeatureFlagSerializer(serializers.ModelSerializer):
    """Public-facing serializer — returns only what the frontend needs to gate UI."""
    class Meta:
        model = FeatureFlag
        fields = ['key', 'name', 'description', 'is_enabled', 'enabled_for_staff_only']
        read_only_fields = ['key', 'name', 'description']


class AdminFeatureFlagSerializer(serializers.ModelSerializer):
    """Admin serializer — exposes timestamps and audit fields."""
    class Meta:
        model = FeatureFlag
        fields = [
            'id', 'key', 'name', 'description',
            'is_enabled', 'enabled_for_staff_only',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'key', 'name', 'description', 'created_at', 'updated_at']
