from django.urls import path
from . import views

app_name = 'support'

urlpatterns = [
    # ── Public — FAQ & Chatbot ──────────────────────────────────────
    path('faq/', views.FAQListView.as_view(), name='faq-list'),
    path('faq/categories/', views.FAQCategoriesView.as_view(), name='faq-categories'),
    path('faq/<uuid:faq_id>/feedback/', views.FAQFeedbackView.as_view(), name='faq-feedback'),
    path('chat/', views.ChatBotView.as_view(), name='chatbot'),
    path('chat/history/', views.ChatHistoryView.as_view(), name='chat-history'),

    # ── Authenticated — Customer Tickets ────────────────────────────
    path('tickets/', views.MyTicketsView.as_view(), name='my-tickets'),
    path('tickets/create/', views.CreateTicketView.as_view(), name='create-ticket'),
    path('tickets/<str:ticket_number>/', views.TicketDetailView.as_view(), name='ticket-detail'),
    path('tickets/<str:ticket_number>/reply/', views.TicketReplyView.as_view(), name='ticket-reply'),
    path('tickets/<str:ticket_number>/satisfaction/', views.TicketSatisfactionView.as_view(), name='ticket-satisfaction'),

    # ── Admin ───────────────────────────────────────────────────────
    path('admin/tickets/', views.AdminTicketListView.as_view(), name='admin-ticket-list'),
    path('admin/tickets/stats/', views.AdminTicketStatsView.as_view(), name='admin-ticket-stats'),
    path('admin/tickets/<str:ticket_number>/', views.AdminTicketDetailView.as_view(), name='admin-ticket-detail'),
    path('admin/tickets/<str:ticket_number>/assign/', views.AdminAssignTicketView.as_view(), name='admin-assign-ticket'),
    path('admin/tickets/<str:ticket_number>/status/', views.AdminUpdateTicketStatusView.as_view(), name='admin-ticket-status'),
    path('admin/faq/', views.AdminFAQListView.as_view(), name='admin-faq-list'),
    path('admin/faq/<uuid:faq_id>/', views.AdminFAQDetailView.as_view(), name='admin-faq-detail'),
]
