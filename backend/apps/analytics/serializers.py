from rest_framework import serializers
from apps.accounts.models import User


# ── Dashboard Overview ──────────────────────────────────────────

class DashboardOverviewSerializer(serializers.Serializer):
    # Users
    total_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    users_by_role = serializers.DictField()

    # Orders
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    processing_orders = serializers.IntegerField()
    delivered_orders = serializers.IntegerField()
    orders_today = serializers.IntegerField()

    # Revenue
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_today = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_week = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)

    # Quotations
    total_quotations = serializers.IntegerField()
    pending_quotation_requests = serializers.IntegerField()
    accepted_quotations = serializers.IntegerField()
    conversion_rate = serializers.FloatField()

    # Support
    open_tickets = serializers.IntegerField()
    unassigned_tickets = serializers.IntegerField()
    avg_resolution_hours = serializers.FloatField(allow_null=True)

    # Courses
    total_enrollments = serializers.IntegerField()
    active_enrollments = serializers.IntegerField()

    # Technicians
    active_technicians = serializers.IntegerField()
    pending_jobs = serializers.IntegerField()

    # Notifications
    unread_notifications = serializers.IntegerField()

    # Solar Advisor
    total_instant_quotes = serializers.IntegerField(default=0)
    instant_quotes_today = serializers.IntegerField(default=0)
    instant_quotes_month = serializers.IntegerField(default=0)
    total_advisor_sessions = serializers.IntegerField(default=0)
    advisor_sessions_today = serializers.IntegerField(default=0)
    advisor_sessions_month = serializers.IntegerField(default=0)


# ── Revenue Analytics ───────────────────────────────────────────

class RevenuePeriodSerializer(serializers.Serializer):
    date = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders = serializers.IntegerField()
    payments = serializers.IntegerField()


class RevenueAnalyticsSerializer(serializers.Serializer):
    period = serializers.CharField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    total_payments = serializers.IntegerField()
    avg_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    data = RevenuePeriodSerializer(many=True)
    payment_methods = serializers.DictField()


# ── User Analytics ──────────────────────────────────────────────

class UserGrowthPointSerializer(serializers.Serializer):
    date = serializers.CharField()
    count = serializers.IntegerField()


class UserAnalyticsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    verified_users = serializers.IntegerField()
    unverified_users = serializers.IntegerField()
    by_role = serializers.DictField()
    by_province = serializers.DictField()
    growth = UserGrowthPointSerializer(many=True)


# ── Admin User Management ──────────────────────────────────────

class AdminUserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    order_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'role', 'is_verified', 'is_active',
            'province', 'company_name', 'account_type',
            'order_count', 'total_spent',
            'last_activity', 'created_at',
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class AdminUserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'role', 'is_verified', 'is_phone_verified', 'is_active',
            'avatar', 'date_of_birth', 'address', 'city', 'province',
            'company_name', 'account_type',
            'last_activity', 'last_login_ip', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'email', 'last_activity', 'last_login_ip', 'created_at', 'updated_at']


class AdminUserUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[('customer', 'Customer'), ('technician', 'Technician'), ('admin', 'Admin')],
        required=False,
    )
    is_active = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)


# ── Recent Activity ─────────────────────────────────────────────

class RecentActivitySerializer(serializers.Serializer):
    type = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    url = serializers.CharField(allow_blank=True)
    icon = serializers.CharField()


# ── Page View Tracking ──────────────────────────────────────────

class PageViewCreateSerializer(serializers.Serializer):
    path = serializers.CharField(max_length=500)
    referrer = serializers.URLField(max_length=1000, required=False, allow_blank=True)


# ── Daily Snapshot ──────────────────────────────────────────────

class DailySnapshotSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_users = serializers.IntegerField()
    new_users = serializers.IntegerField()
    new_orders = serializers.IntegerField()
    revenue_usd = serializers.DecimalField(max_digits=12, decimal_places=2)
    new_tickets = serializers.IntegerField()
    resolved_tickets = serializers.IntegerField()
    new_enrollments = serializers.IntegerField()
    page_views = serializers.IntegerField()
