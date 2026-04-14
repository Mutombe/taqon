import io
import base64
import logging
import os
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# Embed company logo as data URI — portable across xhtml2pdf/WeasyPrint
_LOGO_PATH = os.path.join(
    os.path.dirname(__file__), 'static', 'pdf_assets', 'taqon-electrico-logo.jpg',
)


def _logo_data_uri():
    try:
        with open(_LOGO_PATH, 'rb') as f:
            return 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode('ascii')
    except Exception:
        return ''


def _render_pdf(html_string):
    """Convert HTML to PDF. Tries xhtml2pdf first (pure Python), then WeasyPrint, then HTML fallback."""
    # Option 1: xhtml2pdf (pure Python, no native deps — works everywhere)
    try:
        from xhtml2pdf import pisa
        buf = io.BytesIO()
        result = pisa.CreatePDF(io.StringIO(html_string), dest=buf)
        if not result.err:
            return buf.getvalue()
        logger.warning('xhtml2pdf returned errors, trying WeasyPrint')
    except ImportError:
        pass
    except Exception:
        logger.warning('xhtml2pdf failed, trying WeasyPrint')

    # Option 2: WeasyPrint (needs native GTK libs)
    try:
        from weasyprint import HTML
        return HTML(string=html_string).write_pdf()
    except Exception:
        pass

    # Option 3: HTML fallback
    logger.warning('No PDF library available — returning HTML')
    return html_string.encode('utf-8')


def generate_quotation_pdf(quotation):
    """Generate a PDF for the given Quotation."""
    items = list(quotation.items.all().order_by('order', 'created_at'))
    html_string = render_to_string('pdfs/quotation.html', {
        'quotation': quotation,
        'items': items,
        'logo_data_uri': _logo_data_uri(),
    })
    return _render_pdf(html_string)


def generate_invoice_pdf(invoice):
    """Generate a PDF for the given Invoice."""
    items = list(invoice.items.all().order_by('order', 'created_at'))
    html_string = render_to_string('pdfs/invoice.html', {
        'invoice': invoice,
        'items': items,
        'logo_data_uri': _logo_data_uri(),
    })
    return _render_pdf(html_string)
