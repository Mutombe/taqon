from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.core.permissions import IsAdmin

from .models import Project, ProjectImage
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer,
    ProjectAdminSerializer, ProjectImageAdminSerializer,
)

IMAGE_MAX_BYTES = 12 * 1024 * 1024  # 12 MB per image


# ── Public ───────────────────────────────────────────────────────────

class ProjectListView(generics.ListAPIView):
    """GET /api/v1/projects/ — published projects (optional ?category=)."""
    permission_classes = [AllowAny]
    serializer_class = ProjectListSerializer
    pagination_class = None

    def get_queryset(self):
        qs = Project.objects.filter(is_published=True, is_deleted=False).prefetch_related('images')
        category = self.request.query_params.get('category')
        if category and category != 'all':
            qs = qs.filter(category=category)
        return qs


class ProjectDetailView(generics.RetrieveAPIView):
    """GET /api/v1/projects/<slug>/ — a single published project."""
    permission_classes = [AllowAny]
    serializer_class = ProjectDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Project.objects.filter(is_published=True, is_deleted=False).prefetch_related('images')


# ── Admin ────────────────────────────────────────────────────────────

class AdminProjectListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/projects/admin/ — list all + create."""
    permission_classes = [IsAdmin]
    serializer_class = ProjectAdminSerializer
    pagination_class = None

    def get_queryset(self):
        return Project.objects.filter(is_deleted=False).prefetch_related('images')


class AdminProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/projects/admin/<slug>/."""
    permission_classes = [IsAdmin]
    serializer_class = ProjectAdminSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return Project.objects.filter(is_deleted=False).prefetch_related('images')

    def perform_destroy(self, instance):
        # Soft delete keeps the row; unpublish so it leaves the public gallery.
        instance.is_published = False
        instance.save(update_fields=['is_published'])
        instance.delete()  # SoftDeleteModel — sets is_deleted


def _guard_image(upload):
    if not upload:
        return 'No image provided.'
    if getattr(upload, 'size', 0) and upload.size > IMAGE_MAX_BYTES:
        return 'Image is too large (max 12 MB).'
    ctype = (getattr(upload, 'content_type', '') or '')
    if ctype and not ctype.startswith('image/'):
        return 'Please upload an image file.'
    return None


class AdminProjectImagesView(APIView):
    """POST /api/v1/projects/admin/<slug>/images/ — add a gallery image."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        project = Project.objects.filter(slug=slug, is_deleted=False).first()
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        upload = request.FILES.get('image')
        err = _guard_image(upload)
        if err:
            return Response({'detail': err}, status=status.HTTP_400_BAD_REQUEST)
        last = project.images.order_by('-order').first()
        img = ProjectImage.objects.create(
            project=project,
            image=upload,
            caption=request.data.get('caption', ''),
            order=(last.order + 1) if last else 0,
        )
        return Response(ProjectImageAdminSerializer(img, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class AdminProjectHeroView(APIView):
    """POST /api/v1/projects/admin/<slug>/hero/ — upload/replace the hero image."""
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, slug):
        project = Project.objects.filter(slug=slug, is_deleted=False).first()
        if not project:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)
        upload = request.FILES.get('image')
        err = _guard_image(upload)
        if err:
            return Response({'detail': err}, status=status.HTTP_400_BAD_REQUEST)
        if project.hero_image:
            try:
                project.hero_image.delete(save=False)
            except Exception:
                pass
        project.hero_image = upload
        project.hero_image_url = ''  # uploaded file now wins
        project.save()
        return Response(ProjectAdminSerializer(project, context={'request': request}).data)


class AdminProjectImageDetailView(APIView):
    """PATCH/DELETE /api/v1/projects/admin/images/<uuid:pk>/ — caption/order/remove."""
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        img = ProjectImage.objects.filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)
        if 'caption' in request.data:
            img.caption = request.data.get('caption', '')
        if 'order' in request.data:
            try:
                img.order = int(request.data.get('order') or 0)
            except (TypeError, ValueError):
                pass
        img.save()
        return Response(ProjectImageAdminSerializer(img, context={'request': request}).data)

    def delete(self, request, pk):
        img = ProjectImage.objects.filter(pk=pk).first()
        if not img:
            return Response({'detail': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            if img.image:
                img.image.delete(save=False)
        except Exception:
            pass
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
