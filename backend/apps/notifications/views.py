from django.utils import timezone
from django.db.models import Count, Q
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsAdmin
from apps.core.pagination import StandardPagination
from .models import Notification, NotificationPreference, send_notification
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    AdminSendNotificationSerializer,
)


# ═══════════════════════════════════════════════════════════════════════
# USER — Notifications
# ═══════════════════════════════════════════════════════════════════════

class NotificationListView(APIView):
    """List current user's notifications with filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)

        is_read = request.query_params.get('is_read')
        ntype = request.query_params.get('type')

        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == 'true')
        if ntype:
            qs = qs.filter(notification_type=ntype)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = NotificationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UnreadCountView(APIView):
    """Get count of unread notifications."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).count()
        return Response({'unread_count': count})


class MarkReadView(APIView):
    """Mark a single notification as read."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user,
            )
        except Notification.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.mark_read()
        return Response(NotificationSerializer(notification).data)


class MarkAllReadView(APIView):
    """Mark all unread notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False,
        ).update(is_read=True, read_at=timezone.now())

        return Response({'marked_read': count})


class DeleteNotificationView(APIView):
    """Delete a notification."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):
        try:
            notification = Notification.objects.get(
                id=notification_id, user=request.user,
            )
        except Notification.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClearAllView(APIView):
    """Delete all read notifications for the user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count, _ = Notification.objects.filter(
            user=request.user, is_read=True,
        ).delete()
        return Response({'deleted': count})


# ═══════════════════════════════════════════════════════════════════════
# USER — Preferences
# ═══════════════════════════════════════════════════════════════════════

class PreferencesView(APIView):
    """Get or update notification preferences."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(
            user=request.user,
        )
        return Response(NotificationPreferenceSerializer(prefs).data)

    def patch(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(
            user=request.user,
        )
        serializer = NotificationPreferenceSerializer(
            prefs, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════
# ADMIN — Send & Manage
# ═══════════════════════════════════════════════════════════════════════

class AdminSendNotificationView(APIView):
    """Admin: send a notification to a specific user or broadcast."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminSendNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user_id = data.get('user_id')

        if user_id:
            # Send to specific user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            notification = send_notification(
                user=target_user,
                notification_type=data['notification_type'],
                title=data['title'],
                message=data['message'],
                priority=data['priority'],
                action_url=data.get('action_url', ''),
                action_label=data.get('action_label', ''),
                sent_by=request.user,
            )
            return Response({
                'sent': 1,
                'notification_id': str(notification.id) if notification else None,
            }, status=status.HTTP_201_CREATED)
        else:
            # Broadcast
            from django.contrib.auth import get_user_model
            User = get_user_model()
            qs = User.objects.filter(is_active=True)

            role_filter = data.get('role_filter', 'all')
            if role_filter != 'all':
                qs = qs.filter(role=role_filter)

            count = 0
            for user in qs.iterator():
                result = send_notification(
                    user=user,
                    notification_type=data['notification_type'],
                    title=data['title'],
                    message=data['message'],
                    priority=data['priority'],
                    action_url=data.get('action_url', ''),
                    action_label=data.get('action_label', ''),
                    sent_by=request.user,
                )
                if result:
                    count += 1

            return Response({'sent': count}, status=status.HTTP_201_CREATED)


class AdminNotificationStatsView(APIView):
    """Admin: notification statistics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total = Notification.objects.count()
        unread = Notification.objects.filter(is_read=False).count()
        read_rate = round(((total - unread) / total * 100) if total > 0 else 0, 1)

        by_type = list(
            Notification.objects.values('notification_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        recent_count = Notification.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=7),
        ).count()

        return Response({
            'total_notifications': total,
            'unread': unread,
            'read_rate': read_rate,
            'sent_last_7_days': recent_count,
            'by_type': by_type,
        })
