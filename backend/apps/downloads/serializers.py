from rest_framework import serializers

from .models import Download


class DownloadTrackSerializer(serializers.ModelSerializer):
    """Public — used by client-rendered brochures to log themselves."""
    class Meta:
        model = Download
        fields = [
            'kind', 'surface',
            'target_slug', 'target_label', 'target_id',
            'customer_name', 'customer_email',
            'metadata',
        ]
        extra_kwargs = {
            'kind': {'required': True},
            'surface': {'required': False},
            'target_slug': {'required': False, 'allow_blank': True},
            'target_label': {'required': False, 'allow_blank': True},
            'target_id': {'required': False, 'allow_null': True},
            'customer_name': {'required': False, 'allow_blank': True},
            'customer_email': {'required': False, 'allow_blank': True},
            'metadata': {'required': False},
        }


class DownloadAdminSerializer(serializers.ModelSerializer):
    """Admin list/detail — full payload."""
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    surface_display = serializers.CharField(source='get_surface_display', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True, default=None)

    class Meta:
        model = Download
        fields = [
            'id',
            'kind', 'kind_display',
            'surface', 'surface_display',
            'target_slug', 'target_label', 'target_id',
            'user', 'user_email',
            'customer_name', 'customer_email',
            'ip_address', 'user_agent', 'referer',
            'file_size_bytes', 'duration_ms',
            'success', 'failure_reason',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields
