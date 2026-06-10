from django.contrib import admin

from .models import (
    MaterialCategory, Supplier, Material, SupplierPrice,
    PriceHistory, SupplierQuotation, AuditLog,
)


@admin.register(MaterialCategory)
class MaterialCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'sort_order')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'contact_person')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'specification', 'brand', 'unit', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'brand', 'specification')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(SupplierPrice)
class SupplierPriceAdmin(admin.ModelAdmin):
    list_display = ('material', 'supplier', 'price', 'currency', 'quoted_at', 'updated_at')
    list_filter = ('currency', 'supplier')
    search_fields = ('material__name', 'supplier__name')
    autocomplete_fields = ('supplier', 'material', 'source_quotation')


@admin.register(PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ('material', 'supplier', 'previous_price', 'price', 'change_pct', 'created_at')
    list_filter = ('supplier',)
    search_fields = ('material__name', 'supplier__name')
    readonly_fields = ('created_at',)


@admin.register(SupplierQuotation)
class SupplierQuotationAdmin(admin.ModelAdmin):
    list_display = ('title', 'supplier', 'reference', 'quote_date', 'total_amount')
    list_filter = ('supplier',)
    search_fields = ('title', 'reference')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'target_type', 'target_name', 'actor', 'created_at')
    list_filter = ('target_type', 'action')
    search_fields = ('target_name', 'summary')
    readonly_fields = ('created_at',)
