from rest_framework import serializers
from .models import Payment, PackageDeposit


class InitiatePaymentSerializer(serializers.Serializer):
    """Validate input for starting a new payment."""

    order_number = serializers.CharField(max_length=20)
    # Cash-on-delivery is no longer accepted — all live orders must be
    # settled through an online channel. Historical Payment records with
    # method='cash' still exist in the DB; Payment.METHOD_CHOICES keeps
    # 'cash' so admin reports don't break.
    method = serializers.ChoiceField(choices=[
        ('ecocash', 'EcoCash'),
        ('onemoney', 'OneMoney'),
        ('innbucks', 'InnBucks'),
        ('bank_transfer', 'Bank Transfer'),
        ('zimswitch', 'ZimSwitch'),
        ('card', 'Card'),
    ])
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    return_url = serializers.URLField(required=False, allow_blank=True, default='')

    def validate(self, data):
        # Only ecocash/onemoney push STK to the phone — innbucks is now
        # routed through the web checkout (Paynow test-mode restriction).
        mobile_methods = ('ecocash', 'onemoney')
        if data['method'] in mobile_methods and not data.get('phone'):
            raise serializers.ValidationError({
                'phone': f'Phone number is required for {data["method"]} payments.',
            })
        return data


class PaymentSerializer(serializers.ModelSerializer):
    """Full payment representation for responses."""

    class Meta:
        model = Payment
        fields = [
            'id', 'reference', 'gateway', 'method', 'status',
            'amount', 'currency',
            'gateway_reference', 'gateway_redirect_url',
            'stripe_client_secret',
            'phone_number', 'failure_reason',
            'paid_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PaymentListSerializer(serializers.ModelSerializer):
    """Compact payment representation for list views."""

    class Meta:
        model = Payment
        fields = [
            'id', 'reference', 'gateway', 'method', 'status',
            'amount', 'currency', 'paid_at', 'created_at',
        ]
        read_only_fields = fields


class VerifyPaymentSerializer(serializers.Serializer):
    """Validate input for verifying a payment."""

    reference = serializers.CharField(max_length=50)


class InitiateDepositSerializer(serializers.Serializer):
    """Validate input for initiating a package reservation deposit."""

    package_slug = serializers.CharField(max_length=255)
    tier_label = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    distance_km = serializers.DecimalField(max_digits=8, decimal_places=1, min_value=0, default=10)

    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    customer_address = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')

    method = serializers.ChoiceField(choices=[
        ('ecocash', 'EcoCash'),
        ('onemoney', 'OneMoney'),
        ('innbucks', 'InnBucks'),
        ('bank_transfer', 'Bank Transfer'),
        ('zimswitch', 'ZimSwitch'),
        ('card', 'Card'),
    ])
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    terms_accepted = serializers.BooleanField()

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError('You must accept the terms and conditions to proceed.')
        return value

    def validate(self, data):
        mobile_methods = ('ecocash', 'onemoney')
        if data['method'] in mobile_methods and not data.get('phone'):
            raise serializers.ValidationError({
                'phone': f'Phone number is required for {data["method"]} payments.',
            })
        return data


class PackageDepositSerializer(serializers.ModelSerializer):
    """Full deposit record — used for admin + customer list/detail."""

    user_email = serializers.CharField(source='user.email', read_only=True)
    latest_payment = serializers.SerializerMethodField()

    class Meta:
        model = PackageDeposit
        fields = [
            'id', 'user', 'user_email',
            'package', 'package_name', 'package_slug', 'tier_label',
            'inverter_kva', 'battery_kwh', 'distance_km',
            'package_total', 'deposit_percent', 'deposit_amount', 'currency',
            'customer_name', 'customer_email', 'customer_phone', 'customer_address',
            'terms_version', 'terms_accepted_at', 'terms_accepted_ip',
            'status', 'admin_notes',
            'created_at', 'updated_at',
            'latest_payment',
        ]
        read_only_fields = [
            'id', 'user', 'user_email', 'terms_accepted_at', 'terms_accepted_ip',
            'created_at', 'updated_at', 'latest_payment',
        ]

    def get_latest_payment(self, obj):
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get_for_model(PackageDeposit)
        payment = Payment.objects.filter(content_type=ct, object_id=obj.id).order_by('-created_at').first()
        if not payment:
            return None
        return {
            'reference': payment.reference,
            'status': payment.status,
            'gateway': payment.gateway,
            'method': payment.method,
            'gateway_redirect_url': payment.gateway_redirect_url,
            'paid_at': payment.paid_at,
        }
