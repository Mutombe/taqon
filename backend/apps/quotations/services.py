import logging
from datetime import timedelta
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from .models import Quotation, Invoice, InvoiceItem

logger = logging.getLogger(__name__)


class InvoiceService:
    """Handles invoice creation from various sources."""

    @staticmethod
    def create_from_order(order, created_by=None):
        """
        Generate an invoice from a shop Order.
        """
        ct = ContentType.objects.get_for_model(order)

        # Check if invoice already exists for this order
        existing = Invoice.objects.filter(content_type=ct, object_id=order.pk).first()
        if existing:
            return existing

        invoice = Invoice.objects.create(
            content_type=ct,
            object_id=order.pk,
            customer=order.user,
            customer_name=order.user.get_full_name() or order.user.email,
            customer_email=order.user.email,
            customer_phone=getattr(order.user, 'phone', ''),
            customer_address=order.delivery_address or '',
            subtotal=order.subtotal,
            tax_amount=order.tax_amount,
            discount_amount=order.discount_amount,
            total=order.total,
            amount_paid=order.total if order.payment_status == 'paid' else 0,
            currency=order.currency,
            status='paid' if order.payment_status == 'paid' else 'sent',
            due_date=timezone.now().date() + timedelta(days=14),
            paid_at=timezone.now() if order.payment_status == 'paid' else None,
            created_by=created_by,
        )

        # Create invoice items from order items
        for i, order_item in enumerate(order.items.all()):
            InvoiceItem.objects.create(
                invoice=invoice,
                name=order_item.product_name,
                description=f'SKU: {order_item.product_sku}' if order_item.product_sku else '',
                quantity=order_item.quantity,
                unit_price=order_item.unit_price,
                order=i,
            )

        # Add delivery fee as line item if applicable
        if order.delivery_fee and float(order.delivery_fee) > 0:
            InvoiceItem.objects.create(
                invoice=invoice,
                name='Delivery Fee',
                description=f'{order.delivery_type.title()} delivery',
                quantity=1,
                unit_price=order.delivery_fee,
                order=999,
            )

        return invoice

    @staticmethod
    def create_from_quotation(quotation, created_by=None):
        """
        Generate an invoice from an accepted Quotation.
        """
        ct = ContentType.objects.get_for_model(quotation)

        existing = Invoice.objects.filter(content_type=ct, object_id=quotation.pk).first()
        if existing:
            return existing

        invoice = Invoice.objects.create(
            content_type=ct,
            object_id=quotation.pk,
            customer=quotation.customer,
            customer_name=quotation.customer_name,
            customer_email=quotation.customer_email,
            customer_phone=quotation.customer_phone,
            customer_address=quotation.customer_address,
            subtotal=quotation.subtotal,
            tax_rate=quotation.tax_rate,
            tax_amount=quotation.tax_amount,
            discount_amount=quotation.discount_amount,
            total=quotation.total,
            currency=quotation.currency,
            status='sent',
            due_date=timezone.now().date() + timedelta(days=14),
            created_by=created_by,
        )

        for item in quotation.items.all():
            InvoiceItem.objects.create(
                invoice=invoice,
                name=item.name,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                order=item.order,
            )

        return invoice
