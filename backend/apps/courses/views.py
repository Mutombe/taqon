from django.utils import timezone
from django.db.models import Q, Avg, Count
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.core.permissions import IsAdmin
from apps.core.pagination import StandardPagination, SmallPagination
from .models import (
    Course, Module, Lesson, Enrollment,
    LessonProgress, CourseReview, Certificate,
)
from .serializers import (
    CourseListSerializer, CourseDetailSerializer,
    ModuleListSerializer, LessonDetailSerializer,
    EnrollmentSerializer, EnrollmentDetailSerializer,
    LessonProgressSerializer, LessonProgressUpdateSerializer,
    CourseReviewSerializer, CourseReviewCreateSerializer,
    CertificateSerializer,
    AdminCourseSerializer, AdminModuleSerializer, AdminLessonSerializer,
)


# ═══════════════════════════════════════════════════════════════════════
# PUBLIC — Course Catalog
# ═══════════════════════════════════════════════════════════════════════

class CourseListView(APIView):
    """List published courses with filters."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Course.objects.filter(status='published')

        # Filters
        category = request.query_params.get('category')
        difficulty = request.query_params.get('difficulty')
        is_free = request.query_params.get('is_free')
        is_featured = request.query_params.get('featured')
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering', '-published_at')

        if category:
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        if is_free is not None:
            qs = qs.filter(is_free=is_free.lower() == 'true')
        if is_featured:
            qs = qs.filter(is_featured=True)
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(subtitle__icontains=search) |
                Q(short_description__icontains=search) |
                Q(tags__icontains=search)
            )

        # Ordering
        valid_orders = {
            '-published_at', 'published_at',
            '-average_rating', '-total_enrollments',
            'price', '-price', 'title',
        }
        if ordering in valid_orders:
            qs = qs.order_by(ordering)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CourseListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CourseDetailView(APIView):
    """Get course detail by slug (public)."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            course = Course.objects.prefetch_related(
                'modules__lessons',
            ).get(slug=slug, status='published')
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CourseDetailSerializer(course)
        data = serializer.data

        # If user is authenticated, include enrollment status
        if request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(
                user=request.user, course=course,
            ).first()
            data['is_enrolled'] = enrollment is not None
            data['enrollment_id'] = str(enrollment.id) if enrollment else None
            data['progress_percentage'] = float(enrollment.progress_percentage) if enrollment else 0
        else:
            data['is_enrolled'] = False
            data['enrollment_id'] = None
            data['progress_percentage'] = 0

        return Response(data)


class CourseCategoriesView(APIView):
    """List available categories with course counts."""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = (
            Course.objects.filter(status='published')
            .values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response(list(categories))


class CourseReviewsView(APIView):
    """List approved reviews for a course."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            course = Course.objects.get(slug=slug, status='published')
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        reviews = CourseReview.objects.filter(
            course=course, is_approved=True,
        ).select_related('user')

        paginator = SmallPagination()
        page = paginator.paginate_queryset(reviews, request)
        serializer = CourseReviewSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════
# AUTHENTICATED — Enrollment & Progress
# ═══════════════════════════════════════════════════════════════════════

class EnrollView(APIView):
    """Enroll current user in a course."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            course = Course.objects.get(slug=slug, status='published')
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        if Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response({'error': 'Already enrolled.'}, status=status.HTTP_400_BAD_REQUEST)

        if not course.is_free and course.price > 0:
            return Response(
                {'error': 'This is a paid course. Payment required.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        enrollment = Enrollment.objects.create(
            user=request.user,
            course=course,
            last_accessed_at=timezone.now(),
        )

        # Increment enrollment count
        Course.all_objects.filter(pk=course.pk).update(
            total_enrollments=course.total_enrollments + 1,
        )

        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )


class MyEnrollmentsView(APIView):
    """List current user's enrollments."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Enrollment.objects.filter(
            user=request.user,
        ).select_related('course')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = EnrollmentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class EnrollmentDetailView(APIView):
    """Get enrollment detail with lesson progress."""
    permission_classes = [IsAuthenticated]

    def get(self, request, enrollment_id):
        try:
            enrollment = Enrollment.objects.select_related(
                'course',
            ).prefetch_related(
                'course__modules__lessons',
                'lesson_progress__lesson',
            ).get(id=enrollment_id, user=request.user)
        except Enrollment.DoesNotExist:
            return Response({'error': 'Enrollment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Update last accessed
        enrollment.last_accessed_at = timezone.now()
        enrollment.save(update_fields=['last_accessed_at'])

        return Response(EnrollmentDetailSerializer(enrollment).data)


class LessonContentView(APIView):
    """Get full lesson content (must be enrolled or lesson is free preview)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, enrollment_id, lesson_id):
        try:
            enrollment = Enrollment.objects.get(
                id=enrollment_id, user=request.user, status__in=['active', 'completed'],
            )
        except Enrollment.DoesNotExist:
            return Response({'error': 'Enrollment not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            lesson = Lesson.objects.select_related('module').get(
                id=lesson_id, module__course=enrollment.course,
            )
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get or create progress record
        progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment, lesson=lesson,
        )

        data = LessonDetailSerializer(lesson).data
        data['progress'] = LessonProgressSerializer(progress).data
        return Response(data)


