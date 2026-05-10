from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin

from .models import Inquiry
from .serializers import (
    InquirySubmitSerializer,
    InquiryAdminListSerializer,
    InquiryAdminDetailSerializer,
)


class PublicInquiryView(generics.CreateAPIView):
    """POST /api/v1/inquiries/ — public submission endpoint."""
    permission_classes = [AllowAny]
    serializer_class = InquirySubmitSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()
        # post_save signal fires the admin notification email — see
        # apps/inquiries/signals.py.
        return Response(
            {
                'id': str(inquiry.id),
                'detail': "Thanks — we'll be in touch within one business day.",
            },
            status=status.HTTP_201_CREATED,
        )


class AdminInquiryListView(generics.ListAPIView):
    """GET /api/v1/inquiries/admin/ — paginated triage list."""
    permission_classes = [IsAdmin]
    serializer_class = InquiryAdminListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Inquiry.objects.all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        search = self.request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(phone__icontains=search)
                | Q(area__icontains=search),
            )
        return qs


class AdminInquiryDetailView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/v1/inquiries/admin/<id>/ — view + triage updates."""
    permission_classes = [IsAdmin]
    serializer_class = InquiryAdminDetailSerializer
    queryset = Inquiry.objects.all()
