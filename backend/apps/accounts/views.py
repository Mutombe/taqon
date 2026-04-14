import requests as http_requests

from django.conf import settings
from django.db.models import Sum, Count, Q
from django.shortcuts import redirect
from decimal import Decimal

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from drf_spectacular.utils import extend_schema

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import User, SavedAddress
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    AvatarUploadSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
    SavedAddressSerializer,
    CustomerSummarySerializer,
)
from .services import AuthService


def _get_tokens_for_user(user):
    """Generate JWT token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@extend_schema(tags=['Auth'])
class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_user(serializer.validated_data)
        tokens = _get_tokens_for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'tokens': tokens,
                'message': 'Registration successful. Please verify your email.',
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Auth'])
class LoginView(APIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        AuthService.update_login_info(user, request)
        tokens = _get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })


@extend_schema(tags=['Auth'])
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Token may already be blacklisted
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Auth'])
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, error = AuthService.verify_email(serializer.validated_data['token'])
        if error:
            return Response({'error': error, 'code': 'invalid_token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Email verified successfully.'})


@extend_schema(tags=['Auth'])
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.request_password_reset(serializer.validated_data['email'])
        # Always return success to avoid revealing user existence
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.',
        })


@extend_schema(tags=['Auth'])
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, error = AuthService.confirm_password_reset(
            serializer.validated_data['token'],
            serializer.validated_data['new_password'],
        )
        if error:
            return Response({'error': error, 'code': 'invalid_token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Password reset successful. You can now log in.'})


@extend_schema(tags=['Auth'])
class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Current password is incorrect.', 'code': 'wrong_password'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'message': 'Password changed successfully.'})


@extend_schema(tags=['Auth'])
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


@extend_schema(tags=['Auth'])
class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = AvatarUploadSerializer

    def patch(self, request):
        serializer = AvatarUploadSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


@extend_schema(tags=['Auth'])
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.soft_delete()
        return Response(
            {'message': 'Account deactivated successfully.'},
            status=status.HTTP_200_OK,
        )


# ── Saved Addresses ────────────────────────────────────────────

@extend_schema(tags=['Account'])
class SavedAddressListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SavedAddressSerializer

    def get_queryset(self):
        return SavedAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If first address, make it default
        is_first = not SavedAddress.objects.filter(user=self.request.user).exists()
        serializer.save(user=self.request.user, is_default=is_first or serializer.validated_data.get('is_default', False))


@extend_schema(tags=['Account'])
class SavedAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SavedAddressSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return SavedAddress.objects.filter(user=self.request.user)


@extend_schema(tags=['Account'])
class SetDefaultAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            address = SavedAddress.objects.get(id=id, user=request.user)
        except SavedAddress.DoesNotExist:
            return Response({'detail': 'Address not found.'}, status=status.HTTP_404_NOT_FOUND)
        address.is_default = True
        address.save()
        return Response(SavedAddressSerializer(address).data)


# ── Google OAuth ────────────────────────────────────────────────

GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'


@extend_schema(tags=['Auth'])
class GoogleLoginView(APIView):
    """Initiate Google OAuth — redirect user to Google consent screen.

    The redirect_uri is derived from the frontend's origin when possible
    (so taqon.co.zw, www.taqon.co.zw and taqon.onrender.com each land back
    on their own domain). The computed URI must exactly match one of the
    Authorized Redirect URIs registered in Google Cloud Console — otherwise
    Google responds with 'Error 400: redirect_uri_mismatch'.
    """
    permission_classes = [AllowAny]

    # Domains that are allowed to serve as the Google callback host. Must
    # mirror the Authorized Redirect URIs registered in Google Cloud Console.
    ALLOWED_CALLBACK_HOSTS = {
        'taqon.co.zw',
        'www.taqon.co.zw',
        'taqon.onrender.com',
        'localhost:5173',
        'localhost:5174',
        '127.0.0.1:5173',
    }

    def _pick_redirect_uri(self, request):
        """
        Prefer an explicit redirect_uri from the frontend, then the Origin /
        Referer header, then the FRONTEND_URL setting. Fall back to the
        legacy GOOGLE_OAUTH_REDIRECT_URI env var as a last resort.
        """
        from urllib.parse import urlparse

        explicit = request.query_params.get('redirect_uri')
        if explicit:
            parsed = urlparse(explicit)
            if parsed.netloc in self.ALLOWED_CALLBACK_HOSTS:
                return explicit

        # Derive from Origin header
        origin = request.headers.get('Origin') or request.headers.get('Referer', '')
        if origin:
            parsed = urlparse(origin)
            if parsed.netloc in self.ALLOWED_CALLBACK_HOSTS:
                return f'{parsed.scheme}://{parsed.netloc}/auth/google/callback'

        # Fallback to FRONTEND_URL setting
        frontend = getattr(settings, 'FRONTEND_URL', '')
        if frontend:
            parsed = urlparse(frontend)
            if parsed.netloc in self.ALLOWED_CALLBACK_HOSTS:
                return f'{parsed.scheme}://{parsed.netloc}/auth/google/callback'

        return settings.GOOGLE_OAUTH_REDIRECT_URI

    def get(self, request):
        from urllib.parse import quote

        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        redirect_uri = self._pick_redirect_uri(request)
        scope = 'openid email profile'
        state = request.query_params.get('next', '/')
        url = (
            f'https://accounts.google.com/o/oauth2/v2/auth'
            f'?client_id={client_id}'
            f'&redirect_uri={quote(redirect_uri, safe="")}'
            f'&response_type=code'
            f'&scope={quote(scope)}'
            f'&access_type=offline'
            f'&prompt=consent'
            f'&state={quote(state)}'
        )
        return Response({'url': url, 'redirect_uri': redirect_uri})


@extend_schema(tags=['Auth'])
class GoogleCallbackView(APIView):
    """Legacy server-side callback — kept for backwards compatibility.
    New flow uses GoogleCodeExchangeView (POST) instead."""
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('code')
        error = request.query_params.get('error')
        state = request.query_params.get('state', '/')
        frontend_url = settings.FRONTEND_URL

        if error or not code:
            return redirect(f'{frontend_url}/auth/google/callback?error=google_denied')

        try:
            token_response = http_requests.post(GOOGLE_TOKEN_URL, data={
                'code': code,
                'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
                'redirect_uri': settings.GOOGLE_OAUTH_REDIRECT_URI,
                'grant_type': 'authorization_code',
            })
            token_data = token_response.json()
            if 'error' in token_data:
                return redirect(f'{frontend_url}/auth/google/callback?error=google_token_failed')

            id_info = id_token.verify_oauth2_token(
                token_data['id_token'],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
            email = id_info.get('email', '').lower()
            if not email or not id_info.get('email_verified'):
                return redirect(f'{frontend_url}/auth/google/callback?error=google_email_unverified')

            user = _find_or_create_google_user(id_info)
            if not user.is_active:
                return redirect(f'{frontend_url}/auth/google/callback?error=account_disabled')

            refresh = RefreshToken.for_user(user)
            return redirect(
                f'{frontend_url}/auth/google/callback?'
                f'access={str(refresh.access_token)}'
                f'&refresh={str(refresh)}'
                f'&next={state}'
            )
        except Exception:
            return redirect(f'{frontend_url}/auth/google/callback?error=google_failed')


@extend_schema(tags=['Auth'])
class GoogleCodeExchangeView(APIView):
    """Frontend-redirect flow: frontend receives the Google auth code, POSTs it here.

    Google redirects to the frontend (e.g. www.taqon.co.zw/auth/google/callback?code=...),
    frontend extracts the code and sends it to this endpoint for exchange + user creation.
    Returns JWT tokens as JSON (no redirect).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get('code')
        # The redirect_uri must match exactly what was sent to Google
        redirect_uri = request.data.get('redirect_uri', settings.GOOGLE_OAUTH_REDIRECT_URI)

        if not code:
            return Response({'error': 'Authorization code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Exchange code for Google tokens
            token_response = http_requests.post(GOOGLE_TOKEN_URL, data={
                'code': code,
                'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            })
            token_data = token_response.json()

            if 'error' in token_data:
                return Response(
                    {'error': f'Google token exchange failed: {token_data.get("error_description", token_data["error"])}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify the ID token
            id_info = id_token.verify_oauth2_token(
                token_data['id_token'],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )

            email = id_info.get('email', '').lower()
            if not email or not id_info.get('email_verified'):
                return Response({'error': 'Google email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

            user = _find_or_create_google_user(id_info)

            if not user.is_active:
                return Response({'error': 'This account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

            # Generate JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                },
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
            })

        except Exception as e:
            return Response({'error': f'Google authentication failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


def _find_or_create_google_user(id_info):
    """Shared helper: find or create a user from Google id_info."""
    email = id_info.get('email', '').lower()
    first_name = id_info.get('given_name', '')
    last_name = id_info.get('family_name', '')

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'is_verified': True,
            'role': 'customer',
        },
    )

    if not created:
        updated = False
        if not user.first_name and first_name:
            user.first_name = first_name
            updated = True
        if not user.last_name and last_name:
            user.last_name = last_name
            updated = True
        if not user.is_verified:
            user.is_verified = True
            updated = True
        if updated:
            user.save()

    return user


@extend_schema(tags=['Auth'])
class GoogleTokenLoginView(APIView):
    """Alternative: frontend sends Google ID token directly (popup flow)."""
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response(
                {'error': 'Google credential is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            id_info = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )

            email = id_info.get('email', '').lower()
            if not email or not id_info.get('email_verified'):
                return Response(
                    {'error': 'Google email is not verified.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_verified': True,
                    'role': 'customer',
                },
            )

            if not created:
                updated = False
                if not user.first_name and first_name:
                    user.first_name = first_name
                    updated = True
                if not user.last_name and last_name:
                    user.last_name = last_name
                    updated = True
                if not user.is_verified:
                    user.is_verified = True
                    updated = True
                if updated:
                    user.save()

            if not user.is_active:
                return Response(
                    {'error': 'This account has been deactivated.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

            AuthService.update_login_info(user, request)
            refresh = RefreshToken.for_user(user)

            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'created': created,
            })

        except ValueError:
            return Response(
                {'error': 'Invalid Google token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ── Customer Account Summary ───────────────────────────────────

@extend_schema(tags=['Account'])
class CustomerSummaryView(APIView):
    """Dashboard summary for the customer account portal."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        def _safe_count(module, model_name, **filters):
            try:
                from importlib import import_module
                mod = import_module(module)
                cls = getattr(mod, model_name)
                return cls.objects.filter(**filters).count()
            except Exception:
                return 0

        def _safe_sum(module, model_name, field, **filters):
            try:
                from importlib import import_module
                mod = import_module(module)
                cls = getattr(mod, model_name)
                result = cls.objects.filter(**filters).aggregate(val=Sum(field))
                return result['val'] or Decimal('0')
            except Exception:
                return Decimal('0')

        data = {
            'total_orders': _safe_count('apps.shop.models', 'Order', customer=user),
            'pending_orders': _safe_count('apps.shop.models', 'Order', customer=user, status__in=['pending', 'confirmed', 'processing']),
            'total_spent': _safe_sum('apps.shop.models', 'Order', 'total', customer=user, payment_status='paid'),
            'active_quotations': _safe_count('apps.quotations.models', 'QuotationRequest', customer=user, status__in=['new', 'reviewing']),
            'open_tickets': _safe_count('apps.chatbot.models', 'SupportTicket', customer=user, status__in=['open', 'in_progress', 'waiting_customer', 'waiting_staff']),
            'enrolled_courses': _safe_count('apps.courses.models', 'Enrollment', user=user, status='active'),
            'wishlist_count': _safe_count('apps.shop.models', 'WishlistItem', user=user),
            'saved_addresses': SavedAddress.objects.filter(user=user).count(),
            'unread_notifications': _safe_count('apps.notifications.models', 'Notification', user=user, is_read=False),
        }

        serializer = CustomerSummarySerializer(data)
        return Response(serializer.data)
