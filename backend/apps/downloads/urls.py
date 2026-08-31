from django.urls import path

from . import views

app_name = 'downloads'

urlpatterns = [
    # Public — client-rendered brochure tracking ping
    path('track/', views.TrackDownloadView.as_view(), name='track'),
    # Public — company profile availability (so the site can show/hide the button)
    path('company-profile/', views.CompanyProfileMetaView.as_view(), name='company-profile-meta'),

    # Admin
    path('admin/', views.AdminDownloadListView.as_view(), name='admin-list'),
    path('admin/stats/', views.AdminDownloadStatsView.as_view(), name='admin-stats'),
    path('admin/company-profile/', views.AdminCompanyProfileView.as_view(), name='admin-company-profile'),
]