class UpdateLessonProgressView(APIView):
    """Update progress on a lesson (time, video position, quiz, completion)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, enrollment_id, lesson_id):
        try:
            enrollment = Enrollment.objects.get(
                id=enrollment_id, user=request.user, status='active',
            )
        except Enrollment.DoesNotExist:
            return Response({'error': 'Enrollment not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            lesson = Lesson.objects.get(
                id=lesson_id, module__course=enrollment.course,
            )
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = LessonProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment, lesson=lesson,
        )

        if 'time_spent_minutes' in data:
            progress.time_spent_minutes += data['time_spent_minutes']
            enrollment.total_time_spent_minutes += data['time_spent_minutes']
            enrollment.save(update_fields=['total_time_spent_minutes'])

        if 'video_position_seconds' in data:
            progress.video_position_seconds = data['video_position_seconds']

        if 'notes' in data:
            progress.notes = data['notes']

        if 'quiz_answers' in data:
            progress.quiz_answers = data['quiz_answers']
            progress.quiz_attempts += 1

        if 'quiz_score' in data:
            progress.quiz_score = data['quiz_score']
            progress.quiz_passed = data['quiz_score'] >= lesson.passing_score

        progress.save()

        if data.get('mark_complete'):
            progress.mark_complete()

        return Response(LessonProgressSerializer(progress).data)


class SubmitReviewView(APIView):
    """Submit a review for a course (must be enrolled)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            course = Course.objects.get(slug=slug, status='published')
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not Enrollment.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'You must be enrolled to review this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if CourseReview.objects.filter(user=request.user, course=course).exists():
            return Response(
                {'error': 'You have already reviewed this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CourseReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(user=request.user, course=course)
        return Response(
            CourseReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


class MyCertificatesView(APIView):
    """List current user's certificates."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        certs = Certificate.objects.filter(
            user=request.user,
        ).select_related('course')
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)


class VerifyCertificateView(APIView):
    """Verify a certificate by its code (public)."""
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            cert = Certificate.objects.select_related(
                'user', 'course',
            ).get(verification_code=code)
        except Certificate.DoesNotExist:
            return Response({'error': 'Invalid certificate.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'valid': True,
            'certificate_number': cert.certificate_number,
            'course_title': cert.course.title,
            'user_name': f"{cert.user.first_name} {cert.user.last_name}".strip(),
            'issued_at': cert.issued_at,
        })


# ═══════════════════════════════════════════════════════════════════════
# ADMIN — Course Management
# ═══════════════════════════════════════════════════════════════════════

class AdminCourseListView(APIView):
    """Admin: list all courses (any status)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = Course.all_objects.all()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AdminCourseSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminCourseCreateView(APIView):
    """Admin: create a new course."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminCourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save(created_by=request.user)
        return Response(
            AdminCourseSerializer(course).data,
            status=status.HTTP_201_CREATED,
        )


class AdminCourseDetailView(APIView):
    """Admin: get/update/delete a course."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, slug):
        try:
            course = Course.all_objects.prefetch_related(
                'modules__lessons',
            ).get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminCourseSerializer(course).data)

    def patch(self, request, slug):
        try:
            course = Course.all_objects.get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCourseSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Auto-set published_at when publishing
        if request.data.get('status') == 'published' and not course.published_at:
            serializer.validated_data['published_at'] = timezone.now()

        serializer.save(updated_by=request.user)
        return Response(serializer.data)

    def delete(self, request, slug):
        try:
            course = Course.all_objects.get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)
        course.soft_delete(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminModuleCreateView(APIView):
    """Admin: add a module to a course."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, slug):
        try:
            course = Course.all_objects.get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['course'] = course.id
        serializer = AdminModuleSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()
        return Response(
            AdminModuleSerializer(module).data,
            status=status.HTTP_201_CREATED,
        )


class AdminModuleUpdateView(APIView):
    """Admin: update/delete a module."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, module_id):
        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({'error': 'Module not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminModuleSerializer(module, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, module_id):
        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({'error': 'Module not found.'}, status=status.HTTP_404_NOT_FOUND)
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminLessonCreateView(APIView):
    """Admin: add a lesson to a module."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, module_id):
        try:
            module = Module.objects.get(id=module_id)
        except Module.DoesNotExist:
            return Response({'error': 'Module not found.'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['module'] = module.id
        serializer = AdminLessonSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return Response(
            AdminLessonSerializer(lesson).data,
            status=status.HTTP_201_CREATED,
        )


class AdminLessonUpdateView(APIView):
    """Admin: update/delete a lesson."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminLessonSerializer(lesson, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, lesson_id):
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found.'}, status=status.HTTP_404_NOT_FOUND)
        lesson.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCourseStatsView(APIView):
    """Admin: course platform statistics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        total_courses = Course.objects.filter(status='published').count()
        total_enrollments = Enrollment.objects.count()
        active_enrollments = Enrollment.objects.filter(status='active').count()
        completed_enrollments = Enrollment.objects.filter(status='completed').count()
        total_certificates = Certificate.objects.count()
        avg_rating = Course.objects.filter(
            status='published', total_reviews__gt=0,
        ).aggregate(avg=Avg('average_rating'))['avg'] or 0

        # Top courses by enrollment
        top_courses = (
            Course.objects.filter(status='published')
            .order_by('-total_enrollments')[:5]
            .values('title', 'slug', 'total_enrollments', 'average_rating')
        )

        return Response({
            'total_courses': total_courses,
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
            'completed_enrollments': completed_enrollments,
            'completion_rate': round(
                (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0, 1,
            ),
            'total_certificates': total_certificates,
            'average_rating': round(float(avg_rating), 2),
            'top_courses': list(top_courses),
        })
