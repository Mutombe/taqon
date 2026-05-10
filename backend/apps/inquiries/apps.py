from django.apps import AppConfig


class InquiriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.inquiries'
    verbose_name = 'Customer Inquiries'

    def ready(self):
        # Importing the signals module wires the post_save handler that
        # fans an email to admin recipients on every new Inquiry.
        from . import signals  # noqa: F401
