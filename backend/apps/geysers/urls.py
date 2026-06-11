from django.urls import path

from . import views

app_name = 'geysers'

urlpatterns = [
    # Public
    path('packages/', views.GeyserPackageListView.as_view(), name='package-list'),
    path('packages/<slug:slug>/', views.GeyserPackageDetailView.as_view(), name='package-detail'),

    # Admin
    path('admin/packages/', views.AdminGeyserPackageListCreateView.as_view(), name='admin-package-list'),
    path('admin/packages/<slug:slug>/', views.AdminGeyserPackageDetailView.as_view(), name='admin-package-detail'),
]
