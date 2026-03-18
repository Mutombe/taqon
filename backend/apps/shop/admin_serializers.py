"""
Admin-only serializers for writable Product, Category, and Brand CRUD.
"""
from rest_framework import serializers
from .models import Category, Brand, Product


class AdminProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin product create/update operations."""

    class Meta:
        model = Product
        fields = [
            'name', 'slug', 'sku',
            'category', 'brand',
            'description', 'short_description',
            'price', 'compare_at_price', 'cost_price', 'currency',
            'is_on_sale',
            'stock_quantity', 'low_stock_threshold',
            'weight', 'warranty_period',
            'specifications',
            'is_active', 'is_featured',
            'meta_title', 'meta_description',
        ]

    def validate_sku(self, value):
        instance = self.instance
        qs = Product.objects.filter(sku=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A product with this SKU already exists.')
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price must be a positive value.')
        return value

    def validate(self, attrs):
        compare_at_price = attrs.get('compare_at_price')
        price = attrs.get('price', getattr(self.instance, 'price', None))
        if compare_at_price is not None and price is not None:
            if compare_at_price <= price:
                raise serializers.ValidationError({
                    'compare_at_price': (
                        'Compare-at price must be greater than the selling price.'
                    )
                })
        return attrs


class AdminCategoryCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin category CRUD."""

    class Meta:
        model = Category
        fields = [
            'name', 'slug', 'description', 'image',
            'parent', 'is_active', 'order',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = Category.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A category with this slug already exists.')
        return value


class AdminBrandCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin brand CRUD."""

    class Meta:
        model = Brand
        fields = [
            'name', 'slug', 'logo', 'description',
            'website_url', 'is_active',
        ]

    def validate_slug(self, value):
        instance = self.instance
        qs = Brand.objects.filter(slug=value, is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A brand with this slug already exists.')
        return value
