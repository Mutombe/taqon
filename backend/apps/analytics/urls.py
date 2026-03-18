from django.urls import path
from . import views

urlpatterns = [
    # Dashboard
    path('dashboard/', views.DashboardOverviewView.as_view(), name='analytics-dashboard'),
    path('revenue/', views.RevenueAnalyticsView.as_view(), name='analytics-revenue'),
    path('users/', views.UserAnalyticsView.as_view(), name='analytics-users'),
    path('orders/', views.OrderAnalyticsView.as_view(), name='analytics-orders'),
    path('support/', views.SupportAnalyticsView.as_view(), name='analytics-support'),
    path('activity/', views.RecentActivityView.as_view(), name='analytics-activity'),
    path('snapshots/', views.DailySnapshotListView.as_view(), name='analytics-snapshots'),

    # Page view tracking (public)
    path('track/', views.TrackPageViewView.as_view(), name='analytics-track'),

    # Admin user management
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:id>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
]
