from rest_framework import serializers

from .models import Project, ProjectImage


# ── Public ───────────────────────────────────────────────────────────

class ProjectImagePublicSerializer(serializers.ModelSerializer):
    src = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectImage
        fields = ['src', 'caption']


class ProjectListSerializer(serializers.ModelSerializer):
    """Mirrors the frontend projectsData shape so the gallery just swaps its
    data source (heroImage / date camelCase kept on purpose)."""
    heroImage = serializers.CharField(source='hero', read_only=True)
    date = serializers.CharField(source='date_label', read_only=True)
    images = ProjectImagePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'slug', 'title', 'category', 'location', 'kva', 'date',
            'heroImage', 'description', 'images', 'is_featured',
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    heroImage = serializers.CharField(source='hero', read_only=True)
    date = serializers.CharField(source='date_label', read_only=True)
    fullDescription = serializers.JSONField(source='full_description', read_only=True)
    images = ProjectImagePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'slug', 'title', 'category', 'location', 'kva', 'date',
            'heroImage', 'description', 'fullDescription', 'specs',
            'benefits', 'images', 'is_featured',
            'cta_type', 'cta_label', 'cta_url', 'video_url',
        ]


# ── Admin ────────────────────────────────────────────────────────────

class ProjectImageAdminSerializer(serializers.ModelSerializer):
    src = serializers.CharField(read_only=True)

    class Meta:
        model = ProjectImage
        fields = ['id', 'src', 'image_url', 'caption', 'order']
        read_only_fields = ['id', 'src']


class ProjectAdminSerializer(serializers.ModelSerializer):
    images = ProjectImageAdminSerializer(many=True, read_only=True)
    hero = serializers.CharField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'slug', 'title', 'category', 'location', 'kva',
            'date_label', 'hero_image_url', 'hero', 'description',
            'full_description', 'specs', 'benefits',
            'is_published', 'is_featured', 'sort_order',
            'cta_type', 'cta_label', 'cta_url', 'video_url', 'images', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'hero', 'images', 'created_at']

    def validate_title(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError('Title is required.')
        return value.strip()
