"""
Payment receipts — PDF render + email delivery.

Works uniformly for shop Orders and PackageDeposits, using the Payment
object's GenericForeignKey to pull the right snapshot data.
"""
import base64
import logging
import os
from io import BytesIO

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


def _logo_data_uri():
    """Embed the Taqon logo as base64 so the PDF is portable."""
    try:
        logo_path = os.path.join(
            settings.BASE_DIR, 'apps', 'quotations', 'static',
            'pdf_assets', 'taqon-electrico-logo.jpg',
        )
        with open(logo_path, 'rb') as f:
            return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('ascii')
    except Exception:
        return ''


def _build_receipt_context(payment):
    """
    Pull everything the receipt template needs, regardless of whether the
    payable is an Order or a PackageDeposit.
    """
    from apps.shop.models import Order
    from .models import PackageDeposit

    payable = payment.content_object
    ctx = {
        'logo_data_uri': _logo_data_uri(),
        'payment': payment,
        'receipt_number': f'RCP-{payment.reference}',
        'issued_at': timezone.now(),
        'gateway_label': payment.get_gateway_display(),
        'method_label': payment.get_method_display(),
        'customer_name': '',
        'customer_email': payment.user.email if payment.user else '',
        'customer_phone': '',
        'customer_address': '',
        'items': [],        # rows: {name, description, quantity, unit_price, total}
        'subtotal': None,
        'tax': None,
        'discount': None,
        'shipping': None,
        'total': payment.amount,
        'currency': payment.currency,
        'summary_line': '',   # short one-liner under the header
        'kind': 'generic',
    }

    if isinstance(payable, Order):
        ctx['kind'] = 'order'
        ctx['summary_line'] = f'Order {payable.order_number}'
        user = payment.user
        ctx['customer_name'] = (
            f'{user.first_name} {user.last_name}'.strip()
            if user else ''
        ) or (user.email if user else '')
        ctx['customer_email'] = user.email if user else ''
        # Order has no phone field — best-effort pull from user profile if present
        ctx['customer_phone'] = getattr(user, 'phone', '') or getattr(user, 'phone_number', '') or ''
        ctx['customer_address'] = ', '.join(filter(None, [
            getattr(payable, 'delivery_address', ''),
            getattr(payable, 'delivery_city', ''),
            getattr(payable, 'delivery_province', ''),
        ])) or ''
        for item in payable.items.all():
            try:
                product_desc = item.product.short_description if item.product else ''
            except Exception:
                product_desc = ''
            ctx['items'].append({
                'name': item.product_name or (item.product.name if item.product else 'Item'),
                'description': product_desc,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'total': item.total_price,
            })
        ctx['subtotal'] = payable.subtotal
        ctx['tax'] = payable.tax_amount
        ctx['discount'] = payable.discount_amount
        ctx['shipping'] = payable.delivery_fee
        ctx['total'] = payable.total
    elif isinstance(payable, PackageDeposit):
        ctx['kind'] = 'deposit'
        tier_bit = f' · {payable.tier_label}' if payable.tier_label else ''
        ctx['summary_line'] = f'Reservation deposit for {payable.package_name}{tier_bit}'
        ctx['customer_name'] = payable.customer_name
        ctx['customer_email'] = payable.customer_email
        ctx['customer_phone'] = payable.customer_phone
        ctx['customer_address'] = payable.customer_address
        ctx['items'].append({
            'name': f'{payable.package_name} — reservation deposit ({payable.deposit_percent}%)',
            'description': (
                (f'{payable.inverter_kva}kVA inverter · ' if payable.inverter_kva else '')
                + (f'{payable.battery_kwh}kWh battery · ' if payable.battery_kwh else '')
                + (f'{payable.distance_km}km from Harare' if payable.distance_km else '')
            ).rstrip(' ·'),
            'quantity': 1,
            'unit_price': payable.deposit_amount,
            'total': payable.deposit_amount,
        })
        ctx['subtotal'] = payable.deposit_amount
        ctx['total'] = payable.deposit_amount
        ctx['extra_note'] = (
            f'This deposit ({payable.deposit_percent}%) will be credited in full toward the '
            f'final invoice of USD {payable.package_total:,.2f} once installation is confirmed.'
        )
    else:
        ctx['summary_line'] = f'Payment {payment.reference}'
        ctx['items'].append({
            'name': f'Payment {payment.reference}',
            'description': '',
            'quantity': 1,
            'unit_price': payment.amount,
            'total': payment.amount,
        })

    return ctx


def generate_receipt_pdf(payment):
    """
    Render the receipt HTML and convert to PDF bytes. Returns (pdf_bytes, is_pdf).
    Falls back to raw HTML bytes if PDF engines aren't available (is_pdf=False).
    """
    context = _build_receipt_context(payment)
    html_string = render_to_string('pdfs/receipt.html', context)

    from apps.quotations.pdf import _render_pdf
    try:
        pdf_bytes = _render_pdf(html_string)
        is_pdf = pdf_bytes[:4] == b'%PDF'
        return pdf_bytes, is_pdf
    except Exception:
        logger.exception('Receipt PDF render failed — falling back to HTML for %s', payment.reference)
        return html_string.encode('utf-8'), False


def email_receipt(payment):
    """
    Send the receipt as a PDF attachment to the customer's email.
    Idempotent: marks payment.receipt_sent_at so we don't double-send.
    """
    if payment.receipt_sent_at:
        logger.info('Receipt already sent for %s at %s', payment.reference, payment.receipt_sent_at)
        return True

    ctx = _build_receipt_context(payment)
    to_email = ctx['customer_email']
    if not to_email:
        logger.warning('No email address for payment %s — skipping receipt mail', payment.reference)
        return False

    try:
        pdf_bytes, is_pdf = generate_receipt_pdf(payment)
    except Exception:
        logger.exception('Could not render receipt for %s', payment.reference)
        return False

    ext = 'pdf' if is_pdf else 'html'
    mime = 'application/pdf' if is_pdf else 'text/html'
    filename = f'Taqon-Receipt-{payment.reference}.{ext}'

    subject = f'Receipt for your Taqon payment · {payment.reference}'
    body_text = (
        f"Hi {ctx['customer_name'] or 'there'},\n\n"
        f"Thank you — we've received your payment of "
        f"{payment.currency} {payment.amount:,.2f}.\n\n"
        f"Summary: {ctx['summary_line']}\n"
        f"Receipt number: {ctx['receipt_number']}\n"
        f"Paid via: {ctx['method_label']}\n\n"
        "Your receipt is attached as a PDF for your records.\n\n"
        "— The Taqon Electrico team\n"
        "203 Sherwood Drive, Strathaven, Harare\n"
        "+263 77 277 1036 · info@taqon.co.zw · www.taqon.co.zw\n"
    )

    try:
        email = EmailMessage(
            subject=subject,
            body=body_text,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@taqon.co.zw'),
            to=[to_email],
        )
        email.attach(filename, pdf_bytes, mime)
        email.send(fail_silently=False)

        payment.receipt_sent_at = timezone.now()
        payment.save(update_fields=['receipt_sent_at', 'updated_at'])
        logger.info('Receipt emailed for %s to %s', payment.reference, to_email)
        return True
    except Exception:
        logger.exception('Failed to send receipt email for %s to %s', payment.reference, to_email)
        return False
