from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
import traceback


def health_check(request):
    """Debug endpoint to check DB, storage, and settings."""
    checks = {}
    try:
        from django.db import connection
        connection.ensure_connection()
        checks['database'] = 'ok'
    except Exception as e:
        checks['database'] = f'FAIL: {e}'

    checks['settings_module'] = settings.SETTINGS_MODULE if hasattr(settings, 'SETTINGS_MODULE') else str(settings)
    checks['debug'] = settings.DEBUG
    checks['allowed_hosts'] = settings.ALLOWED_HOSTS
    checks['static_url'] = settings.STATIC_URL
    checks['media_url'] = getattr(settings, 'MEDIA_URL', 'not set')
    checks['storages'] = str(getattr(settings, 'STORAGES', 'not set'))
    checks['cors_origins'] = getattr(settings, 'CORS_ALLOWED_ORIGINS', 'not set')

    # Try a simple query
    try:
        from apps.shop.models import Category
        count = Category.objects.count()
        checks['categories_count'] = count
    except Exception as e:
        checks['categories_query'] = f'FAIL: {e}'

    return JsonResponse(checks)


urlpatterns = [
    path('health/', health_check),
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/shop/', include('apps.shop.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/quotations/', include('apps.quotations.urls')),
    path('api/v1/solar-config/', include('apps.solar_config.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/courses/', include('apps.courses.urls')),
    path('api/v1/technician/', include('apps.technicians.urls')),
    path('api/v1/support/', include('apps.chatbot.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/blog/', include('apps.blog.urls')),
    path('api/v1/comments/', include('apps.comments.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    try:
        import debug_toolbar
        urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    except ImportError:
        pass
