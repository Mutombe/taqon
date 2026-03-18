import logging
from datetime import date, timedelta

from django.db import transaction
from django.db.models import Count, Q, Avg, Prefetch
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination, SmallPagination
from apps.core.permissions import IsTechnician, IsAdmin

from .models import (
    TechnicianProfile, Job, JobStatusHistory,
    JobNote, JobPhoto, TechnicianSchedule,
)
from .serializers import (
    TechnicianProfileSerializer,
    TechnicianProfileListSerializer,
    TechnicianProfileUpdateSerializer,
    JobSerializer,
    JobListSerializer,
    JobStatusUpdateSerializer,
    AdminCreateJobSerializer,
    JobNoteSerializer,
    JobNoteCreateSerializer,
    JobPhotoSerializer,
    TechnicianScheduleSerializer,
    TechnicianScheduleCreateSerializer,
    TechnicianDashboardSerializer,
    JobStatusHistorySerializer,
)

logger = logging.getLogger(__name__)


def _get_technician_profile(user):
    """Get or raise 404 for the technician profile of the current user."""
    try:
        return TechnicianProfile.objects.select_related('user').get(user=user)
    except TechnicianProfile.DoesNotExist:
        return None


# ══════════════════════════════════════════════
# Technician Dashboard & Profile
# ══════════════════════════════════════════════

