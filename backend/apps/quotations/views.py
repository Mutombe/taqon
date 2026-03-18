import logging

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsAdmin
from apps.core.utils import get_client_ip

from .models import QuotationRequest, Quotation, QuotationItem, Invoice
from .serializers import (
    SubmitQuoteRequestSerializer,
    QuotationRequestSerializer,
    QuotationRequestListSerializer,
    AdminQuotationRequestUpdateSerializer,
    QuotationSerializer,
    QuotationListSerializer,
    AdminQuotationCreateSerializer,
    QuotationItemCreateSerializer,
    QuotationStatusUpdateSerializer,
    InvoiceSerializer,
    InvoiceListSerializer,
)
from .services import InvoiceService

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════
# Quotation Requests (public + customer)
# ══════════════════════════════════════════════

@extend_schema(tags=['Quotations'])
class SubmitQuoteRequestView(APIView):
    """
    Submit a quote request from the QuoteWizard.
    Works for both authenticated and anonymous users.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = SubmitQuoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quote_request = serializer.save(
            user=request.user if request.user.is_authenticated else None,
            ip_address=get_client_ip(request),
        )

        return Response(
            QuotationRequestSerializer(quote_request).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Quotations'])
class MyQuoteRequestsView(generics.ListAPIView):
    """List the authenticated user's quote requests."""

    permission_classes = [IsAuthenticated]
    serializer_class = QuotationRequestListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return QuotationRequest.objects.filter(user=self.request.user)


@extend_schema(tags=['Quotations'])
class QuoteRequestDetailView(generics.RetrieveAPIView):
    """Retrieve a single quote request."""

    permission_classes = [IsAuthenticated]
    serializer_class = QuotationRequestSerializer

    def get_queryset(self):
        if self.request.user.role in ('admin', 'superadmin'):
            return QuotationRequest.objects.all()
        return QuotationRequest.objects.filter(user=self.request.user)


# ══════════════════════════════════════════════
# Admin: Quotation Request Management
# ══════════════════════════════════════════════

@extend_schema(tags=['Quotations'])
class AdminQuoteRequestListView(generics.ListAPIView):
    """Admin: List all quote requests with filtering."""

    permission_classes = [IsAdmin]
    serializer_class = QuotationRequestListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = QuotationRequest.objects.all()
        params = self.request.query_params

        req_status = params.get('status')
        if req_status:
            qs = qs.filter(status=req_status)

        property_type = params.get('property_type')
        if property_type:
            qs = qs.filter(property_type=property_type)

        return qs


@extend_schema(tags=['Quotations'])
class AdminQuoteRequestUpdateView(APIView):
    """Admin: Update a quote request's status/notes."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            quote_request = QuotationRequest.objects.get(pk=pk)
        except QuotationRequest.DoesNotExist:
            return Response({'error': 'Quote request not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminQuotationRequestUpdateSerializer(quote_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(QuotationRequestSerializer(quote_request).data)


# ══════════════════════════════════════════════
# Customer: Quotations
# ══════════════════════════════════════════════

@extend_schema(tags=['Quotations'])
class MyQuotationsView(generics.ListAPIView):
    """List the authenticated user's quotations."""

    permission_classes = [IsAuthenticated]
    serializer_class = QuotationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Quotation.objects.filter(customer=self.request.user).prefetch_related('items')


