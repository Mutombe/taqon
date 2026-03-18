from django.contrib import admin
from .models import FAQ, SupportTicket, TicketMessage, ChatSession


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0
    readonly_fields = ['sender', 'sender_type', 'content', 'is_internal', 'created_at']
    fields = readonly_fields


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'is_published', 'is_featured', 'order', 'helpful_count']
    list_filter = ['category', 'is_published', 'is_featured']
    search_fields = ['question', 'answer']
    list_editable = ['order', 'is_published', 'is_featured']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = [
        'ticket_number', 'subject', 'customer', 'category',
        'priority', 'status', 'assigned_to', 'message_count',
        'satisfaction_rating', 'created_at',
    ]
    list_filter = ['status', 'priority', 'category']
    search_fields = ['ticket_number', 'subject', 'customer__email']
    readonly_fields = ['ticket_number', 'message_count', 'last_reply_at']
    inlines = [TicketMessageInline]
    fieldsets = (
        (None, {
            'fields': ('ticket_number', 'customer', 'subject', 'category', 'priority', 'status'),
        }),
        ('Assignment', {
            'fields': ('assigned_to',),
        }),
        ('Linked Entities', {
            'fields': ('order', 'job'),
            'classes': ('collapse',),
        }),
        ('Resolution', {
            'fields': ('resolved_at', 'resolved_by', 'resolution_notes'),
        }),
        ('Satisfaction', {
            'fields': ('satisfaction_rating', 'satisfaction_comment'),
        }),
        ('Metadata', {
            'fields': ('message_count', 'last_reply_at', 'last_reply_by'),
        }),
    )
    actions = ['close_tickets', 'assign_to_me']

    @admin.action(description='Close selected tickets')
    def close_tickets(self, request, queryset):
        queryset.update(status='closed')

    @admin.action(description='Assign selected tickets to me')
    def assign_to_me(self, request, queryset):
        queryset.update(assigned_to=request.user, status='in_progress')


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'sender_type', 'sender', 'is_internal', 'created_at']
    list_filter = ['sender_type', 'is_internal']
    search_fields = ['content']


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'session_key', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['user__email']
