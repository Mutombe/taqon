from django.urls import path
from . import views

urlpatterns = [
    # Public: Submit quote request
    path('request/', views.SubmitQuoteRequestView.as_view(), name='submit-quote-request'),

    # Customer: My quote requests
    path('requests/mine/', views.MyQuoteRequestsView.as_view(), name='my-quote-requests'),
    path('requests/<uuid:pk>/', views.QuoteRequestDetailView.as_view(), name='quote-request-detail'),

    # Customer: My quotations
    path('mine/', views.MyQuotationsView.as_view(), name='my-quotations'),
    path('<str:quotation_number>/', views.QuotationDetailView.as_view(), name='quotation-detail'),
    path('<str:quotation_number>/respond/', views.QuotationRespondView.as_view(), name='quotation-respond'),
    path('<str:quotation_number>/pdf/', views.QuotationDownloadPDFView.as_view(), name='quotation-pdf'),

    # Customer: My invoices
    path('invoices/mine/', views.MyInvoicesView.as_view(), name='my-invoices'),
    path('invoices/<str:invoice_number>/', views.InvoiceDetailView.as_view(), name='invoice-detail'),
    path('invoices/<str:invoice_number>/pdf/', views.InvoiceDownloadPDFView.as_view(), name='invoice-pdf'),

    # Admin: Quote requests
    path('admin/requests/', views.AdminQuoteRequestListView.as_view(), name='admin-quote-requests'),
    path('admin/requests/<uuid:pk>/', views.AdminQuoteRequestUpdateView.as_view(), name='admin-quote-request-update'),

    # Admin: Quotations
    path('admin/quotations/', views.AdminQuotationListView.as_view(), name='admin-quotations'),
    path('admin/quotations/create/', views.AdminQuotationCreateView.as_view(), name='admin-quotation-create'),
    path('admin/quotations/<str:quotation_number>/add-item/', views.AdminQuotationAddItemView.as_view(), name='admin-quotation-add-item'),
    path('admin/quotations/<str:quotation_number>/send/', views.AdminQuotationSendView.as_view(), name='admin-quotation-send'),

    # Admin: Invoices
    path('admin/invoices/', views.AdminInvoiceListView.as_view(), name='admin-invoices'),
    path('admin/invoices/from-order/<str:order_number>/', views.AdminGenerateOrderInvoiceView.as_view(), name='admin-invoice-from-order'),
]
