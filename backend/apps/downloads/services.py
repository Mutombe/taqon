"""Helpers used by other apps to record downloads from server-rendered PDFs.

Centralised so the schema can evolve without touching every PDF view.
"""
import logging

from .models import Download

logger = logging.getLogger(__name__)


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '') or None


def record_download(request, *, kind, surface='other',
                    target_slug='', target_label='', target_id=None,
                    customer_name='', customer_email='',
                    file_size_bytes=None, duration_ms=None,
                    success=True, failure_reason='',
                    metadata=None):
    """Persist a Download row. Never raises — tracking failures must
    not break the actual download response.
    """
    try:
        user = getattr(request, 'user', None) if request else None
        if user is not None and not getattr(user, 'is_authenticated', False):
            user = None

        Download.objects.create(
            kind=kind,
            surface=surface,
            target_slug=target_slug or '',
            target_label=target_label or '',
            target_id=target_id,
            user=user,
            customer_name=customer_name or '',
            customer_email=customer_email or '',
            ip_address=_client_ip(request) if request else None,
            user_agent=(request.META.get('HTTP_USER_AGENT', '')[:1000] if request else ''),
            referer=(request.META.get('HTTP_REFERER', '')[:500] if request else ''),
            file_size_bytes=file_size_bytes,
            duration_ms=duration_ms,
            success=success,
            failure_reason=failure_reason or '',
            metadata=metadata or {},
        )
    except Exception:
        # Tracking is fire-and-forget. A DB hiccup must not break the
        # PDF response that the customer is waiting on.
        logger.exception('Failed to record Download (kind=%s)', kind)
