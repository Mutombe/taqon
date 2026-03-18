from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # Public
    path('posts/', views.BlogPostListView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', views.BlogPostDetailView.as_view(), name='post-detail'),
    path('categories/', views.BlogCategoryListView.as_view(), name='category-list'),

    # Admin
    path('admin/posts/', views.AdminBlogPostListView.as_view(), name='admin-post-list'),
    path('admin/posts/create/', views.AdminBlogPostCreateView.as_view(), name='admin-post-create'),
    path('admin/posts/<slug:slug>/', views.AdminBlogPostUpdateView.as_view(), name='admin-post-detail'),
    path('admin/posts/<slug:slug>/delete/', views.AdminBlogPostDeleteView.as_view(), name='admin-post-delete'),
    path('admin/categories/', views.AdminBlogCategoryListCreateView.as_view(), name='admin-category-list'),
    path('admin/categories/<slug:slug>/', views.AdminBlogCategoryUpdateView.as_view(), name='admin-category-detail'),
]
