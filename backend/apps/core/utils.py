import uuid
import re
from django.utils.text import slugify


def generate_reference(prefix='REF'):
    """Generate a unique reference number like TAQ-2024-A1B2C3D4."""
    from django.utils import timezone
    now = timezone.now()
    return f"{prefix}-{now.year}-{uuid.uuid4().hex[:8].upper()}"


def validate_zimbabwe_phone(phone):
    """Validate Zimbabwe phone number format (+263XXXXXXXXX)."""
    pattern = r'^\+263[0-9]{9}$'
    return bool(re.match(pattern, phone))


def generate_unique_slug(model_class, value, slug_field='slug'):
    """Generate a unique slug for a model instance."""
    slug = slugify(value)
    unique_slug = slug
    counter = 1
    while model_class.objects.filter(**{slug_field: unique_slug}).exists():
        unique_slug = f"{slug}-{counter}"
        counter += 1
    return unique_slug


def get_client_ip(request):
    """Extract client IP from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')
