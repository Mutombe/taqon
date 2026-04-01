import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, SavedAddress


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'phone_number', 'account_type', 'agreed_to_terms',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered. Try logging in or use "Forgot password".')
        return value.lower()

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+263[0-9]{9}$', value):
            raise serializers.ValidationError(
                'Phone number must be in Zimbabwe format: +263XXXXXXXXX'
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_agreed_to_terms(self, value):
        if not value:
            raise serializers.ValidationError('You must agree to the terms and conditions.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')

        # Check if user exists first for specific error messages
        try:
            user_exists = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('No account found with this email address.')

        if not user_exists.is_active:
            raise serializers.ValidationError('This account has been deactivated. Please contact support.')

        if not user_exists.is_verified:
            raise serializers.ValidationError('Please verify your email address. Check your inbox for the verification link.')

        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError('Incorrect password. Please try again or use "Forgot password" to reset it.')

        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'avatar', 'is_verified', 'is_phone_verified',
            'date_of_birth', 'address', 'city', 'province',
            'company_name', 'account_type', 'created_at', 'last_activity',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'is_phone_verified', 'created_at', 'last_activity']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'address', 'city', 'province', 'company_name', 'account_type',
        ]

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+263[0-9]{9}$', value):
            raise serializers.ValidationError(
                'Phone number must be in Zimbabwe format: +263XXXXXXXXX'
            )
        return value


class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['avatar']

    def validate_avatar(self, value):
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError('Avatar file size must be under 5MB.')
        if not value.content_type.startswith('image/'):
            raise serializers.ValidationError('File must be an image.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = [
            'id', 'label', 'recipient_name', 'phone_number',
            'address_line', 'city', 'province', 'postal_code',
            'is_default', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerSummarySerializer(serializers.Serializer):
    """Summary stats for the customer account portal."""
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_quotations = serializers.IntegerField()
    open_tickets = serializers.IntegerField()
    enrolled_courses = serializers.IntegerField()
    wishlist_count = serializers.IntegerField()
    saved_addresses = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token
