from django.contrib import admin
from .models import (
    Course, Module, Lesson, Enrollment,
    LessonProgress, CourseReview, Certificate,
)


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0
    fields = ['title', 'order', 'is_free_preview']
    ordering = ['order']


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['title', 'lesson_type', 'order', 'duration_minutes', 'is_free_preview']
    ordering = ['order']


class LessonProgressInline(admin.TabularInline):
    model = LessonProgress
    extra = 0
    readonly_fields = [
        'lesson', 'is_completed', 'completed_at',
        'time_spent_minutes', 'quiz_score', 'quiz_passed',
    ]
    fields = readonly_fields


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'category', 'difficulty', 'status',
        'is_featured', 'is_free', 'price',
        'total_enrollments', 'average_rating', 'published_at',
    ]
    list_filter = ['status', 'category', 'difficulty', 'is_featured', 'is_free']
    search_fields = ['title', 'subtitle', 'description']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['total_enrollments', 'average_rating', 'total_reviews']
    inlines = [ModuleInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'subtitle', 'description', 'short_description'),
        }),
        ('Instructor', {
            'fields': ('instructor', 'instructor_name', 'instructor_bio', 'instructor_avatar'),
        }),
        ('Media', {
            'fields': ('thumbnail', 'thumbnail_url', 'preview_video_url'),
        }),
        ('Classification', {
            'fields': ('category', 'difficulty', 'status', 'tags', 'is_featured'),
        }),
        ('Pricing', {
            'fields': ('is_free', 'price', 'currency'),
        }),
        ('Content', {
            'fields': ('estimated_duration_hours', 'requirements', 'learning_outcomes'),
        }),
        ('Stats (read-only)', {
            'fields': ('total_enrollments', 'average_rating', 'total_reviews', 'published_at'),
        }),
    )
    actions = ['publish_courses', 'archive_courses']

    @admin.action(description='Publish selected courses')
    def publish_courses(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='draft').update(
            status='published', published_at=timezone.now(),
        )

    @admin.action(description='Archive selected courses')
    def archive_courses(self, request, queryset):
        queryset.update(status='archived')


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'is_free_preview']
    list_filter = ['course', 'is_free_preview']
    search_fields = ['title']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'module', 'lesson_type', 'order', 'duration_minutes', 'is_free_preview']
    list_filter = ['lesson_type', 'is_free_preview', 'module__course']
    search_fields = ['title']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'course', 'status', 'progress_percentage',
        'lessons_completed', 'enrolled_at', 'completed_at',
    ]
    list_filter = ['status', 'course']
    search_fields = ['user__email', 'user__first_name', 'course__title']
    readonly_fields = ['progress_percentage', 'lessons_completed', 'total_time_spent_minutes']
    inlines = [LessonProgressInline]


@admin.register(CourseReview)
class CourseReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'course']
    search_fields = ['user__email', 'comment']
    actions = ['approve_reviews', 'reject_reviews']

    @admin.action(description='Approve selected reviews')
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description='Reject selected reviews')
    def reject_reviews(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'user', 'course', 'issued_at', 'verification_code']
    search_fields = ['certificate_number', 'verification_code', 'user__email']
    readonly_fields = ['certificate_number', 'verification_code']
