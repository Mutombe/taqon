from django.urls import path

from . import views

app_name = 'inquiries'

urlpatterns = [
    # Public — customer-facing submit endpoint
    path('', views.PublicInquiryView.as_view(), name='public-submit'),

    # Admin — triage list + detail/update
    path('admin/', views.AdminInquiryListView.as_view(), name='admin-list'),
    path('admin/<uuid:pk>/', views.AdminInquiryDetailView.as_view(), name='admin-detail'),
]
