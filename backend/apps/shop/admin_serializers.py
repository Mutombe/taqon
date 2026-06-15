"""
Admin-only serializers for writable Product, Category, and Brand CRUD.
"""
from rest_framework import serializers
from .models import Category, Brand, Product
from .serializers import (
    CategoryCompactSerializer,
    BrandCompactSerializer,
    ProductImageSerializer,
)


class AdminProductDetailSerializer(serializers.ModelSerializer):
    """Full read serializer for the admin edit form.

    The admin product form needs every editable field pre-populated when
    opening an existing product — the public ProductDetailSerializer omits
    admin-only fields (is_active, cost_price, low_stock_threshold, …), and
    the compact ProductListSerializer omits content fields (description,
    specifications, …). Feeding the edit form from either of those left
    fields blank, and saving then wiped the real values. This serializer
    returns the complete, authoritative picture for editing.
    """
    category = CategoryCompactSerializer(read_only=True)
    brand = BrandCompactSerializer(read_only=True)
    primary_image = ProductImageSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku',
            'category', 'brand',
            'description', 'short_description',
            'price', 'compare_at_price', 'cost_price', 'currency',
            'is_on_sale',
            'stock_quantity', 'low_stock_threshold',
            'weight', 'warranty_period',
            'specifications',
            'is_active', 'is_featured',
            'meta_title', 'meta_description',
            'primary_image', 'images',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class AdminProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Writable serializer for admin product create/update operations.

    slug and sku are optional on input — the slug is generated from the name
    by Product.save(), and a unique sku is generated here when left blank, so
    the admin only has to fill name, category and price to create a product.
    """

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
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
            'sku': {'required': False, 'allow_blank': True},
        }

    @staticmethod
    def _unique_sku(name):
        import re
        base = re.sub(r'[^A-Z0-9]+', '-', (name or 'PROD').upper()).strip('-')[:24] or 'PROD'
        candidate, i = base, 2
        while Product.objects.filter(sku=candidate).exists():
            candidate = f'{base}-{i}'
            i += 1
        return candidate

    def create(self, validated_data):
        if not validated_data.get('sku'):
            validated_data['sku'] = self._unique_sku(validated_data.get('name', ''))
        return super().create(validated_data)

    def validate_sku(self, value):
        if not value:
            return value  # auto-generated on create; left unchanged on update
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
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'is_active', 'order',
        ]
        read_only_fields = ['id']
        # Slug auto-generates from the name in the model's save() — admins
        # shouldn't have to supply it (lets inline "+ new category" send just a name).
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}

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
