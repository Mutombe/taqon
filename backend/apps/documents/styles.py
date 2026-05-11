"""Single source of truth for Taqon's PDF brand tokens.

Mirrors the Tailwind palette + font hierarchy used on the website so
every downloadable feels "of the brand" instead of generic ReportLab.

Helvetica + Helvetica-Bold are used everywhere to avoid font-file
shipping (and the licensing/embedding pain that comes with custom
fonts on a pure-Python renderer). The look comes from disciplined
spacing, tracking, color, and ruled lines — not exotic typefaces.
"""
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm


# ── BRAND COLORS — mirrors the website CSS tokens ──────────────────
ORANGE       = HexColor('#F26522')   # primary accent
ORANGE_DARK  = HexColor('#D04F12')
ORANGE_LIGHT = HexColor('#FFE8D9')   # warm wash background
CREAM        = HexColor('#FFFBF5')   # surface
INK          = HexColor('#0D0D0D')   # primary text / dark panels
CHARCOAL     = HexColor('#1A1A1A')   # secondary text
MUTED        = HexColor('#6B7280')   # labels, captions
HAIRLINE     = HexColor('#EAE2D5')   # table rule
HAIRLINE_INK = HexColor('#2A2A2A')   # rule on dark
ZEBRA        = HexColor('#FFFBF5')   # alternating row tint
WHITE        = colors.white


# ── PAGE GEOMETRY ────────────────────────────────────────────────
PAGE_MARGIN_LEFT   = 18 * mm
PAGE_MARGIN_RIGHT  = 18 * mm
PAGE_MARGIN_TOP    = 20 * mm
PAGE_MARGIN_BOTTOM = 22 * mm


# ── PARAGRAPH STYLES ─────────────────────────────────────────────
def _styles():
    base = getSampleStyleSheet()
    sheet = {}

    sheet['Eyebrow'] = ParagraphStyle(
        'Eyebrow', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=7,
        textColor=ORANGE,
        leading=10, spaceAfter=2,
        spaceBefore=0,
        # ReportLab doesn't expose letter-spacing on ParagraphStyle directly;
        # we widen via explicit spaces in HTML-ish strings where needed.
    )
    sheet['EyebrowMuted'] = ParagraphStyle(
        'EyebrowMuted', parent=sheet['Eyebrow'],
        textColor=MUTED,
    )
    sheet['EyebrowOnDark'] = ParagraphStyle(
        'EyebrowOnDark', parent=sheet['Eyebrow'],
        textColor=ORANGE,
    )

    sheet['Display'] = ParagraphStyle(
        'Display', parent=base['Title'],
        fontName='Helvetica-Bold', fontSize=44,
        textColor=INK, leading=46,
        alignment=TA_LEFT,
        spaceAfter=0,
    )
    sheet['H1'] = ParagraphStyle(
        'H1', parent=base['Heading1'],
        fontName='Helvetica-Bold', fontSize=22,
        textColor=INK, leading=26,
        alignment=TA_LEFT,
        spaceBefore=0, spaceAfter=2,
    )
    sheet['H2'] = ParagraphStyle(
        'H2', parent=base['Heading2'],
        fontName='Helvetica-Bold', fontSize=14,
        textColor=INK, leading=18,
        spaceBefore=4, spaceAfter=4,
    )
    sheet['H3'] = ParagraphStyle(
        'H3', parent=base['Heading3'],
        fontName='Helvetica-Bold', fontSize=10.5,
        textColor=INK, leading=14,
        spaceBefore=2, spaceAfter=2,
    )

    sheet['Lead'] = ParagraphStyle(
        'Lead', parent=base['Normal'],
        fontName='Helvetica', fontSize=10,
        textColor=CHARCOAL, leading=14,
        spaceAfter=4,
    )
    sheet['Body'] = ParagraphStyle(
        'Body', parent=base['Normal'],
        fontName='Helvetica', fontSize=9,
        textColor=CHARCOAL, leading=13,
        spaceAfter=3,
    )
    sheet['BodySmall'] = ParagraphStyle(
        'BodySmall', parent=base['Normal'],
        fontName='Helvetica', fontSize=8,
        textColor=MUTED, leading=11,
    )
    sheet['XS'] = ParagraphStyle(
        'XS', parent=base['Normal'],
        fontName='Helvetica', fontSize=7,
        textColor=MUTED, leading=10,
    )

    sheet['CustomerLabel'] = ParagraphStyle(
        'CustomerLabel', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=7,
        textColor=MUTED, leading=10,
        spaceAfter=1,
    )
    sheet['CustomerValue'] = ParagraphStyle(
        'CustomerValue', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=10,
        textColor=INK, leading=12,
        spaceAfter=2,
    )

    sheet['SpecBig'] = ParagraphStyle(
        'SpecBig', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=20,
        textColor=INK, leading=22,
        alignment=TA_CENTER,
    )
    sheet['SpecLabel'] = ParagraphStyle(
        'SpecLabel', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=6,
        textColor=MUTED, leading=10,
        alignment=TA_CENTER,
    )

    # ── On-dark variants (cover panels, dark CTA) ────────────────
    sheet['EyebrowOnDarkOrange'] = ParagraphStyle(
        'EyebrowOnDarkOrange', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=7,
        textColor=ORANGE, leading=10,
    )
    sheet['CTAValue'] = ParagraphStyle(
        'CTAValue', parent=base['Normal'],
        fontName='Helvetica-Bold', fontSize=11,
        textColor=CREAM, leading=14,
    )
    sheet['CTAMuted'] = ParagraphStyle(
        'CTAMuted', parent=base['Normal'],
        fontName='Helvetica', fontSize=8,
        textColor=HexColor('#C9C9C9'), leading=11,
    )

    # ── Right-aligned variants ───────────────────────────────────
    sheet['BodyRight'] = ParagraphStyle('BodyRight', parent=sheet['Body'], alignment=TA_RIGHT)
    sheet['EyebrowRight'] = ParagraphStyle('EyebrowRight', parent=sheet['Eyebrow'], alignment=TA_RIGHT)
    sheet['CTAValueRight'] = ParagraphStyle('CTAValueRight', parent=sheet['CTAValue'], alignment=TA_RIGHT)
    sheet['CTAMutedRight'] = ParagraphStyle('CTAMutedRight', parent=sheet['CTAMuted'], alignment=TA_RIGHT)

    return sheet


STYLES = _styles()
