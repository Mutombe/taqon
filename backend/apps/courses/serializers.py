from rest_framework import serializers
from .models import (
    Course, Module, Lesson, Enrollment,
    LessonProgress, CourseReview, Certificate,
)


# ── Lesson ──────────────────────────────────────────────────────────────

class LessonListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'lesson_type', 'order',
            'duration_minutes', 'is_free_preview',
        ]


class LessonDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'slug', 'lesson_type', 'order',
            'content', 'video_url', 'video_duration_seconds',
            'duration_minutes', 'quiz_data', 'passing_score',
            'attachment', 'attachment_url', 'external_links',
            'is_free_preview', 'created_at',
        ]


# ── Module ──────────────────────────────────────────────────────────────

class ModuleListSerializer(serializers.ModelSerializer):
    lessons = LessonListSerializer(many=True, read_only=True)
    lesson_count = serializers.ReadOnlyField()
    total_duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order',
            'is_free_preview', 'lesson_count',
            'total_duration_minutes', 'lessons',
        ]


class ModuleDetailSerializer(serializers.ModelSerializer):
    lessons = LessonDetailSerializer(many=True, read_only=True)
    lesson_count = serializers.ReadOnlyField()
    total_duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order',
            'is_free_preview', 'lesson_count',
            'total_duration_minutes', 'lessons',
        ]


# ── Course ──────────────────────────────────────────────────────────────

class CourseListSerializer(serializers.ModelSerializer):
    module_count = serializers.ReadOnlyField()
    lesson_count = serializers.ReadOnlyField()
    display_thumbnail = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'subtitle', 'short_description',
            'category', 'difficulty', 'display_thumbnail',
            'instructor_name', 'is_featured', 'is_free', 'price',
            'currency', 'estimated_duration_hours',
            'total_enrollments', 'average_rating', 'total_reviews',
            'module_count', 'lesson_count',
            'tags', 'published_at',
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    modules = ModuleListSerializer(many=True, read_only=True)
    module_count = serializers.ReadOnlyField()
    lesson_count = serializers.ReadOnlyField()
    display_thumbnail = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'subtitle', 'description',
            'short_description', 'instructor_name', 'instructor_bio',
            'instructor_avatar', 'display_thumbnail', 'preview_video_url',
            'category', 'difficulty', 'status', 'tags',
            'is_featured', 'is_free', 'price', 'currency',
            'estimated_duration_hours', 'requirements', 'learning_outcomes',
            'total_enrollments', 'average_rating', 'total_reviews',
            'module_count', 'lesson_count', 'modules',
            'published_at', 'created_at',
        ]


# ── Enrollment ──────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_slug = serializers.CharField(source='course.slug', read_only=True)
    course_thumbnail = serializers.CharField(source='course.display_thumbnail', read_only=True)
    course_category = serializers.CharField(source='course.category', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'course_title', 'course_slug',
            'course_thumbnail', 'course_category', 'status',
            'enrolled_at', 'completed_at', 'last_accessed_at',
            'progress_percentage', 'lessons_completed',
            'total_time_spent_minutes',
        ]
        read_only_fields = [
            'status', 'enrolled_at', 'completed_at',
            'progress_percentage', 'lessons_completed',
            'total_time_spent_minutes',
        ]


class EnrollmentDetailSerializer(serializers.ModelSerializer):
    course = CourseDetailSerializer(read_only=True)
    lesson_progress = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'course', 'status', 'enrolled_at', 'completed_at',
            'last_accessed_at', 'progress_percentage', 'lessons_completed',
            'total_time_spent_minutes', 'lesson_progress',
        ]

    def get_lesson_progress(self, obj):
        progress = obj.lesson_progress.select_related('lesson').all()
        return LessonProgressSerializer(progress, many=True).data


# ── Lesson Progress ────────────────────────────────────────────────────

class LessonProgressSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_type = serializers.CharField(source='lesson.lesson_type', read_only=True)

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'lesson', 'lesson_title', 'lesson_type',
            'is_completed', 'completed_at', 'time_spent_minutes',
            'video_position_seconds', 'quiz_score', 'quiz_attempts',
            'quiz_passed', 'notes',
        ]
        read_only_fields = ['is_completed', 'completed_at', 'quiz_passed']


class LessonProgressUpdateSerializer(serializers.Serializer):
    """Used to update progress on a lesson (mark complete, save quiz, update time)."""
    time_spent_minutes = serializers.IntegerField(required=False, min_value=0)
    video_position_seconds = serializers.IntegerField(required=False, min_value=0)
    mark_complete = serializers.BooleanField(required=False, default=False)
    quiz_answers = serializers.ListField(required=False)
    quiz_score = serializers.IntegerField(required=False, min_value=0, max_value=100)
    notes = serializers.CharField(required=False, allow_blank=True)


# ── Reviews ─────────────────────────────────────────────────────────────

class CourseReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = [
            'id', 'course', 'user', 'user_name',
            'rating', 'title', 'comment',
            'is_approved', 'created_at',
        ]
        read_only_fields = ['user', 'is_approved']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class CourseReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseReview
        fields = ['rating', 'title', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value


# ── Certificate ─────────────────────────────────────────────────────────

class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_number', 'course', 'course_title',
            'user', 'user_name', 'issued_at',
            'pdf', 'pdf_url', 'verification_code',
        ]
        read_only_fields = [
            'certificate_number', 'user', 'issued_at',
            'pdf', 'pdf_url', 'verification_code',
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


# ── Admin Serializers ───────────────────────────────────────────────────

class AdminCourseSerializer(serializers.ModelSerializer):
    module_count = serializers.ReadOnlyField()
    lesson_count = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = '__all__'


class AdminModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = '__all__'


class AdminLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'
