from django.contrib import admin

from .models import FeatureFlag


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('name', 'key', 'is_enabled', 'enabled_for_staff_only', 'updated_at')
    list_filter = ('is_enabled', 'enabled_for_staff_only')
    search_fields = ('key', 'name', 'description')
    readonly_fields = ('key', 'name', 'description', 'created_at', 'updated_at')
    fieldsets = (
        ('Identity', {'fields': ('key', 'name', 'description')}),
        ('State', {'fields': ('is_enabled', 'enabled_for_staff_only')}),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )
