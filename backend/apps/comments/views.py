from django.db.models import Q, F
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.permissions import IsAdmin
from apps.core.pagination import SmallPagination
from apps.core.utils import get_client_ip
from .models import Comment
from .serializers import CommentSerializer, CreateCommentSerializer


# ═══════════════════════════════════════════════════════════════════════
# PUBLIC
# ═══════════════════════════════════════════════════════════════════════

class CommentListView(APIView):
    """Public: list approved comments for a specific content item."""
    permission_classes = [AllowAny]

    def get(self, request):
        content_type = request.query_params.get('content_type')
        slug = request.query_params.get('slug')

        if not content_type or not slug:
            return Response(
                {'error': 'Both content_type and slug query params are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Comment.objects.filter(
            content_type=content_type,
            content_slug=slug,
            is_approved=True,
            parent__isnull=True,
        ).select_related('user').prefetch_related('replies', 'replies__user', 'replies__replies', 'replies__replies__user')

        paginator = SmallPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CommentSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class CreateCommentView(APIView):
    """Public: create a comment. Both authenticated and guest users allowed."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateCommentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        comment = Comment(
            content_type=data['content_type'],
            content_slug=data['content_slug'],
            text=data['text'],
            ip_address=get_client_ip(request),
        )

        # Set parent for threaded replies
        parent_id = data.get('parent')
        if parent_id:
            comment.parent_id = parent_id

        if request.user and request.user.is_authenticated:
            comment.user = request.user
        else:
            comment.guest_name = data.get('guest_name', '')
            comment.guest_email = data.get('guest_email', '')

        comment.save()

        return Response(
            CommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class LikeCommentView(APIView):
    """Public: increment like count on a comment."""
    permission_classes = [AllowAny]

    def post(self, request, comment_id):
        try:
            comment = Comment.objects.get(id=comment_id, is_approved=True)
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Comment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        Comment.objects.filter(id=comment_id).update(likes=F('likes') + 1)
        comment.refresh_from_db()

        return Response({'likes': comment.likes})


# ═══════════════════════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════════════════════

class AdminCommentListView(APIView):
    """Admin: list all comments with filters."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Comment.objects.select_related('user').all()

        content_type = request.query_params.get('content_type')
        is_approved = request.query_params.get('is_approved')
        search = request.query_params.get('search')

        if content_type:
            qs = qs.filter(content_type=content_type)
        if is_approved is not None and is_approved != '':
            qs = qs.filter(is_approved=is_approved.lower() in ('true', '1'))
        if search:
            qs = qs.filter(
                Q(text__icontains=search) |
                Q(guest_name__icontains=search) |
                Q(guest_email__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)
            )

        paginator = SmallPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CommentSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class AdminCommentModerateView(APIView):
    """Admin: approve, unapprove, or delete a comment."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, comment_id):
        try:
            comment = Comment.objects.get(id=comment_id)
        except Comment.DoesNotExist:
            return Response(
                {'error': 'Comment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get('action')

        if action == 'approve':
            comment.is_approved = True
            comment.save(update_fields=['is_approved'])
            return Response(CommentSerializer(comment, context={'request': request}).data)

        elif action == 'unapprove':
            comment.is_approved = False
            comment.save(update_fields=['is_approved'])
            return Response(CommentSerializer(comment, context={'request': request}).data)

        elif action == 'delete':
            comment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {'error': 'Invalid action. Must be one of: approve, unapprove, delete.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
