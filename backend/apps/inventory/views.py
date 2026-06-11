"""Admin-only supplier inventory & pricing API.

Every endpoint is gated by IsAdmin — this data is internal procurement
intelligence and never exposed to the public.
"""
import uuid
from decimal import Decimal, InvalidOperation

from django.db.models import Count, Q, Prefetch, Avg, Min, Max


def _is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from . import audit
from .models import (
    MaterialCategory, Supplier, Material, SupplierPrice,
    PriceHistory, SupplierQuotation, AuditLog,
)
from .serializers import (
    MaterialCategorySerializer, SupplierSerializer, MaterialSerializer,
    MaterialWriteSerializer, SupplierPriceSerializer, PriceHistorySerializer,
    SupplierQuotationSerializer, AuditLogSerializer,
)

SUPPLIER_FIELDS = ['name', 'contact_person', 'phone', 'email', 'address', 'website', 'is_active']
MATERIAL_FIELDS = ['name', 'category_id', 'specification', 'brand', 'unit', 'is_active']
QUOTATION_FIELDS = ['title', 'reference', 'quote_date', 'total_amount']


def apply_price(request, *, supplier, material, price, currency='USD',
                source_quotation=None, note='', quoted_at=None):
    """Upsert the current price for (supplier, material) and, when it changes,
    append a PriceHistory row and an audit entry. Returns (obj, created)."""
    existing = SupplierPrice.objects.filter(
        supplier=supplier, material=material, is_deleted=False,
    ).first()
    previous = existing.price if existing else None
    user = getattr(request, 'user', None)
    if existing:
        existing.price = price
        if currency:
            existing.currency = currency
        if source_quotation is not None:
            existing.source_quotation = source_quotation
        if note:
            existing.note = note
        if quoted_at:
            existing.quoted_at = quoted_at
        existing.updated_by = user
        existing.save()
        obj, created = existing, False
    else:
        obj = SupplierPrice.objects.create(
            supplier=supplier, material=material, price=price, currency=currency or 'USD',
            source_quotation=source_quotation, note=note or '', quoted_at=quoted_at,
            created_by=user,
        )
        created = True

    if previous is None or Decimal(str(previous)) != Decimal(str(obj.price)):
        PriceHistory.record(
            supplier=obj.supplier, material=obj.material, price=obj.price,
            previous_price=previous, currency=obj.currency,
            source_quotation=obj.source_quotation, note=obj.note, user=user,
        )
        summary = (f'Price set to {obj.currency} {obj.price}' if previous is None
                   else f'Price {obj.currency} {previous} → {obj.price}')
        audit.log(request, action='created' if previous is None else 'updated',
                  target_type='price', target_name=f'{obj.material.name} @ {obj.supplier.name}',
                  target_id=obj.id, summary=summary)
    return obj, created


def resolve_material(request, *, material_id=None, name=None, category=None,
                     specification='', brand='', unit=''):
    """Return an existing Material (by id or name), or create one inline.

    For a new material a category is used if given, else the first category.
    """
    if material_id:
        return Material.objects.filter(pk=material_id, is_deleted=False).first()
    name = (name or '').strip()
    if not name:
        return None

    # Match an existing material by name only — so a category passed for a new
    # material can never spawn a duplicate of one that already exists.
    found = Material.objects.filter(name__iexact=name, is_deleted=False).first()
    if found:
        return found

    cat_obj = None
    if category:
        cat_obj = (MaterialCategory.objects.filter(pk=category).first() if _is_uuid(category)
                   else MaterialCategory.objects.filter(slug=category).first())
    if not cat_obj:
        cat_obj = MaterialCategory.objects.order_by('sort_order').first()
    obj = Material.objects.create(
        name=name, category=cat_obj, specification=specification or '',
        brand=brand or '', unit=unit or '', created_by=getattr(request, 'user', None),
    )
    audit.log(request, action='created', target_type='material', target_name=obj.name,
              target_id=obj.id, summary=f'Material added under {cat_obj.name} (from a price entry)')
    return obj


