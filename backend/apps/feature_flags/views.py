from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin

from .models import FeatureFlag
from .serializers import AdminFeatureFlagSerializer, FeatureFlagSerializer


class PublicFeatureFlagsView(APIView):
    """GET: returns the resolved flag state for the requesting user.

    Frontend hits this once on app boot (and on auth state change) and uses
    the result to gate UI. The response is shaped as a `{ key: bool }` map
    rather than a list so the frontend can do `flags['installer_accounts']`
    directly without a second `.find()`.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        flags = FeatureFlag.objects.all()
        resolved = {f.key: f.is_visible_to(request.user) for f in flags}
        return Response(resolved)


class AdminFeatureFlagListView(generics.ListAPIView):
    """Admin: list every flag with full metadata."""
    permission_classes = [IsAdmin]
    serializer_class = AdminFeatureFlagSerializer
    pagination_class = None

    def get_queryset(self):
        return FeatureFlag.objects.all()


class AdminFeatureFlagUpdateView(generics.UpdateAPIView):
    """Admin: toggle is_enabled / enabled_for_staff_only on a single flag."""
    permission_classes = [IsAdmin]
    serializer_class = AdminFeatureFlagSerializer
    lookup_field = 'key'

    def get_queryset(self):
        return FeatureFlag.objects.all()

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
