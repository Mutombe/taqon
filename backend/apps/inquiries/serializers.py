from rest_framework import serializers

from .models import Inquiry


class InquirySubmitSerializer(serializers.ModelSerializer):
    """Public-facing — captures only what the form posts."""
    class Meta:
        model = Inquiry
        fields = [
            'name', 'email', 'phone',
            'area', 'distance_km',
            'monthly_grid_bill', 'appliances', 'message',
            'source',
        ]
        extra_kwargs = {
            'phone': {'required': False, 'allow_blank': True},
            'area': {'required': False, 'allow_blank': True},
            'distance_km': {'required': False, 'allow_null': True},
            'monthly_grid_bill': {'required': False, 'allow_null': True},
            'appliances': {'required': False},
            'message': {'required': False, 'allow_blank': True},
            'source': {'required': False},
        }


class InquiryAdminListSerializer(serializers.ModelSerializer):
    """Admin list view — slim payload for the inquiries table."""
    appliance_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            'id', 'name', 'email', 'phone',
            'area', 'distance_km',
            'monthly_grid_bill', 'appliance_count',
            'status', 'source',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class InquiryAdminDetailSerializer(serializers.ModelSerializer):
    """Admin detail view — everything the operator needs to triage."""
    class Meta:
        model = Inquiry
        fields = [
            'id', 'name', 'email', 'phone',
            'area', 'distance_km',
            'monthly_grid_bill', 'appliances', 'message',
            'status', 'source', 'admin_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'name', 'email', 'phone',
                            'area', 'distance_km',
                            'monthly_grid_bill', 'appliances', 'message',
                            'source',
                            'created_at', 'updated_at']
