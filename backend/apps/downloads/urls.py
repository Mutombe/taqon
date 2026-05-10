from django.urls import path

from . import views

app_name = 'downloads'

urlpatterns = [
    # Public — client-rendered brochure tracking ping
    path('track/', views.TrackDownloadView.as_view(), name='track'),

    # Admin
    path('admin/', views.AdminDownloadListView.as_view(), name='admin-list'),
    path('admin/stats/', views.AdminDownloadStatsView.as_view(), name='admin-stats'),
]