@extend_schema(tags=['Quotations'])
class QuotationDetailView(APIView):
    """
    Retrieve a quotation by number.
    Marks it as 'viewed' on first access by the customer.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, quotation_number):
        try:
            if request.user.role in ('admin', 'superadmin'):
                quotation = Quotation.objects.prefetch_related('items').get(
                    quotation_number=quotation_number,
                )
            else:
                quotation = Quotation.objects.prefetch_related('items').get(
                    quotation_number=quotation_number,
                    customer=request.user,
                )
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Mark as viewed on first customer access
        if quotation.status == 'sent' and request.user == quotation.customer:
            quotation.status = 'viewed'
            quotation.viewed_at = timezone.now()
            quotation.save(update_fields=['status', 'viewed_at', 'updated_at'])

        return Response(QuotationSerializer(quotation).data)


@extend_schema(tags=['Quotations'])
class QuotationRespondView(APIView):
    """Customer accepts or rejects a quotation."""

    permission_classes = [IsAuthenticated]

    def post(self, request, quotation_number):
        try:
            quotation = Quotation.objects.get(
                quotation_number=quotation_number,
                customer=request.user,
            )
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quotation.status not in ('sent', 'viewed'):
            return Response(
                {'error': f'Cannot respond to a quotation with status "{quotation.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if expired
        if quotation.valid_until and quotation.valid_until < timezone.now().date():
            quotation.status = 'expired'
            quotation.save(update_fields=['status', 'updated_at'])
            return Response(
                {'error': 'This quotation has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = QuotationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']

        if action == 'accept':
            quotation.status = 'accepted'
            quotation.accepted_at = timezone.now()
            quotation.save(update_fields=['status', 'accepted_at', 'updated_at'])

            # Auto-generate invoice
            InvoiceService.create_from_quotation(quotation, created_by=request.user)

        elif action == 'reject':
            quotation.status = 'rejected'
            quotation.rejected_at = timezone.now()
            quotation.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            quotation.save(update_fields=['status', 'rejected_at', 'rejection_reason', 'updated_at'])

        return Response(QuotationSerializer(quotation).data)


# ══════════════════════════════════════════════
# Admin: Quotation Management
# ══════════════════════════════════════════════

@extend_schema(tags=['Quotations'])
class AdminQuotationListView(generics.ListAPIView):
    """Admin: List all quotations."""

    permission_classes = [IsAdmin]
    serializer_class = QuotationListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Quotation.objects.prefetch_related('items').all()
        q_status = self.request.query_params.get('status')
        if q_status:
            qs = qs.filter(status=q_status)
        return qs


@extend_schema(tags=['Quotations'])
class AdminQuotationCreateView(APIView):
    """Admin: Create a new quotation."""

    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = AdminQuotationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quotation = serializer.save(created_by=request.user)

        return Response(
            QuotationSerializer(quotation).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Quotations'])
class AdminQuotationAddItemView(APIView):
    """Admin: Add an item to a quotation."""

    permission_classes = [IsAdmin]

    def post(self, request, quotation_number):
        try:
            quotation = Quotation.objects.get(quotation_number=quotation_number)
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quotation.status not in ('draft',):
            return Response(
                {'error': 'Can only add items to draft quotations.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = QuotationItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(quotation=quotation)
        quotation.recalculate_totals()

        return Response(QuotationSerializer(quotation).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Quotations'])
class AdminQuotationSendView(APIView):
    """Admin: Mark a quotation as sent."""

    permission_classes = [IsAdmin]

    def post(self, request, quotation_number):
        try:
            quotation = Quotation.objects.get(quotation_number=quotation_number)
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quotation.status != 'draft':
            return Response(
                {'error': f'Cannot send a quotation with status "{quotation.status}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not quotation.items.exists():
            return Response(
                {'error': 'Cannot send a quotation with no items.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        quotation.status = 'sent'
        quotation.sent_at = timezone.now()
        quotation.save(update_fields=['status', 'sent_at', 'updated_at'])

        return Response(QuotationSerializer(quotation).data)


# ══════════════════════════════════════════════
# Invoices
# ══════════════════════════════════════════════

@extend_schema(tags=['Quotations'])
class MyInvoicesView(generics.ListAPIView):
    """List the authenticated user's invoices."""

    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        return Invoice.objects.filter(customer=self.request.user)


@extend_schema(tags=['Quotations'])
class InvoiceDetailView(APIView):
    """Retrieve a single invoice."""

    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_number):
        try:
            if request.user.role in ('admin', 'superadmin'):
                invoice = Invoice.objects.prefetch_related('items').get(
                    invoice_number=invoice_number,
                )
            else:
                invoice = Invoice.objects.prefetch_related('items').get(
                    invoice_number=invoice_number,
                    customer=request.user,
                )
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(InvoiceSerializer(invoice).data)


@extend_schema(tags=['Quotations'])
class AdminInvoiceListView(generics.ListAPIView):
    """Admin: List all invoices."""

    permission_classes = [IsAdmin]
    serializer_class = InvoiceListSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Invoice.objects.all()
        inv_status = self.request.query_params.get('status')
        if inv_status:
            qs = qs.filter(status=inv_status)
        return qs


@extend_schema(tags=['Quotations'])
class AdminGenerateOrderInvoiceView(APIView):
    """Admin: Generate an invoice from an existing order."""

    permission_classes = [IsAdmin]

    def post(self, request, order_number):
        from apps.shop.models import Order

        try:
            order = Order.objects.prefetch_related('items').get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        invoice = InvoiceService.create_from_order(order, created_by=request.user)
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Quotations'])
class InvoiceDownloadPDFView(APIView):
    """Download the PDF for an invoice."""

    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_number):
        from django.http import HttpResponse
        from .pdf import generate_invoice_pdf

        try:
            if request.user.role in ('admin', 'superadmin'):
                invoice = Invoice.objects.prefetch_related('items').get(
                    invoice_number=invoice_number,
                )
            else:
                invoice = Invoice.objects.prefetch_related('items').get(
                    invoice_number=invoice_number,
                    customer=request.user,
                )
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            pdf_bytes = generate_invoice_pdf(invoice)
        except Exception as e:
            logger.exception('PDF generation failed for %s', invoice_number)
            return Response(
                {'error': 'PDF generation failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response


class QuotationDownloadPDFView(APIView):
    """Download the PDF for a quotation."""

    permission_classes = [IsAuthenticated]

    def get(self, request, quotation_number):
        from django.http import HttpResponse
        from .pdf import generate_quotation_pdf

        try:
            if request.user.role in ('admin', 'superadmin'):
                quotation = Quotation.objects.prefetch_related('items').get(
                    quotation_number=quotation_number,
                )
            else:
                quotation = Quotation.objects.prefetch_related('items').get(
                    quotation_number=quotation_number,
                    customer=request.user,
                )
        except Quotation.DoesNotExist:
            return Response({'error': 'Quotation not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            pdf_bytes = generate_quotation_pdf(quotation)
        except Exception:
            logger.exception('PDF generation failed for %s', quotation_number)
            return Response(
                {'error': 'PDF generation failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{quotation.quotation_number}.pdf"'
        return response
