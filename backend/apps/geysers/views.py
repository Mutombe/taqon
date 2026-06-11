from rest_framework import generics, filters
from rest_framework.permissions import AllowAny

from apps.core.permissions import IsAdmin
from apps.core.pagination import StandardPagination
from .models import GeyserPackage
from .serializers import (
    GeyserPackageListSerializer,
    GeyserPackageDetailSerializer,
    AdminGeyserPackageSerializer,
)


# ── Public ──────────────────────────────────────────────────────────────────

class GeyserPackageListView(generics.ListAPIView):
    """All active geyser packages (the grid). Filterable by system_type / variant."""
    permission_classes = [AllowAny]
    serializer_class = GeyserPackageListSerializer
    pagination_class = None  # only 16 packages — return them all in one grid

    def get_queryset(self):
        qs = GeyserPackage.objects.filter(is_deleted=False, is_active=True)
        system = self.request.query_params.get('system_type')
        if system:
            qs = qs.filter(system_type=system)
        variant = self.request.query_params.get('variant')
        if variant:
            qs = qs.filter(variant=variant)
        return qs


class GeyserPackageDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = GeyserPackageDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return GeyserPackage.objects.filter(is_deleted=False, is_active=True)


# ── Admin ───────────────────────────────────────────────────────────────────

class AdminGeyserPackageListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminGeyserPackageSerializer
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'brand', 'geyser_unit']

    def get_queryset(self):
        return GeyserPackage.objects.filter(is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminGeyserPackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = AdminGeyserPackageSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return GeyserPackage.objects.filter(is_deleted=False)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)
