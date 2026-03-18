from rest_framework import serializers
from .models import FAQ, SupportTicket, TicketMessage, ChatSession


# ── FAQ ─────────────────────────────────────────────────────────────────

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'answer', 'category', 'keywords',
            'order', 'is_published', 'is_featured',
            'helpful_count', 'not_helpful_count',
        ]


class FAQPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'answer', 'category',
            'is_featured', 'helpful_count', 'not_helpful_count',
        ]


# ── Ticket Messages ────────────────────────────────────────────────────

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = [
            'id', 'sender', 'sender_name', 'sender_type',
            'content', 'is_internal', 'attachment', 'attachment_url',
            'created_at',
        ]
        read_only_fields = ['sender', 'sender_type']

    def get_sender_name(self, obj):
        if not obj.sender:
            return 'System'
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.email


class TicketMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField()
    is_internal = serializers.BooleanField(default=False, required=False)


# ── Support Tickets ─────────────────────────────────────────────────────

class SupportTicketListSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'subject', 'category', 'priority',
            'status', 'customer', 'customer_name',
            'assigned_to', 'assigned_to_name',
            'message_count', 'last_reply_at', 'last_reply_by',
            'created_at', 'updated_at',
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email


class SupportTicketDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'ticket_number', 'subject', 'category', 'priority',
            'status', 'customer', 'customer_name', 'customer_email',
            'assigned_to', 'assigned_to_name',
            'order', 'job',
            'resolved_at', 'resolved_by', 'resolution_notes',
            'satisfaction_rating', 'satisfaction_comment',
            'message_count', 'last_reply_at', 'last_reply_by',
            'messages', 'created_at', 'updated_at',
        ]

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email

    def get_messages(self, obj):
        user = self.context.get('request', {})
        user = getattr(user, 'user', None)
        qs = obj.messages.select_related('sender').all()
        # Non-staff users shouldn't see internal notes
        if user and user.role not in ('admin', 'superadmin'):
            qs = qs.filter(is_internal=False)
        return TicketMessageSerializer(qs, many=True).data


class CreateTicketSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=300)
    category = serializers.CharField(max_length=30, default='general')
    priority = serializers.CharField(max_length=20, default='medium')
    message = serializers.CharField()
    order_id = serializers.UUIDField(required=False)
    job_id = serializers.UUIDField(required=False)


class TicketSatisfactionSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, default='')


# ── Chat Session ────────────────────────────────────────────────────────

class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'messages', 'is_active', 'created_at', 'updated_at']


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
