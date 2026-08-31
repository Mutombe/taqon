from django.urls import path

from . import views

app_name = 'projects'

urlpatterns = [
    # Public
    path('', views.ProjectListView.as_view(), name='list'),

    # Admin (before the public <slug> so 'admin' isn't captured as a slug)
    path('admin/', views.AdminProjectListCreateView.as_view(), name='admin-list'),
    path('admin/images/<uuid:pk>/', views.AdminProjectImageDetailView.as_view(), name='admin-image-detail'),
    path('admin/<slug:slug>/', views.AdminProjectDetailView.as_view(), name='admin-detail'),
    path('admin/<slug:slug>/images/', views.AdminProjectImagesView.as_view(), name='admin-images'),
    path('admin/<slug:slug>/hero/', views.AdminProjectHeroView.as_view(), name='admin-hero'),

    # Public detail (kept last so it doesn't shadow /admin/)
    path('<slug:slug>/', views.ProjectDetailView.as_view(), name='detail'),
]
