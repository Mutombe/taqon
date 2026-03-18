from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('password-change/', views.PasswordChangeView.as_view(), name='password-change'),
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('me/avatar/', views.AvatarUploadView.as_view(), name='avatar-upload'),
    path('me/delete/', views.DeleteAccountView.as_view(), name='delete-account'),

    # Google OAuth
    path('google/', views.GoogleLoginView.as_view(), name='google-login'),
    path('google/callback/', views.GoogleCallbackView.as_view(), name='google-callback'),
    path('google/token/', views.GoogleTokenLoginView.as_view(), name='google-token-login'),

    # Address book
    path('me/addresses/', views.SavedAddressListCreateView.as_view(), name='address-list'),
    path('me/addresses/<uuid:id>/', views.SavedAddressDetailView.as_view(), name='address-detail'),
    path('me/addresses/<uuid:id>/default/', views.SetDefaultAddressView.as_view(), name='address-default'),

    # Customer summary
    path('me/summary/', views.CustomerSummaryView.as_view(), name='customer-summary'),
]
