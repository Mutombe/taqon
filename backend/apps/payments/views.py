import hashlib
import json
import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.pagination import StandardPagination
from apps.core.utils import get_client_ip
from apps.shop.models import Order

from .models import Payment, PackageDeposit
from .serializers import (
    InitiatePaymentSerializer,
    PaymentSerializer,
    PaymentListSerializer,
    VerifyPaymentSerializer,
    InitiateDepositSerializer,
    PackageDepositSerializer,
)
from .services import PaymentService

logger = logging.getLogger(__name__)


@extend_schema(tags=['Payments'])
class InitiatePaymentView(APIView):
    """
    Initiate a payment for an order.

    Returns the Payment object including redirect_url (for Paynow web)
    or stripe_client_secret (for Stripe card payments).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Find the order
        try:
            order = Order.objects.get(
                order_number=data['order_number'],
                user=request.user,
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Don't allow payment on already paid orders
        if order.payment_status == 'paid':
            return Response(
                {'error': 'This order has already been paid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Don't allow payment on cancelled/refunded orders
        if order.status in ('cancelled', 'refunded'):
            return Response(
                {'error': f'Cannot pay for an order with status "{order.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build return URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return_url = data.get('return_url') or f'{frontend_url}/payment/return?ref={{ref}}'

        payment, error = PaymentService.initiate_payment(
            payable_object=order,
            user=request.user,
            amount=order.total,
            method=data['method'],
            currency=order.currency,
            phone=data.get('phone', ''),
            description=f'Taqon Electrico Order {order.order_number}',
            return_url=return_url.replace('{ref}', ''),
            ip_address=get_client_ip(request),
            metadata={'order_number': order.order_number},
        )

        if error and not payment:
            return Response(
                {'error': error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment and payment.status == 'failed':
            return Response(
                {'error': error or 'Payment initiation failed.', 'payment': PaymentSerializer(payment).data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update order payment status to pending
        if order.payment_status == 'unpaid':
            order.payment_status = 'pending'
            order.payment_method = data['method']
            order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Payments'])
class VerifyPaymentView(APIView):
    """
    Check the current status of a payment by polling the gateway.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payment = Payment.objects.get(
                reference=serializer.validated_data['reference'],
                user=request.user,
            )
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        payment, error = PaymentService.verify_payment(payment)

        if error:
            return Response(
                {'error': error, 'payment': PaymentSerializer(payment).data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(PaymentSerializer(payment).data)


@extend_schema(tags=['Payments'])
class PaymentDetailView(APIView):
    """Retrieve a single payment by reference."""

    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        try:
            payment = Payment.objects.get(
                reference=reference,
                user=request.user,
            )
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(PaymentSerializer(payment).data)


@extend_schema(tags=['Payments'])
class PaymentHistoryView(APIView):
    """List all payments for the authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.filter(user=request.user)

        # Optional filter by status
        payment_status = request.query_params.get('status')
        if payment_status:
            payments = payments.filter(status=payment_status)

        # Optional filter by order
        order_number = request.query_params.get('order')
        if order_number:
            from django.contrib.contenttypes.models import ContentType
            order_ct = ContentType.objects.get_for_model(Order)
            try:
                order = Order.objects.get(order_number=order_number, user=request.user)
                payments = payments.filter(content_type=order_ct, object_id=order.pk)
            except Order.DoesNotExist:
                payments = payments.none()

        paginator = StandardPagination()
        page = paginator.paginate_queryset(payments, request)
        serializer = PaymentListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['Payments'])
class OrderPaymentsView(APIView):
    """List all payment attempts for a specific order."""

    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        from django.contrib.contenttypes.models import ContentType
        order_ct = ContentType.objects.get_for_model(Order)
        payments = Payment.objects.filter(content_type=order_ct, object_id=order.pk)

        return Response(PaymentListSerializer(payments, many=True).data)


# ── Webhooks (no authentication — secured by signature) ──


@extend_schema(tags=['Payments'], exclude=True)
class PaynowWebhookView(APIView):
    """
    Receive payment result notifications from Paynow.
    No authentication — Paynow sends POST with payment status.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}

        if not payload:
            # Paynow may send form-encoded data
            payload = dict(request.POST)

        payment, error = PaymentService.process_webhook(
            gateway_name='paynow',
            payload=payload,
            headers=dict(request.headers),
            ip_address=get_client_ip(request),
        )

        if error:
            logger.warning('Paynow webhook error: %s', error)

        # Paynow expects 200 OK regardless
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Payments'], exclude=True)
class StripeWebhookView(APIView):
    """
    Receive webhook events from Stripe.
    No authentication — secured by webhook signature verification.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # Stripe sends JSON
        payload = request.data if isinstance(request.data, dict) else {}

        payment, error = PaymentService.process_webhook(
            gateway_name='stripe',
            payload=payload,
            headers=dict(request.headers),
            ip_address=get_client_ip(request),
        )

        if error:
            logger.warning('Stripe webhook error: %s', error)
            return Response(
                {'error': error},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════
# Package Deposits
# ═══════════════════════════════════════════════════════════════════════════

@extend_schema(tags=['Payments'])
class InitiateDepositView(APIView):
    """
    Initiate a 10% reservation deposit against a solar package.
    Creates a PackageDeposit record, snapshots the quoted price at the
    selected distance, and kicks off a Paynow payment.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone
        from decimal import Decimal
        from apps.solar_config.models import SolarPackageTemplate
        from apps.solar_config.engine.pricing import calculate_price

        serializer = InitiateDepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            package = SolarPackageTemplate.objects.select_related('family').get(slug=data['package_slug'])
        except SolarPackageTemplate.DoesNotExist:
            return Response({'error': 'Package not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Compute total at the client's distance — same engine used everywhere else
        distance_km = Decimal(data.get('distance_km') or 10)
        try:
            price = calculate_price(package, distance_km=distance_km)
            package_total = Decimal(str(price['total']))
        except Exception:
            package_total = package.price or Decimal('0')

        if package_total <= 0:
            return Response({'error': 'Unable to compute package total.'}, status=status.HTTP_400_BAD_REQUEST)

        deposit_percent = Decimal('10.00')
        deposit_amount = (package_total * deposit_percent / Decimal('100')).quantize(Decimal('0.01'))

        deposit = PackageDeposit.objects.create(
            user=request.user,
            package=package,
            package_name=(package.family.name if package.family else package.name),
            package_slug=package.slug,
            tier_label=data.get('tier_label') or '',
            inverter_kva=str(package.inverter_kva or ''),
            battery_kwh=str(package.battery_capacity_kwh or ''),
            distance_km=distance_km,
            package_total=package_total,
            deposit_percent=deposit_percent,
            deposit_amount=deposit_amount,
            currency='USD',
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data.get('customer_phone', ''),
            customer_address=data.get('customer_address', ''),
            terms_version='v2',
            terms_accepted_at=timezone.now(),
            terms_accepted_ip=get_client_ip(request),
            status='pending',
        )

        # Kick off the Paynow (or other) payment against this deposit
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return_url = f'{frontend_url}/account/deposits/{deposit.id}'

        payment, error = PaymentService.initiate_payment(
            payable_object=deposit,
            user=request.user,
            amount=deposit_amount,
            method=data['method'],
            currency='USD',
            phone=data.get('phone', ''),
            description=f'Taqon Electrico Deposit ({deposit.package_name})',
            return_url=return_url,
            ip_address=get_client_ip(request),
            metadata={
                'deposit_id': str(deposit.id),
                'package_slug': package.slug,
                'package_name': deposit.package_name,
                'type': 'package_deposit',
            },
        )

        if error and not payment:
            deposit.status = 'cancelled'
            deposit.save(update_fields=['status', 'updated_at'])
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        if payment and payment.status == 'failed':
            deposit.status = 'cancelled'
            deposit.save(update_fields=['status', 'updated_at'])
            return Response(
                {'error': error or 'Payment initiation failed.', 'deposit': PackageDepositSerializer(deposit).data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'deposit': PackageDepositSerializer(deposit).data,
                'payment': PaymentSerializer(payment).data,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Payments'])
class MyDepositsView(APIView):
    """List the authenticated user's deposits."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PackageDeposit.objects.filter(user=request.user).order_by('-created_at')
        return Response(PackageDepositSerializer(qs, many=True).data)


@extend_schema(tags=['Payments'])
class DepositDetailView(APIView):
    """Customer deposit detail (owner only)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, deposit_id):
        try:
            deposit = PackageDeposit.objects.get(pk=deposit_id, user=request.user)
        except PackageDeposit.DoesNotExist:
            return Response({'error': 'Deposit not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PackageDepositSerializer(deposit).data)


# ═══════════════════════════════════════════════════════════════════════════
# Admin — Deposits
# ═══════════════════════════════════════════════════════════════════════════

@extend_schema(tags=['Admin'])
class AdminDepositListView(APIView):
    """List all package deposits across all users. Filterable by status."""
    from apps.core.permissions import IsAdmin
    permission_classes = [IsAdmin]
    pagination_class = StandardPagination

    def get(self, request):
        qs = PackageDeposit.objects.all().select_related('user', 'package', 'package__family').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(customer_name__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(customer_phone__icontains=search)
                | Q(package_name__icontains=search)
            )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = PackageDepositSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


@extend_schema(tags=['Admin'])
class AdminDepositDetailView(APIView):
    """Admin deposit detail — allows updating status and notes."""
    from apps.core.permissions import IsAdmin
    permission_classes = [IsAdmin]

    def get(self, request, deposit_id):
        try:
            deposit = PackageDeposit.objects.select_related('user', 'package').get(pk=deposit_id)
        except PackageDeposit.DoesNotExist:
            return Response({'error': 'Deposit not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PackageDepositSerializer(deposit).data)

    def patch(self, request, deposit_id):
        try:
            deposit = PackageDeposit.objects.get(pk=deposit_id)
        except PackageDeposit.DoesNotExist:
            return Response({'error': 'Deposit not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Allow status + notes updates
        new_status = request.data.get('status')
        if new_status and new_status in dict(PackageDeposit.STATUS_CHOICES):
            deposit.status = new_status

        notes = request.data.get('admin_notes')
        if notes is not None:
            deposit.admin_notes = notes

        deposit.save()
        return Response(PackageDepositSerializer(deposit).data)
