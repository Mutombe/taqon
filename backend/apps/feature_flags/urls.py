from django.urls import path

from . import views

app_name = 'feature_flags'

urlpatterns = [
    # Public — resolved per-request, used by the frontend gating layer
    path('', views.PublicFeatureFlagsView.as_view(), name='public-list'),

    # Admin — list + update
    path('admin/', views.AdminFeatureFlagListView.as_view(), name='admin-list'),
    path('admin/<str:key>/', views.AdminFeatureFlagUpdateView.as_view(), name='admin-update'),
]
