"""
Admin-only views for Product CRUD, Media management, and Package management.
All views require IsAdmin permission.
"""
import logging
import os

from django.db import transaction
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from .models import Product, ProductImage, Category, Brand
from .serializers import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    CategorySerializer,
    BrandSerializer,
)
from .admin_serializers import (
    AdminProductCreateUpdateSerializer,
    AdminCategoryCreateUpdateSerializer,
    AdminBrandCreateUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════
# Admin Product CRUD
# ══════════════════════════════════════════════

@extend_schema(
    tags=['Admin'],
    parameters=[
        OpenApiParameter('search', str, description='Search by name, SKU, description'),
        OpenApiParameter('category', str, description='Filter by category slug'),
        OpenApiParameter('brand', str, description='Filter by brand slug'),
        OpenApiParameter('is_active', bool, description='Filter by active status'),
        OpenApiParameter('is_featured', bool, description='Filter by featured status'),
        OpenApiParameter('in_stock', bool, description='Filter by stock availability'),
        OpenApiParameter('on_sale', bool, description='Filter by on-sale status'),
    ],
)
class AdminProductListView(generics.ListAPIView):
    """Admin view: list all products including inactive, with search and filtering."""
    permission_classes = [IsAdmin]
    serializer_class = ProductListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = (
            Product.objects
            .filter(is_deleted=False)
            .select_related('category', 'brand')
            .prefetch_related('images')
        )

        params = self.request.query_params

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(description__icontains=search)
                | Q(brand__name__icontains=search)
            )

        category = params.get('category')
        if category:
            qs = qs.filter(
                Q(category__slug=category) | Q(category__parent__slug=category)
            )

        brand = params.get('brand')
        if brand:
            qs = qs.filter(brand__slug=brand)

        is_active = params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        is_featured = params.get('is_featured')
        if is_featured is not None:
            qs = qs.filter(is_featured=is_featured.lower() == 'true')

        on_sale = params.get('on_sale')
        if on_sale is not None:
            qs = qs.filter(is_on_sale=on_sale.lower() == 'true')

        in_stock = params.get('in_stock')
        if in_stock is not None:
            if in_stock.lower() == 'true':
                qs = qs.filter(stock_quantity__gt=0)
            else:
                qs = qs.filter(stock_quantity=0)

        ordering = params.get('ordering', '-created_at')
        allowed_orderings = [
            'name', '-name', 'price', '-price',
            'created_at', '-created_at', 'stock_quantity', '-stock_quantity',
        ]
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)

        return qs


@extend_schema(tags=['Admin'])
class AdminProductCreateView(generics.CreateAPIView):
    """Admin view: create a new product."""
    permission_classes = [IsAdmin]
    serializer_class = AdminProductCreateUpdateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@extend_schema(tags=['Admin'])
class AdminProductUpdateView(generics.RetrieveUpdateAPIView):
    """Admin view: retrieve or update a product by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_deleted=False)
            .select_related('category', 'brand')
            .prefetch_related('images')
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminProductCreateUpdateSerializer
        return ProductDetailSerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@extend_schema(tags=['Admin'])
class AdminProductDeleteView(APIView):
    """Admin view: soft-delete a product by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_deleted=False)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        product.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ══════════════════════════════════════════════
# Admin Product Image Management
# ══════════════════════════════════════════════

