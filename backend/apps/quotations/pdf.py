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


def _render_pdf(html_string, base_url=None):
    """Convert HTML to PDF.

    Tries WeasyPrint first (full CSS3 — flex, grid, gradients, real
    fonts, external image fetching). Falls back to xhtml2pdf for
    environments where the GTK native libs are missing (e.g. local
    Windows dev). Last resort returns an HTML diagnostic page so the
    operator can see why both renderers failed instead of getting a
    silent .html download.
    """
    weasy_error = None
    xhtml_error = None

    # Option 1: WeasyPrint — modern CSS, the production renderer
    try:
        from weasyprint import HTML
        return HTML(string=html_string, base_url=base_url).write_pdf()
    except ImportError as exc:
        weasy_error = f'ImportError: {exc}'
        logger.warning('WeasyPrint not installed — falling back')
    except Exception as exc:  # pragma: no cover — runtime failure path
        weasy_error = f'{type(exc).__name__}: {exc}'
        logger.exception('WeasyPrint failed at write_pdf — falling back')

    # Option 2: xhtml2pdf — pure Python, last-resort renderer
    try:
        from xhtml2pdf import pisa
        buf = io.BytesIO()
        result = pisa.CreatePDF(io.StringIO(html_string), dest=buf)
        if not result.err:
            return buf.getvalue()
        xhtml_error = f'pisa returned err={result.err}'
        logger.warning('xhtml2pdf returned errors')
    except ImportError as exc:
        xhtml_error = f'ImportError: {exc}'
    except Exception as exc:
        xhtml_error = f'{type(exc).__name__}: {exc}'
        logger.exception('xhtml2pdf failed')

    # Option 3: diagnostic HTML so the operator can see *why* both renderers
    # failed instead of getting an opaque .html download.
    diag = (
        '<!doctype html><meta charset="utf-8"><title>PDF render failed</title>'
        '<style>body{font-family:system-ui,Arial;padding:32px;max-width:780px;'
        'margin:0 auto;color:#1a1a1a;line-height:1.55}'
        'h1{color:#F26522;margin-bottom:.4rem}'
        'h2{margin-top:24px;font-size:13pt;color:#0D0D0D}'
        'pre{background:#f5f5f5;padding:14px;border-left:3px solid #F26522;'
        'overflow:auto;font-size:11pt}</style>'
        '<h1>Could not generate PDF</h1>'
        '<p>Both PDF renderers failed. The errors below tell us which native '
        'dependency is missing on this server.</p>'
        f'<h2>WeasyPrint</h2><pre>{weasy_error or "(not attempted)"}</pre>'
        f'<h2>xhtml2pdf</h2><pre>{xhtml_error or "(not attempted)"}</pre>'
        '<p style="margin-top:32px;font-size:10pt;color:#6B7280">'
        'Server: install <code>libpango-1.0-0 libpangocairo-1.0-0 libcairo2 '
        'libgdk-pixbuf2.0-0 libffi-dev shared-mime-info</code> via the '
        'Dockerfile / build script for WeasyPrint.</p>'
    )
    logger.error('Both PDF renderers failed. weasy=%s xhtml=%s', weasy_error, xhtml_error)
    return diag.encode('utf-8')


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
