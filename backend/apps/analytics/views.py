from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.core.permissions import IsAdmin, IsSuperAdmin
from apps.core.pagination import StandardPagination, SmallPagination
from apps.core.utils import get_client_ip

from .models import PageView, DailySnapshot
from .serializers import (
    DashboardOverviewSerializer,
    RevenueAnalyticsSerializer,
    UserAnalyticsSerializer,
    AdminUserListSerializer,
    AdminUserDetailSerializer,
    AdminUserUpdateSerializer,
    RecentActivitySerializer,
    PageViewCreateSerializer,
    DailySnapshotSerializer,
)


# ── Helper ──────────────────────────────────────────────────────

def _safe_import(module_path, class_name):
    """Import a model class safely, returning None if unavailable."""
    try:
        from importlib import import_module
        mod = import_module(module_path)
        return getattr(mod, class_name, None)
    except Exception:
        return None


def _count(model, **filters):
    if model is None:
        return 0
    try:
        return model.objects.filter(**filters).count()
    except Exception:
        return 0


def _aggregate(model, field, func=Sum, **filters):
    if model is None:
        return Decimal('0')
    try:
        result = model.objects.filter(**filters).aggregate(val=func(field))
        return result['val'] or Decimal('0')
    except Exception:
        return Decimal('0')


# ── Dashboard Overview ──────────────────────────────────────────

