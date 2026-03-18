import logging
from django.conf import settings
from .base import BasePaymentGateway, PaymentResult

logger = logging.getLogger(__name__)


class StripeGateway(BasePaymentGateway):
    """
    Stripe payment gateway for international card payments.

    Uses PaymentIntents for SCA-compliant card payments.
    """

    def __init__(self):
        try:
            import stripe
            self.stripe = stripe
        except ImportError:
            raise ImportError('The stripe package is required. Install it with: pip install stripe')

        self.stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
        self.webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

        if not self.stripe.api_key:
            logger.warning('Stripe secret key not configured — payments will fail.')

    def initiate(
        self,
        reference,
        amount,
        currency='USD',
        method='card',
        email='',
        phone='',
        description='',
        return_url='',
        metadata=None,
    ):
        try:
            # Stripe expects amount in cents
            amount_cents = int(float(amount) * 100)

            intent_params = {
                'amount': amount_cents,
                'currency': currency.lower(),
                'payment_method_types': ['card'],
                'metadata': {
                    'reference': reference,
                    'email': email,
                    **(metadata or {}),
                },
                'description': description or f'Taqon Electrico - {reference}',
                'receipt_email': email or None,
            }

            if return_url:
                intent_params['return_url'] = return_url

            intent = self.stripe.PaymentIntent.create(**intent_params)

            return PaymentResult(
                success=True,
                status='pending',
                gateway_reference=intent.id,
                client_secret=intent.client_secret,
                raw_response={
                    'payment_intent_id': intent.id,
                    'client_secret': intent.client_secret,
                    'status': intent.status,
                },
            )

        except self.stripe.error.StripeError as e:
            logger.error('Stripe initiation error for %s: %s', reference, str(e))
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason=str(e.user_message or e),
            )
        except Exception as e:
            logger.exception('Stripe initiation error for %s', reference)
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason=str(e),
            )

    def verify(self, payment):
        """Retrieve the PaymentIntent from Stripe and check its status."""
        intent_id = payment.stripe_payment_intent_id or payment.gateway_reference

        if not intent_id:
            return PaymentResult(
                success=False,
                status=payment.status,
                failure_reason='No Stripe PaymentIntent ID available.',
            )

        try:
            intent = self.stripe.PaymentIntent.retrieve(intent_id)

            status_map = {
                'succeeded': 'paid',
                'processing': 'processing',
                'requires_payment_method': 'pending',
                'requires_confirmation': 'pending',
                'requires_action': 'pending',
                'canceled': 'cancelled',
                'requires_capture': 'processing',
            }

            mapped_status = status_map.get(intent.status, 'pending')

            return PaymentResult(
                success=mapped_status == 'paid',
                status=mapped_status,
                gateway_reference=intent.id,
                raw_response={
                    'intent_status': intent.status,
                    'amount': intent.amount,
                    'currency': intent.currency,
                },
            )

        except self.stripe.error.StripeError as e:
            logger.error('Stripe verify error for payment %s: %s', payment.reference, str(e))
            return PaymentResult(
                success=False,
                status=payment.status,
                failure_reason=str(e.user_message or e),
            )
        except Exception as e:
            logger.exception('Stripe verify error for payment %s', payment.reference)
            return PaymentResult(
                success=False,
                status=payment.status,
                failure_reason=str(e),
            )

    def handle_webhook(self, payload, headers):
        """
        Process a Stripe webhook event.
        Verifies the signature and extracts payment status.
        """
        sig_header = headers.get('Stripe-Signature', '')

        try:
            if self.webhook_secret and sig_header:
                import json
                raw_payload = json.dumps(payload) if isinstance(payload, dict) else payload
                event = self.stripe.Webhook.construct_event(
                    raw_payload, sig_header, self.webhook_secret,
                )
            else:
                # In dev/test without webhook secret, trust the payload
                event = self.stripe.Event.construct_from(payload, self.stripe.api_key)

            event_type = event.get('type', '')
            data_object = event.get('data', {}).get('object', {})

            intent_id = data_object.get('id', '')
            reference = data_object.get('metadata', {}).get('reference', '')

            status_map = {
                'payment_intent.succeeded': 'paid',
                'payment_intent.payment_failed': 'failed',
                'payment_intent.canceled': 'cancelled',
                'payment_intent.processing': 'processing',
                'charge.refunded': 'refunded',
            }

            mapped_status = status_map.get(event_type, 'pending')
            failure_reason = ''
            if event_type == 'payment_intent.payment_failed':
                last_error = data_object.get('last_payment_error', {})
                failure_reason = last_error.get('message', 'Payment failed')

            return PaymentResult(
                success=mapped_status == 'paid',
                status=mapped_status,
                gateway_reference=intent_id or reference,
                failure_reason=failure_reason,
                raw_response=payload if isinstance(payload, dict) else {},
            )

        except self.stripe.error.SignatureVerificationError:
            logger.error('Stripe webhook signature verification failed')
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason='Invalid webhook signature',
                raw_response=payload if isinstance(payload, dict) else {},
            )
        except Exception as e:
            logger.exception('Stripe webhook processing error')
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason=str(e),
                raw_response=payload if isinstance(payload, dict) else {},
            )
