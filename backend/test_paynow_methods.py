"""
End-to-end smoke test for every Paynow payment method we expose.
Uses Paynow's documented test phone numbers so nothing is actually charged.

Run from backend/ with an activated venv:
    python test_paynow_methods.py
"""
import os
import sys
import django
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from apps.payments.gateways.paynow_gateway import PaynowGateway, PAYNOW_MOBILE_METHODS, PAYNOW_WEB_METHODS
from django.conf import settings


def banner(msg):
    print()
    print('=' * 70)
    print(f' {msg}')
    print('=' * 70)


def check(label, value, ok_fn):
    status = 'PASS' if ok_fn(value) else 'FAIL'
    tag = '[OK]' if status == 'PASS' else '[XX]'
    print(f'  {tag} {label}: {value!r}')
    return status == 'PASS'


def run_method(method, phone=None):
    banner(f'METHOD: {method}' + (f'  (phone={phone})' if phone else ''))

    gateway = PaynowGateway()
    ref = f'TEST-{method.upper()}-{os.getpid()}'

    result = gateway.initiate(
        reference=ref,
        amount=10.00,
        currency='USD',
        method=method,
        email='test@taqon.co.zw',
        phone=phone or '',
        description=f'Smoke test {method}',
        return_url=settings.PAYNOW_RETURN_URL,
    )

    print(f'  PaymentResult.success         = {result.success}')
    print(f'  PaymentResult.status          = {result.status}')
    print(f'  PaymentResult.gateway_reference = {str(result.gateway_reference)[:80]}')
    print(f'  PaymentResult.redirect_url    = {str(result.redirect_url)[:100]}')
    print(f'  PaymentResult.poll_url        = {str(result.poll_url)[:100]}')
    print(f'  PaymentResult.failure_reason  = {result.failure_reason!r}')
    print()

    all_ok = True
    if method in PAYNOW_WEB_METHODS:
        all_ok &= check('Must be success=True', result.success, lambda v: v is True)
        all_ok &= check('Must return http(s) redirect_url', result.redirect_url,
                        lambda v: isinstance(v, str) and v.startswith(('http://', 'https://')))
        all_ok &= check('redirect_url is NOT "<class \'str\'>"', result.redirect_url,
                        lambda v: "<class" not in str(v))
    elif method in PAYNOW_MOBILE_METHODS:
        all_ok &= check('Must be success=True', result.success, lambda v: v is True)
        all_ok &= check('Must return poll_url starting with http(s)', result.poll_url,
                        lambda v: isinstance(v, str) and v.startswith(('http://', 'https://')))
        all_ok &= check('poll_url is NOT "<class \'str\'>"', result.poll_url,
                        lambda v: "<class" not in str(v))

    return all_ok


def main():
    print()
    print('Paynow integration smoke test')
    print(f'  Integration ID set?  {bool(settings.PAYNOW_INTEGRATION_ID)}  (len={len(settings.PAYNOW_INTEGRATION_ID)})')
    print(f'  Integration key set? {bool(settings.PAYNOW_INTEGRATION_KEY)} (len={len(settings.PAYNOW_INTEGRATION_KEY)})')
    print(f'  Return URL:  {settings.PAYNOW_RETURN_URL}')
    print(f'  Result URL:  {settings.PAYNOW_RESULT_URL}')
    print(f'  Merchant email: {settings.PAYNOW_MERCHANT_EMAIL}')

    # Web methods — no phone needed, Paynow's hosted page handles it
    # (InnBucks is here too — Paynow rejects remote InnBucks for test-mode IDs)
    results = {}
    for m in ['card', 'zimswitch', 'bank_transfer', 'innbucks']:
        results[m] = run_method(m)

    # Mobile money — use Paynow test phone number 0771111111 (documented: Success in 5s)
    for m in ['ecocash', 'onemoney']:
        results[m] = run_method(m, phone='0771111111')

    banner('SUMMARY')
    for method, ok in results.items():
        print(f'  {"PASS" if ok else "FAIL"}  {method}')


if __name__ == '__main__':
    main()
