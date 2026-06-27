from django.apps import AppConfig


class ShopConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.shop'
    verbose_name = 'Shop'

    def ready(self):
        from . import signals  # noqa: F401  (registers post_save handlers)
