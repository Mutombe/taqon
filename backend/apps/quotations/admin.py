from django.contrib import admin
from .models import QuotationRequest, Quotation, QuotationItem, Invoice, InvoiceItem


@admin.register(QuotationRequest)
class QuotationRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'property_type', 'monthly_bill', 'budget_range', 'status', 'created_at']
    list_filter = ['status', 'property_type', 'roof_type', 'created_at']
    search_fields = ['name', 'email', 'phone']
    readonly_fields = ['id', 'user', 'ip_address', 'created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Contact', {'fields': ('name', 'email', 'phone', 'message', 'user')}),
        ('Wizard Data', {'fields': ('property_type', 'roof_type', 'monthly_bill', 'appliances', 'budget_range')}),
        ('Recommendation', {'fields': ('recommended_system_kw', 'recommended_panels', 'estimated_cost_min', 'estimated_cost_max')}),
        ('Admin', {'fields': ('status', 'admin_notes', 'assigned_to', 'ip_address')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1
    fields = ['item_type', 'name', 'description', 'sku', 'quantity', 'unit_price', 'total_price', 'warranty', 'order']
    readonly_fields = ['total_price']


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['quotation_number', 'customer_name', 'title', 'total', 'currency', 'status', 'valid_until', 'created_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['quotation_number', 'customer_name', 'customer_email']
    readonly_fields = ['id', 'quotation_number', 'subtotal', 'tax_amount', 'total', 'sent_at', 'viewed_at', 'accepted_at', 'rejected_at', 'created_at', 'updated_at']
    inlines = [QuotationItemInline]
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('quotation_number', 'request', 'status')}),
        ('Customer', {'fields': ('customer', 'customer_name', 'customer_email', 'customer_phone', 'customer_address')}),
        ('Project', {'fields': ('title', 'description', 'project_type', 'system_size_kw')}),
        ('Pricing', {'fields': ('subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'discount_description', 'total', 'currency')}),
        ('Validity', {'fields': ('valid_until', 'sent_at', 'viewed_at', 'accepted_at', 'rejected_at', 'rejection_reason')}),
        ('Terms', {'fields': ('terms_and_conditions', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    fields = ['name', 'description', 'quantity', 'unit_price', 'total_price', 'order']
    readonly_fields = ['total_price']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer_name', 'total', 'amount_due', 'currency', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['invoice_number', 'customer_name', 'customer_email']
    readonly_fields = ['id', 'invoice_number', 'amount_due', 'content_type', 'object_id', 'paid_at', 'created_at', 'updated_at']
    inlines = [InvoiceItemInline]
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('invoice_number', 'status')}),
        ('Linked Object', {'fields': ('content_type', 'object_id')}),
        ('Customer', {'fields': ('customer', 'customer_name', 'customer_email', 'customer_phone', 'customer_address')}),
        ('Pricing', {'fields': ('subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total', 'amount_paid', 'amount_due', 'currency')}),
        ('Dates', {'fields': ('issue_date', 'due_date', 'paid_at')}),
        ('Documents', {'fields': ('pdf_file',)}),
        ('Content', {'fields': ('notes', 'terms')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
