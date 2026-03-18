import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings


class AuthService:
    @staticmethod
    def register_user(validated_data):
        """Create user and send verification email."""
        from .models import User
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)
        agreed = validated_data.pop('agreed_to_terms', False)

        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=password,
            agreed_to_terms=agreed,
            agreed_to_terms_at=timezone.now() if agreed else None,
            **validated_data,
        )
        AuthService.send_verification_email(user)
        return user

    @staticmethod
    def send_verification_email(user):
        """Generate token and send verification email."""
        from .models import EmailVerificationToken
        token = secrets.token_urlsafe(48)
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=24),
        )
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        try:
            send_mail(
                subject='Verify your Taqon Electrico account',
                message=f'Click this link to verify your email: {verification_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=render_to_string('emails/verify_email.html', {
                    'user': user,
                    'verification_url': verification_url,
                }),
                fail_silently=True,
            )
        except Exception:
            pass  # Email failures shouldn't block registration

    @staticmethod
    def verify_email(token):
        """Verify user email with token."""
        from .models import EmailVerificationToken
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token)
        except EmailVerificationToken.DoesNotExist:
            return None, 'Invalid verification token.'
        if not token_obj.is_valid():
            return None, 'Token has expired or already been used.'
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])
        token_obj.user.is_verified = True
        token_obj.user.save(update_fields=['is_verified'])
        return token_obj.user, None

    @staticmethod
    def request_password_reset(email):
        """Send password reset email. Returns nothing to avoid revealing user existence."""
        from .models import User, PasswordResetToken
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            return
        token = secrets.token_urlsafe(48)
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1),
        )
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        try:
            send_mail(
                subject='Reset your Taqon Electrico password',
                message=f'Click this link to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=render_to_string('emails/password_reset.html', {
                    'user': user,
                    'reset_url': reset_url,
                }),
                fail_silently=True,
            )
        except Exception:
            pass

    @staticmethod
    def confirm_password_reset(token, new_password):
        """Reset password with token."""
        from .models import PasswordResetToken
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(token=token)
        except PasswordResetToken.DoesNotExist:
            return None, 'Invalid reset token.'
        if not token_obj.is_valid():
            return None, 'Token has expired or already been used.'
        token_obj.is_used = True
        token_obj.save(update_fields=['is_used'])
        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return user, None

    @staticmethod
    def update_login_info(user, request):
        """Update last login IP and activity timestamp."""
        from apps.core.utils import get_client_ip
        ip = get_client_ip(request)
        user.last_login_ip = ip or None
        user.last_activity = timezone.now()
        user.save(update_fields=['last_login_ip', 'last_activity'])
