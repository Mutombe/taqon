import logging
from django.conf import settings
from .base import BasePaymentGateway, PaymentResult

logger = logging.getLogger(__name__)

# Mobile money method mapping for Paynow
PAYNOW_MOBILE_METHODS = {
    'ecocash': 'ecocash',
    'onemoney': 'onemoney',
    'innbucks': 'innbucks',
}


class PaynowGateway(BasePaymentGateway):
    """
    Paynow Zimbabwe payment gateway.

    Supports:
    - EcoCash (mobile money)
    - OneMoney (mobile money)
    - InnBucks (mobile money)
    - Bank transfer (web redirect)
    """

    def __init__(self):
        try:
            from paynow import Paynow
        except ImportError:
            raise ImportError('The paynow package is required. Install it with: pip install paynow')

        self.integration_id = getattr(settings, 'PAYNOW_INTEGRATION_ID', '')
        self.integration_key = getattr(settings, 'PAYNOW_INTEGRATION_KEY', '')
        self.return_url = getattr(settings, 'PAYNOW_RETURN_URL', '')
        self.result_url = getattr(settings, 'PAYNOW_RESULT_URL', '')
        # Paynow auth_email — must match the merchant's registered email
        # while the integration is in test mode. Keeping this constant in
        # production is also fine; customer receipts still go through our
        # own email flow, not Paynow's.
        self.merchant_email = getattr(settings, 'PAYNOW_MERCHANT_EMAIL', 'info@taqon.co.zw')

        if not self.integration_id or not self.integration_key:
            logger.warning('Paynow credentials not configured — payments will use sandbox mode.')

        self.client = Paynow(
            self.integration_id or 'sandbox_id',
            self.integration_key or 'sandbox_key',
            self.return_url,
            self.result_url,
        )

    def initiate(
        self,
        reference,
        amount,
        currency='USD',
        method='ecocash',
        email='',
        phone='',
        description='',
        return_url='',
        metadata=None,
    ):
        try:
            # auth_email MUST match the merchant's registered email while
            # the account is in test mode. The customer's actual email is
            # stored separately on our Payment model for receipts.
            payment = self.client.create_payment(reference, self.merchant_email)
            payment.add(description or f'Payment {reference}', float(amount))

            # Mobile money methods require phone number
            if method in PAYNOW_MOBILE_METHODS:
                if not phone:
                    return PaymentResult(
                        success=False,
                        status='failed',
                        failure_reason='Phone number is required for mobile money payments.',
                    )
                response = self.client.send_mobile(payment, phone, PAYNOW_MOBILE_METHODS[method])
            else:
                # Bank transfer / web checkout
                response = self.client.send(payment)

            if response.success:
                return PaymentResult(
                    success=True,
                    status='pending',
                    gateway_reference=str(getattr(response, 'poll_url', '')),
                    redirect_url=getattr(response, 'redirect_url', '') or '',
                    poll_url=getattr(response, 'poll_url', '') or '',
                    raw_response={'instructions': getattr(response, 'instructions', '')},
                )
            else:
                # The Paynow SDK nests the real error message in response.data.error
                # while response.error is often a type reference that stringifies to
                # "<class 'str'>". Dig in for the actual message.
                friendly = None
                try:
                    data = getattr(response, 'data', None) or {}
                    if isinstance(data, dict):
                        friendly = data.get('error')
                except Exception:
                    pass

                if not friendly or isinstance(friendly, type):
                    # Fall back to response.error if data.error wasn't useful
                    raw_error = getattr(response, 'error', None)
                    if raw_error and not isinstance(raw_error, type):
                        friendly = str(raw_error)

                if not friendly or isinstance(friendly, type):
                    if method in PAYNOW_MOBILE_METHODS:
                        friendly = (
                            f'Could not initiate {method.capitalize()} payment. '
                            f'Check that the phone number is valid and that '
                            f'{method.capitalize()} is enabled on the merchant account.'
                        )
                    else:
                        friendly = 'Payment initiation failed. Please try again or contact support.'

                logger.error(
                    'Paynow initiation failed for %s (method=%s): %s (response=%r)',
                    reference, method, friendly,
                    response.__dict__ if hasattr(response, '__dict__') else response,
                )
                return PaymentResult(
                    success=False,
                    status='failed',
                    failure_reason=str(friendly),
                )

        except Exception as e:
            logger.exception('Paynow initiation error for %s', reference)
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason=str(e),
            )

    def verify(self, payment):
        """Poll Paynow for the current payment status."""
        poll_url = payment.paynow_poll_url or payment.gateway_poll_url

        if not poll_url:
            return PaymentResult(
                success=False,
                status=payment.status,
                failure_reason='No poll URL available for this payment.',
            )

        try:
            status_response = self.client.check_transaction_status(poll_url)
            paynow_status = getattr(status_response, 'status', '').lower()

            status_map = {
                'paid': 'paid',
                'awaiting delivery': 'paid',
                'delivered': 'paid',
                'created': 'pending',
                'sent': 'pending',
                'cancelled': 'cancelled',
                'disputed': 'failed',
                'refunded': 'refunded',
            }

            mapped_status = status_map.get(paynow_status, 'pending')

            return PaymentResult(
                success=mapped_status == 'paid',
                status=mapped_status,
                gateway_reference=str(getattr(status_response, 'reference', '')),
                raw_response={
                    'paynow_status': paynow_status,
                    'amount': str(getattr(status_response, 'amount', '')),
                    'reference': str(getattr(status_response, 'reference', '')),
                },
            )

        except Exception as e:
            logger.exception('Paynow verification error for payment %s', payment.reference)
            return PaymentResult(
                success=False,
                status=payment.status,
                failure_reason=str(e),
            )

    def handle_webhook(self, payload, headers):
        """
        Paynow sends result notifications to the result_url.
        The payload contains status and reference info.
        """
        try:
            paynow_status = str(payload.get('status', '')).lower()
            reference = payload.get('reference', '')

            status_map = {
                'paid': 'paid',
                'awaiting delivery': 'paid',
                'delivered': 'paid',
                'created': 'pending',
                'sent': 'pending',
                'cancelled': 'cancelled',
                'disputed': 'failed',
                'refunded': 'refunded',
            }

            mapped_status = status_map.get(paynow_status, 'pending')

            return PaymentResult(
                success=mapped_status == 'paid',
                status=mapped_status,
                gateway_reference=str(reference),
                raw_response=payload,
            )

        except Exception as e:
            logger.exception('Paynow webhook processing error')
            return PaymentResult(
                success=False,
                status='failed',
                failure_reason=str(e),
                raw_response=payload,
            )
