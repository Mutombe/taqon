from django.urls import path
from . import views

app_name = 'comments'

urlpatterns = [
    # ── Public ───────────────────────────────────────────────────────
    path('', views.CommentListView.as_view(), name='comment-list'),
    path('create/', views.CreateCommentView.as_view(), name='comment-create'),
    path('<uuid:comment_id>/like/', views.LikeCommentView.as_view(), name='comment-like'),

    # ── Admin ────────────────────────────────────────────────────────
    path('admin/', views.AdminCommentListView.as_view(), name='admin-comment-list'),
    path('admin/<uuid:comment_id>/', views.AdminCommentModerateView.as_view(), name='admin-comment-moderate'),
]
