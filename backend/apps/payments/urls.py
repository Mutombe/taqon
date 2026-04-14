from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('initiate/', views.InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', views.VerifyPaymentView.as_view(), name='payment-verify'),
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),

    # Package deposits — customer
    path('deposits/initiate/', views.InitiateDepositView.as_view(), name='deposit-initiate'),
    path('deposits/mine/', views.MyDepositsView.as_view(), name='deposit-mine'),
    path('deposits/<uuid:deposit_id>/', views.DepositDetailView.as_view(), name='deposit-detail'),

    # Package deposits — admin
    path('admin/deposits/', views.AdminDepositListView.as_view(), name='admin-deposit-list'),
    path('admin/deposits/<uuid:deposit_id>/', views.AdminDepositDetailView.as_view(), name='admin-deposit-detail'),

    path('<str:reference>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('<str:reference>/receipt/', views.PaymentReceiptView.as_view(), name='payment-receipt'),
    path('order/<str:order_number>/', views.OrderPaymentsView.as_view(), name='order-payments'),

    # Webhooks (unauthenticated)
    path('webhook/paynow/', views.PaynowWebhookView.as_view(), name='paynow-webhook'),
    path('webhook/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]
