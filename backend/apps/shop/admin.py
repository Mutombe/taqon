from django.contrib import admin
from .models import (
    Category, Brand, Product, ProductImage, ProductReview,
    Cart, CartItem, WishlistItem,
    Order, OrderItem, OrderStatusHistory,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_sku', 'quantity', 'unit_price', 'total_price']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'notes', 'created_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active', 'order']
    list_filter = ['is_active', 'parent']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order', 'is_active']


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'brand', 'price', 'stock_quantity', 'is_active', 'is_featured', 'is_on_sale']
    list_filter = ['category', 'brand', 'is_active', 'is_featured', 'is_on_sale', 'created_at']
    search_fields = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'stock_quantity', 'is_active', 'is_featured', 'is_on_sale']
    inlines = [ProductImageInline]
    fieldsets = (
        (None, {'fields': ('name', 'slug', 'sku', 'category', 'brand')}),
        ('Description', {'fields': ('short_description', 'description')}),
        ('Pricing', {'fields': ('price', 'compare_at_price', 'cost_price', 'currency', 'is_on_sale')}),
        ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold', 'weight', 'warranty_period')}),
        ('Specifications', {'fields': ('specifications',)}),
        ('Display', {'fields': ('is_active', 'is_featured')}),
        ('SEO', {'fields': ('meta_title', 'meta_description')}),
        ('Stats', {'fields': ('average_rating', 'total_reviews'), 'classes': ('collapse',)}),
    )


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'is_verified_purchase']
    search_fields = ['product__name', 'user__email', 'comment']
    list_editable = ['is_approved']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key', 'total_items', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'session_key']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_status', 'total', 'delivery_type', 'created_at']
    list_filter = ['status', 'payment_status', 'delivery_type', 'created_at']
    search_fields = ['order_number', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['order_number', 'subtotal', 'tax_amount', 'delivery_fee', 'discount_amount', 'total', 'ip_address']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    fieldsets = (
        (None, {'fields': ('order_number', 'user', 'status', 'payment_status', 'payment_method')}),
        ('Totals', {'fields': ('subtotal', 'tax_amount', 'delivery_fee', 'discount_amount', 'total', 'currency')}),
        ('Delivery', {'fields': ('delivery_type', 'delivery_address', 'delivery_city', 'delivery_province', 'delivery_notes', 'estimated_delivery_date', 'actual_delivery_date')}),
        ('Notes', {'fields': ('customer_notes', 'tracking_notes')}),
        ('Meta', {'fields': ('ip_address',), 'classes': ('collapse',)}),
    )


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'created_at']
    search_fields = ['user__email', 'product__name']
