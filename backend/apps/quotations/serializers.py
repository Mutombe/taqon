from rest_framework import serializers
from .models import QuotationRequest, Quotation, QuotationItem, Invoice, InvoiceItem


# ── Quotation Request ──

class SubmitQuoteRequestSerializer(serializers.ModelSerializer):
    """Validates data from the QuoteWizard frontend."""

    class Meta:
        model = QuotationRequest
        fields = [
            'name', 'email', 'phone', 'message',
            'property_type', 'roof_type', 'monthly_bill',
            'appliances', 'budget_range',
            'recommended_system_kw', 'recommended_panels',
            'estimated_cost_min', 'estimated_cost_max',
        ]


class QuotationRequestSerializer(serializers.ModelSerializer):
    """Full representation for listing/detail views."""

    class Meta:
        model = QuotationRequest
        fields = [
            'id', 'name', 'email', 'phone', 'message',
            'property_type', 'roof_type', 'monthly_bill',
            'appliances', 'budget_range',
            'recommended_system_kw', 'recommended_panels',
            'estimated_cost_min', 'estimated_cost_max',
            'status', 'admin_notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class QuotationRequestListSerializer(serializers.ModelSerializer):
    """Compact list view."""

    class Meta:
        model = QuotationRequest
        fields = [
            'id', 'name', 'email', 'phone',
            'property_type', 'monthly_bill', 'budget_range',
            'status', 'created_at',
        ]
        read_only_fields = fields


class AdminQuotationRequestUpdateSerializer(serializers.ModelSerializer):
    """Admin can update status and notes."""

    class Meta:
        model = QuotationRequest
        fields = ['status', 'admin_notes', 'assigned_to']


# ── Quotation Items ──

class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = [
            'id', 'item_type', 'product', 'name', 'description',
            'sku', 'quantity', 'unit_price', 'total_price',
            'warranty', 'order',
        ]
        read_only_fields = ['id', 'total_price']


class QuotationItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = [
            'item_type', 'product', 'name', 'description',
            'sku', 'quantity', 'unit_price', 'warranty', 'order',
        ]

    def validate(self, data):
        # If product is provided, auto-fill name/sku/price
        product = data.get('product')
        if product:
            if not data.get('name'):
                data['name'] = product.name
            if not data.get('sku'):
                data['sku'] = product.sku
            if not data.get('unit_price'):
                data['unit_price'] = product.price
        return data


# ── Quotation ──

class QuotationSerializer(serializers.ModelSerializer):
    """Full quotation with items."""

    items = QuotationItemSerializer(many=True, read_only=True)
    request_id = serializers.UUIDField(source='request.id', read_only=True, allow_null=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'request_id',
            'customer', 'customer_name', 'customer_email',
            'customer_phone', 'customer_address',
            'title', 'description', 'project_type', 'system_size_kw',
            'subtotal', 'tax_rate', 'tax_amount',
            'discount_amount', 'discount_description', 'total', 'currency',
            'status', 'valid_until',
            'sent_at', 'viewed_at', 'accepted_at', 'rejected_at',
            'rejection_reason', 'terms_and_conditions', 'notes',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'quotation_number', 'subtotal', 'tax_amount', 'total',
            'sent_at', 'viewed_at', 'accepted_at', 'rejected_at',
            'created_at', 'updated_at',
        ]


class QuotationListSerializer(serializers.ModelSerializer):
    """Compact list view."""

    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'customer_name',
            'title', 'total', 'currency', 'status',
            'valid_until', 'item_count', 'created_at',
        ]
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()


class AdminQuotationCreateSerializer(serializers.ModelSerializer):
    """Admin creates a new quotation."""

    items = QuotationItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Quotation
        fields = [
            'request', 'customer', 'customer_name', 'customer_email',
            'customer_phone', 'customer_address',
            'title', 'description', 'project_type', 'system_size_kw',
            'tax_rate', 'discount_amount', 'discount_description',
            'currency', 'valid_until',
            'terms_and_conditions', 'notes', 'items',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quotation = Quotation.objects.create(**validated_data)

        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)

        quotation.recalculate_totals()
        return quotation


class QuotationStatusUpdateSerializer(serializers.Serializer):
    """Customer accepts/rejects a quotation."""

    action = serializers.ChoiceField(choices=['accept', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')


# ── Invoice ──

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'name', 'description', 'quantity', 'unit_price', 'total_price', 'order']
        read_only_fields = ['id', 'total_price']


class InvoiceSerializer(serializers.ModelSerializer):
    """Full invoice with items."""

    items = InvoiceItemSerializer(many=True, read_only=True)
    has_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number',
            'customer', 'customer_name', 'customer_email',
            'customer_phone', 'customer_address',
            'subtotal', 'tax_rate', 'tax_amount',
            'discount_amount', 'total',
            'amount_paid', 'amount_due', 'currency',
            'status', 'issue_date', 'due_date', 'paid_at',
            'notes', 'terms',
            'has_pdf', 'items',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_has_pdf(self, obj):
        return bool(obj.pdf_file)


class InvoiceListSerializer(serializers.ModelSerializer):
    """Compact list view."""

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name',
            'total', 'amount_due', 'currency',
            'status', 'issue_date', 'due_date', 'created_at',
        ]
        read_only_fields = fields
