from django.contrib import admin
from .models import (
    SolarComponent,
    SolarPackageTemplate,
    PackageComponent,
    SolarConfiguration,
    ConfigurationItem,
    PackageFamily,
    Appliance,
)


class PackageComponentInline(admin.TabularInline):
    model = PackageComponent
    extra = 1
    autocomplete_fields = ['component']


class ConfigurationItemInline(admin.TabularInline):
    model = ConfigurationItem
    extra = 0
    autocomplete_fields = ['component']
    readonly_fields = ['line_total']


class PackageInline(admin.TabularInline):
    model = SolarPackageTemplate
    extra = 0
    fields = ['name', 'variant_name', 'inverter_kva', 'battery_capacity_kwh', 'price', 'is_active']
    readonly_fields = ['price']
    show_change_link = True


@admin.register(PackageFamily)
class PackageFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'kva_rating', 'family_code', 'is_active', 'sort_order']
    list_filter = ['is_active', 'kva_rating']
    search_fields = ['name', 'family_code', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PackageInline]
    fieldsets = [
        (None, {
            'fields': ('name', 'slug', 'kva_rating', 'family_code', 'description', 'short_description', 'image_url'),
        }),
        ('Marketing', {
            'fields': ('suitable_for',),
        }),
        ('Display', {
            'fields': ('is_active', 'sort_order'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(Appliance)
class ApplianceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'typical_wattage', 'power_points', 'energy_points', 'concurrency_factor', 'smart_load_eligible', 'is_active']
    list_filter = ['category', 'is_active', 'smart_load_eligible']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 50
    fieldsets = [
        (None, {
            'fields': ('name', 'slug', 'category', 'icon_name', 'description'),
        }),
        ('Scoring', {
            'fields': ('typical_wattage', 'power_points', 'energy_points', 'concurrency_factor', 'night_use_factor', 'smart_load_eligible'),
        }),
        ('Display', {
            'fields': ('is_active', 'sort_order'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(SolarComponent)
class SolarComponentAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'price', 'wattage', 'voltage', 'shop_visible', 'is_active', 'is_featured']
    list_filter = ['category', 'is_active', 'is_featured', 'shop_visible', 'brand']
    search_fields = ['name', 'brand', 'model_number', 'description', 'xlsx_row_key']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'is_featured', 'shop_visible']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        (None, {
            'fields': ('name', 'slug', 'category', 'brand', 'model_number', 'description', 'image_url'),
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'product'),
        }),
        ('Technical Specs', {
            'fields': ('wattage', 'voltage', 'capacity_ah', 'capacity_kwh', 'efficiency', 'warranty_years', 'weight_kg', 'compatible_voltages', 'specifications'),
        }),
        ('Display & Seeding', {
            'fields': ('is_active', 'is_featured', 'shop_visible', 'xlsx_row_key', 'sort_order'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(SolarPackageTemplate)
class SolarPackageTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'family', 'variant_name', 'tier', 'inverter_kva', 'battery_capacity_kwh', 'panel_count', 'price', 'is_active', 'is_popular']
    list_filter = ['tier', 'is_active', 'is_popular', 'family', 'phase']
    search_fields = ['name', 'description', 'variant_name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['material_cost', 'sundries_cost', 'labour_cost', 'transport_cost', 'created_at', 'updated_at']
    inlines = [PackageComponentInline]
    autocomplete_fields = ['family']
    fieldsets = [
        (None, {
            'fields': ('name', 'slug', 'tier', 'family', 'variant_name', 'description', 'short_description', 'image_url'),
        }),
        ('System Specs', {
            'fields': ('system_size_kw', 'inverter_rating_va', 'inverter_kva', 'battery_capacity_kwh', 'estimated_daily_output_kwh', 'backup_hours', 'panel_count', 'phase'),
        }),
        ('Pricing', {
            'fields': ('price', 'compare_at_price', 'currency', 'distance_km', 'material_cost', 'sundries_cost', 'labour_cost', 'transport_cost'),
        }),
        ('Marketing', {
            'fields': ('features', 'suitable_for'),
        }),
        ('Display', {
            'fields': ('is_active', 'is_popular', 'sort_order'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]
    actions = ['recalculate_prices']

    @admin.action(description='Recalculate prices from components')
    def recalculate_prices(self, request, queryset):
        for pkg in queryset:
            pkg.recalculate_price()
        self.message_user(request, f'Recalculated prices for {queryset.count()} packages.')


@admin.register(SolarConfiguration)
class SolarConfigurationAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'total_price', 'total_wattage', 'system_voltage', 'status', 'has_warnings', 'created_at']
    list_filter = ['status', 'system_voltage', 'has_warnings']
    search_fields = ['name', 'user__email']
    readonly_fields = [
        'total_price', 'total_wattage', 'estimated_daily_kwh',
        'estimated_backup_hours', 'battery_capacity_kwh',
        'has_warnings', 'warnings', 'created_at', 'updated_at',
    ]
    inlines = [ConfigurationItemInline]
    actions = ['recalculate_configurations']

    @admin.action(description='Recalculate system specs')
    def recalculate_configurations(self, request, queryset):
        for config in queryset:
            config.recalculate()
        self.message_user(request, f'Recalculated {queryset.count()} configurations.')
