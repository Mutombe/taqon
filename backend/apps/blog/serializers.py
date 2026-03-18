from rest_framework import serializers
from .models import BlogCategory, BlogPost


# ── Blog Category ────────────────────────────────────────────────────


class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'is_active', 'post_count']
        read_only_fields = ['id', 'slug', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(is_published=True, is_deleted=False).count()


# ── Author compact ───────────────────────────────────────────────────


class BlogAuthorSerializer(serializers.Serializer):
    """Read-only author representation for blog posts."""
    id = serializers.UUIDField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    avatar = serializers.ImageField(read_only=True)


# ── Blog Post List (compact) ─────────────────────────────────────────


class BlogPostListSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author = BlogAuthorSerializer(read_only=True)
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'category', 'tags',
            'image_display', 'author', 'read_time',
            'published_at', 'views_count',
        ]
        read_only_fields = fields

    def get_image_display(self, obj):
        """Return the best available image URL."""
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or ''


# ── Blog Post Detail (full) ──────────────────────────────────────────


class BlogPostDetailSerializer(serializers.ModelSerializer):
    category = BlogCategorySerializer(read_only=True)
    author = BlogAuthorSerializer(read_only=True)
    image_display = serializers.SerializerMethodField()
    related_posts = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'category', 'tags', 'image_display', 'author',
            'read_time', 'is_published', 'published_at',
            'meta_title', 'meta_description', 'views_count',
            'related_posts', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_image_display(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or ''

    def get_related_posts(self, obj):
        related = (
            BlogPost.objects
            .filter(
                category=obj.category,
                is_published=True,
                is_deleted=False,
            )
            .exclude(pk=obj.pk)[:3]
        )
        return BlogPostListSerializer(related, many=True, context=self.context).data


# ── Blog Post Create/Update (admin writable) ─────────────────────────


class BlogPostCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            'title', 'slug', 'excerpt', 'content',
            'category', 'tags', 'image', 'image_url',
            'read_time', 'is_published', 'published_at',
            'meta_title', 'meta_description',
        ]

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Tags must be a list of strings.')
        return value

    def validate(self, attrs):
        # Auto-set published_at when publishing for the first time
        if attrs.get('is_published') and not attrs.get('published_at'):
            instance = self.instance
            if not instance or not instance.published_at:
                from django.utils import timezone
                attrs['published_at'] = timezone.now()
        return attrs
