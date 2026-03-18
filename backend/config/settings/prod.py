"""
Production settings for Taqon Electrico platform.
"""
from .base import *  # noqa

import environ
env = environ.Env()

DEBUG = False
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS')

# Email - SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# DigitalOcean Spaces / S3-compatible Storage
if env('DO_SPACES_KEY', default='') or env('AWS_ACCESS_KEY_ID', default=''):
    _using_do = bool(env('DO_SPACES_KEY', default=''))

    AWS_ACCESS_KEY_ID = env('DO_SPACES_KEY') if _using_do else env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = env('DO_SPACES_SECRET') if _using_do else env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = env('DO_SPACES_BUCKET') if _using_do else env('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = env('DO_SPACES_REGION', default='nyc3') if _using_do else env('AWS_S3_REGION_NAME', default='us-east-1')

    if _using_do:
        AWS_S3_ENDPOINT_URL = f'https://{AWS_S3_REGION_NAME}.digitaloceanspaces.com'
        DO_SPACES_CDN = env('DO_SPACES_CDN', default='')
        AWS_S3_CUSTOM_DOMAIN = DO_SPACES_CDN if DO_SPACES_CDN else f'{AWS_STORAGE_BUCKET_NAME}.{AWS_S3_REGION_NAME}.digitaloceanspaces.com'
    else:
        AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'

    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_LOCATION = 'media'
    AWS_QUERYSTRING_AUTH = False

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
        },
        'staticfiles': {
            'BACKEND': 'storages.backends.s3boto3.S3StaticStorage',
        },
    }
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

    # Keep WhiteNoise for static files if preferred (set DO_SPACES_STATIC=false)
    if not env.bool('DO_SPACES_STATIC', default=True):
        STORAGES['staticfiles'] = {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        }
        STATIC_URL = '/static/'

# Sentry
SENTRY_DSN = env('SENTRY_DSN', default='')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True,
    )

# Logging - file-based in production
LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': BASE_DIR / 'logs' / 'django.log',  # noqa: F405
    'maxBytes': 1024 * 1024 * 10,  # 10MB
    'backupCount': 5,
    'formatter': 'verbose',
}
LOGGING['root']['handlers'] = ['console', 'file']  # noqa: F405