@extend_schema(tags=['Admin'])
class AdminProductImageUploadView(APIView):
    """Admin view: upload one or more images for a product."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        try:
            product = Product.objects.get(slug=slug, is_deleted=False)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        images = request.FILES.getlist('images')
        image_urls = request.data.getlist('image_urls', [])

        if not images and not image_urls:
            return Response(
                {'detail': 'Provide at least one image file (images) or URL (image_urls).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine if this product already has a primary image
        has_primary = product.images.filter(is_primary=True).exists()
        existing_count = product.images.count()

        created_images = []

        with transaction.atomic():
            for i, image_file in enumerate(images):
                is_primary = not has_primary and i == 0
                img = ProductImage.objects.create(
                    product=product,
                    image=image_file,
                    alt_text=request.data.get('alt_text', product.name),
                    is_primary=is_primary,
                    order=existing_count + i,
                )
                if is_primary:
                    has_primary = True
                created_images.append(img)

            for i, url in enumerate(image_urls):
                is_primary = not has_primary and i == 0
                img = ProductImage.objects.create(
                    product=product,
                    image_url=url,
                    alt_text=request.data.get('alt_text', product.name),
                    is_primary=is_primary,
                    order=existing_count + len(images) + i,
                )
                if is_primary:
                    has_primary = True
                created_images.append(img)

        serializer = ProductImageSerializer(
            created_images, many=True, context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin'])
class AdminProductImageDeleteView(APIView):
    """Admin view: delete a specific product image by ID."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug, image_id):
        try:
            product = Product.objects.get(slug=slug, is_deleted=False)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            image = ProductImage.objects.get(pk=image_id, product=product)
        except ProductImage.DoesNotExist:
            return Response(
                {'detail': 'Image not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        was_primary = image.is_primary

        # Delete file from storage if it exists
        if image.image:
            try:
                image.image.delete(save=False)
            except Exception:
                pass

        image.delete()

        # If the deleted image was primary, promote the next image
        if was_primary:
            next_image = product.images.order_by('order').first()
            if next_image:
                next_image.is_primary = True
                next_image.save(update_fields=['is_primary'])

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Admin'])
class AdminProductImageSetPrimaryView(APIView):
    """Admin view: set a specific product image as the primary image."""
    permission_classes = [IsAdmin]

    def post(self, request, slug, image_id):
        try:
            product = Product.objects.get(slug=slug, is_deleted=False)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            image = ProductImage.objects.get(pk=image_id, product=product)
        except ProductImage.DoesNotExist:
            return Response(
                {'detail': 'Image not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        with transaction.atomic():
            product.images.update(is_primary=False)
            image.is_primary = True
            image.save(update_fields=['is_primary'])

        serializer = ProductImageSerializer(image, context={'request': request})
        return Response(serializer.data)


# ══════════════════════════════════════════════
# Admin Category & Brand CRUD
# ══════════════════════════════════════════════

@extend_schema(tags=['Admin'])
class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """Admin view: list all categories (including inactive) or create one."""
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Category.objects.filter(is_deleted=False).prefetch_related('children')
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCategoryCreateUpdateSerializer
        return CategorySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@extend_schema(tags=['Admin'])
class AdminCategoryUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view: retrieve, update, or soft-delete a category by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return Category.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminCategoryCreateUpdateSerializer
        return CategorySerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Admin'])
class AdminBrandListCreateView(generics.ListCreateAPIView):
    """Admin view: list all brands (including inactive) or create one."""
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Brand.objects.filter(is_deleted=False)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminBrandCreateUpdateSerializer
        return BrandSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@extend_schema(tags=['Admin'])
class AdminBrandUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view: retrieve, update, or soft-delete a brand by slug."""
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_queryset(self):
        return Brand.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AdminBrandCreateUpdateSerializer
        return BrandSerializer

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ══════════════════════════════════════════════
# Admin Media Management
# ══════════════════════════════════════════════

@extend_schema(
    tags=['Admin'],
    parameters=[
        OpenApiParameter('product', str, description='Filter by product slug'),
        OpenApiParameter('is_primary', bool, description='Filter by primary status'),
    ],
)
class AdminMediaListView(generics.ListAPIView):
    """Admin view: list all product images as media library."""
    permission_classes = [IsAdmin]
    serializer_class = ProductImageSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = ProductImage.objects.select_related('product').all()

        product_slug = self.request.query_params.get('product')
        if product_slug:
            qs = qs.filter(product__slug=product_slug)

        is_primary = self.request.query_params.get('is_primary')
        if is_primary is not None:
            qs = qs.filter(is_primary=is_primary.lower() == 'true')

        return qs.order_by('-created_at')


@extend_schema(tags=['Admin'])
class AdminMediaUploadView(APIView):
    """Admin view: upload a standalone media file and return its URL."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """
        Upload a file. If product_slug is provided, attach it to that product.
        Otherwise returns a standalone URL (stored as image_url on a temp ProductImage).
        """
        product_slug = request.data.get('product_slug')
        image_file = request.FILES.get('file')

        if not image_file:
            return Response(
                {'detail': 'A file is required (field: file).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if product_slug:
            try:
                product = Product.objects.get(slug=product_slug, is_deleted=False)
            except Product.DoesNotExist:
                return Response(
                    {'detail': 'Product not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            has_primary = product.images.filter(is_primary=True).exists()
            img = ProductImage.objects.create(
                product=product,
                image=image_file,
                alt_text=request.data.get('alt_text', product.name),
                is_primary=not has_primary,
                order=product.images.count(),
            )
            serializer = ProductImageSerializer(img, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Standalone upload — store temporarily against first product
        # (real production would use a dedicated media model)
        from django.core.files.storage import default_storage
        file_name = f"uploads/{image_file.name}"
        saved_path = default_storage.save(file_name, image_file)
        file_url = request.build_absolute_uri(
            f'{request.scheme}://{request.get_host()}/media/{saved_path}'
        )

        return Response({
            'url': f'/media/{saved_path}',
            'absolute_url': file_url,
            'file_name': os.path.basename(saved_path),
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin'])
class AdminMediaDeleteView(APIView):
    """Admin view: delete a product image (media item) by ID."""
    permission_classes = [IsAdmin]

    def delete(self, request, image_id):
        try:
            image = ProductImage.objects.get(pk=image_id)
        except ProductImage.DoesNotExist:
            return Response(
                {'detail': 'Media item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        product = image.product
        was_primary = image.is_primary

        if image.image:
            try:
                image.image.delete(save=False)
            except Exception:
                pass

        image.delete()

        if was_primary and product:
            next_image = product.images.order_by('order').first()
            if next_image:
                next_image.is_primary = True
                next_image.save(update_fields=['is_primary'])

        return Response(status=status.HTTP_204_NO_CONTENT)
