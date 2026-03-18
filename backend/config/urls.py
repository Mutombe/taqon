from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
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