class DashboardOverviewView(APIView):
    """Main admin dashboard KPI cards."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        month_start = today_start.replace(day=1)

        # Lazy model imports
        Order = _safe_import('apps.shop.models', 'Order')
        Payment = _safe_import('apps.payments.models', 'Payment')
        Quotation = _safe_import('apps.quotations.models', 'Quotation')
        QuotationRequest = _safe_import('apps.quotations.models', 'QuotationRequest')
        SupportTicket = _safe_import('apps.chatbot.models', 'SupportTicket')
        Enrollment = _safe_import('apps.courses.models', 'Enrollment')
        Job = _safe_import('apps.technicians.models', 'Job')
        Notification = _safe_import('apps.notifications.models', 'Notification')

        # Users
        total_users = User.objects.filter(is_deleted=False).count()
        new_users_today = User.objects.filter(created_at__gte=today_start, is_deleted=False).count()
        new_users_week = User.objects.filter(created_at__gte=week_start, is_deleted=False).count()
        new_users_month = User.objects.filter(created_at__gte=month_start, is_deleted=False).count()
        users_by_role = dict(
            User.objects.filter(is_deleted=False)
            .values_list('role')
            .annotate(c=Count('id'))
            .values_list('role', 'c')
        )

        # Orders
        total_orders = _count(Order)
        pending_orders = _count(Order, status='pending')
        processing_orders = _count(Order, status='processing')
        delivered_orders = _count(Order, status='delivered')
        orders_today = _count(Order, created_at__gte=today_start)

        # Revenue (from paid payments)
        total_revenue = _aggregate(Payment, 'amount', status='paid')
        revenue_today = _aggregate(Payment, 'amount', status='paid', paid_at__gte=today_start)
        revenue_week = _aggregate(Payment, 'amount', status='paid', paid_at__gte=week_start)
        revenue_month = _aggregate(Payment, 'amount', status='paid', paid_at__gte=month_start)

        # Quotations
        total_quotations = _count(Quotation)
        pending_requests = _count(QuotationRequest, status='new')
        accepted_quotations = _count(Quotation, status='accepted')
        sent_quotations = _count(Quotation, status__in=['sent', 'viewed', 'accepted', 'rejected'])
        conversion_rate = round((accepted_quotations / sent_quotations * 100) if sent_quotations else 0, 1)

        # Support
        open_tickets = _count(SupportTicket, status__in=['open', 'in_progress', 'waiting_customer', 'waiting_staff'])
        unassigned_tickets = _count(SupportTicket, assigned_to__isnull=True, status__in=['open', 'in_progress'])

        avg_resolution = None
        if SupportTicket:
            try:
                resolved = SupportTicket.objects.filter(status__in=['resolved', 'closed'], resolved_at__isnull=False)
                if resolved.exists():
                    from django.db.models import ExpressionWrapper, DurationField
                    avg_dur = resolved.aggregate(
                        avg=Avg(ExpressionWrapper(F('resolved_at') - F('created_at'), output_field=DurationField()))
                    )['avg']
                    avg_resolution = round(avg_dur.total_seconds() / 3600, 1) if avg_dur else None
            except Exception:
                pass

        # Courses
        total_enrollments = _count(Enrollment)
        active_enrollments = _count(Enrollment, status='active')

        # Technicians
        active_technicians = User.objects.filter(role='technician', is_active=True, is_deleted=False).count()
        pending_jobs = _count(Job, status__in=['assigned', 'scheduled']) if Job else 0

        # Notifications
        unread_notifications = _count(Notification, is_read=False)

        data = {
            'total_users': total_users,
            'new_users_today': new_users_today,
            'new_users_this_week': new_users_week,
            'new_users_this_month': new_users_month,
            'users_by_role': users_by_role,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'processing_orders': processing_orders,
            'delivered_orders': delivered_orders,
            'orders_today': orders_today,
            'total_revenue': total_revenue,
            'revenue_today': revenue_today,
            'revenue_this_week': revenue_week,
            'revenue_this_month': revenue_month,
            'total_quotations': total_quotations,
            'pending_quotation_requests': pending_requests,
            'accepted_quotations': accepted_quotations,
            'conversion_rate': conversion_rate,
            'open_tickets': open_tickets,
            'unassigned_tickets': unassigned_tickets,
            'avg_resolution_hours': avg_resolution,
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
            'active_technicians': active_technicians,
            'pending_jobs': pending_jobs,
            'unread_notifications': unread_notifications,
        }
        serializer = DashboardOverviewSerializer(data)
        return Response(serializer.data)


# ── Revenue Analytics ───────────────────────────────────────────

class RevenueAnalyticsView(APIView):
    """Revenue breakdown by period (daily/weekly/monthly)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        days = int(request.query_params.get('days', 30))

        Payment = _safe_import('apps.payments.models', 'Payment')
        Order = _safe_import('apps.shop.models', 'Order')
        if not Payment:
            return Response({'detail': 'Payment module unavailable.'}, status=400)

        since = timezone.now() - timedelta(days=days)
        paid = Payment.objects.filter(status='paid', paid_at__gte=since)

        trunc_map = {'daily': TruncDate, 'weekly': TruncWeek, 'monthly': TruncMonth}
        trunc_fn = trunc_map.get(period, TruncDate)

        timeline = (
            paid.annotate(date=trunc_fn('paid_at'))
            .values('date')
            .annotate(revenue=Sum('amount'), payments=Count('id'))
            .order_by('date')
        )

        # Count orders per period
        orders_qs = Order.objects.filter(created_at__gte=since) if Order else None
        orders_by_date = {}
        if orders_qs:
            for row in orders_qs.annotate(date=trunc_fn('created_at')).values('date').annotate(c=Count('id')):
                orders_by_date[str(row['date'])] = row['c']

        data_points = []
        for row in timeline:
            d = str(row['date'])
            data_points.append({
                'date': d,
                'revenue': row['revenue'] or Decimal('0'),
                'payments': row['payments'],
                'orders': orders_by_date.get(d, 0),
            })

        total_rev = paid.aggregate(t=Sum('amount'))['t'] or Decimal('0')
        total_payments = paid.count()
        total_orders = Order.objects.filter(created_at__gte=since).count() if Order else 0
        avg_order = round(total_rev / total_orders, 2) if total_orders else Decimal('0')

        # Payment method breakdown
        method_breakdown = dict(
            paid.values_list('method')
            .annotate(c=Count('id'))
            .values_list('method', 'c')
        )

        result = {
            'period': period,
            'total_revenue': total_rev,
            'total_orders': total_orders,
            'total_payments': total_payments,
            'avg_order_value': avg_order,
            'data': data_points,
            'payment_methods': method_breakdown,
        }
        serializer = RevenueAnalyticsSerializer(result)
        return Response(serializer.data)


# ── User Analytics ──────────────────────────────────────────────

