from django.apps import AppConfig


class SolarConfigConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.solar_config'
    verbose_name = 'SolarConfig'

    def ready(self):
        import apps.solar_config.signals  # noqa: F401
