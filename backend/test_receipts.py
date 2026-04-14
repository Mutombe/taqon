"""
End-to-end smoke test for payment receipts.

Uses a dummy Payment + dummy payable (Order or PackageDeposit) in memory
so no DB is touched. Verifies:
  - receipt_context() builds the right fields per payable kind
  - receipt HTML renders without errors
  - PDF renderer produces bytes (PDF on prod, HTML fallback on Windows dev)
  - email body composition includes correct fields

Run from backend/ with venv active:
    python test_receipts.py
"""
import os
import sys
import django
from decimal import Decimal
from unittest.mock import MagicMock

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.template.loader import render_to_string
from django.utils import timezone
from apps.payments.receipts import _build_receipt_context, generate_receipt_pdf


def banner(msg):
    print()
    print('=' * 70)
    print(f' {msg}')
    print('=' * 70)


def check(label, ok):
    tag = '[OK]' if ok else '[XX]'
    print(f'  {tag} {label}')
    return ok


# ---- Mock builders ---------------------------------------------------------

def mock_payment(method='ecocash', gateway='paynow', amount=Decimal('340.00')):
    # Use a plain object so attribute access returns the real values we set
    # (MagicMock auto-generates mocks which break Django's date templatetag).
    class P:
        pass
    p = P()
    p.reference = 'PAY-TEST-42'
    p.gateway = gateway
    p.method = method
    p.amount = amount
    p.currency = 'USD'
    p.status = 'paid'
    p.paid_at = timezone.now()
    p.gateway_reference = 'https://www.paynow.co.zw/Interface/CheckPayment/?guid=abc'
    p.receipt_sent_at = None
    p.get_gateway_display = lambda: gateway.title()
    p.get_method_display = lambda: {
        'ecocash': 'EcoCash', 'onemoney': 'OneMoney', 'innbucks': 'InnBucks',
        'card': 'Card Payment', 'zimswitch': 'ZimSwitch', 'bank_transfer': 'Bank Transfer',
    }.get(method, method)
    class U:
        pass
    u = U()
    u.email = 'buyer@example.com'
    u.first_name = 'Kunda'
    u.last_name = 'Ndoro'
    p.user = u
    return p


def mock_deposit_payment():
    """Payment attached to a PackageDeposit via GFK."""
    from apps.payments.models import PackageDeposit
    deposit = MagicMock(spec=PackageDeposit)
    deposit.package_name = 'Home Luxury 5kVA'
    deposit.package_slug = 'home-luxury-5kva'
    deposit.tier_label = 'Good Fit'
    deposit.inverter_kva = '5'
    deposit.battery_kwh = '10.2'
    deposit.distance_km = Decimal('25')
    deposit.deposit_percent = Decimal('20')
    deposit.deposit_amount = Decimal('340.00')
    deposit.package_total = Decimal('1700.00')
    deposit.customer_name = 'Kunda Ndoro'
    deposit.customer_email = 'kunda@example.com'
    deposit.customer_phone = '+263 77 111 2222'
    deposit.customer_address = '12 Baines Ave, Borrowdale'

    p = mock_payment(method='ecocash', amount=Decimal('340.00'))
    p.content_object = deposit
    return p


def mock_order_payment():
    """
    Payment attached to a shop Order via GFK.
    Uses real Order field names (tax_amount, discount_amount, delivery_fee,
    OrderItem.total_price) so the mock matches production reality — this is
    the class of drift that caused a 500 in prod on PAY-2026-AA823690.
    """
    from apps.shop.models import Order
    order = MagicMock(spec=Order)
    order.order_number = 'TAQ-2026-00042'
    order.delivery_address = '5 Samora Machel Ave'
    order.delivery_city = 'Harare'
    order.delivery_province = 'Harare'
    order.subtotal = Decimal('250.00')
    order.tax_amount = Decimal('37.50')
    order.discount_amount = Decimal('0.00')
    order.delivery_fee = Decimal('15.00')
    order.total = Decimal('302.50')

    item_a = MagicMock(
        product_name='Luxeon 200Ah Battery',
        quantity=1,
        unit_price=Decimal('220.00'),
        total_price=Decimal('220.00'),
        product=MagicMock(short_description='Deep cycle, 12V, sealed'),
    )
    item_b = MagicMock(
        product_name='PWM Solar Charge Controller',
        quantity=2,
        unit_price=Decimal('15.00'),
        total_price=Decimal('30.00'),
        product=MagicMock(short_description='20A, USB out'),
    )
    order.items.all.return_value = [item_a, item_b]

    p = mock_payment(method='card', gateway='paynow', amount=Decimal('302.50'))
    p.content_object = order
    return p


# ---- Run tests -------------------------------------------------------------

