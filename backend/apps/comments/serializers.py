from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    """Read serializer for listing/detail."""
    author_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    parent = serializers.UUIDField(source='parent_id', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'content_type', 'content_slug', 'author_name',
            'avatar_url', 'text', 'likes', 'created_at', 'parent', 'replies',
        ]

    def get_author_name(self, obj):
        if obj.user:
            full = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full or obj.user.email
        return obj.guest_name or 'Anonymous'

    def get_avatar_url(self, obj):
        if obj.user and obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None

    def get_replies(self, obj):
        # Only fetch replies for top-level comments to avoid N+1
        # Replies are prefetched in the view
        replies = obj.replies.filter(is_approved=True).order_by('created_at')
        return CommentSerializer(replies, many=True, context=self.context).data


class CreateCommentSerializer(serializers.Serializer):
    """Write serializer for creating comments."""
    content_type = serializers.ChoiceField(choices=Comment.CONTENT_TYPE_CHOICES)
    content_slug = serializers.CharField(max_length=320)
    text = serializers.CharField()
    guest_name = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    guest_email = serializers.EmailField(required=False, allow_blank=True, default='')
    parent = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_content_slug(self, value):
        if not value.strip():
            raise serializers.ValidationError('Content slug cannot be empty.')
        return value.strip()

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError('Comment text cannot be empty.')
        return value.strip()

    def validate_parent(self, value):
        if value is not None:
            try:
                parent_comment = Comment.objects.get(id=value)
            except Comment.DoesNotExist:
                raise serializers.ValidationError('Parent comment does not exist.')
            # Store the parent comment object for later use
            self._parent_comment = parent_comment
        return value

    def validate(self, attrs):
        request = self.context.get('request')

        # If not authenticated, guest_name is required
        if not request or not request.user or not request.user.is_authenticated:
            guest_name = attrs.get('guest_name', '').strip()
            if not guest_name:
                raise serializers.ValidationError(
                    {'guest_name': 'Name is required for guest comments.'}
                )

        # Ensure parent comment belongs to the same content
        parent_id = attrs.get('parent')
        if parent_id is not None:
            parent_comment = getattr(self, '_parent_comment', None)
            if parent_comment:
                if (parent_comment.content_type != attrs['content_type'] or
                        parent_comment.content_slug != attrs['content_slug']):
                    raise serializers.ValidationError(
                        {'parent': 'Parent comment must belong to the same content.'}
                    )

        # Rate limit: max 5 comments per IP per 10 minutes
        if request:
            from apps.core.utils import get_client_ip
            ip = get_client_ip(request)
            if ip:
                ten_mins_ago = timezone.now() - timedelta(minutes=10)
                recent_count = Comment.objects.filter(
                    ip_address=ip,
                    created_at__gte=ten_mins_ago,
                ).count()
                if recent_count >= 5:
                    raise serializers.ValidationError(
                        'Too many comments. Please wait a few minutes before posting again.'
                    )

        return attrs
