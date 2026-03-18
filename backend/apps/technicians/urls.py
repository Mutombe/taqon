from django.urls import path
from . import views

app_name = 'technicians'

urlpatterns = [
    # Technician dashboard & profile
    path('dashboard/', views.TechnicianDashboardView.as_view(), name='dashboard'),
    path('profile/', views.TechnicianProfileView.as_view(), name='profile'),

    # Technician job management
    path('jobs/', views.TechnicianJobListView.as_view(), name='job-list'),
    path('jobs/<str:job_number>/', views.TechnicianJobDetailView.as_view(), name='job-detail'),
    path('jobs/<str:job_number>/status/', views.TechnicianUpdateJobStatusView.as_view(), name='job-status'),
    path('jobs/<str:job_number>/notes/', views.TechnicianAddJobNoteView.as_view(), name='job-add-note'),
    path('jobs/<str:job_number>/photos/', views.TechnicianUploadJobPhotoView.as_view(), name='job-upload-photo'),

    # Technician schedule
    path('schedule/', views.TechnicianScheduleListView.as_view(), name='schedule-list'),
    path('schedule/create/', views.TechnicianScheduleCreateView.as_view(), name='schedule-create'),
    path('schedule/<uuid:pk>/delete/', views.TechnicianScheduleDeleteView.as_view(), name='schedule-delete'),

    # Admin endpoints
    path('admin/jobs/', views.AdminJobListView.as_view(), name='admin-job-list'),
    path('admin/jobs/create/', views.AdminCreateJobView.as_view(), name='admin-job-create'),
    path('admin/jobs/stats/', views.AdminJobStatsView.as_view(), name='admin-job-stats'),
    path('admin/jobs/<str:job_number>/', views.AdminJobDetailView.as_view(), name='admin-job-detail'),
    path('admin/jobs/<str:job_number>/assign/', views.AdminAssignJobView.as_view(), name='admin-job-assign'),
    path('admin/jobs/<str:job_number>/status/', views.AdminUpdateJobStatusView.as_view(), name='admin-job-status'),
    path('admin/technicians/', views.AdminTechnicianListView.as_view(), name='admin-tech-list'),
    path('admin/technicians/create/', views.AdminCreateTechnicianProfileView.as_view(), name='admin-tech-create'),
]
