from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import TimeStampedModel
from apps.core.constants import (
    JOB_TYPES, JOB_STATUSES, PRIORITY_LEVELS, ZIMBABWE_PROVINCES,
)
from apps.core.utils import generate_reference


class TechnicianProfile(TimeStampedModel):
    """
    Extended profile for users with role='technician'.
    Stores skills, certifications, availability, and performance metrics.
    """

    SKILL_LEVEL_CHOICES = [
        ('junior', 'Junior'),
        ('mid', 'Mid-Level'),
        ('senior', 'Senior'),
        ('lead', 'Lead'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='technician_profile',
    )
    employee_id = models.CharField(max_length=30, unique=True, blank=True)
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVEL_CHOICES, default='junior')
    specializations = models.JSONField(
        default=list, blank=True,
        help_text='List of specialization areas, e.g. ["installation", "repair", "battery"]',
    )
    certifications = models.JSONField(
        default=list, blank=True,
        help_text='List of certifications, e.g. [{"name": "ZERA Licensed", "year": 2023}]',
    )

    # Service area
    service_provinces = models.JSONField(
        default=list, blank=True,
        help_text='List of province codes the technician covers',
    )
    service_radius_km = models.PositiveIntegerField(default=50)
    base_location = models.CharField(max_length=200, blank=True, help_text='Home base / depot address')

    # Availability
    is_available = models.BooleanField(default=True, db_index=True)
    max_concurrent_jobs = models.PositiveIntegerField(default=3)

    # Performance metrics (updated by admin or automated)
    total_jobs_completed = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_ratings = models.PositiveIntegerField(default=0)
    on_time_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=100)

    # Emergency contact
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    bio = models.TextField(blank=True)

    class Meta:
        ordering = ['-average_rating', 'user__first_name']

    def __str__(self):
        return f"{self.user.full_name} ({self.skill_level})"

    def save(self, *args, **kwargs):
        if not self.employee_id:
            self.employee_id = generate_reference('TECH')
        super().save(*args, **kwargs)

    @property
    def active_jobs_count(self):
        return self.jobs.filter(status__in=['assigned', 'en_route', 'in_progress']).count()

    @property
    def can_accept_jobs(self):
        return self.is_available and self.active_jobs_count < self.max_concurrent_jobs


class Job(TimeStampedModel):
    """
    A job/work order assigned to a technician.
    Linked optionally to an order or quotation.
    """

    job_number = models.CharField(max_length=30, unique=True, db_index=True)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)

    job_type = models.CharField(max_length=20, choices=JOB_TYPES, db_index=True)
    status = models.CharField(max_length=20, choices=JOB_STATUSES, default='unassigned', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')

    # Assignment
    technician = models.ForeignKey(
        TechnicianProfile, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='jobs',
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='jobs_assigned',
    )

    # Customer
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='service_jobs',
    )
    customer_name = models.CharField(max_length=200, blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    customer_email = models.EmailField(blank=True)

    # Location
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    province = models.CharField(max_length=50, choices=ZIMBABWE_PROVINCES, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Scheduling
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time_start = models.TimeField(null=True, blank=True)
    scheduled_time_end = models.TimeField(null=True, blank=True)
    estimated_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=1, default=2,
        help_text='Estimated job duration in hours',
    )

    # Completion
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    actual_duration_hours = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
    )

    # Linked entities (optional)
    order = models.ForeignKey(
        'shop.Order', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='service_jobs',
    )
    quotation = models.ForeignKey(
        'quotations.Quotation', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='service_jobs',
    )
    solar_configuration = models.ForeignKey(
        'solar_config.SolarConfiguration', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='service_jobs',
    )

    # System info
    system_details = models.JSONField(
        default=dict, blank=True,
        help_text='System details: panel count, inverter, battery, etc.',
    )
    materials_used = models.JSONField(
        default=list, blank=True,
        help_text='List of materials/parts used during the job',
    )
    cost_estimate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Customer feedback
    customer_rating = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    customer_feedback = models.TextField(blank=True)

    # Completion details
    completion_summary = models.TextField(blank=True)
    requires_follow_up = models.BooleanField(default=False)
    follow_up_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-scheduled_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'technician']),
            models.Index(fields=['scheduled_date', 'status']),
            models.Index(fields=['customer', 'status']),
        ]

    def __str__(self):
        return f"{self.job_number} - {self.title}"

    def save(self, *args, **kwargs):
        if not self.job_number:
            self.job_number = generate_reference('JOB')
        super().save(*args, **kwargs)


class JobStatusHistory(TimeStampedModel):
    """Track status changes for audit trail."""

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20, choices=JOB_STATUSES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job.job_number}: {self.old_status} → {self.new_status}"


class JobNote(TimeStampedModel):
    """Notes added to a job by technician or admin."""

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='job_notes',
    )
    content = models.TextField()
    is_internal = models.BooleanField(default=False, help_text='Internal notes not visible to customer')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.job.job_number} by {self.author}"


class JobPhoto(TimeStampedModel):
    """Photos attached to a job (before/during/after work)."""

    PHOTO_TYPE_CHOICES = [
        ('before', 'Before Work'),
        ('during', 'During Work'),
        ('after', 'After Work'),
        ('issue', 'Issue/Problem'),
        ('material', 'Materials Used'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='photos')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    image = models.ImageField(upload_to='job_photos/%Y/%m/')
    image_url = models.URLField(blank=True, help_text='External URL alternative')
    photo_type = models.CharField(max_length=20, choices=PHOTO_TYPE_CHOICES, default='during')
    caption = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['photo_type', 'created_at']

    def __str__(self):
        return f"{self.photo_type} photo for {self.job.job_number}"


class TechnicianSchedule(TimeStampedModel):
    """Technician availability / time-off blocks."""

    SCHEDULE_TYPE_CHOICES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
        ('leave', 'On Leave'),
        ('training', 'Training'),
    ]

    technician = models.ForeignKey(
        TechnicianProfile, on_delete=models.CASCADE,
        related_name='schedule_entries',
    )
    schedule_type = models.CharField(max_length=20, choices=SCHEDULE_TYPE_CHOICES, default='available')
    date = models.DateField(db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    notes = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['technician', 'date', 'start_time']

    def __str__(self):
        return f"{self.technician.user.full_name} - {self.date} ({self.schedule_type})"
