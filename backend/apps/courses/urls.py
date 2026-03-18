from django.urls import path
from . import views

app_name = 'courses'

urlpatterns = [
    # ── Public ──────────────────────────────────────────────────────
    path('', views.CourseListView.as_view(), name='course-list'),
    path('categories/', views.CourseCategoriesView.as_view(), name='course-categories'),
    path('certificates/verify/<str:code>/', views.VerifyCertificateView.as_view(), name='verify-certificate'),
    path('<slug:slug>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('<slug:slug>/reviews/', views.CourseReviewsView.as_view(), name='course-reviews'),

    # ── Authenticated — Enrollment ──────────────────────────────────
    path('<slug:slug>/enroll/', views.EnrollView.as_view(), name='enroll'),
    path('<slug:slug>/review/', views.SubmitReviewView.as_view(), name='submit-review'),
    path('my/enrollments/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
    path('my/certificates/', views.MyCertificatesView.as_view(), name='my-certificates'),

    # ── Authenticated — Learning ────────────────────────────────────
    path('enrollments/<uuid:enrollment_id>/', views.EnrollmentDetailView.as_view(), name='enrollment-detail'),
    path('enrollments/<uuid:enrollment_id>/lessons/<uuid:lesson_id>/', views.LessonContentView.as_view(), name='lesson-content'),
    path('enrollments/<uuid:enrollment_id>/lessons/<uuid:lesson_id>/progress/', views.UpdateLessonProgressView.as_view(), name='update-progress'),

    # ── Admin ───────────────────────────────────────────────────────
    path('admin/courses/', views.AdminCourseListView.as_view(), name='admin-course-list'),
    path('admin/courses/create/', views.AdminCourseCreateView.as_view(), name='admin-course-create'),
    path('admin/courses/stats/', views.AdminCourseStatsView.as_view(), name='admin-course-stats'),
    path('admin/courses/<slug:slug>/', views.AdminCourseDetailView.as_view(), name='admin-course-detail'),
    path('admin/modules/create/<slug:slug>/', views.AdminModuleCreateView.as_view(), name='admin-module-create'),
    path('admin/modules/<uuid:module_id>/', views.AdminModuleUpdateView.as_view(), name='admin-module-update'),
    path('admin/lessons/create/<uuid:module_id>/', views.AdminLessonCreateView.as_view(), name='admin-lesson-create'),
    path('admin/lessons/<uuid:lesson_id>/', views.AdminLessonUpdateView.as_view(), name='admin-lesson-update'),
]
