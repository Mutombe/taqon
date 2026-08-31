from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count
from django.utils import timezone

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from .models import Download, CompanyProfile, VideoStory
from .serializers import (
    DownloadTrackSerializer, DownloadAdminSerializer, CompanyProfileSerializer,
    VideoStorySerializer,
)
from .services import _client_ip

# Company profile upload guards.
PROFILE_MAX_BYTES = 50 * 1024 * 1024  # 50 MB
PROFILE_ALLOWED_TYPES = ('application/pdf',)
PROFILE_ALLOWED_EXTS = ('.pdf',)


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


class CompanyProfileMetaView(APIView):
    """GET /api/v1/downloads/company-profile/ — public availability meta so the
    website knows whether to show the 'Download Company Profile' button."""
    permission_classes = [AllowAny]

    def get(self, request):
        profile = CompanyProfile.current()
        if not profile or not profile.file:
            return Response({'available': False})
        data = CompanyProfileSerializer(profile, context={'request': request}).data
        data['available'] = True
        return Response(data)


class AdminCompanyProfileView(APIView):
    """GET/PUT /api/v1/downloads/admin/company-profile/ — the Taqon team
    uploads or replaces the company profile document here (singleton)."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        profile = CompanyProfile.current()
        if not profile:
            return Response({'available': False})
        data = CompanyProfileSerializer(profile, context={'request': request}).data
        data['available'] = bool(profile.file)
        return Response(data)

    def put(self, request):
        return self._save(request)

    def post(self, request):
        return self._save(request)

    def delete(self, request):
        """Remove the uploaded profile — the site's download buttons hide again."""
        profile = CompanyProfile.current()
        if profile:
            if profile.file:
                try:
                    profile.file.delete(save=False)
                except Exception:
                    pass
            profile.delete()
        return Response({'available': False}, status=status.HTTP_200_OK)

    def _save(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'No file provided.'},
                            status=status.HTTP_400_BAD_REQUEST)

        name = (getattr(upload, 'name', '') or '')
        ctype = (getattr(upload, 'content_type', '') or '')
        ext = ('.' + name.rsplit('.', 1)[1].lower()) if '.' in name else ''
        if ext not in PROFILE_ALLOWED_EXTS and ctype not in PROFILE_ALLOWED_TYPES:
            return Response(
                {'detail': 'Please upload a PDF file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if getattr(upload, 'size', 0) and upload.size > PROFILE_MAX_BYTES:
            return Response(
                {'detail': 'File is too large (max 50 MB).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Singleton: replace the existing row's file (deleting the old stored
        # file to avoid orphans), else create the first row.
        profile = CompanyProfile.current() or CompanyProfile()
        if profile.pk and profile.file:
            try:
                profile.file.delete(save=False)
            except Exception:
                pass
        profile.file = upload
        profile.original_name = name[:255]
        profile.content_type = ctype[:100]
        profile.size_bytes = getattr(upload, 'size', None)
        profile.uploaded_by = request.user if request.user.is_authenticated else None
        profile.save()

        data = CompanyProfileSerializer(profile, context={'request': request}).data
        data['available'] = True
        return Response(data, status=status.HTTP_200_OK)


class VideoStoryListView(generics.ListAPIView):
    """GET /api/v1/downloads/video-stories/ — public, active videos ordered."""
    permission_classes = [AllowAny]
    serializer_class = VideoStorySerializer

    def get_queryset(self):
        return VideoStory.objects.filter(is_active=True)


class AdminVideoStoryListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/downloads/admin/video-stories/ — manage the list."""
    permission_classes = [IsAdmin]
    serializer_class = VideoStorySerializer
    queryset = VideoStory.objects.all()


class AdminVideoStoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/downloads/admin/video-stories/<uuid:pk>/."""
    permission_classes = [IsAdmin]
    serializer_class = VideoStorySerializer
    queryset = VideoStory.objects.all()
