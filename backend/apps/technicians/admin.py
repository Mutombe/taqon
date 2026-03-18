from django.contrib import admin
from .models import (
    TechnicianProfile, Job, JobStatusHistory,
    JobNote, JobPhoto, TechnicianSchedule,
)


class JobNoteInline(admin.TabularInline):
    model = JobNote
    extra = 0
    readonly_fields = ['author', 'created_at']


class JobPhotoInline(admin.TabularInline):
    model = JobPhoto
    extra = 0
    readonly_fields = ['uploaded_by', 'created_at']


class JobStatusHistoryInline(admin.TabularInline):
    model = JobStatusHistory
    extra = 0
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'notes', 'created_at']
    ordering = ['-created_at']


class TechnicianScheduleInline(admin.TabularInline):
    model = TechnicianSchedule
    extra = 0


@admin.register(TechnicianProfile)
class TechnicianProfileAdmin(admin.ModelAdmin):
    list_display = [
        'employee_id', 'user', 'skill_level', 'is_available',
        'total_jobs_completed', 'average_rating', 'on_time_percentage',
    ]
    list_filter = ['skill_level', 'is_available']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'employee_id']
    readonly_fields = [
        'employee_id', 'total_jobs_completed', 'average_rating',
        'total_ratings', 'on_time_percentage', 'created_at', 'updated_at',
    ]
    inlines = [TechnicianScheduleInline]
    fieldsets = [
        (None, {
            'fields': ('user', 'employee_id', 'skill_level', 'bio'),
        }),
        ('Skills & Certifications', {
            'fields': ('specializations', 'certifications'),
        }),
        ('Service Area', {
            'fields': ('service_provinces', 'service_radius_km', 'base_location'),
        }),
        ('Availability', {
            'fields': ('is_available', 'max_concurrent_jobs'),
        }),
        ('Performance', {
            'fields': ('total_jobs_completed', 'average_rating', 'total_ratings', 'on_time_percentage'),
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = [
        'job_number', 'title', 'job_type', 'status', 'priority',
        'technician', 'customer_name', 'city',
        'scheduled_date', 'customer_rating',
    ]
    list_filter = ['status', 'job_type', 'priority', 'province']
    search_fields = ['job_number', 'title', 'customer_name', 'customer_email', 'city']
    readonly_fields = ['job_number', 'started_at', 'completed_at', 'created_at', 'updated_at']
    inlines = [JobNoteInline, JobPhotoInline, JobStatusHistoryInline]
    fieldsets = [
        (None, {
            'fields': ('job_number', 'title', 'description', 'job_type', 'status', 'priority'),
        }),
        ('Assignment', {
            'fields': ('technician', 'assigned_by'),
        }),
        ('Customer', {
            'fields': ('customer', 'customer_name', 'customer_phone', 'customer_email'),
        }),
        ('Location', {
            'fields': ('address', 'city', 'province', 'latitude', 'longitude'),
        }),
        ('Schedule', {
            'fields': (
                'scheduled_date', 'scheduled_time_start', 'scheduled_time_end',
                'estimated_duration_hours',
            ),
        }),
        ('Completion', {
            'fields': (
                'started_at', 'completed_at', 'actual_duration_hours',
                'completion_summary', 'actual_cost',
            ),
        }),
        ('Linked Entities', {
            'fields': ('order', 'quotation', 'solar_configuration'),
            'classes': ('collapse',),
        }),
        ('Technical', {
            'fields': ('system_details', 'materials_used', 'cost_estimate'),
            'classes': ('collapse',),
        }),
        ('Customer Feedback', {
            'fields': ('customer_rating', 'customer_feedback'),
        }),
        ('Follow-up', {
            'fields': ('requires_follow_up', 'follow_up_notes'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(TechnicianSchedule)
class TechnicianScheduleAdmin(admin.ModelAdmin):
    list_display = ['technician', 'date', 'schedule_type', 'start_time', 'end_time', 'is_all_day']
    list_filter = ['schedule_type', 'date']
    search_fields = ['technician__user__email', 'technician__user__first_name']
