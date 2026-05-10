from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from .models import Download
from .serializers import DownloadTrackSerializer, DownloadAdminSerializer
from .services import _client_ip


class TrackDownloadView(generics.CreateAPIView):
    """POST /api/v1/downloads/track/ — public ping from client-rendered
    brochures (print-window flow) so we still capture them."""
    permission_classes = [AllowAny]
    serializer_class = DownloadTrackSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Download.objects.create(
            **serializer.validated_data,
            user=(request.user if request.user.is_authenticated else None),
            ip_address=_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000],
            referer=request.META.get('HTTP_REFERER', '')[:500],
            success=True,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminDownloadListView(generics.ListAPIView):
    """GET /api/v1/downloads/admin/ — paginated list with filters."""
    permission_classes = [IsAdmin]
    serializer_class = DownloadAdminSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Download.objects.select_related('user').all()
        kind = self.request.query_params.get('kind')
        if kind:
            qs = qs.filter(kind=kind)
        surface = self.request.query_params.get('surface')
        if surface:
            qs = qs.filter(surface=surface)
        success = self.request.query_params.get('success')
        if success in ('true', 'false'):
            qs = qs.filter(success=(success == 'true'))
        search = self.request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(target_slug__icontains=search)
                | Q(target_label__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(ip_address__icontains=search),
            )
        return qs


class AdminDownloadStatsView(generics.GenericAPIView):
    """GET /api/v1/downloads/admin/stats/ — top-line counts for the
    Downloads dashboard panel: total, by kind, last 7 days, last 24h."""
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        last_24h = now - timezone.timedelta(hours=24)
        last_7d = now - timezone.timedelta(days=7)
        last_30d = now - timezone.timedelta(days=30)

        qs = Download.objects.all()
        return Response({
            'total': qs.count(),
            'success_total': qs.filter(success=True).count(),
            'failed_total': qs.filter(success=False).count(),
            'last_24h': qs.filter(created_at__gte=last_24h).count(),
            'last_7d': qs.filter(created_at__gte=last_7d).count(),
            'last_30d': qs.filter(created_at__gte=last_30d).count(),
            'by_kind': list(
                qs.values('kind').annotate(count=Count('id')).order_by('-count')
            ),
            'by_surface': list(
                qs.values('surface').annotate(count=Count('id')).order_by('-count')
            ),
        })