def run_deposit():
    banner('DEPOSIT RECEIPT')
    p = mock_deposit_payment()
    ctx = _build_receipt_context(p)

    all_ok = True
    all_ok &= check('kind == deposit', ctx['kind'] == 'deposit')
    all_ok &= check("customer_email from deposit", ctx['customer_email'] == 'kunda@example.com')
    all_ok &= check('has summary line', 'Home Luxury 5kVA' in ctx['summary_line'])
    all_ok &= check('has 1 item', len(ctx['items']) == 1)
    all_ok &= check('item name mentions deposit %', '20%' in ctx['items'][0]['name'])
    all_ok &= check("extra_note mentions full invoice", 'credited' in ctx.get('extra_note', ''))

    html = render_to_string('pdfs/receipt.html', ctx)
    all_ok &= check('HTML renders', len(html) > 1000)
    all_ok &= check('HTML contains PAID stamp', 'Paid' in html and 'paid-stamp' in html)
    all_ok &= check('HTML shows Ref', 'PAY-TEST-42' in html)
    all_ok &= check('HTML shows amount', '340.00' in html)
    all_ok &= check('HTML shows customer name', 'Kunda Ndoro' in html)
    all_ok &= check('HTML shows extra note', 'credited in full' in html)

    pdf_bytes, is_pdf = generate_receipt_pdf(p)
    all_ok &= check(f'PDF generator returns bytes (is_pdf={is_pdf})', len(pdf_bytes) > 1000)

    return all_ok


def run_order():
    banner('ORDER RECEIPT')
    p = mock_order_payment()
    ctx = _build_receipt_context(p)

    all_ok = True
    all_ok &= check('kind == order', ctx['kind'] == 'order')
    all_ok &= check('summary line mentions order number', 'TAQ-2026-00042' in ctx['summary_line'])
    all_ok &= check('has 2 items from order', len(ctx['items']) == 2)
    all_ok &= check('first item is Luxeon battery', ctx['items'][0]['name'] == 'Luxeon 200Ah Battery')
    all_ok &= check('totals include tax', ctx['tax'] == Decimal('37.50'))
    all_ok &= check('shipping present', ctx['shipping'] == Decimal('15.00'))

    html = render_to_string('pdfs/receipt.html', ctx)
    all_ok &= check('HTML renders', len(html) > 1000)
    all_ok &= check('HTML shows both items', 'Luxeon' in html and 'PWM' in html)
    all_ok &= check('HTML shows subtotal', '250.00' in html)
    all_ok &= check('HTML shows tax line', 'Tax' in html and '37.50' in html)
    all_ok &= check('HTML shows shipping', 'Shipping' in html)
    all_ok &= check('HTML shows grand total', '302.50' in html)

    pdf_bytes, is_pdf = generate_receipt_pdf(p)
    all_ok &= check(f'PDF generator returns bytes (is_pdf={is_pdf})', len(pdf_bytes) > 1000)

    # Write artifact to disk for visual inspection
    ext = 'pdf' if is_pdf else 'html'
    out = f'/tmp/receipt-order-sample.{ext}' if os.name != 'nt' else f'receipt-order-sample.{ext}'
    try:
        with open(out, 'wb') as f:
            f.write(pdf_bytes)
        print(f'  Artifact: {out}')
    except Exception:
        pass

    return all_ok


def run_email_composition():
    banner('EMAIL COMPOSITION (DRY RUN)')
    # Point Django at the console email backend so nothing is sent externally
    from django.test.utils import override_settings
    from django.conf import settings as dj_settings
    dj_settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

    from apps.payments.receipts import email_receipt
    from django.core import mail

    p = mock_deposit_payment()
    # email_receipt mutates payment.save — stub it
    p.save = MagicMock()

    mail.outbox = []
    ok_send = email_receipt(p)
    all_ok = True
    all_ok &= check('email_receipt returned True', ok_send is True)
    all_ok &= check('exactly 1 email queued', len(mail.outbox) == 1)
    if mail.outbox:
        m = mail.outbox[0]
        all_ok &= check(f"to = kunda@example.com ({m.to})", m.to == ['kunda@example.com'])
        all_ok &= check('subject mentions reference', 'PAY-TEST-42' in m.subject)
        all_ok &= check('body has amount', '340' in m.body)
        all_ok &= check('body has greeting', 'Kunda' in m.body)
        all_ok &= check('has attachment', len(m.attachments) == 1)
        if m.attachments:
            name, content, mime = m.attachments[0]
            all_ok &= check(f'attachment filename = {name}', 'Taqon-Receipt' in name)
            all_ok &= check(f'attachment mime = {mime}', mime in ('application/pdf', 'text/html'))

    return all_ok


def main():
    results = {
        'Deposit receipt': run_deposit(),
        'Order receipt': run_order(),
        'Email composition': run_email_composition(),
    }
    banner('SUMMARY')
    for name, ok in results.items():
        print(f'  {"PASS" if ok else "FAIL"}  {name}')
    return 0 if all(results.values()) else 1


if __name__ == '__main__':
    sys.exit(main())
