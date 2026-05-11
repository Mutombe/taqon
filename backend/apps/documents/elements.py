"""Reusable Platypus flowables + builders that compose into Taqon docs.

These are the "kit" — section header with accent bar, hairline rule,
spec strip, contact strip, dark CTA panel. Each doc combines them.
"""
import io
import os
import base64
import logging

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable, Image, KeepTogether, Paragraph, Spacer, Table, TableStyle,
)

from .styles import (
    STYLES, ORANGE, ORANGE_DARK, ORANGE_LIGHT, CREAM, INK, CHARCOAL,
    MUTED, HAIRLINE, HAIRLINE_INK, ZEBRA, WHITE,
)

logger = logging.getLogger(__name__)


# ── IMAGE FETCHING ─────────────────────────────────────────────────

def fetch_image_bytes(url, timeout=4):
    """Return image bytes for a URL, or None on failure.

    Cached for 24h via Django cache so the first call after deploy is
    the only slow one. Negative-cached for 1h on failure so a flaky
    CDN doesn't slow down every render.
    """
    if not url:
        return None
    try:
        from django.core.cache import cache
    except Exception:
        cache = None

    key = f'taqon:doc_img:{url}'
    if cache is not None:
        cached = cache.get(key)
        if cached is not None:
            return cached if cached else None

    try:
        import urllib.request
        req = urllib.request.Request(url, headers={'User-Agent': 'TaqonDocs/1.0'})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
        if cache is not None and data:
            cache.set(key, data, 60 * 60 * 24)
        return data
    except Exception as exc:
        logger.warning('Document image fetch failed: %s (%s)', url, exc)
        if cache is not None:
            cache.set(key, b'', 60 * 60)
        return None


def image_flowable(image_bytes, width_mm, height_mm):
    """Build a Platypus Image at exact target dimensions."""
    if not image_bytes:
        return None
    try:
        img = Image(io.BytesIO(image_bytes))
        img.drawWidth = width_mm * mm
        img.drawHeight = height_mm * mm
        return img
    except Exception as exc:
        logger.warning('Image flowable creation failed: %s', exc)
        return None


def image_or_placeholder(image_bytes, width_mm, height_mm, *, label=''):
    """Image if available, otherwise a tinted cream box of the same size."""
    img = image_flowable(image_bytes, width_mm, height_mm)
    if img is not None:
        return img
    label_style = STYLES.get('Eyebrow')
    inner = [Paragraph(label or '', label_style)] if label_style else []
    tbl = Table([[inner]], colWidths=[width_mm * mm], rowHeights=[height_mm * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    return tbl


# ── PRIMITIVES ─────────────────────────────────────────────────────

class HRule(Flowable):
    """A single horizontal rule with configurable thickness + color."""
    def __init__(self, width=None, thickness=0.4, color=HAIRLINE, space_after=4):
        super().__init__()
        self.width_ = width
        self.thickness = thickness
        self.color = color
        self.spaceAfter = space_after

    def wrap(self, availWidth, availHeight):
        self._w = self.width_ if self.width_ else availWidth
        return (self._w, self.thickness)

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self._w, 0)


class AccentBar(Flowable):
    """The short orange bar used under section eyebrows. 14mm wide, 1mm tall."""
    def __init__(self, width=14 * mm, thickness=1.2 * mm, color=ORANGE, space_after=6):
        super().__init__()
        self.width_ = width
        self.thickness = thickness
        self.color = color
        self.spaceAfter = space_after

    def wrap(self, availWidth, availHeight):
        return (self.width_, self.thickness)

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width_, self.thickness, stroke=0, fill=1)


# ── COMPOSED BLOCKS ────────────────────────────────────────────────

def section_header(eyebrow_text, title_text, *, style=None):
    """Eyebrow + accent bar + h1 title. Used at the top of major sections."""
    items = [
        Paragraph(eyebrow_text.upper(), STYLES['Eyebrow']),
        AccentBar(),
        Paragraph(title_text, style or STYLES['H1']),
        Spacer(1, 6),
    ]
    return items