class UserAnalyticsView(APIView):
    """User growth and distribution analytics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        users = User.objects.filter(is_deleted=False)
        total = users.count()
        verified = users.filter(is_verified=True).count()

        by_role = dict(
            users.values_list('role').annotate(c=Count('id')).values_list('role', 'c')
        )
        by_province = dict(
            users.exclude(province='').values_list('province').annotate(c=Count('id')).values_list('province', 'c')
        )

        growth = list(
            users.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
            .values('date', 'count')
        )
        for g in growth:
            g['date'] = str(g['date'])

        data = {
            'total_users': total,
            'verified_users': verified,
            'unverified_users': total - verified,
            'by_role': by_role,
            'by_province': by_province,
            'growth': growth,
        }
        serializer = UserAnalyticsSerializer(data)
        return Response(serializer.data)


# ── Order Analytics ─────────────────────────────────────────────

class OrderAnalyticsView(APIView):
    """Order status breakdown and trends."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        Order = _safe_import('apps.shop.models', 'Order')
        if not Order:
            return Response({'detail': 'Shop module unavailable.'}, status=400)

        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        orders = Order.objects.all()
        status_breakdown = dict(
            orders.values_list('status').annotate(c=Count('id')).values_list('status', 'c')
        )
        payment_status_breakdown = dict(
            orders.values_list('payment_status').annotate(c=Count('id')).values_list('payment_status', 'c')
        )

        daily_orders = list(
            orders.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'), revenue=Sum('total'))
            .order_by('date')
        )
        for d in daily_orders:
            d['date'] = str(d['date'])
            d['revenue'] = str(d['revenue'] or 0)

        top_products = []
        OrderItem = _safe_import('apps.shop.models', 'OrderItem')
        if OrderItem:
            top_products = list(
                OrderItem.objects.filter(order__created_at__gte=since)
                .values('product__name')
                .annotate(qty=Sum('quantity'), revenue=Sum(F('unit_price') * F('quantity')))
                .order_by('-qty')[:10]
            )
            for p in top_products:
                p['revenue'] = str(p['revenue'] or 0)

        return Response({
            'total_orders': orders.count(),
            'status_breakdown': status_breakdown,
            'payment_status_breakdown': payment_status_breakdown,
            'daily_orders': daily_orders,
            'top_products': top_products,
        })


# ── Support Analytics ───────────────────────────────────────────

