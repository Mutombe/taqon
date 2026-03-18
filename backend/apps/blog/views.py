import logging

from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter

from apps.core.pagination import StandardPagination, SmallPagination
from apps.core.permissions import IsAdmin

from .models import BlogCategory, BlogPost
from .serializers import (
    BlogCategorySerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    BlogPostCreateUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════
# Public Blog Views
# ══════════════════════════════════════════════

@extend_schema(
    tags=['Blog'],
    parameters=[
        OpenApiParameter('category', str, description='Filter by category slug'),
        OpenApiParameter('tag', str, description='Filter by tag'),
        OpenApiParameter('search', str, description='Search in title and excerpt'),
    ],
)
class BlogPostListView(generics.ListAPIView):
    """List all published blog posts, filterable by category and tag."""
    permission_classes = [AllowAny]
    serializer_class = BlogPostListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = (
            BlogPost.objects
            .filter(is_published=True, is_deleted=False)
            .select_related('category', 'author')
        )

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__contains=[tag])

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content__icontains=search)
            )

        return qs


@extend_schema(tags=['Blog'])
class BlogPostDetailView(generics.RetrieveAPIView):
    """Retrieve a single published blog post by slug. Increments view count."""
    permission_classes = [AllowAny]
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            BlogPost.objects
            .filter(is_published=True, is_deleted=False)
            .select_related('category', 'author')
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count atomically
        BlogPost.objects.filter(pk=instance.pk).update(
            views_count=instance.views_count + 1
        )
        instance.views_count += 1
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@extend_schema(tags=['Blog'])
class BlogCategoryListView(generics.ListAPIView):
    """List all active blog categories."""
    permission_classes = [AllowAny]
    serializer_class = BlogCategorySerializer
    pagination_class = None

    def get_queryset(self):
        return BlogCategory.objects.filter(is_active=True)


# ══════════════════════════════════════════════
# Admin Blog Views (IsAdmin permission)
# ══════════════════════════════════════════════

@extend_schema(
    tags=['Blog'],
    parameters=[
        OpenApiParameter('is_published', bool, description='Filter by published status'),
        OpenApiParameter('category', str, description='Filter by category slug'),
        OpenApiParameter('search', str, description='Search in title and content'),
    ],
)
class AdminBlogPostListView(generics.ListAPIView):
    """Admin view: list all blog posts including unpublished."""
    permission_classes = [IsAdmin]
    serializer_class = BlogPostListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = (
            BlogPost.objects
            .filter(is_deleted=False)
            .select_related('category', 'author')
        )

        params = self.request.query_params

        is_published = params.get('is_published')
        if is_published is not None:
            qs = qs.filter(is_published=is_published.lower() == 'true')

        category = params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(excerpt__icontains=search)
                | Q(content__icontains=search)
            )

        return qs


@extend_schema(tags=['Blog'])
class AdminBlogPostCreateView(generics.CreateAPIView):
    """Admin view: create a new blog post."""
    permission_classes = [IsAdmin]
    serializer_class = BlogPostCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


@extend_schema(tags=['Blog'])
class AdminBlogPostUpdateView(generics.RetrieveUpdateAPIView):
    """Admin view: retrieve or update a blog post by slug."""
    permission_classes = [IsAdmin]
    serializer_class = BlogPostCreateUpdateSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return BlogPost.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return BlogPostCreateUpdateSerializer
        return BlogPostDetailSerializer


@extend_schema(tags=['Blog'])
class AdminBlogPostDeleteView(APIView):
    """Admin view: soft-delete a blog post by slug."""
    permission_classes = [IsAdmin]

    def delete(self, request, slug):
        try:
            post = BlogPost.objects.get(slug=slug, is_deleted=False)
        except BlogPost.DoesNotExist:
            return Response(
                {'detail': 'Blog post not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        post.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Blog'])
class AdminBlogCategoryListCreateView(generics.ListCreateAPIView):
    """Admin view: list and create blog categories."""
    permission_classes = [IsAdmin]
    serializer_class = BlogCategorySerializer
    pagination_class = None

    def get_queryset(self):
        return BlogCategory.objects.all()


@extend_schema(tags=['Blog'])
class AdminBlogCategoryUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view: retrieve, update or delete a blog category."""
    permission_classes = [IsAdmin]
    serializer_class = BlogCategorySerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return BlogCategory.objects.all()
