from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    # ── User ────────────────────────────────────────────────────────
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
    path('mark-all-read/', views.MarkAllReadView.as_view(), name='mark-all-read'),
    path('clear-read/', views.ClearAllView.as_view(), name='clear-read'),
    path('<uuid:notification_id>/read/', views.MarkReadView.as_view(), name='mark-read'),
    path('<uuid:notification_id>/delete/', views.DeleteNotificationView.as_view(), name='delete-notification'),

    # ── Preferences ─────────────────────────────────────────────────
    path('preferences/', views.PreferencesView.as_view(), name='preferences'),

    # ── Admin ───────────────────────────────────────────────────────
    path('admin/send/', views.AdminSendNotificationView.as_view(), name='admin-send'),
    path('admin/stats/', views.AdminNotificationStatsView.as_view(), name='admin-stats'),
]
