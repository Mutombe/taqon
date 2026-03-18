from django.contrib import admin
from .models import PageView, DailySnapshot


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['path', 'user', 'device_type', 'ip_address', 'created_at']
    list_filter = ['device_type', 'created_at']
    search_fields = ['path', 'ip_address']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(DailySnapshot)
class DailySnapshotAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'new_users', 'new_orders', 'revenue_usd',
        'new_tickets', 'resolved_tickets', 'page_views',
    ]
    list_filter = ['date']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
