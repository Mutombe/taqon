"""
Shared constants for the Taqon Electrico platform.
"""
import os

# ── Internal / test accounts ──────────────────────────────────────────
# Activity from these accounts (quote downloads, inquiries, advisor
# sessions) is NOT recorded, so admin testing does not pollute the
# customer analytics. Extend at runtime without a deploy via the
# INTERNAL_TEST_EMAILS env var (comma-separated).
INTERNAL_TEST_EMAILS = frozenset({
    'admin@taqon.co.zw',
    'smutombe98@gmail.com',
    'simbarashemutombe1@gmail.com',
    'publish@bgfi.global',
    'mcdonaldmatiki@gmail.com',
})


def _internal_email_set():
    extra = {
        e.strip().lower()
        for e in os.environ.get('INTERNAL_TEST_EMAILS', '').split(',')
        if e.strip()
    }
    return INTERNAL_TEST_EMAILS | extra


def is_internal_email(email):
    """True if the given email belongs to an internal / test account."""
    if not email:
        return False
    return email.strip().lower() in _internal_email_set()


def is_internal_actor(request=None, email=None):
    """True if this request/email is internal testing and should not be
    recorded. Matches on the supplied email and, when present, the
    authenticated user's email (covers logged-in admin testing on public
    endpoints)."""
    if is_internal_email(email):
        return True
    user = getattr(request, 'user', None) if request is not None else None
    if user is not None and getattr(user, 'is_authenticated', False):
        return is_internal_email(getattr(user, 'email', ''))
    return False


ZIMBABWE_PROVINCES = [
    ('harare', 'Harare'),
    ('bulawayo', 'Bulawayo'),
    ('manicaland', 'Manicaland'),
    ('mashonaland_central', 'Mashonaland Central'),
    ('mashonaland_east', 'Mashonaland East'),
    ('mashonaland_west', 'Mashonaland West'),
    ('masvingo', 'Masvingo'),
    ('matabeleland_north', 'Matabeleland North'),
    ('matabeleland_south', 'Matabeleland South'),
    ('midlands', 'Midlands'),
]

USER_ROLES = [
    ('customer', 'Customer'),
    ('technician', 'Technician'),
    ('admin', 'Admin'),
    ('superadmin', 'Super Admin'),
]

ACCOUNT_TYPES = [
    ('individual', 'Individual'),
    ('business', 'Business'),
]

CURRENCIES = [
    ('USD', 'US Dollar'),
    ('ZWG', 'Zimbabwe Gold'),
]

ORDER_STATUSES = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('processing', 'Processing'),
    ('ready_for_delivery', 'Ready for Delivery'),
    ('out_for_delivery', 'Out for Delivery'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
    ('refunded', 'Refunded'),
]

PAYMENT_STATUSES = [
    ('unpaid', 'Unpaid'),
    ('pending', 'Pending'),
    ('paid', 'Paid'),
    ('partially_refunded', 'Partially Refunded'),
    ('refunded', 'Refunded'),
    ('failed', 'Failed'),
]

PAYMENT_METHODS = [
    ('paynow_ecocash', 'EcoCash (Paynow)'),
    ('paynow_onemoney', 'OneMoney (Paynow)'),
    ('paynow_bank', 'Bank Transfer (Paynow)'),
    ('stripe', 'Card Payment (Stripe)'),
    ('cash', 'Cash'),
]

PAYMENT_GATEWAYS = [
    ('paynow', 'Paynow'),
    ('stripe', 'Stripe'),
    ('cash', 'Cash'),
]

JOB_TYPES = [
    ('installation', 'Installation'),
    ('maintenance', 'Maintenance'),
    ('repair', 'Repair'),
    ('inspection', 'Inspection'),
    ('consultation', 'Consultation'),
]

JOB_STATUSES = [
    ('unassigned', 'Unassigned'),
    ('assigned', 'Assigned'),
    ('en_route', 'En Route'),
    ('in_progress', 'In Progress'),
    ('on_hold', 'On Hold'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

PRIORITY_LEVELS = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
]

TICKET_CATEGORIES = [
    ('general', 'General'),
    ('sales', 'Sales'),
    ('technical_support', 'Technical Support'),
    ('billing', 'Billing'),
    ('installation', 'Installation'),
    ('maintenance', 'Maintenance'),
    ('complaint', 'Complaint'),
]

NOTIFICATION_TYPES = [
    ('order_update', 'Order Update'),
    ('payment_received', 'Payment Received'),
    ('quote_ready', 'Quotation Ready'),
    ('job_assigned', 'Job Assigned'),
    ('ticket_reply', 'Ticket Reply'),
    ('course_update', 'Course Update'),
    ('promotion', 'Promotion'),
    ('system', 'System'),
]
