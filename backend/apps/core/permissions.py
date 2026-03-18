from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    """Allow access to customers (and admins)."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('customer', 'admin', 'superadmin')
        )


class IsTechnician(BasePermission):
    """Allow access to technicians (and admins)."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('technician', 'admin', 'superadmin')
        )


class IsAdmin(BasePermission):
    """Allow access to admin and superadmin users."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('admin', 'superadmin')
        )


class IsSuperAdmin(BasePermission):
    """Allow access to superadmin users only."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'superadmin'
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow object owners or admins."""

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'superadmin'):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False
