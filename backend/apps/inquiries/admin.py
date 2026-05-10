from django.contrib import admin

from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'area', 'status', 'source', 'created_at')
    list_filter = ('status', 'source', 'created_at')
    search_fields = ('name', 'email', 'phone', 'area', 'message')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    fieldsets = (
        ('Customer', {'fields': ('name', 'email', 'phone')}),
        ('Site', {'fields': ('area', 'distance_km')}),
        ('Demand', {'fields': ('monthly_grid_bill', 'appliances', 'message')}),
        ('Triage', {'fields': ('status', 'source', 'admin_notes')}),
        ('Audit', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
