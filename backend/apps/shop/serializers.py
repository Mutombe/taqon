from decimal import Decimal
from rest_framework import serializers
from .models import (
    Category, Brand, Product, ProductImage, ProductReview,
    Cart, CartItem, WishlistItem,
    Order, OrderItem, OrderStatusHistory,
)


# ── Nested / Compact helpers ─────────────────────────────────────────


class CategoryCompactSerializer(serializers.ModelSerializer):
    """Minimal category representation for nesting inside products."""

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']
        read_only_fields = fields


class BrandCompactSerializer(serializers.ModelSerializer):
    """Minimal brand representation for nesting inside products."""

    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug']
        read_only_fields = fields


class ReviewUserSerializer(serializers.Serializer):
    """Read-only user representation for review display."""
    id = serializers.UUIDField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    avatar = serializers.ImageField(read_only=True)


# ── Category ─────────────────────────────────────────────────────────


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    parent = CategoryCompactSerializer(read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'parent', 'children', 'product_count',
        ]
        read_only_fields = ['id', 'slug']

    def get_children(self, obj):
        children = obj.children.filter(is_active=True, is_deleted=False)
        return CategoryCompactSerializer(children, many=True).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_deleted=False).count()


# ── Brand ────────────────────────────────────────────────────────────


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description', 'website_url']
        read_only_fields = ['id', 'slug']


# ── Product Image ────────────────────────────────────────────────────


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'order']
        read_only_fields = ['id']


# ── Product Review ───────────────────────────────────────────────────


class ProductReviewSerializer(serializers.ModelSerializer):
    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            'id', 'user', 'rating', 'title', 'comment',
            'is_verified_purchase', 'created_at',
        ]
        read_only_fields = fields


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    """Write-only serializer for submitting reviews."""

    class Meta:
        model = ProductReview
        fields = ['rating', 'title', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_comment(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Comment cannot be empty.')
        return value.strip()


# ── Product List (compact) ───────────────────────────────────────────


class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryCompactSerializer(read_only=True)
    brand = BrandCompactSerializer(read_only=True)
    primary_image = ProductImageSerializer(read_only=True)
    sale_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku',
            'price', 'compare_at_price', 'is_on_sale', 'sale_percentage',
            'in_stock', 'category', 'brand', 'primary_image',
            'average_rating', 'total_reviews', 'is_featured',
            'is_active', 'stock_quantity',
        ]
        read_only_fields = fields


# ── Product Detail (full) ───────────────────────────────────────────


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategoryCompactSerializer(read_only=True)
    brand = BrandCompactSerializer(read_only=True)
    primary_image = ProductImageSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    related_products = serializers.SerializerMethodField()
    sale_percentage = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            # Core identification
            'id', 'name', 'slug', 'sku',
            # Pricing
            'price', 'compare_at_price', 'is_on_sale', 'sale_percentage',
            'currency',
            # Stock
            'in_stock', 'stock_quantity',
            # Taxonomy
            'category', 'brand',
            # Content
            'description', 'short_description',
            'warranty_period', 'specifications',
            # Images
            'primary_image', 'images',
            # Ratings
            'average_rating', 'total_reviews',
            # Flags
            'is_featured',
            # SEO
            'meta_title', 'meta_description',
            # Related data
            'reviews', 'related_products',
        ]
        read_only_fields = fields

    def get_reviews(self, obj):
        recent = obj.reviews.filter(is_approved=True).select_related('user')[:5]
        return ProductReviewSerializer(recent, many=True).data

    def get_related_products(self, obj):
        related = (
            Product.objects
            .filter(
                category=obj.category,
                is_active=True,
                is_deleted=False,
            )
            .exclude(pk=obj.pk)
            .select_related('category', 'brand')
            .prefetch_related('images')[:4]
        )
        return ProductListSerializer(related, many=True, context=self.context).data


# ── Cart Item ────────────────────────────────────────────────────────


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    line_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    savings = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'quantity', 'price_at_addition',
            'line_total', 'savings',
        ]
        read_only_fields = ['id', 'price_at_addition', 'line_total', 'savings']


class CartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(
                pk=value, is_active=True, is_deleted=False,
            )
        except Product.DoesNotExist:
            raise serializers.ValidationError('Product not found or unavailable.')
        if not product.in_stock:
            raise serializers.ValidationError('Product is out of stock.')
        return value

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate(self, attrs):
        product = Product.objects.get(pk=attrs['product_id'])
        if attrs['quantity'] > product.stock_quantity:
            raise serializers.ValidationError({
                'quantity': (
                    f'Requested quantity exceeds available stock '
                    f'({product.stock_quantity}).'
                ),
            })
        return attrs


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        # Stock check is performed in the view where we have access to the
        # CartItem instance and its associated product.
        return value


