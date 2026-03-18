import logging

import django_filters
from django.db import transaction
from django.db.models import Q, F, Avg, Prefetch
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from apps.core.pagination import StandardPagination, SmallPagination
from apps.core.permissions import IsAdmin

from .models import (
    Category,
    Brand,
    Product,
    ProductImage,
    ProductReview,
    Cart,
    CartItem,
    WishlistItem,
    Order,
    OrderItem,
    OrderStatusHistory,
)
from .serializers import (
    CategorySerializer,
    BrandSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductReviewSerializer,
    ProductReviewCreateSerializer,
    CartSerializer,
    CartItemCreateSerializer,
    CartItemUpdateSerializer,
    WishlistItemSerializer,
    OrderSerializer,
    OrderListSerializer,
    CheckoutSerializer,
    OrderStatusUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def get_or_create_cart(request):
    """
    Return the active cart for the current request.

    - Authenticated users: cart is tied to ``request.user``.
    - Guest users: cart is tied to ``request.session.session_key``.
    Uses ``select_related`` / ``prefetch_related`` for efficient loading.
    """
    prefetch = Prefetch(
        'items',
        queryset=CartItem.objects.select_related('product').prefetch_related(
            'product__images',
        ),
    )

    if request.user.is_authenticated:
        cart, _created = Cart.objects.prefetch_related(prefetch).get_or_create(
            user=request.user,
            is_active=True,
            defaults={'user': request.user},
        )
        return cart

    # Guest: ensure a session exists
    if not request.session.session_key:
        request.session.create()

    session_key = request.session.session_key
    cart, _created = Cart.objects.prefetch_related(prefetch).get_or_create(
        session_key=session_key,
        is_active=True,
        user__isnull=True,
        defaults={'session_key': session_key},
    )
    return cart


def _get_client_ip(request):
    """Extract the client IP from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


# ──────────────────────────────────────────────
# Product Filter
# ──────────────────────────────────────────────

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = django_filters.CharFilter(method='filter_category')
    brand = django_filters.CharFilter(field_name='brand__slug')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    on_sale = django_filters.BooleanFilter(field_name='is_on_sale')
    featured = django_filters.BooleanFilter(field_name='is_featured')

    class Meta:
        model = Product
        fields = []

    def filter_category(self, queryset, name, value):
        return queryset.filter(
            Q(category__slug=value) | Q(category__parent__slug=value)
        )

    def filter_in_stock(self, queryset, name, value):
        if value is True:
            return queryset.filter(stock_quantity__gt=0)
        if value is False:
            return queryset.filter(stock_quantity=0)
        return queryset


# ══════════════════════════════════════════════
# Product Catalog (public / AllowAny)
# ══════════════════════════════════════════════

@extend_schema(tags=['Shop'])
@extend_schema_view(
    get=extend_schema(
        summary='List products',
        description='Paginated product listing with filtering, search, and ordering.',
        parameters=[
            OpenApiParameter('category', str, description='Filter by category slug'),
            OpenApiParameter('brand', str, description='Filter by brand slug'),
            OpenApiParameter('price_min', float, description='Minimum price'),
            OpenApiParameter('price_max', float, description='Maximum price'),
            OpenApiParameter('in_stock', bool, description='Filter by stock availability'),
            OpenApiParameter('on_sale', bool, description='Filter on-sale products'),
            OpenApiParameter('featured', bool, description='Filter featured products'),
            OpenApiParameter('search', str, description='Search term'),
            OpenApiParameter('ordering', str, description='Order by: price, -price, -created_at, -average_rating, name'),
        ],
    ),
)
class ProductListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardPagination
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'brand__name']
    ordering_fields = ['price', 'created_at', 'average_rating', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category', 'brand')
            .prefetch_related('images')
        )


@extend_schema(tags=['Shop'])
class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category', 'brand')
            .prefetch_related('images')
        )


@extend_schema(tags=['Shop'])
class ProductReviewListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ProductReviewSerializer
    pagination_class = SmallPagination

    def get_queryset(self):
        return (
            ProductReview.objects
            .filter(
                product__slug=self.kwargs['slug'],
                is_approved=True,
            )
            .select_related('user')
        )


@extend_schema(tags=['Shop'])
class ProductReviewCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProductReviewCreateSerializer

    def perform_create(self, serializer):
        product = Product.objects.get(slug=self.kwargs['slug'])
        serializer.save(user=self.request.user, product=product)

        # Recalculate product rating aggregates
        reviews = ProductReview.objects.filter(product=product, is_approved=True)
        count = reviews.count()
        avg = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        Product.objects.filter(pk=product.pk).update(
            average_rating=round(avg, 2),
            total_reviews=count,
        )


@extend_schema(tags=['Shop'])
class CategoryListView(generics.ListAPIView):
    """Return active, top-level categories with nested children."""
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return (
            Category.objects
            .filter(is_active=True, parent__isnull=True)
            .prefetch_related(
                Prefetch(
                    'children',
                    queryset=Category.objects.filter(is_active=True),
                ),
            )
        )


@extend_schema(tags=['Shop'])
class CategoryDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            Category.objects
            .filter(is_active=True)
            .prefetch_related(
                Prefetch(
                    'children',
                    queryset=Category.objects.filter(is_active=True),
                ),
                Prefetch(
                    'products',
                    queryset=Product.objects.filter(is_active=True)
                    .select_related('brand')
                    .prefetch_related('images'),
                ),
            )
        )


@extend_schema(tags=['Shop'])
class BrandListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer

    def get_queryset(self):
        return Brand.objects.filter(is_active=True)


@extend_schema(tags=['Shop'])
class BrandDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = BrandSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Brand.objects.filter(is_active=True)


@extend_schema(tags=['Shop'])
class FeaturedProductsView(generics.ListAPIView):
    """Return up to 8 featured products."""
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True, is_featured=True)
            .select_related('category', 'brand')
            .prefetch_related('images')[:8]
        )


@extend_schema(tags=['Shop'])
class OnSaleProductsView(generics.ListAPIView):
    """Return products currently on sale."""
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True, is_on_sale=True)
            .select_related('category', 'brand')
            .prefetch_related('images')
        )


@extend_schema(
    tags=['Shop'],
    parameters=[
        OpenApiParameter('q', str, description='Search query', required=True),
    ],
)
class ProductSearchView(generics.ListAPIView):
    """Full-text search across product name, description, brand, and category."""
    permission_classes = [AllowAny]
    serializer_class = ProductListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        query = self.request.query_params.get('q', '').strip()
        if not query:
            return Product.objects.none()

        return (
            Product.objects
            .filter(
                is_active=True,
            )
            .filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(brand__name__icontains=query)
                | Q(category__name__icontains=query)
            )
            .select_related('category', 'brand')
            .prefetch_related('images')
            .distinct()
        )


# ══════════════════════════════════════════════
# Cart (authenticated or session-based)
# ══════════════════════════════════════════════

@extend_schema(tags=['Shop'])
class CartView(APIView):
    """Retrieve the current user/session cart."""
    permission_classes = [AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


@extend_schema(tags=['Shop'])
class CartAddItemView(APIView):
    """Add a product to the cart. Validates stock and snapshots the current price."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CartItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data.get('quantity', 1)

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if product.stock_quantity < quantity:
            return Response(
                {'detail': f'Insufficient stock. Only {product.stock_quantity} available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = get_or_create_cart(request)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                'quantity': quantity,
                'price_at_addition': product.price,
            },
        )

        if not created:
            new_qty = cart_item.quantity + quantity
            if product.stock_quantity < new_qty:
                return Response(
                    {'detail': f'Insufficient stock. Only {product.stock_quantity} available.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            cart_item.quantity = new_qty
            cart_item.price_at_addition = product.price  # refresh snapshot
            cart_item.save(update_fields=['quantity', 'price_at_addition', 'updated_at'])

        # Re-fetch the cart with prefetching for the response
        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@extend_schema(tags=['Shop'])
class CartUpdateItemView(APIView):
    """Update the quantity of a cart item."""
    permission_classes = [AllowAny]

    def patch(self, request, pk):
        serializer = CartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']
        cart = get_or_create_cart(request)

        try:
            cart_item = CartItem.objects.select_related('product').get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if cart_item.product.stock_quantity < quantity:
            return Response(
                {'detail': f'Insufficient stock. Only {cart_item.product.stock_quantity} available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart_item.quantity = quantity
        cart_item.save(update_fields=['quantity', 'updated_at'])

        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)


@extend_schema(tags=['Shop'])
class CartRemoveItemView(APIView):
    """Remove an item from the cart."""
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        cart = get_or_create_cart(request)

        try:
            cart_item = CartItem.objects.get(pk=pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'detail': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        cart_item.delete()

        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)


@extend_schema(tags=['Shop'])
class CartClearView(APIView):
    """Remove all items from the cart."""
    permission_classes = [AllowAny]

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response({'detail': 'Cart cleared.'}, status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Shop'])
class CartSummaryView(APIView):
    """Return a lightweight summary of the current cart (totals, item count)."""
    permission_classes = [AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        return Response({
            'total_items': cart.total_items,
            'subtotal': str(cart.subtotal),
            'total_savings': str(cart.total_savings),
        })


@extend_schema(tags=['Shop'])
class CartMergeView(APIView):
    """
    Merge a guest (session-based) cart into the authenticated user's cart.

    Call this after a user logs in so their guest selections are preserved.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        session_key = request.data.get('session_key') or request.session.session_key

        if not session_key:
            return Response(
                {'detail': 'No guest cart to merge.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            guest_cart = Cart.objects.prefetch_related(
                Prefetch(
                    'items',
                    queryset=CartItem.objects.select_related('product'),
                ),
            ).get(session_key=session_key, is_active=True, user__isnull=True)
        except Cart.DoesNotExist:
            return Response(
                {'detail': 'No guest cart found for this session.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        user_cart, _created = Cart.objects.get_or_create(
            user=request.user,
            is_active=True,
            defaults={'user': request.user},
        )

        with transaction.atomic():
            for guest_item in guest_cart.items.all():
                user_item, created = CartItem.objects.get_or_create(
                    cart=user_cart,
                    product=guest_item.product,
                    defaults={
                        'quantity': guest_item.quantity,
                        'price_at_addition': guest_item.price_at_addition,
                    },
                )
                if not created:
                    # Keep the higher quantity between guest and user carts
                    user_item.quantity = max(user_item.quantity, guest_item.quantity)
                    user_item.price_at_addition = guest_item.product.price  # refresh
                    user_item.save(update_fields=['quantity', 'price_at_addition', 'updated_at'])

            # Deactivate the guest cart
            guest_cart.is_active = False
            guest_cart.save(update_fields=['is_active', 'updated_at'])

        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)


# ══════════════════════════════════════════════
# Wishlist (authenticated)
# ══════════════════════════════════════════════

@extend_schema(tags=['Shop'])
class WishlistListView(generics.ListAPIView):
    """List all wishlist items for the authenticated user."""
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistItemSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            WishlistItem.objects
            .filter(user=self.request.user)
            .select_related('product__category', 'product__brand')
            .prefetch_related('product__images')
        )


@extend_schema(tags=['Shop'])
class WishlistAddView(APIView):
    """Add a product to the user's wishlist."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')

        if not product_id:
            return Response(
                {'detail': 'product_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        wishlist_item, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product,
        )

        if not created:
            return Response(
                {'detail': 'Product is already in your wishlist.'},
                status=status.HTTP_200_OK,
            )

        serializer = WishlistItemSerializer(wishlist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Shop'])
class WishlistRemoveView(APIView):
    """Remove a product from the user's wishlist."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        try:
            wishlist_item = WishlistItem.objects.get(
                user=request.user,
                product_id=product_id,
            )
        except WishlistItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in wishlist.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        wishlist_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Shop'])
class WishlistMoveToCartView(APIView):
    """Move a wishlist item into the cart and remove it from the wishlist."""
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        try:
            wishlist_item = WishlistItem.objects.select_related('product').get(
                user=request.user,
                product_id=product_id,
            )
        except WishlistItem.DoesNotExist:
            return Response(
                {'detail': 'Item not found in wishlist.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        product = wishlist_item.product

        if not product.is_active:
            return Response(
                {'detail': 'This product is no longer available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if product.stock_quantity < 1:
            return Response(
                {'detail': 'This product is out of stock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart = get_or_create_cart(request)

        with transaction.atomic():
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': 1,
                    'price_at_addition': product.price,
                },
            )
            if not created:
                cart_item.quantity += 1
                cart_item.price_at_addition = product.price
                cart_item.save(update_fields=['quantity', 'price_at_addition', 'updated_at'])

            wishlist_item.delete()

        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)


# ══════════════════════════════════════════════
# Orders (authenticated)
# ══════════════════════════════════════════════

@extend_schema(tags=['Shop'])
class CheckoutView(APIView):
    """
    Create an order from the current cart.

    Steps:
    1. Validate the cart is not empty.
    2. Check stock availability for every item.
    3. Snapshot product prices into order items.
    4. Decrement stock quantities.
    5. Create the order with items.
    6. Record initial status history entry.
    7. Clear the cart.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_or_create_cart(request)
        cart_items = list(cart.items.select_related('product').all())

        if not cart_items:
            return Response(
                {'detail': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Stock validation pass
        stock_errors = []
        for item in cart_items:
            if item.product.stock_quantity < item.quantity:
                stock_errors.append(
                    f'{item.product.name}: only {item.product.stock_quantity} available '
                    f'(requested {item.quantity}).'
                )
        if stock_errors:
            return Response(
                {'detail': 'Insufficient stock.', 'errors': stock_errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data

        with transaction.atomic():
            # Build order
            subtotal = sum(item.product.price * item.quantity for item in cart_items)
            delivery_fee = validated.get('delivery_fee', 0)
            tax_amount = validated.get('tax_amount', 0)
            discount_amount = validated.get('discount_amount', 0)
            total = subtotal + delivery_fee + tax_amount - discount_amount

            order = Order.objects.create(
                user=request.user,
                subtotal=subtotal,
                tax_amount=tax_amount,
                delivery_fee=delivery_fee,
                discount_amount=discount_amount,
                total=total,
                delivery_type=validated.get('delivery_type', 'delivery'),
                delivery_address=validated.get('delivery_address', ''),
                delivery_city=validated.get('delivery_city', ''),
                delivery_province=validated.get('delivery_province', ''),
                delivery_notes=validated.get('delivery_notes', ''),
                customer_notes=validated.get('customer_notes', ''),
                payment_method=validated.get('payment_method', ''),
                ip_address=_get_client_ip(request),
            )

            # Create order items and decrement stock
            order_items = []
            for item in cart_items:
                order_items.append(
                    OrderItem(
                        order=order,
                        product=item.product,
                        product_name=item.product.name,
                        product_sku=item.product.sku,
                        quantity=item.quantity,
                        unit_price=item.product.price,
                        total_price=item.product.price * item.quantity,
                    )
                )
                # Atomic stock decrement
                Product.objects.filter(pk=item.product.pk).update(
                    stock_quantity=F('stock_quantity') - item.quantity,
                )
            OrderItem.objects.bulk_create(order_items)

            # Record initial status history
            OrderStatusHistory.objects.create(
                order=order,
                old_status='',
                new_status='pending',
                changed_by=request.user,
                notes='Order created via checkout.',
            )

            # Clear the cart
            cart.items.all().delete()

        # Re-fetch order with related data for the response
        order = (
            Order.objects
            .select_related('user')
            .prefetch_related('items__product', 'status_history')
            .get(pk=order.pk)
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Shop'])
class OrderListView(generics.ListAPIView):
    """List the authenticated user's orders."""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .select_related('user')
            .prefetch_related('items')
        )


@extend_schema(tags=['Shop'])
class OrderDetailView(generics.RetrieveAPIView):
    """Retrieve a single order by order number."""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    lookup_field = 'order_number'

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .select_related('user')
            .prefetch_related(
                'items__product',
                'status_history__changed_by',
            )
        )


@extend_schema(tags=['Shop'])
class OrderCancelView(APIView):
    """
    Cancel an order if its status is ``pending`` or ``confirmed``.

    Restores product stock quantities.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        try:
            order = Order.objects.prefetch_related('items__product').get(
                order_number=order_number,
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status not in ('pending', 'confirmed'):
            return Response(
                {'detail': f'Cannot cancel order with status "{order.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            old_status = order.status
            order.status = 'cancelled'
            order.save(update_fields=['status', 'updated_at'])

            # Restore stock
            for item in order.items.select_related('product').all():
                if item.product:
                    Product.objects.filter(pk=item.product.pk).update(
                        stock_quantity=F('stock_quantity') + item.quantity,
                    )

            OrderStatusHistory.objects.create(
                order=order,
                old_status=old_status,
                new_status='cancelled',
                changed_by=request.user,
                notes='Cancelled by customer.',
            )

        order.refresh_from_db()
        return Response(OrderSerializer(order).data)


# ══════════════════════════════════════════════
# Admin Orders (IsAdmin permission)
# ══════════════════════════════════════════════

@extend_schema(
    tags=['Shop'],
    parameters=[
        OpenApiParameter('status', str, description='Filter by order status'),
        OpenApiParameter('payment_status', str, description='Filter by payment status'),
        OpenApiParameter('date_from', str, description='Start date (YYYY-MM-DD)'),
        OpenApiParameter('date_to', str, description='End date (YYYY-MM-DD)'),
    ],
)
class AdminOrderListView(generics.ListAPIView):
    """Admin view: list all orders with filtering by status, payment status, and date range."""
    permission_classes = [IsAdmin]
    serializer_class = OrderListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = (
            Order.objects
            .select_related('user')
            .prefetch_related('items')
            .all()
        )

        params = self.request.query_params

        order_status = params.get('status')
        if order_status:
            qs = qs.filter(status=order_status)

        payment_status = params.get('payment_status')
        if payment_status:
            qs = qs.filter(payment_status=payment_status)

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs


@extend_schema(tags=['Shop'])
class AdminOrderStatusUpdateView(APIView):
    """Admin view: update order status and record the change in history."""
    permission_classes = [IsAdmin]

    def patch(self, request, order_number):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')

        if new_status == order.status:
            return Response(
                {'detail': f'Order is already in "{new_status}" status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = order.status

        with transaction.atomic():
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=order,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=notes,
            )

        order = (
            Order.objects
            .select_related('user')
            .prefetch_related('items__product', 'status_history__changed_by')
            .get(pk=order.pk)
        )
        return Response(OrderSerializer(order).data)
