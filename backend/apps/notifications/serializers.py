from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 'priority',
            'is_read', 'read_at', 'action_url', 'action_label',
            'order_id', 'ticket_id', 'job_id', 'course_id', 'quotation_id',
            'metadata', 'created_at',
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = ['id', 'user', 'created_at', 'updated_at']


class AdminSendNotificationSerializer(serializers.Serializer):
    user_id = serializers.UUIDField(required=False, help_text='Specific user. Omit for broadcast.')
    notification_type = serializers.CharField(default='system')
    title = serializers.CharField(max_length=300)
    message = serializers.CharField()
    priority = serializers.ChoiceField(choices=['low', 'normal', 'high'], default='normal')
    action_url = serializers.CharField(required=False, allow_blank=True, default='')
    action_label = serializers.CharField(required=False, allow_blank=True, default='')
    role_filter = serializers.ChoiceField(
        choices=['all', 'customer', 'technician', 'admin'],
        default='all',
        required=False,
        help_text='For broadcast: filter by role',
    )