class SupportAnalyticsView(APIView):
    """Support ticket analytics."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        SupportTicket = _safe_import('apps.chatbot.models', 'SupportTicket')
        if not SupportTicket:
            return Response({'detail': 'Support module unavailable.'}, status=400)

        tickets = SupportTicket.objects.all()
        status_breakdown = dict(
            tickets.values_list('status').annotate(c=Count('id')).values_list('status', 'c')
        )
        category_breakdown = dict(
            tickets.values_list('category').annotate(c=Count('id')).values_list('category', 'c')
        )
        priority_breakdown = dict(
            tickets.values_list('priority').annotate(c=Count('id')).values_list('priority', 'c')
        )

        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        daily_tickets = list(
            tickets.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        for d in daily_tickets:
            d['date'] = str(d['date'])

        avg_satisfaction = tickets.filter(
            satisfaction_rating__isnull=False
        ).aggregate(avg=Avg('satisfaction_rating'))['avg']

        return Response({
            'total_tickets': tickets.count(),
            'status_breakdown': status_breakdown,
            'category_breakdown': category_breakdown,
            'priority_breakdown': priority_breakdown,
            'daily_tickets': daily_tickets,
            'avg_satisfaction': round(avg_satisfaction, 1) if avg_satisfaction else None,
        })


# ── Admin User Management ──────────────────────────────────────

class AdminUserListView(ListAPIView):
    """Paginated, filterable user list for admin."""
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AdminUserListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = User.objects.filter(is_deleted=False)

        # Annotate order stats
        Order = _safe_import('apps.shop.models', 'Order')
        if Order:
            qs = qs.annotate(
                order_count=Count('orders', distinct=True),
                total_spent=Sum('orders__total'),
            )
        else:
            from django.db.models import Value
            qs = qs.annotate(
                order_count=Value(0),
                total_spent=Value(Decimal('0')),
            )

        # Filters
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)

        is_verified = self.request.query_params.get('is_verified')
        if is_verified == 'true':
            qs = qs.filter(is_verified=True)
        elif is_verified == 'false':
            qs = qs.filter(is_verified=False)

        is_active = self.request.query_params.get('is_active')
        if is_active == 'true':
            qs = qs.filter(is_active=True)
        elif is_active == 'false':
            qs = qs.filter(is_active=False)

        province = self.request.query_params.get('province')
        if province:
            qs = qs.filter(province=province)

        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(company_name__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed = ['created_at', '-created_at', 'email', '-email', 'last_activity', '-last_activity']
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs


class AdminUserDetailView(RetrieveUpdateAPIView):
    """View / update a single user (role, active, verified)."""
    permission_classes = [IsAuthenticated, IsAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.filter(is_deleted=False)

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return AdminUserUpdateSerializer
        return AdminUserDetailSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = AdminUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Prevent non-superadmins from creating admins
        new_role = serializer.validated_data.get('role')
        if new_role == 'admin' and request.user.role != 'superadmin':
            return Response(
                {'detail': 'Only superadmins can assign the admin role.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save(update_fields=list(serializer.validated_data.keys()))

        return Response(AdminUserDetailSerializer(user).data)


# ── Recent Activity Feed ────────────────────────────────────────

class RecentActivityView(APIView):
    """Cross-app recent activity feed for the admin dashboard."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        limit = int(request.query_params.get('limit', 20))
        activities = []

        # Recent orders
        Order = _safe_import('apps.shop.models', 'Order')
        if Order:
            for o in Order.objects.select_related('user').order_by('-created_at')[:limit]:
                name = f"{o.user.first_name} {o.user.last_name}".strip() if o.user else 'Guest'
                activities.append({
                    'type': 'order',
                    'title': f'New order {o.order_number}',
                    'description': f'{name} placed an order for ${o.total}',
                    'timestamp': o.created_at,
                    'url': f'/admin/orders/{o.order_number}',
                    'icon': 'ShoppingCart',
                })

        # Recent users
        for u in User.objects.filter(is_deleted=False).order_by('-created_at')[:limit]:
            activities.append({
                'type': 'user',
                'title': 'New user registered',
                'description': f'{u.first_name} {u.last_name} ({u.email})',
                'timestamp': u.created_at,
                'url': f'/admin/users/{u.id}',
                'icon': 'UserPlus',
            })

        # Recent tickets
        SupportTicket = _safe_import('apps.chatbot.models', 'SupportTicket')
        if SupportTicket:
            for t in SupportTicket.objects.select_related('customer').order_by('-created_at')[:limit]:
                name = f"{t.customer.first_name}" if t.customer else 'User'
                activities.append({
                    'type': 'ticket',
                    'title': f'Ticket {t.ticket_number}',
                    'description': f'{name}: {t.subject}',
                    'timestamp': t.created_at,
                    'url': f'/support/tickets/{t.ticket_number}',
                    'icon': 'MessageSquare',
                })

        # Recent payments
        Payment = _safe_import('apps.payments.models', 'Payment')
        if Payment:
            for p in Payment.objects.filter(status='paid').order_by('-paid_at')[:limit]:
                activities.append({
                    'type': 'payment',
                    'title': f'Payment received ${p.amount}',
                    'description': f'{p.method} via {p.gateway}',
                    'timestamp': p.paid_at or p.created_at,
                    'url': '',
                    'icon': 'CreditCard',
                })

        # Sort by timestamp, return top N
        activities.sort(key=lambda a: a['timestamp'], reverse=True)
        activities = activities[:limit]

        serializer = RecentActivitySerializer(activities, many=True)
        return Response(serializer.data)


# ── Page View Tracking ──────────────────────────────────────────

class TrackPageViewView(APIView):
    """Record a page view (public endpoint)."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PageViewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ua = request.META.get('HTTP_USER_AGENT', '')
        device = 'mobile'
        if 'tablet' in ua.lower() or 'ipad' in ua.lower():
            device = 'tablet'
        elif 'mobile' not in ua.lower() and 'android' not in ua.lower():
            device = 'desktop'

        PageView.objects.create(
            user=request.user if request.user.is_authenticated else None,
            path=serializer.validated_data['path'],
            referrer=serializer.validated_data.get('referrer', ''),
            user_agent=ua[:500],
            ip_address=get_client_ip(request),
            session_key=request.session.session_key or '',
            device_type=device,
        )
        return Response({'status': 'ok'}, status=status.HTTP_201_CREATED)


# ── Daily Snapshots ─────────────────────────────────────────────

class DailySnapshotListView(APIView):
    """Return pre-aggregated daily snapshots for charting."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now().date() - timedelta(days=days)
        snapshots = DailySnapshot.objects.filter(date__gte=since).order_by('date')
        serializer = DailySnapshotSerializer(snapshots, many=True)
        return Response(serializer.data)
