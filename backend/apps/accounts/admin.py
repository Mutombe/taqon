from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmailVerificationToken, PasswordResetToken, SavedAddress


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'account_type', 'province', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number', 'company_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': (
            'first_name', 'last_name', 'phone_number', 'date_of_birth', 'avatar',
        )}),
        ('Address', {'fields': ('address', 'city', 'province')}),
        ('Business', {'fields': ('company_name', 'account_type')}),
        ('Platform', {'fields': ('role', 'is_verified', 'is_phone_verified')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Terms', {'fields': ('agreed_to_terms', 'agreed_to_terms_at')}),
        ('Tracking', {'fields': ('last_login', 'last_activity', 'last_login_ip', 'is_deleted', 'deleted_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )


class SavedAddressInline(admin.TabularInline):
    model = SavedAddress
    extra = 0
    fields = ['label', 'recipient_name', 'address_line', 'city', 'province', 'is_default']


@admin.register(SavedAddress)
class SavedAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'label', 'address_line', 'city', 'province', 'is_default', 'created_at']
    list_filter = ['province', 'is_default']
    search_fields = ['user__email', 'recipient_name', 'address_line']


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used']
    search_fields = ['user__email']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used']
    search_fields = ['user__email']
