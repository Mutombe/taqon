"""
Development settings for Taqon Electrico platform.
"""
from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - console backend for dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Debug toolbar (optional - only if installed)
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1']
except ImportError:
    pass

# Use SQLite if no PostgreSQL configured
import environ
env = environ.Env()
if not env('DATABASE_URL', default=''):
    DATABASES = {  # noqa: F405
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',  # noqa: F405
        }
    }

# Channels - use in-memory layer for dev if no Redis
try:
    import redis
    r = redis.Redis.from_url(env('REDIS_URL', default='redis://127.0.0.1:6379/0'))
    r.ping()
except Exception:
    CHANNEL_LAYERS = {  # noqa: F405
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }
    CACHES = {  # noqa: F405
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
    CELERY_TASK_ALWAYS_EAGER = True  # noqa: F405
    CELERY_TASK_EAGER_PROPAGATES = True  # noqa: F405

# Logging - more verbose in dev
LOGGING['loggers']['apps']['level'] = 'DEBUG'  # noqa: F405
