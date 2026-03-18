from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user', 'notification_type', 'priority',
        'is_read', 'action_url', 'created_at',
    ]
    list_filter = ['notification_type', 'priority', 'is_read']
    search_fields = ['title', 'message', 'user__email']
    readonly_fields = ['read_at']
    actions = ['mark_as_read']

    @admin.action(description='Mark selected as read')
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        queryset.filter(is_read=False).update(is_read=True, read_at=timezone.now())


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user']
    search_fields = ['user__email']
    fieldsets = (
        ('In-App Notifications', {
            'fields': (
                'in_app_order_update', 'in_app_payment_received',
                'in_app_quote_ready', 'in_app_job_assigned',
                'in_app_ticket_reply', 'in_app_course_update',
                'in_app_promotion', 'in_app_system',
            ),
        }),
        ('Email Notifications', {
            'fields': (
                'email_order_update', 'email_payment_received',
                'email_quote_ready', 'email_job_assigned',
                'email_ticket_reply', 'email_course_update',
                'email_promotion', 'email_system',
            ),
        }),
    )
