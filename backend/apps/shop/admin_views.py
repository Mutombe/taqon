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

from .models import Product, ProductImage, Category, Brand, MediaAsset, GalleryHidden, ShopSetting
from .serializers import (
    ProductListSerializer,
    ProductImageSerializer,
    CategorySerializer,
    BrandSerializer,
)
from .admin_serializers import (
    AdminProductDetailSerializer,
    AdminProductCreateUpdateSerializer,
    AdminCategoryCreateUpdateSerializer,
    AdminBrandCreateUpdateSerializer,
    ShopSettingSerializer,
)


class AdminShopSettingsView(APIView):
    """Admin: read or update shop-wide settings (default product order)."""
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(ShopSettingSerializer(ShopSetting.load()).data)

    def patch(self, request):
        obj = ShopSetting.load()
        ser = ShopSettingSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

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
        return AdminProductDetailSerializer

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


@extend_schema(tags=['Admin'])
class AdminProductDuplicateView(APIView):
    """Admin view: duplicate a product into a new inactive draft.

    Copies every field plus the images (the underlying image files are
    duplicated so the two products are fully independent). The copy starts
    inactive with zero stock and no reviews, and gets a unique name/slug/SKU,
    so a half-finished duplicate can never leak onto the storefront before
    it's reviewed and activated.
    """
    permission_classes = [IsAdmin]

    def post(self, request, slug):
        try:
            src = (
                Product.objects
                .prefetch_related('images')
                .get(slug=slug, is_deleted=False)
            )
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # SKU is unique and required — derive a free one from the source.
        base_sku = f'{src.sku or "SKU"}-COPY'
        new_sku = base_sku
        n = 2
        while Product.objects.filter(sku=new_sku).exists():
            new_sku = f'{base_sku}-{n}'
            n += 1

        with transaction.atomic():
            dup = Product.objects.get(pk=src.pk)
            dup.pk = None
            dup._state.adding = True
            dup.name = f'{src.name} (Copy)'
            dup.slug = ''            # Product.save() generates a unique slug
            dup.sku = new_sku
            dup.is_active = False    # land as a draft
            dup.is_featured = False
            dup.stock_quantity = 0
            dup.average_rating = 0
            dup.total_reviews = 0
            dup.created_by = request.user
            dup.save()

            # Copy images, duplicating the stored file for each so deleting
            # an image on one product never affects the other.
            from django.core.files.base import ContentFile
            for img in src.images.all():
                new_img = ProductImage(
                    product=dup,
                    alt_text=img.alt_text,
                    is_primary=img.is_primary,
                    order=img.order,
                    image_url=img.image_url,
                )
                if img.image:
                    try:
                        img.image.open('rb')
                        content = img.image.read()
                        img.image.close()
                        new_img.image.save(
                            os.path.basename(img.image.name),
                            ContentFile(content), save=False,
                        )
                    except Exception:
                        logger.exception('Duplicate: failed to copy image file')
                new_img.save()

        serializer = AdminProductDetailSerializer(dup, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
    parameters=[OpenApiParameter('search', str, description='Search by name or source')],
)
class AdminMediaListView(APIView):
    """Admin view: the full media library — a deduplicated pool of every image
    on the site (standalone uploads + product images + blog images) so an admin
    can reuse one instead of re-uploading."""
    permission_classes = [IsAdmin]

    def get(self, request):
        from .library import aggregate_library
        items = aggregate_library(
            request=request, public_only=False,
            search=request.query_params.get('search', ''),
        )
        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            size = min(200, max(1, int(request.query_params.get('page_size', 48))))
        except (TypeError, ValueError):
            size = 48
        start = (page - 1) * size
        return Response({'count': len(items), 'results': items[start:start + size]})


@extend_schema(tags=['Admin'])
class AdminMediaUploadView(APIView):
    """Admin view: upload a standalone image into the library (or attach it to
    a product when product_slug is provided)."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        product_slug = request.data.get('product_slug')
        image_file = request.FILES.get('file') or request.FILES.get('image')

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

        # Standalone library upload → MediaAsset row (reusable).
        asset = MediaAsset.objects.create(
            file=image_file,
            name=request.data.get('name') or getattr(image_file, 'name', '') or 'Image',
            alt_text=request.data.get('alt_text', ''),
            file_size=getattr(image_file, 'size', None),
            uploaded_by=request.user,
            is_public=str(request.data.get('is_public', '')).lower() == 'true',
        )
        return Response({
            'id': f'asset-{asset.pk}',
            'url': asset.src,
            'name': asset.name,
            'kind': 'upload',
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Admin'])
class AdminMediaDeleteView(APIView):
    """Admin view: delete a library item. Standalone uploads are removed
    outright; product/blog images can't be deleted from the library (they
    belong to their product/post) — hide them from the gallery instead."""
    permission_classes = [IsAdmin]

    def delete(self, request, item_id):
        if item_id.startswith('asset-'):
            try:
                asset = MediaAsset.objects.get(pk=item_id[len('asset-'):])
            except (MediaAsset.DoesNotExist, ValueError):
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            if asset.file:
                try:
                    asset.file.delete(save=False)
                except Exception:
                    pass
            asset.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {'detail': 'This image belongs to a product or blog post. '
                       'Hide it from the gallery, or remove it from its product/post.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


@extend_schema(tags=['Admin'])
class AdminGalleryHideView(APIView):
    """Admin view: hide a specific image URL from the public gallery (POST)
    or unhide it (DELETE). The image stays on its product/post."""
    permission_classes = [IsAdmin]

    def post(self, request):
        url = (request.data.get('url') or '').strip()
        if not url:
            return Response({'detail': 'url is required.'}, status=status.HTTP_400_BAD_REQUEST)
        GalleryHidden.objects.get_or_create(url=url, defaults={'hidden_by': request.user})
        return Response({'url': url, 'is_hidden': True})

    def delete(self, request):
        url = (request.data.get('url') or request.query_params.get('url') or '').strip()
        GalleryHidden.objects.filter(url=url).delete()
        return Response({'url': url, 'is_hidden': False})
