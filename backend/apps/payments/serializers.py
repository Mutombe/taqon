from rest_framework import serializers
from .models import Payment


class InitiatePaymentSerializer(serializers.Serializer):
    """Validate input for starting a new payment."""

    order_number = serializers.CharField(max_length=20)
    method = serializers.ChoiceField(choices=[
        ('ecocash', 'EcoCash'),
        ('onemoney', 'OneMoney'),
        ('innbucks', 'InnBucks'),
        ('bank_transfer', 'Bank Transfer'),
        ('card', 'Card'),
        ('cash', 'Cash'),
    ])
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    return_url = serializers.URLField(required=False, allow_blank=True, default='')

    def validate(self, data):
        mobile_methods = ('ecocash', 'onemoney', 'innbucks')
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
