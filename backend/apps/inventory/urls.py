from django.urls import path

from . import views

app_name = 'inventory'

urlpatterns = [
    # Dashboard summary
    path('summary/', views.InventorySummaryView.as_view(), name='summary'),

    # Categories
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<slug:slug>/', views.CategoryDetailView.as_view(), name='category-detail'),

    # Suppliers
    path('suppliers/', views.SupplierListCreateView.as_view(), name='supplier-list'),
    path('suppliers/<slug:slug>/', views.SupplierDetailView.as_view(), name='supplier-detail'),

    # Materials
    path('materials/', views.MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<slug:slug>/', views.MaterialDetailView.as_view(), name='material-detail'),

    # Supplier prices (with history logging)
    path('prices/', views.SupplierPriceListCreateView.as_view(), name='price-list'),
    path('prices/<uuid:pk>/', views.SupplierPriceDetailView.as_view(), name='price-detail'),

    # Price update logs
    path('price-history/', views.PriceHistoryListView.as_view(), name='price-history'),

    # Unified audit trail
    path('audit/', views.AuditLogListView.as_view(), name='audit-log'),

    # Supplier quotations (uploads)
    path('quotations/', views.QuotationListCreateView.as_view(), name='quotation-list'),
    path('quotations/<uuid:pk>/', views.QuotationDetailView.as_view(), name='quotation-detail'),
]
