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


def _debug_login(request):
    """Debug: test admin login and show exactly what fails."""
    from apps.accounts.models import User
    from django.contrib.auth import authenticate

    email = 'admin@taqon.co.zw'
    password = 'TaqonAdmin2026'
    checks = {}

    # 1. Does user exist?
    try:
        u = User.objects.get(email=email)
        checks['user_exists'] = True
        checks['user_id'] = str(u.id)
        checks['role'] = u.role
        checks['is_active'] = u.is_active
        checks['is_verified'] = u.is_verified
        checks['is_staff'] = u.is_staff
        checks['is_superuser'] = u.is_superuser
        checks['has_usable_password'] = u.has_usable_password()
        checks['password_check'] = u.check_password(password)
    except User.DoesNotExist:
        checks['user_exists'] = False
        return JsonResponse(checks)

    # 2. Does authenticate() work?
    auth_user = authenticate(email=email, password=password)
    checks['authenticate_result'] = str(auth_user) if auth_user else 'None'

    # 3. Try authenticate with username field
    auth_user2 = authenticate(username=email, password=password)
    checks['authenticate_username_result'] = str(auth_user2) if auth_user2 else 'None'

    # 4. Check AUTH_USER_MODEL and backends
    checks['auth_user_model'] = str(settings.AUTH_USER_MODEL)
    checks['auth_backends'] = str(settings.AUTHENTICATION_BACKENDS) if hasattr(settings, 'AUTHENTICATION_BACKENDS') else 'default'
    checks['username_field'] = User.USERNAME_FIELD

    return JsonResponse(checks)


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


def debug_api(request, path=''):
    """Proxy any API call and return the traceback if it 500s."""
    from django.test import RequestFactory
    from django.urls import resolve
    try:
        resolved = resolve(f'/api/v1/{path}')
        factory = RequestFactory()
        fake_request = factory.get(f'/api/v1/{path}')
        fake_request.META['HTTP_ACCEPT'] = 'application/json'
        response = resolved.func(fake_request, **resolved.kwargs)
        return JsonResponse({'status': response.status_code, 'ok': True})
    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'type': type(e).__name__,
            'traceback': traceback.format_exc(),
        }, status=500)


urlpatterns = [
    path('health/', health_check),
    path('debug-login/', lambda request: _debug_login(request)),
    path('debug-api/<path:path>', debug_api),
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
