from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import (
    TechnicianProfile, Job, JobStatusHistory,
    JobNote, JobPhoto, TechnicianSchedule,
)


# ── Technician Profile ──

class TechnicianProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    active_jobs_count = serializers.IntegerField(read_only=True)
    can_accept_jobs = serializers.BooleanField(read_only=True)

    class Meta:
        model = TechnicianProfile
        fields = [
            'id', 'user', 'employee_id', 'skill_level',
            'specializations', 'certifications',
            'service_provinces', 'service_radius_km', 'base_location',
            'is_available', 'max_concurrent_jobs',
            'total_jobs_completed', 'average_rating', 'total_ratings',
            'on_time_percentage',
            'emergency_contact_name', 'emergency_contact_phone',
            'bio', 'active_jobs_count', 'can_accept_jobs',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'employee_id', 'total_jobs_completed',
            'average_rating', 'total_ratings', 'on_time_percentage',
            'created_at', 'updated_at',
        ]


class TechnicianProfileListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = TechnicianProfile
        fields = [
            'id', 'employee_id', 'full_name', 'email', 'phone',
            'skill_level', 'specializations', 'is_available',
            'average_rating', 'total_jobs_completed',
        ]
        read_only_fields = fields


class TechnicianProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicianProfile
        fields = [
            'skill_level', 'specializations', 'certifications',
            'service_provinces', 'service_radius_km', 'base_location',
            'is_available', 'max_concurrent_jobs',
            'emergency_contact_name', 'emergency_contact_phone', 'bio',
        ]


# ── Jobs ──

class JobNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = JobNote
        fields = ['id', 'author', 'author_name', 'content', 'is_internal', 'created_at']
        read_only_fields = ['id', 'author', 'author_name', 'created_at']


class JobPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = JobPhoto
        fields = ['id', 'uploaded_by', 'uploaded_by_name', 'image', 'image_url', 'photo_type', 'caption', 'created_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_by_name', 'created_at']


class JobStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        model = JobStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by', 'changed_by_name', 'notes', 'created_at']
        read_only_fields = fields


class JobSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.user.full_name', read_only=True, default='')
    notes = JobNoteSerializer(many=True, read_only=True)
    photos = JobPhotoSerializer(many=True, read_only=True)
    status_history = JobStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'job_number', 'title', 'description',
            'job_type', 'status', 'priority',
            'technician', 'technician_name', 'assigned_by',
            'customer', 'customer_name', 'customer_phone', 'customer_email',
            'address', 'city', 'province', 'latitude', 'longitude',
            'scheduled_date', 'scheduled_time_start', 'scheduled_time_end',
            'estimated_duration_hours',
            'started_at', 'completed_at', 'actual_duration_hours',
            'order', 'quotation', 'solar_configuration',
            'system_details', 'materials_used',
            'cost_estimate', 'actual_cost',
            'customer_rating', 'customer_feedback',
            'completion_summary', 'requires_follow_up', 'follow_up_notes',
            'notes', 'photos', 'status_history',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'job_number', 'technician_name',
            'notes', 'photos', 'status_history',
            'created_at', 'updated_at',
        ]


class JobListSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.user.full_name', read_only=True, default='')
    notes_count = serializers.IntegerField(source='notes.count', read_only=True)
    photos_count = serializers.IntegerField(source='photos.count', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'job_number', 'title', 'job_type', 'status', 'priority',
            'technician', 'technician_name',
            'customer_name', 'city', 'province',
            'scheduled_date', 'scheduled_time_start',
            'estimated_duration_hours',
            'customer_rating', 'requires_follow_up',
            'notes_count', 'photos_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class JobStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[s[0] for s in Job.status.field.choices])
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    completion_summary = serializers.CharField(required=False, allow_blank=True, default='')
    actual_duration_hours = serializers.DecimalField(
        max_digits=5, decimal_places=1, required=False, allow_null=True,
    )
    materials_used = serializers.ListField(child=serializers.DictField(), required=False)


class AdminCreateJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'title', 'description', 'job_type', 'priority',
            'technician', 'customer',
            'customer_name', 'customer_phone', 'customer_email',
            'address', 'city', 'province', 'latitude', 'longitude',
            'scheduled_date', 'scheduled_time_start', 'scheduled_time_end',
            'estimated_duration_hours',
            'order', 'quotation', 'solar_configuration',
            'system_details', 'cost_estimate',
        ]


class JobNoteCreateSerializer(serializers.Serializer):
    content = serializers.CharField()
    is_internal = serializers.BooleanField(default=False)


# ── Schedule ──

class TechnicianScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicianSchedule
        fields = [
            'id', 'technician', 'schedule_type', 'date',
            'start_time', 'end_time', 'is_all_day', 'notes',
            'created_at',
        ]
        read_only_fields = ['id', 'technician', 'created_at']


class TechnicianScheduleCreateSerializer(serializers.Serializer):
    schedule_type = serializers.ChoiceField(
        choices=[s[0] for s in TechnicianSchedule.SCHEDULE_TYPE_CHOICES],
    )
    date = serializers.DateField()
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    is_all_day = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


# ── Dashboard Stats ──

class TechnicianDashboardSerializer(serializers.Serializer):
    profile = TechnicianProfileSerializer()
    active_jobs = JobListSerializer(many=True)
    upcoming_jobs = JobListSerializer(many=True)
    stats = serializers.DictField()
