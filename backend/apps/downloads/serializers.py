from rest_framework import serializers

from .models import Download, CompanyProfile, VideoStory


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


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Read/meta for the admin-uploaded company profile document."""
    file_url = serializers.SerializerMethodField()
    uploaded_by_email = serializers.EmailField(
        source='uploaded_by.email', read_only=True, default=None,
    )

    class Meta:
        model = CompanyProfile
        fields = [
            'id', 'file_url', 'original_name', 'content_type',
            'size_bytes', 'uploaded_by_email', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        try:
            return obj.file.url if obj.file else None
        except Exception:
            return None


class VideoStorySerializer(serializers.ModelSerializer):
    """Homepage video stories — admin-managed, public list is active-only."""
    youtube_id = serializers.CharField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = VideoStory
        fields = [
            'id', 'title', 'subtitle', 'youtube_url', 'youtube_id',
            'thumbnail_url', 'order', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'youtube_id', 'thumbnail_url', 'created_at']

    def get_thumbnail_url(self, obj):
        vid = obj.youtube_id
        # hqdefault always exists for a valid video id (unlike maxresdefault).
        return f'https://img.youtube.com/vi/{vid}/hqdefault.jpg' if vid else ''

    def validate_youtube_url(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('A YouTube link is required.')
        return value

    def validate(self, attrs):
        # Ensure the URL actually yields a video id on create/update.
        from .models import VideoStory as _VS
        url = attrs.get('youtube_url', getattr(self.instance, 'youtube_url', ''))
        if not _VS(youtube_url=url).youtube_id:
            raise serializers.ValidationError(
                {'youtube_url': 'Could not find a YouTube video id in that link.'})
        return attrs