# ── Cart ─────────────────────────────────────────────────────────────


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    total_savings = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'total_savings']
        read_only_fields = fields


# ── Wishlist ─────────────────────────────────────────────────────────


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'created_at']
        read_only_fields = fields


# ── Order Item ───────────────────────────────────────────────────────


class OrderItemProductSerializer(serializers.Serializer):
    """Minimal product reference for linking from order items."""
    id = serializers.UUIDField(read_only=True)
    slug = serializers.SlugField(read_only=True)


class OrderItemSerializer(serializers.ModelSerializer):
    product = OrderItemProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'product_sku', 'quantity',
            'unit_price', 'total_price', 'product',
        ]
        read_only_fields = fields


# ── Order Status History ─────────────────────────────────────────────


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'old_status', 'new_status', 'changed_by_name',
            'notes', 'created_at',
        ]
        read_only_fields = fields

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.full_name
        return None


# ── Order (full detail) ─────────────────────────────────────────────


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status',
            'payment_method',
            # Financial
            'subtotal', 'tax_amount', 'delivery_fee',
            'discount_amount', 'total', 'currency',
            # Delivery
            'delivery_type', 'delivery_address', 'delivery_city',
            'delivery_province', 'delivery_notes',
            'estimated_delivery_date', 'actual_delivery_date',
            # Notes
            'customer_notes',
            # Nested
            'items', 'status_history', 'total_items',
            # Timestamps
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())


# ── Order List (compact) ────────────────────────────────────────────


class OrderListSerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status',
            'total', 'total_items', 'created_at',
        ]
        read_only_fields = fields

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())


# ── Checkout ─────────────────────────────────────────────────────────


class CheckoutSerializer(serializers.Serializer):
    DELIVERY_TYPE_CHOICES = [
        ('delivery', 'Delivery'),
        ('pickup', 'Pickup'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('cash_on_delivery', 'Cash on Delivery'),
        ('ecocash', 'EcoCash'),
        ('bank_transfer', 'Bank Transfer'),
        ('card', 'Card'),
    ]

    delivery_type = serializers.ChoiceField(choices=DELIVERY_TYPE_CHOICES)
    delivery_address = serializers.CharField(
        max_length=500, required=False, allow_blank=True,
    )
    delivery_city = serializers.CharField(
        max_length=100, required=False, allow_blank=True,
    )
    delivery_province = serializers.CharField(
        max_length=50, required=False, allow_blank=True,
    )
    delivery_notes = serializers.CharField(
        required=False, allow_blank=True, default='',
    )
    customer_notes = serializers.CharField(
        required=False, allow_blank=True, default='',
    )
    payment_method = serializers.ChoiceField(choices=PAYMENT_METHOD_CHOICES)

    def validate(self, attrs):
        if attrs.get('delivery_type') == 'delivery':
            address = attrs.get('delivery_address', '').strip()
            city = attrs.get('delivery_city', '').strip()
            province = attrs.get('delivery_province', '').strip()

            errors = {}
            if not address:
                errors['delivery_address'] = (
                    'Delivery address is required for delivery orders.'
                )
            if not city:
                errors['delivery_city'] = (
                    'Delivery city is required for delivery orders.'
                )
            if not province:
                errors['delivery_province'] = (
                    'Delivery province is required for delivery orders.'
                )
            if errors:
                raise serializers.ValidationError(errors)
        return attrs


# ── Order Status Update (admin) ──────────────────────────────────────


class OrderStatusUpdateSerializer(serializers.Serializer):
    VALID_STATUSES = [s[0] for s in Order.ORDER_STATUS_CHOICES]

    status = serializers.ChoiceField(choices=Order.ORDER_STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_status(self, value):
        if value not in self.VALID_STATUSES:
            raise serializers.ValidationError(
                f'Invalid status. Must be one of: {", ".join(self.VALID_STATUSES)}'
            )
        return value

    def validate(self, attrs):
        order = self.context.get('order')
        if order:
            new_status = attrs['status']
            current = order.status
            # Prevent backwards transitions to already-terminal states
            terminal = {'delivered', 'cancelled', 'refunded'}
            if current in terminal and new_status not in terminal:
                raise serializers.ValidationError({
                    'status': (
                        f'Cannot change status from "{current}" to '
                        f'"{new_status}". Order is in a terminal state.'
                    ),
                })
        return attrs
