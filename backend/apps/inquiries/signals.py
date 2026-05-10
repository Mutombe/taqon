"""Signal handlers for Inquiry — primarily fanning out admin email
notifications when a new inquiry lands.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string

from .models import Inquiry

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Inquiry)
def email_admins_on_new_inquiry(sender, instance, created, **kwargs):
    """Fire a notification email to the configured admin recipients.

    Only on first creation — status changes don't re-notify. Failures
    are logged but never raised, so a flaky SMTP server can't break the
    customer-facing form submit.
    """
    if not created:
        return

    recipients = getattr(settings, 'INQUIRY_NOTIFICATION_RECIPIENTS', None) or []
    if not recipients:
        logger.info('Inquiry %s saved but no INQUIRY_NOTIFICATION_RECIPIENTS configured.', instance.id)
        return

    try:
        subject = f'New Taqon inquiry — {instance.name}'
        ctx = {
            'inquiry': instance,
            'frontend_url': getattr(settings, 'FRONTEND_URL', ''),
            'admin_url': f"{getattr(settings, 'FRONTEND_URL', '').rstrip('/')}/admin/inquiries/{instance.id}",
        }
        text_body = render_to_string('emails/inquiry_notification.txt', ctx)
        html_body = render_to_string('emails/inquiry_notification.html', ctx)

        from_email = getattr(
            settings,
            'DEFAULT_FROM_EMAIL',
            'Taqon Electrico <noreply@taqon.co.zw>',
        )
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=list(recipients),
            reply_to=[instance.email] if instance.email else None,
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        logger.info(
            'Inquiry %s: notification sent to %s', instance.id, recipients,
        )
    except Exception:
        # Never break the public form just because the SMTP server hiccupped.
        logger.exception('Inquiry %s: failed to send admin notification email.', instance.id)
