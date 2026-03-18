from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.utils import generate_reference, generate_unique_slug


class Course(SoftDeleteModel):
    """
    A solar/energy training course with modules and lessons.
    Courses can be free or paid, and have difficulty levels.
    """

    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    CATEGORY_CHOICES = [
        ('solar_fundamentals', 'Solar Fundamentals'),
        ('installation', 'Installation'),
        ('maintenance', 'Maintenance & Repair'),
        ('battery_storage', 'Battery Storage'),
        ('inverters', 'Inverters'),
        ('electrical', 'Electrical Safety'),
        ('business', 'Solar Business'),
        ('diy', 'DIY Solar'),
        ('borehole', 'Borehole Systems'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    subtitle = models.CharField(max_length=300, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='courses_teaching',
    )
    instructor_name = models.CharField(max_length=100, blank=True)
    instructor_bio = models.TextField(blank=True)
    instructor_avatar = models.ImageField(upload_to='courses/instructors/', blank=True)

    thumbnail = models.ImageField(upload_to='courses/thumbnails/', blank=True)
    thumbnail_url = models.URLField(blank=True)
    preview_video_url = models.URLField(blank=True)

    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='solar_fundamentals')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    tags = models.JSONField(default=list, blank=True)

    is_featured = models.BooleanField(default=False)
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='USD')

    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=1, default=0,
        help_text='Total estimated hours to complete',
    )
    requirements = models.JSONField(default=list, blank=True, help_text='Prerequisites')
    learning_outcomes = models.JSONField(default=list, blank=True, help_text='What students will learn')

    total_enrollments = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)

    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-is_featured', '-published_at']
        indexes = [
            models.Index(fields=['status', 'category']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_featured', '-published_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Course, self.title)
        super().save(*args, **kwargs)

    @property
    def module_count(self):
        return self.modules.count()

    @property
    def lesson_count(self):
        return sum(m.lessons.count() for m in self.modules.all())

    @property
    def display_thumbnail(self):
        if self.thumbnail:
            return self.thumbnail.url
        return self.thumbnail_url or ''


class Module(TimeStampedModel):
    """
    A module (section) within a course, containing ordered lessons.
    """

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='modules',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_free_preview = models.BooleanField(
        default=False, help_text='Allow non-enrolled users to preview this module',
    )

    class Meta:
        ordering = ['order']
        unique_together = ['course', 'order']

    def __str__(self):
        return f"{self.course.title} — {self.title}"

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def total_duration_minutes(self):
        return self.lessons.aggregate(
            total=models.Sum('duration_minutes')
        )['total'] or 0


class Lesson(TimeStampedModel):
    """
    An individual lesson within a module. Supports video, text, and quiz types.
    """

    LESSON_TYPE_CHOICES = [
        ('video', 'Video'),
        ('text', 'Text/Article'),
        ('quiz', 'Quiz'),
        ('practical', 'Practical Exercise'),
        ('download', 'Downloadable Resource'),
    ]

    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name='lessons',
    )
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, blank=True)
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPE_CHOICES, default='video')
    order = models.PositiveIntegerField(default=0)

    # Content fields
    content = models.TextField(blank=True, help_text='Rich text content for text lessons')
    video_url = models.URLField(blank=True, help_text='YouTube or hosted video URL')
    video_duration_seconds = models.PositiveIntegerField(default=0)
    duration_minutes = models.PositiveIntegerField(default=0, help_text='Estimated time to complete')

    # Quiz data (JSON for quiz-type lessons)
    quiz_data = models.JSONField(
        default=list, blank=True,
        help_text='Array of {question, options[], correct_index, explanation}',
    )
    passing_score = models.PositiveIntegerField(
        default=70, help_text='Minimum score (%) to pass quiz',
    )

    # Resources
    attachment = models.FileField(upload_to='courses/attachments/', blank=True)
    attachment_url = models.URLField(blank=True)
    external_links = models.JSONField(default=list, blank=True)

    is_free_preview = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']
        unique_together = ['module', 'order']

    def __str__(self):
        return f"{self.module.title} — {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    @property
    def course(self):
        return self.module.course


class Enrollment(TimeStampedModel):
    """
    Tracks a user's enrollment in a course.
    """

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='enrollments',
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='enrollments',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    # Progress tracking
    progress_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    lessons_completed = models.PositiveIntegerField(default=0)
    total_time_spent_minutes = models.PositiveIntegerField(default=0)

    # Payment reference (for paid courses)
    payment_reference = models.CharField(max_length=50, blank=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ['user', 'course']
        ordering = ['-last_accessed_at', '-enrolled_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['course', 'status']),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.course.title}"

    def update_progress(self):
        """Recalculate progress from completed lessons."""
        total_lessons = sum(
            m.lessons.count() for m in self.course.modules.all()
        )
        if total_lessons == 0:
            return
        completed = self.lesson_progress.filter(is_completed=True).count()
        self.lessons_completed = completed
        self.progress_percentage = round((completed / total_lessons) * 100, 2)
        if self.progress_percentage >= 100:
            from django.utils import timezone
            self.status = 'completed'
            self.completed_at = timezone.now()
        self.save(update_fields=[
            'lessons_completed', 'progress_percentage', 'status', 'completed_at',
        ])


class LessonProgress(TimeStampedModel):
    """
    Tracks a user's progress on an individual lesson.
    """

    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name='lesson_progress',
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name='progress_records',
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_minutes = models.PositiveIntegerField(default=0)

    # For video lessons
    video_position_seconds = models.PositiveIntegerField(default=0)

    # For quiz lessons
    quiz_score = models.PositiveIntegerField(null=True, blank=True)
    quiz_attempts = models.PositiveIntegerField(default=0)
    quiz_answers = models.JSONField(default=list, blank=True)
    quiz_passed = models.BooleanField(default=False)

    # Notes the student took
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['enrollment', 'lesson']
        ordering = ['lesson__module__order', 'lesson__order']

    def __str__(self):
        status = 'Done' if self.is_completed else 'In Progress'
        return f"{self.enrollment.user.email} — {self.lesson.title} ({status})"

    def mark_complete(self):
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=['is_completed', 'completed_at'])
        self.enrollment.update_progress()


class CourseReview(TimeStampedModel):
    """
    Student review/rating for a course.
    """

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='reviews',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='course_reviews',
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True)

    class Meta:
        unique_together = ['course', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} rated {self.course.title}: {self.rating}/5"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_course_stats()

    def _update_course_stats(self):
        """Recalculate course average rating and review count."""
        reviews = CourseReview.objects.filter(course=self.course, is_approved=True)
        count = reviews.count()
        avg = reviews.aggregate(avg=models.Avg('rating'))['avg'] or 0
        Course.all_objects.filter(pk=self.course.pk).update(
            average_rating=round(avg, 2),
            total_reviews=count,
        )


class Certificate(TimeStampedModel):
    """
    Certificate issued upon course completion.
    """

    certificate_number = models.CharField(max_length=30, unique=True, blank=True)
    enrollment = models.OneToOneField(
        Enrollment, on_delete=models.CASCADE, related_name='certificate',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='certificates',
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name='certificates',
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf = models.FileField(upload_to='courses/certificates/', blank=True)
    pdf_url = models.URLField(blank=True)

    # Verification
    verification_code = models.CharField(max_length=20, unique=True, blank=True)

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Certificate {self.certificate_number} — {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.certificate_number = generate_reference('CERT')
        if not self.verification_code:
            import uuid
            self.verification_code = uuid.uuid4().hex[:12].upper()
        super().save(*args, **kwargs)