def contact_strip(company):
    """Three-column contact panel — address / phone+email / web+date.

    Used as the closing block on every Taqon downloadable. Reflects the
    'every doc must carry the contact strip + generated date' rule.
    """
    address = company.get('address', '203 Sherwood Drive, Strathaven, Harare')
    phone = company.get('phone', '+263 77 277 1036')
    email = company.get('email', 'info@taqon.co.zw')
    website = company.get('website', 'www.taqon.co.zw')
    generated_date = company.get('generated_date', '')

    cells = [[
        [
            Paragraph('VISIT', STYLES['EyebrowOnDarkOrange']),
            Spacer(1, 2),
            Paragraph(address, STYLES['CTAValue']),
        ],
        [
            Paragraph('REACH US', STYLES['EyebrowOnDarkOrange']),
            Spacer(1, 2),
            Paragraph(phone, STYLES['CTAValue']),
            Paragraph(email, STYLES['CTAMuted']),
        ],
        [
            Paragraph('ONLINE', STYLES['EyebrowOnDarkOrange']),
            Spacer(1, 2),
            Paragraph(website, STYLES['CTAValue']),
            Paragraph(f'Generated {generated_date}' if generated_date else '', STYLES['CTAMuted']),
        ],
    ]]

    tbl = Table(cells, colWidths=[63 * mm, 55 * mm, 55 * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    return tbl


def cta_band(eyebrow, title, sub, *, right_label='', right_value='', right_sub=''):
    """The orange CTA panel that closes most docs.

    Left side: eyebrow + bold title + sub.
    Right side: optional 'Call us today / +263 77 ...' block.
    """
    left = [
        Paragraph(eyebrow.upper(), STYLES['EyebrowOnDarkOrange']),
        Spacer(1, 2),
        Paragraph(f'<font color="#FFFFFF"><b>{title}</b></font>',
                  STYLES['H2']),
        Spacer(1, 2),
        Paragraph(f'<font color="#FFFBF5">{sub}</font>', STYLES['Body']),
    ]
    right = []
    if right_value:
        if right_label:
            right.append(Paragraph(right_label.upper(), STYLES['EyebrowOnDarkOrange']))
            right.append(Spacer(1, 2))
        right.append(Paragraph(
            f'<font color="#FFFFFF"><b>{right_value}</b></font>',
            STYLES['H2'],
        ))
        if right_sub:
            right.append(Paragraph(
                f'<font color="#FFFBF5">{right_sub}</font>', STYLES['Body'],
            ))

    tbl = Table([[left, right]], colWidths=[100 * mm, 73 * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ORANGE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 18),
        ('RIGHTPADDING', (0, 0), (-1, -1), 18),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    return tbl


def spec_strip(specs):
    """A row of 'spec tiles' — 18kVA / 12kWh / 14 panels / Premium tier.
    `specs` is a list of (label, value) tuples; renders one per cell."""
    if not specs:
        return Spacer(1, 0)
    cells = []
    for label, value in specs:
        cells.append([
            Paragraph(str(value), STYLES['SpecBig']),
            Spacer(1, 2),
            Paragraph(str(label).upper(), STYLES['SpecLabel']),
        ])
    rows = [cells]
    col_count = len(specs)
    col_w = (174 * mm) / col_count
    tbl = Table(rows, colWidths=[col_w] * col_count)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), ORANGE_LIGHT),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return tbl


def load_logo_image(width_mm=36):
    """Returns a Platypus Image for the Taqon logo, or None if missing."""
    try:
        from PIL import Image as PILImage  # noqa: F401 — Pillow availability check
    except ImportError:
        pass
    path = os.path.join(
        os.path.dirname(__file__), '..', 'quotations', 'static',
        'pdf_assets', 'taqon-electrico-logo.jpg',
    )
    path = os.path.normpath(path)
    if not os.path.exists(path):
        return None
    try:
        img = Image(path)
        # Preserve aspect ratio while constraining width
        w = width_mm * mm
        ratio = img.imageWidth / img.imageHeight if img.imageHeight else 3
        img.drawWidth = w
        img.drawHeight = w / ratio if ratio else w / 3
        return img
    except Exception:
        return None


def doc_header_table(left_flowables, right_flowables, *,
                     left_width_mm=90, right_width_mm=84):
    """Top-of-document header: logo+brand on left, doc metadata on right."""
    tbl = Table(
        [[left_flowables, right_flowables]],
        colWidths=[left_width_mm * mm, right_width_mm * mm],
    )
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LINEBELOW', (0, 0), (-1, -1), 1, ORANGE),
    ]))
    return tbl


def soft_panel(content_flowables, *, bg=CREAM, border=HAIRLINE, width_mm=174):
    """A light-cream panel with a 1pt accent-orange left border. Used for
    notes / Bank details / Standard Warranties."""
    tbl = Table([[content_flowables]], colWidths=[width_mm * mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
    ]))
    return tbl
