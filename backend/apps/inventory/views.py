"""Admin-only supplier inventory & pricing API.

Every endpoint is gated by IsAdmin — this data is internal procurement
intelligence and never exposed to the public.
"""
import uuid
from decimal import Decimal

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
            .select_related('category')
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
        data = serializer.validated_data
        existing = SupplierPrice.objects.filter(
            supplier=data['supplier'], material=data['material'], is_deleted=False,
        ).first()

        previous = existing.price if existing else None
        if existing:
            for field in ('price', 'currency', 'source_quotation', 'note', 'quoted_at'):
                if field in data:
                    setattr(existing, field, data[field])
            existing.updated_by = request.user
            existing.save()
            obj = existing
        else:
            obj = serializer.save(created_by=request.user)

        if previous is None or Decimal(str(previous)) != Decimal(str(obj.price)):
            PriceHistory.record(
                supplier=obj.supplier, material=obj.material, price=obj.price,
                previous_price=previous, currency=obj.currency,
                source_quotation=obj.source_quotation, note=obj.note, user=request.user,
            )
            summary = (f'Price set to {obj.currency} {obj.price}' if previous is None
                       else f'Price {obj.currency} {previous} → {obj.price}')
            audit.log(
                request, action='created' if previous is None else 'updated',
                target_type='price', target_name=f'{obj.material.name} @ {obj.supplier.name}',
                target_id=obj.id, summary=summary,
            )
        out = SupplierPriceSerializer(obj).data
        return Response(out, status=status.HTTP_201_CREATED)


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
        qs = SupplierQuotation.objects.filter(is_deleted=False).select_related('supplier')
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
        return SupplierQuotation.objects.filter(is_deleted=False).select_related('supplier')

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