# ── Categories ──────────────────────────────────────────────────────────────

class CategoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = MaterialCategorySerializer
    pagination_class = None

    def get_queryset(self):
        return MaterialCategory.objects.annotate(
            material_count=Count('materials', filter=Q(materials__is_deleted=False)),
        )

    def perform_create(self, serializer):
        obj = serializer.save()
        audit.log(self.request, action='created', target_type='category',
                  target_name=obj.name, target_id=obj.id, summary='Category created')


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = MaterialCategorySerializer
    lookup_field = 'slug'
    queryset = MaterialCategory.objects.all()

    def perform_update(self, serializer):
        before = audit.snapshot(serializer.instance, ['name', 'description', 'sort_order'])
        obj = serializer.save()
        audit.log(self.request, action='updated', target_type='category',
                  target_name=obj.name, target_id=obj.id, summary='Category updated',
                  changes=audit.diff(before, obj, ['name', 'description', 'sort_order']))

    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError
        in_use = instance.materials.filter(is_deleted=False).count()
        if in_use:
            raise ValidationError(
                f'This category still has {in_use} material(s). Move or delete them first.'
            )
        audit.log(self.request, action='deleted', target_type='category',
                  target_name=instance.name, target_id=instance.id, summary='Category deleted')
        instance.delete()


# ── Suppliers ───────────────────────────────────────────────────────────────

class SupplierListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupplierSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Supplier.objects.filter(is_deleted=False).annotate(
            price_count=Count('prices', filter=Q(prices__is_deleted=False), distinct=True),
            quotation_count=Count('quotations', filter=Q(quotations__is_deleted=False), distinct=True),
        )
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(contact_person__icontains=search))
        if self.request.query_params.get('is_active') == 'true':
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        audit.log(self.request, action='created', target_type='supplier',
                  target_name=obj.name, target_id=obj.id, summary='Supplier added')


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupplierSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Supplier.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        before = audit.snapshot(serializer.instance, SUPPLIER_FIELDS)
        obj = serializer.save(updated_by=self.request.user)
        audit.log(self.request, action='updated', target_type='supplier',
                  target_name=obj.name, target_id=obj.id, summary='Supplier updated',
                  changes=audit.diff(before, obj, SUPPLIER_FIELDS))

    def perform_destroy(self, instance):
        audit.log(self.request, action='deleted', target_type='supplier',
                  target_name=instance.name, target_id=instance.id, summary='Supplier deleted')
        instance.soft_delete(user=self.request.user)


# ── Materials ───────────────────────────────────────────────────────────────

class MaterialListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        return MaterialWriteSerializer if self.request.method == 'POST' else MaterialSerializer

    def get_queryset(self):
        qs = (
            Material.objects.filter(is_deleted=False)
            .select_related('category', 'product')
            .prefetch_related(
                Prefetch(
                    'supplier_prices',
                    queryset=SupplierPrice.objects.filter(is_deleted=False).select_related('supplier', 'source_quotation'),
                ),
            )
        )
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category) if _is_uuid(category) else qs.filter(category__slug=category)
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(brand__icontains=search)
                | Q(specification__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        audit.log(self.request, action='created', target_type='material',
                  target_name=obj.name, target_id=obj.id,
                  summary=f'Material added under {obj.category.name}')


class MaterialDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    lookup_field = 'slug'

    def get_serializer_class(self):
        return MaterialWriteSerializer if self.request.method in ('PUT', 'PATCH') else MaterialSerializer

    def get_queryset(self):
        return (
            Material.objects.filter(is_deleted=False)
            .select_related('category')
            .prefetch_related(
                Prefetch(
                    'supplier_prices',
                    queryset=SupplierPrice.objects.filter(is_deleted=False).select_related('supplier', 'source_quotation'),
                ),
            )
        )

    def perform_update(self, serializer):
        before = audit.snapshot(serializer.instance, MATERIAL_FIELDS)
        obj = serializer.save(updated_by=self.request.user)
        audit.log(self.request, action='updated', target_type='material',
                  target_name=obj.name, target_id=obj.id, summary='Material updated',
                  changes=audit.diff(before, obj, MATERIAL_FIELDS))

    def perform_destroy(self, instance):
        audit.log(self.request, action='deleted', target_type='material',
                  target_name=instance.name, target_id=instance.id, summary='Material deleted')
        instance.soft_delete(user=self.request.user)


# ── Material ⇄ Shop product linking ─────────────────────────────────────────

def _material_latest_price(material):
    """A representative price for a material = its most recently updated supplier
    price (each supplier has one current price). Used when publishing to the shop."""
    prices = [p for p in material.supplier_prices.all() if not p.is_deleted]
    if not prices:
        return Decimal('0')
    return sorted(prices, key=lambda p: p.updated_at, reverse=True)[0].price


def _material_shop_price(material):
    """Shop price = latest supplier price + that price × markup% (stored on the
    material): supplier × (1 + markup/100)."""
    base = _material_latest_price(material)
    pct = material.markup_pct or Decimal('0')
    return (base * (Decimal('1') + pct / Decimal('100'))).quantize(Decimal('0.01'))


def _parse_markup(value):
    """Returns a non-negative Decimal markup %, or None on invalid input."""
    if value is None or value == '':
        return Decimal('0')
    try:
        pct = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None
    return pct if pct >= 0 else None


def _fetch_material(slug):
    return (
        Material.objects.filter(slug=slug, is_deleted=False)
        .select_related('category', 'product')
        .prefetch_related(
            Prefetch('supplier_prices',
                     queryset=SupplierPrice.objects.filter(is_deleted=False).select_related('supplier', 'source_quotation')),
        )
        .first()
    )


def _create_product_from_material(material):
    """Promote a material into a shop Product so it appears in the shop, priced
    from its latest supplier price. Category/brand are matched (or created)."""
    from django.utils.text import slugify
    from apps.shop.models import Product, Category, Brand

    shop_cat, _ = Category.objects.get_or_create(name=material.category.name)
    shop_brand = None
    if material.brand:
        shop_brand, _ = Brand.objects.get_or_create(name=material.brand)

    root = (slugify(material.name) or 'material').replace('-', '').upper()[:42] or 'MATERIAL'
    sku, i = root, 1
    while Product.objects.filter(sku=sku).exists():
        suffix = f'-{i}'
        sku = root[:50 - len(suffix)] + suffix
        i += 1

    product = Product(
        name=material.name,
        sku=sku,
        category=shop_cat,
        brand=shop_brand,
        description=material.notes or '',
        short_description=(f'{material.brand} ' if material.brand else '') + material.name,
        price=_material_shop_price(material),
        is_active=True,
    )
    product.save()
    material.product = product
    material.save(update_fields=['product', 'updated_at'])
    return product


class MaterialLinkProductView(APIView):
    """Link a material to a shop product (existing or newly created), or unlink it."""
    permission_classes = [IsAdmin]

    def post(self, request, slug):
        material = _fetch_material(slug)
        if not material:
            return Response({'detail': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)

        product_id = request.data.get('product_id')
        create = request.data.get('create')
        sync_price = request.data.get('sync_price')

        if product_id:
            from apps.shop.models import Product
            try:
                product = Product.objects.get(pk=product_id, is_deleted=False)
            except Product.DoesNotExist:
                return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
            material.product = product
            material.save(update_fields=['product', 'updated_at'])
            audit.log(request, action='updated', target_type='material', target_name=material.name,
                      target_id=material.id, summary=f'Linked to shop product “{product.name}”')
        elif create:
            if 'markup_pct' in request.data:
                markup = _parse_markup(request.data.get('markup_pct'))
                if markup is None:
                    return Response({'detail': 'Markup must be a number ≥ 0.'}, status=status.HTTP_400_BAD_REQUEST)
                material.markup_pct = markup
                material.save(update_fields=['markup_pct', 'updated_at'])
            product = _create_product_from_material(material)
            audit.log(request, action='created', target_type='material', target_name=material.name,
                      target_id=material.id,
                      summary=f'Published to shop as “{product.name}” at {product.price} ({material.markup_pct}% markup)')
        elif sync_price:
            if not material.product_id:
                return Response({'detail': 'This material is not linked to a product.'}, status=status.HTTP_400_BAD_REQUEST)
            if 'markup_pct' in request.data:
                markup = _parse_markup(request.data.get('markup_pct'))
                if markup is None:
                    return Response({'detail': 'Markup must be a number ≥ 0.'}, status=status.HTTP_400_BAD_REQUEST)
                material.markup_pct = markup
                material.save(update_fields=['markup_pct', 'updated_at'])
            product = material.product
            new_price = _material_shop_price(material)
            old_price = product.price
            product.price = new_price
            product.save(update_fields=['price', 'updated_at'])
            audit.log(request, action='updated', target_type='material', target_name=material.name,
                      target_id=material.id,
                      summary=f'Synced shop price {old_price} → {new_price} ({material.markup_pct}% markup) for “{product.name}”')
        else:
            return Response({'detail': 'Provide product_id to link, create=true to publish, or sync_price=true.'},
                            status=status.HTTP_400_BAD_REQUEST)

        return Response(MaterialSerializer(_fetch_material(slug)).data)

    def delete(self, request, slug):
        material = _fetch_material(slug)
        if not material:
            return Response({'detail': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)
        material.product = None
        material.save(update_fields=['product', 'updated_at'])
        audit.log(request, action='updated', target_type='material', target_name=material.name,
                  target_id=material.id, summary='Unlinked from shop product')
        return Response(MaterialSerializer(_fetch_material(slug)).data)


class ImportFromProductView(APIView):
    """Create an inventory material from a shop product (linked), so its supplier
    pricing can be tracked here. Idempotent: re-importing returns the existing one."""
    permission_classes = [IsAdmin]

    def post(self, request):
        from apps.shop.models import Product
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.select_related('category', 'brand').get(pk=product_id, is_deleted=False)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        existing = Material.objects.filter(product=product, is_deleted=False).first()
        if existing:
            return Response(MaterialSerializer(_fetch_material(existing.slug)).data, status=status.HTTP_200_OK)

        cat, _ = MaterialCategory.objects.get_or_create(name=product.category.name if product.category else 'General')
        material = Material(
            name=product.name,
            category=cat,
            brand=(product.brand.name if product.brand else ''),
            product=product,
            created_by=request.user,
        )
        material.save()
        audit.log(request, action='created', target_type='material', target_name=material.name,
                  target_id=material.id, summary=f'Imported from shop product “{product.name}”')
        return Response(MaterialSerializer(_fetch_material(material.slug)).data, status=status.HTTP_201_CREATED)


# ── Supplier prices (with history logging) ──────────────────────────────────

class SupplierPriceListCreateView(generics.ListCreateAPIView):
    """List prices, or set a price for a (supplier, material). Setting a price
    is an upsert: if one already exists for the pair it's updated, and either
    way a PriceHistory row is appended."""
    permission_classes = [IsAdmin]
    serializer_class = SupplierPriceSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = SupplierPrice.objects.filter(is_deleted=False).select_related(
            'supplier', 'material', 'material__category', 'source_quotation',
        )
        if self.request.query_params.get('material'):
            qs = qs.filter(material_id=self.request.query_params['material'])
        if self.request.query_params.get('supplier'):
            qs = qs.filter(supplier_id=self.request.query_params['supplier'])
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        obj, _ = apply_price(
            request, supplier=d['supplier'], material=d['material'], price=d['price'],
            currency=d.get('currency', 'USD'), source_quotation=d.get('source_quotation'),
            note=d.get('note', ''), quoted_at=d.get('quoted_at'),
        )
        return Response(SupplierPriceSerializer(obj).data, status=status.HTTP_201_CREATED)


class BatchPriceView(APIView):
    """Log several priced materials for one supplier in a single action.

    The quotation document is OPTIONAL — pass an existing `quotation` id, or
    `quotation_title`/`quotation_file` to create one, or neither for prices a
    supplier simply told you (verbal / WhatsApp). Each item may reference an
    existing material by `material` (id) or create one inline via
    `material_name` (+ optional `category`).
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        import json

        sup_id = request.data.get('supplier')
        supplier = (Supplier.objects.filter(pk=sup_id, is_deleted=False).first()
                    if sup_id and _is_uuid(sup_id) else None)
        if not supplier:
            return Response({'detail': 'A valid supplier is required.'}, status=status.HTTP_400_BAD_REQUEST)

        items = request.data.get('items')
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except (ValueError, TypeError):
                items = []
        if not items:
            return Response({'detail': 'Add at least one priced item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Optional quotation document.
        quote = None
        q_id = request.data.get('quotation')
        if q_id and _is_uuid(q_id):
            quote = SupplierQuotation.objects.filter(pk=q_id, is_deleted=False).first()
        else:
            q_title = (request.data.get('quotation_title') or '').strip()
            q_file = request.FILES.get('quotation_file')
            if q_title or q_file:
                quote = SupplierQuotation.objects.create(
                    supplier=supplier, title=q_title or f'{supplier.name} pricing',
                    file=q_file, reference=request.data.get('reference', ''),
                    quote_date=request.data.get('quote_date') or None,
                    total_amount=request.data.get('total_amount') or None,
                    created_by=request.user,
                )
                audit.log(request, action='created', target_type='quotation', target_name=quote.title,
                          target_id=quote.id, summary=f'Quotation uploaded for {supplier.name}')

        created = updated = 0
        out = []
        for it in items:
            price = it.get('price')
            if price in (None, ''):
                continue
            material = resolve_material(
                request, material_id=it.get('material'), name=it.get('material_name'),
                category=it.get('category'), specification=it.get('specification', ''),
                brand=it.get('brand', ''), unit=it.get('unit', ''),
            )
            if not material:
                continue
            obj, was_created = apply_price(
                request, supplier=supplier, material=material, price=price,
                source_quotation=quote, note=it.get('note', ''),
                quoted_at=it.get('quoted_at') or (quote.quote_date if quote else None),
            )
            created += int(was_created)
            updated += int(not was_created)
            out.append(SupplierPriceSerializer(obj).data)

        return Response({
            'created': created, 'updated': updated,
            'quotation_id': str(quote.id) if quote else None,
            'prices': out,
        }, status=status.HTTP_201_CREATED)


class SupplierPriceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupplierPriceSerializer

    def get_queryset(self):
        return SupplierPrice.objects.filter(is_deleted=False).select_related('supplier', 'material')

    def perform_update(self, serializer):
        old_price = serializer.instance.price
        obj = serializer.save(updated_by=self.request.user)
        if Decimal(str(old_price)) != Decimal(str(obj.price)):
            PriceHistory.record(
                supplier=obj.supplier, material=obj.material, price=obj.price,
                previous_price=old_price, currency=obj.currency,
                source_quotation=obj.source_quotation, note=obj.note, user=self.request.user,
            )
            audit.log(self.request, action='updated', target_type='price',
                      target_name=f'{obj.material.name} @ {obj.supplier.name}', target_id=obj.id,
                      summary=f'Price {obj.currency} {old_price} → {obj.price}')

    def perform_destroy(self, instance):
        audit.log(self.request, action='deleted', target_type='price',
                  target_name=f'{instance.material.name} @ {instance.supplier.name}', target_id=instance.id,
                  summary='Price removed')
        instance.soft_delete(user=self.request.user)


# ── Price history (update logs) ─────────────────────────────────────────────

class PriceHistoryListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = PriceHistorySerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = PriceHistory.objects.select_related(
            'supplier', 'material', 'material__category', 'recorded_by',
        )
        if self.request.query_params.get('material'):
            qs = qs.filter(material_id=self.request.query_params['material'])
        if self.request.query_params.get('supplier'):
            qs = qs.filter(supplier_id=self.request.query_params['supplier'])
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(material__category_id=category) if _is_uuid(category) else qs.filter(material__category__slug=category)
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(Q(material__name__icontains=search) | Q(supplier__name__icontains=search))
        return qs


# ── Quotations (file uploads) ───────────────────────────────────────────────

class QuotationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupplierQuotationSerializer
    pagination_class = StandardPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = SupplierQuotation.objects.filter(is_deleted=False).select_related('supplier').prefetch_related(
            Prefetch('priced_items', queryset=SupplierPrice.objects.filter(is_deleted=False).select_related('material')),
        )
        if self.request.query_params.get('supplier'):
            qs = qs.filter(supplier_id=self.request.query_params['supplier'])
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        audit.log(self.request, action='created', target_type='quotation',
                  target_name=obj.title, target_id=obj.id,
                  summary=f'Quotation uploaded for {obj.supplier.name}')


class QuotationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupplierQuotationSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return SupplierQuotation.objects.filter(is_deleted=False).select_related('supplier').prefetch_related(
            Prefetch('priced_items', queryset=SupplierPrice.objects.filter(is_deleted=False).select_related('material')),
        )

    def perform_update(self, serializer):
        before = audit.snapshot(serializer.instance, QUOTATION_FIELDS)
        obj = serializer.save(updated_by=self.request.user)
        audit.log(self.request, action='updated', target_type='quotation',
                  target_name=obj.title, target_id=obj.id, summary='Quotation updated',
                  changes=audit.diff(before, obj, QUOTATION_FIELDS))

    def perform_destroy(self, instance):
        audit.log(self.request, action='deleted', target_type='quotation',
                  target_name=instance.title, target_id=instance.id, summary='Quotation deleted')
        instance.soft_delete(user=self.request.user)


# ── Audit trail ─────────────────────────────────────────────────────────────

class AuditLogListView(generics.ListAPIView):
    """Unified who-changed-what feed across the inventory module."""
    permission_classes = [IsAdmin]
    serializer_class = AuditLogSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor')
        target_type = self.request.query_params.get('target_type')
        if target_type:
            qs = qs.filter(target_type=target_type)
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(Q(target_name__icontains=search) | Q(summary__icontains=search))
        return qs


# ── Summary / dashboard ─────────────────────────────────────────────────────

class InventorySummaryView(APIView):
    """Per-category roll-up + headline counts for the inventory dashboard."""
    permission_classes = [IsAdmin]

    def get(self, request):
        categories = []
        for cat in MaterialCategory.objects.all():
            prices = SupplierPrice.objects.filter(
                material__category=cat, is_deleted=False, material__is_deleted=False,
            )
            agg = prices.aggregate(avg=Avg('price'), low=Min('price'), high=Max('price'))
            categories.append({
                'id': str(cat.id),
                'name': cat.name,
                'slug': cat.slug,
                'material_count': Material.objects.filter(category=cat, is_deleted=False).count(),
                'priced_count': prices.values('material').distinct().count(),
                'avg_price': round(agg['avg'], 2) if agg['avg'] is not None else None,
                'min_price': agg['low'],
                'max_price': agg['high'],
            })
        return Response({
            'categories': categories,
            'totals': {
                'suppliers': Supplier.objects.filter(is_deleted=False).count(),
                'materials': Material.objects.filter(is_deleted=False).count(),
                'prices': SupplierPrice.objects.filter(is_deleted=False).count(),
                'quotations': SupplierQuotation.objects.filter(is_deleted=False).count(),
                'price_updates': PriceHistory.objects.count(),
            },
        })