class TechnicianDashboardView(APIView):
    """
    Technician's main dashboard.
    Returns profile, active jobs, upcoming jobs, and stats.
    """
    permission_classes = [IsTechnician]

    def get(self, request):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response(
                {'detail': 'Technician profile not found. Contact admin.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        today = date.today()
        week_end = today + timedelta(days=7)

        active_jobs = (
            Job.objects
            .filter(
                technician=profile,
                status__in=['assigned', 'en_route', 'in_progress', 'on_hold'],
            )
            .order_by('scheduled_date', 'scheduled_time_start')[:10]
        )

        upcoming_jobs = (
            Job.objects
            .filter(
                technician=profile,
                status='assigned',
                scheduled_date__gte=today,
                scheduled_date__lte=week_end,
            )
            .order_by('scheduled_date', 'scheduled_time_start')[:10]
        )

        # Stats
        all_jobs = Job.objects.filter(technician=profile)
        completed_this_month = all_jobs.filter(
            status='completed',
            completed_at__year=today.year,
            completed_at__month=today.month,
        ).count()

        stats = {
            'total_completed': profile.total_jobs_completed,
            'completed_this_month': completed_this_month,
            'active_jobs': profile.active_jobs_count,
            'average_rating': float(profile.average_rating),
            'on_time_percentage': float(profile.on_time_percentage),
            'pending_today': all_jobs.filter(
                scheduled_date=today,
                status__in=['assigned', 'en_route'],
            ).count(),
        }

        data = TechnicianDashboardSerializer({
            'profile': profile,
            'active_jobs': active_jobs,
            'upcoming_jobs': upcoming_jobs,
            'stats': stats,
        }).data

        return Response(data)


class TechnicianProfileView(APIView):
    """Get or update the current technician's profile."""
    permission_classes = [IsTechnician]

    def get(self, request):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response(
                {'detail': 'Technician profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TechnicianProfileSerializer(profile).data)

    def patch(self, request):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response(
                {'detail': 'Technician profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = TechnicianProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TechnicianProfileSerializer(profile).data)


# ══════════════════════════════════════════════
# Technician Job Management
# ══════════════════════════════════════════════

class TechnicianJobListView(generics.ListAPIView):
    """List jobs assigned to the current technician."""
    permission_classes = [IsTechnician]
    serializer_class = JobListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        profile = _get_technician_profile(self.request.user)
        if not profile:
            return Job.objects.none()

        qs = Job.objects.filter(technician=profile)

        job_status = self.request.query_params.get('status')
        if job_status:
            qs = qs.filter(status=job_status)

        job_type = self.request.query_params.get('type')
        if job_type:
            qs = qs.filter(job_type=job_type)

        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(scheduled_date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(scheduled_date__lte=date_to)

        return qs


class TechnicianJobDetailView(APIView):
    """Get full job details for a technician's assigned job."""
    permission_classes = [IsTechnician]

    def get(self, request, job_number):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job = (
                Job.objects
                .filter(technician=profile)
                .prefetch_related(
                    Prefetch('notes', queryset=JobNote.objects.select_related('author').filter(
                        Q(is_internal=False) | Q(author=request.user)
                    )),
                    Prefetch('photos', queryset=JobPhoto.objects.select_related('uploaded_by')),
                    Prefetch('status_history', queryset=JobStatusHistory.objects.select_related('changed_by')),
                )
                .get(job_number=job_number)
            )
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(JobSerializer(job).data)


class TechnicianUpdateJobStatusView(APIView):
    """Technician updates the status of their assigned job."""
    permission_classes = [IsTechnician]

    def patch(self, request, job_number):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job = Job.objects.get(job_number=job_number, technician=profile)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_status = data['status']
        old_status = job.status

        # Validate transitions
        valid_transitions = {
            'assigned': ['en_route', 'cancelled'],
            'en_route': ['in_progress', 'on_hold'],
            'in_progress': ['on_hold', 'completed'],
            'on_hold': ['in_progress', 'cancelled'],
        }
        allowed = valid_transitions.get(old_status, [])
        if new_status not in allowed:
            return Response(
                {'detail': f'Cannot transition from "{old_status}" to "{new_status}". Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            job.status = new_status

            if new_status == 'in_progress' and not job.started_at:
                job.started_at = timezone.now()

            if new_status == 'completed':
                job.completed_at = timezone.now()
                if data.get('completion_summary'):
                    job.completion_summary = data['completion_summary']
                if data.get('actual_duration_hours') is not None:
                    job.actual_duration_hours = data['actual_duration_hours']
                if data.get('materials_used'):
                    job.materials_used = data['materials_used']

                # Update technician metrics
                profile.total_jobs_completed += 1
                profile.save(update_fields=['total_jobs_completed', 'updated_at'])

            job.save()

            JobStatusHistory.objects.create(
                job=job,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=data.get('notes', ''),
            )

        job.refresh_from_db()
        return Response(JobSerializer(job).data)


class TechnicianAddJobNoteView(APIView):
    """Technician adds a note to their job."""
    permission_classes = [IsTechnician]

    def post(self, request, job_number):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job = Job.objects.get(job_number=job_number, technician=profile)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobNoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note = JobNote.objects.create(
            job=job,
            author=request.user,
            content=serializer.validated_data['content'],
            is_internal=serializer.validated_data.get('is_internal', False),
        )

        return Response(JobNoteSerializer(note).data, status=status.HTTP_201_CREATED)


class TechnicianUploadJobPhotoView(APIView):
    """Technician uploads a photo to their job."""
    permission_classes = [IsTechnician]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, job_number):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            job = Job.objects.get(job_number=job_number, technician=profile)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobPhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(job=job, uploaded_by=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ══════════════════════════════════════════════
# Technician Schedule
# ══════════════════════════════════════════════

class TechnicianScheduleListView(APIView):
    """List the technician's schedule for a date range."""
    permission_classes = [IsTechnician]

    def get(self, request):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Default to current week
        today = date.today()
        date_from = request.query_params.get('date_from', str(today))
        date_to = request.query_params.get('date_to', str(today + timedelta(days=30)))

        entries = TechnicianSchedule.objects.filter(
            technician=profile,
            date__gte=date_from,
            date__lte=date_to,
        )

        # Also include jobs as schedule items
        jobs = Job.objects.filter(
            technician=profile,
            scheduled_date__gte=date_from,
            scheduled_date__lte=date_to,
            status__in=['assigned', 'en_route', 'in_progress'],
        ).values(
            'job_number', 'title', 'scheduled_date',
            'scheduled_time_start', 'scheduled_time_end',
            'status', 'city',
        )

        return Response({
            'schedule': TechnicianScheduleSerializer(entries, many=True).data,
            'jobs': list(jobs),
        })


class TechnicianScheduleCreateView(APIView):
    """Create a schedule entry (availability/time-off)."""
    permission_classes = [IsTechnician]

    def post(self, request):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TechnicianScheduleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        entry = TechnicianSchedule.objects.create(
            technician=profile,
            **data,
        )
        return Response(
            TechnicianScheduleSerializer(entry).data,
            status=status.HTTP_201_CREATED,
        )


class TechnicianScheduleDeleteView(APIView):
    """Delete a schedule entry."""
    permission_classes = [IsTechnician]

    def delete(self, request, pk):
        profile = _get_technician_profile(request.user)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            entry = TechnicianSchedule.objects.get(pk=pk, technician=profile)
        except TechnicianSchedule.DoesNotExist:
            return Response({'detail': 'Schedule entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ══════════════════════════════════════════════
# Admin Job Management
# ══════════════════════════════════════════════

class AdminJobListView(generics.ListAPIView):
    """Admin: list all jobs with filtering."""
    permission_classes = [IsAdmin]
    serializer_class = JobListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Job.objects.select_related('technician__user').all()

        params = self.request.query_params

        job_status = params.get('status')
        if job_status:
            qs = qs.filter(status=job_status)

        job_type = params.get('type')
        if job_type:
            qs = qs.filter(job_type=job_type)

        priority = params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        technician_id = params.get('technician')
        if technician_id:
            qs = qs.filter(technician_id=technician_id)

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(scheduled_date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(scheduled_date__lte=date_to)

        search = params.get('search')
        if search:
            qs = qs.filter(
                Q(job_number__icontains=search)
                | Q(title__icontains=search)
                | Q(customer_name__icontains=search)
                | Q(city__icontains=search)
            )

        return qs


class AdminJobDetailView(generics.RetrieveAPIView):
    """Admin: get full job details."""
    permission_classes = [IsAdmin]
    serializer_class = JobSerializer
    lookup_field = 'job_number'

    def get_queryset(self):
        return (
            Job.objects
            .select_related('technician__user', 'customer', 'assigned_by')
            .prefetch_related(
                Prefetch('notes', queryset=JobNote.objects.select_related('author')),
                Prefetch('photos', queryset=JobPhoto.objects.select_related('uploaded_by')),
                Prefetch('status_history', queryset=JobStatusHistory.objects.select_related('changed_by')),
            )
        )


class AdminCreateJobView(APIView):
    """Admin: create a new job and optionally assign a technician."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = AdminCreateJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            job = serializer.save(assigned_by=request.user)

            initial_status = 'assigned' if job.technician else 'unassigned'
            job.status = initial_status
            job.save(update_fields=['status'])

            JobStatusHistory.objects.create(
                job=job,
                old_status='',
                new_status=initial_status,
                changed_by=request.user,
                notes='Job created by admin.',
            )

        return Response(JobSerializer(job).data, status=status.HTTP_201_CREATED)


class AdminAssignJobView(APIView):
    """Admin: assign or reassign a job to a technician."""
    permission_classes = [IsAdmin]

    def patch(self, request, job_number):
        try:
            job = Job.objects.get(job_number=job_number)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        technician_id = request.data.get('technician_id')
        if not technician_id:
            return Response(
                {'detail': 'technician_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            tech_profile = TechnicianProfile.objects.get(pk=technician_id)
        except TechnicianProfile.DoesNotExist:
            return Response({'detail': 'Technician not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not tech_profile.can_accept_jobs:
            return Response(
                {'detail': f'{tech_profile.user.full_name} cannot accept more jobs.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = job.status

        with transaction.atomic():
            job.technician = tech_profile
            job.assigned_by = request.user
            if job.status == 'unassigned':
                job.status = 'assigned'
            job.save(update_fields=['technician', 'assigned_by', 'status', 'updated_at'])

            JobStatusHistory.objects.create(
                job=job,
                old_status=old_status,
                new_status=job.status,
                changed_by=request.user,
                notes=f'Assigned to {tech_profile.user.full_name}',
            )

        return Response(JobSerializer(job).data)


class AdminUpdateJobStatusView(APIView):
    """Admin: force-update any job status."""
    permission_classes = [IsAdmin]

    def patch(self, request, job_number):
        try:
            job = Job.objects.get(job_number=job_number)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        old_status = job.status

        with transaction.atomic():
            job.status = new_status
            if new_status == 'completed' and not job.completed_at:
                job.completed_at = timezone.now()
            job.save()

            JobStatusHistory.objects.create(
                job=job,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=serializer.validated_data.get('notes', 'Updated by admin.'),
            )

        return Response(JobSerializer(job).data)


class AdminTechnicianListView(generics.ListAPIView):
    """Admin: list all technician profiles."""
    permission_classes = [IsAdmin]
    serializer_class = TechnicianProfileListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = TechnicianProfile.objects.select_related('user').all()

        available = self.request.query_params.get('available')
        if available == 'true':
            qs = qs.filter(is_available=True)

        skill = self.request.query_params.get('skill_level')
        if skill:
            qs = qs.filter(skill_level=skill)

        return qs


class AdminCreateTechnicianProfileView(APIView):
    """Admin: create a technician profile for an existing user."""
    permission_classes = [IsAdmin]

    def post(self, request):
        from apps.accounts.models import User

        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(user, 'technician_profile'):
            return Response({'detail': 'User already has a technician profile.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user.role = 'technician'
            user.save(update_fields=['role', 'updated_at'])

            profile = TechnicianProfile.objects.create(
                user=user,
                skill_level=request.data.get('skill_level', 'junior'),
                specializations=request.data.get('specializations', []),
                service_provinces=request.data.get('service_provinces', []),
                base_location=request.data.get('base_location', ''),
                bio=request.data.get('bio', ''),
            )

        return Response(TechnicianProfileSerializer(profile).data, status=status.HTTP_201_CREATED)


class AdminJobStatsView(APIView):
    """Admin: get overall job statistics."""
    permission_classes = [IsAdmin]

    def get(self, request):
        today = date.today()
        this_month_start = today.replace(day=1)

        all_jobs = Job.objects.all()
        total = all_jobs.count()

        by_status = dict(
            all_jobs.values_list('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        by_type = dict(
            all_jobs.values_list('job_type')
            .annotate(count=Count('id'))
            .values_list('job_type', 'count')
        )

        completed_this_month = all_jobs.filter(
            status='completed',
            completed_at__gte=this_month_start,
        ).count()

        avg_rating = all_jobs.filter(
            customer_rating__isnull=False,
        ).aggregate(avg=Avg('customer_rating'))['avg'] or 0

        avg_duration = all_jobs.filter(
            actual_duration_hours__isnull=False,
        ).aggregate(avg=Avg('actual_duration_hours'))['avg'] or 0

        return Response({
            'total_jobs': total,
            'by_status': by_status,
            'by_type': by_type,
            'completed_this_month': completed_this_month,
            'average_customer_rating': round(float(avg_rating), 2),
            'average_duration_hours': round(float(avg_duration), 1),
            'technician_count': TechnicianProfile.objects.count(),
            'available_technicians': TechnicianProfile.objects.filter(is_available=True).count(),
        })
