from django.urls import path
from . import views

urlpatterns = [
    # Customer endpoints
    path('initiate/', views.InitiatePaymentView.as_view(), name='payment-initiate'),
    path('verify/', views.VerifyPaymentView.as_view(), name='payment-verify'),
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),
    path('<str:reference>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('order/<str:order_number>/', views.OrderPaymentsView.as_view(), name='order-payments'),

    # Webhooks (unauthenticated)
    path('webhook/paynow/', views.PaynowWebhookView.as_view(), name='paynow-webhook'),
    path('webhook/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]
