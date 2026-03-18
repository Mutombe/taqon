from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        'short_text', 'author_name', 'content_type', 'content_slug',
        'is_approved', 'likes', 'ip_address', 'created_at',
    ]
    list_filter = ['content_type', 'is_approved', 'created_at']
    search_fields = ['text', 'guest_name', 'guest_email', 'user__email', 'content_slug']
    readonly_fields = ['ip_address', 'created_at', 'updated_at']
    list_editable = ['is_approved']
    actions = ['approve_comments', 'unapprove_comments']

    def short_text(self, obj):
        return obj.text[:80] + ('...' if len(obj.text) > 80 else '')
    short_text.short_description = 'Text'

    @admin.action(description='Approve selected comments')
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description='Unapprove selected comments')
    def unapprove_comments(self, request, queryset):
        queryset.update(is_approved=False)
