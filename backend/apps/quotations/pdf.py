import logging
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _render_pdf(html_string):
    """Try WeasyPrint, fall back to raw HTML bytes if unavailable."""
    try:
        from weasyprint import HTML
        return HTML(string=html_string).write_pdf()
    except Exception:
        logger.warning('WeasyPrint unavailable — returning HTML fallback.')
        return html_string.encode('utf-8')


def generate_quotation_pdf(quotation):
    """Generate a PDF for the given Quotation."""
    items = list(quotation.items.all().order_by('order', 'created_at'))
    html_string = render_to_string('pdfs/quotation.html', {
        'quotation': quotation,
        'items': items,
    })
    return _render_pdf(html_string)


def generate_invoice_pdf(invoice):
    """Generate a PDF for the given Invoice."""
    items = list(invoice.items.all().order_by('order', 'created_at'))
    html_string = render_to_string('pdfs/invoice.html', {
        'invoice': invoice,
        'items': items,
    })
    return _render_pdf(html_string)
