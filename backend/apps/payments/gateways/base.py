from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PaymentResult:
    """Standardised result returned by every gateway."""

    success: bool
    status: str  # pending, paid, failed, cancelled, processing
    gateway_reference: str = ''
    redirect_url: str = ''
    poll_url: str = ''
    client_secret: str = ''  # Stripe-specific
    failure_reason: str = ''
    raw_response: dict = field(default_factory=dict)


class BasePaymentGateway(ABC):
    """Interface that every payment gateway must implement."""

    @abstractmethod
    def initiate(
        self,
        reference: str,
        amount: float,
        currency: str,
        method: str,
        email: str,
        phone: str = '',
        description: str = '',
        return_url: str = '',
        metadata: Optional[dict] = None,
    ) -> PaymentResult:
        """Start a new payment. Returns a PaymentResult."""
        ...

    @abstractmethod
    def verify(self, payment) -> PaymentResult:
        """Check the current status of a payment with the gateway."""
        ...

    @abstractmethod
    def handle_webhook(self, payload: dict, headers: dict) -> PaymentResult:
        """Process an incoming webhook and return the result."""
        ...
