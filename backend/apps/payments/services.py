import logging
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from apps.core.utils import generate_reference
from .models import Payment, PaymentWebhookLog
from .gateways import PaynowGateway, StripeGateway

logger = logging.getLogger(__name__)

# Gateway method routing
GATEWAY_FOR_METHOD = {
    'ecocash': 'paynow',
    'onemoney': 'paynow',
    'innbucks': 'paynow',
    'bank_transfer': 'paynow',
    'card': 'stripe',
    'cash': 'cash',
}


def _get_gateway(gateway_name):
    """Return an instantiated gateway by name."""
    if gateway_name == 'paynow':
        return PaynowGateway()
    elif gateway_name == 'stripe':
        return StripeGateway()
    elif gateway_name == 'cash':
        return None
    raise ValueError(f'Unknown gateway: {gateway_name}')


class PaymentService:
    """Orchestrates payment creation, verification, and webhook handling."""

    @staticmethod
    def initiate_payment(
        payable_object,
        user,
        amount,
        method,
        currency='USD',
        phone='',
        description='',
        return_url='',
        ip_address=None,
        metadata=None,
    ):
        """
        Create a Payment record and initiate it with the appropriate gateway.
        Returns (payment, error_message).
        """
        gateway_name = GATEWAY_FOR_METHOD.get(method)
        if not gateway_name:
            return None, f'Unsupported payment method: {method}'

        reference = generate_reference('PAY')
        ct = ContentType.objects.get_for_model(payable_object)

        payment = Payment.objects.create(
            content_type=ct,
            object_id=payable_object.pk,
            user=user,
            reference=reference,
            gateway=gateway_name,
            method=method,
            amount=amount,
            currency=currency,
            phone_number=phone,
            ip_address=ip_address,
            metadata=metadata or {},
        )

        # Cash payments are confirmed immediately
        if gateway_name == 'cash':
            payment.status = 'pending'
            payment.save(update_fields=['status'])
            return payment, None

        try:
            gateway = _get_gateway(gateway_name)
            result = gateway.initiate(
                reference=reference,
                amount=float(amount),
                currency=currency,
                method=method,
                email=user.email,
                phone=phone,
                description=description,
                return_url=return_url,
                metadata=metadata,
            )

            if result.success:
                # Guard: only treat redirect_url as real if it's an http(s) URL.
                # Some SDK quirks leave non-URL strings there.
                redirect_url = result.redirect_url or ''
                if not redirect_url.startswith(('http://', 'https://')):
                    redirect_url = ''

                payment.status = 'awaiting_redirect' if redirect_url else 'pending'
                payment.gateway_reference = result.gateway_reference
                payment.gateway_redirect_url = redirect_url
                payment.gateway_poll_url = result.poll_url

                if gateway_name == 'paynow':
                    payment.paynow_poll_url = result.poll_url

                if gateway_name == 'stripe':
                    payment.stripe_payment_intent_id = result.gateway_reference
                    payment.stripe_client_secret = result.client_secret

                # Defensive: only store JSON-serializable values in metadata
                if isinstance(result.raw_response, dict):
                    import json
                    for k, v in result.raw_response.items():
                        try:
                            json.dumps(v)
                            payment.metadata[k] = v
                        except (TypeError, ValueError):
                            payment.metadata[k] = str(v)
                payment.save()
                return payment, None
            else:
                payment.status = 'failed'
                payment.failure_reason = result.failure_reason
                payment.save(update_fields=['status', 'failure_reason'])
                return payment, result.failure_reason

        except Exception as e:
            logger.exception('Payment initiation failed for %s', reference)
            payment.status = 'failed'
            payment.failure_reason = str(e)
            payment.save(update_fields=['status', 'failure_reason'])
            return payment, str(e)

    @staticmethod
    def verify_payment(payment):
        """
        Poll the gateway for the current payment status.
        Updates the Payment record and related payable if paid.
        Returns (payment, error_message).
        """
        if payment.gateway == 'cash':
            return payment, None

        if payment.status in ('paid', 'refunded', 'cancelled'):
            return payment, None

        try:
            gateway = _get_gateway(payment.gateway)
            result = gateway.verify(payment)

            old_status = payment.status
            payment.status = result.status

            if result.gateway_reference:
                payment.gateway_reference = result.gateway_reference

            if result.status == 'paid' and old_status != 'paid':
                payment.paid_at = timezone.now()
                PaymentService._mark_payable_paid(payment)

            if result.failure_reason:
                payment.failure_reason = result.failure_reason

            payment.save()
            return payment, None

        except Exception as e:
            logger.exception('Payment verification failed for %s', payment.reference)
            return payment, str(e)

    @staticmethod
    def process_webhook(gateway_name, payload, headers, ip_address=None):
        """
        Process an incoming webhook from a payment gateway.
        Logs the webhook and updates the associated payment.
        Returns (payment_or_none, error_message).
        """
        # Log the webhook
        webhook_log = PaymentWebhookLog.objects.create(
            gateway=gateway_name,
            event_type=payload.get('type', payload.get('status', '')),
            payment_reference=payload.get('reference', payload.get('data', {}).get('object', {}).get('metadata', {}).get('reference', '')),
            raw_payload=payload,
            headers=dict(headers) if headers else {},
            ip_address=ip_address,
        )

        try:
            gateway = _get_gateway(gateway_name)
            if not gateway:
                webhook_log.processing_error = f'No gateway handler for {gateway_name}'
                webhook_log.save(update_fields=['processing_error'])
                return None, f'No gateway handler for {gateway_name}'

            result = gateway.handle_webhook(payload, headers)

            # Find the associated payment
            payment = PaymentService._find_payment(gateway_name, result, payload)
            if not payment:
                webhook_log.processing_error = 'Could not find associated payment'
                webhook_log.save(update_fields=['processing_error'])
                return None, 'Payment not found for webhook'

            old_status = payment.status
            payment.status = result.status

            if result.gateway_reference:
                payment.gateway_reference = result.gateway_reference

            if result.status == 'paid' and old_status != 'paid':
                payment.paid_at = timezone.now()
                PaymentService._mark_payable_paid(payment)

            if result.failure_reason:
                payment.failure_reason = result.failure_reason

            payment.save()

            webhook_log.processed = True
            webhook_log.save(update_fields=['processed'])

            return payment, None

        except Exception as e:
            logger.exception('Webhook processing error for %s', gateway_name)
            webhook_log.processing_error = str(e)
            webhook_log.save(update_fields=['processing_error'])
            return None, str(e)

    @staticmethod
    def _find_payment(gateway_name, result, payload):
        """Locate the Payment record from gateway result or webhook payload."""
        # Try by reference from metadata
        reference = payload.get('reference', '')
        if not reference and gateway_name == 'stripe':
            reference = payload.get('data', {}).get('object', {}).get('metadata', {}).get('reference', '')

        if reference:
            try:
                return Payment.objects.get(reference=reference)
            except Payment.DoesNotExist:
                pass

        # Try by gateway reference
        if result.gateway_reference:
            filters = {'gateway': gateway_name}
            if gateway_name == 'stripe':
                filters['stripe_payment_intent_id'] = result.gateway_reference
            else:
                filters['gateway_reference'] = result.gateway_reference

            payment = Payment.objects.filter(**filters).first()
            if payment:
                return payment

        return None

    @staticmethod
    def _mark_payable_paid(payment):
        """Update the related payable object (e.g., Order) when payment succeeds."""
        payable = payment.content_object
        if not payable:
            return

        # If the payable is an Order, update its payment status
        from apps.shop.models import Order, OrderStatusHistory

        if isinstance(payable, Order):
            payable.payment_status = 'paid'
            payable.status = 'confirmed'
            payable.payment_method = payment.method
            payable.save(update_fields=['payment_status', 'status', 'payment_method', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=payable,
                old_status='pending',
                new_status='confirmed',
                notes=f'Payment received via {payment.gateway} ({payment.method}). Ref: {payment.reference}',
            )
