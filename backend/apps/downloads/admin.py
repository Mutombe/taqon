from django.contrib import admin

from .models import Download


@admin.register(Download)
class DownloadAdmin(admin.ModelAdmin):
    list_display = ('kind', 'target_label', 'surface', 'customer_email', 'success', 'created_at')
    list_filter = ('kind', 'surface', 'success', 'created_at')
    search_fields = ('target_slug', 'target_label', 'customer_name', 'customer_email', 'ip_address')
    readonly_fields = tuple(f.name for f in Download._meta.fields)
