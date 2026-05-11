"""Taqon Electrico business / company profile PDF.

This is the long-form brand document — designed to be picked up, leafed
through, and left on a desk. The visual rhythm alternates dark
full-bleed bands, cream panels, and large project photography so the
reader never lingers on whitespace.

Sections (10):
  1. Cover  — brand mark, display title, hero install photo
  2. About + Mission + Stats
  3. Our Process — 5-step timeline
  4. Why Taqon — 4 pillars
  5. Services — 3×2 grid
  6. Featured Projects — hero + gallery (live-fetched, 24h cache)
  7. Equipment Standards — brand pillars + descriptions
  8. Testimonials
  9. Closing CTA
 10. Contact strip
"""
import logging

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image, KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle,
)

from .base import format_date_label, render_doc
from .elements import (
    AccentBar, HRule, contact_strip, cta_band, doc_header_table,
    fetch_image_bytes, image_or_placeholder, load_logo_image,
    section_header, soft_panel, spec_strip,
)
from .styles import (
    STYLES, ORANGE, ORANGE_DARK, ORANGE_LIGHT, CREAM, INK, CHARCOAL,
    MUTED, HAIRLINE, ZEBRA, WHITE,
)

logger = logging.getLogger(__name__)


# ── Local typography ───────────────────────────────────────────────

_COVER_EYEBROW = ParagraphStyle(
    'ProfileCoverEyebrow', fontName='Helvetica-Bold', fontSize=8,
    textColor=ORANGE, leading=11, alignment=TA_LEFT,
)
_COVER_DISPLAY = ParagraphStyle(
    'ProfileCoverDisplay', fontName='Helvetica-Bold', fontSize=48,
    textColor=INK, leading=52, alignment=TA_LEFT,
)
_COVER_DISPLAY_LIGHT = ParagraphStyle(
    'ProfileCoverDisplayLight', fontName='Helvetica-Bold', fontSize=48,
    textColor=CREAM, leading=52, alignment=TA_LEFT,
)
_COVER_SUB = ParagraphStyle(
    'ProfileCoverSub', fontName='Helvetica', fontSize=12,
    textColor=CHARCOAL, leading=17, alignment=TA_LEFT,
)
_COVER_SUB_LIGHT = ParagraphStyle(
    'ProfileCoverSubLight', fontName='Helvetica', fontSize=11.5,
    textColor=CREAM, leading=16, alignment=TA_LEFT,
)
_SECTION_TITLE = ParagraphStyle(
    'ProfileSectionTitle', fontName='Helvetica-Bold', fontSize=24,
    textColor=INK, leading=28, alignment=TA_LEFT,
)
_SECTION_TITLE_LIGHT = ParagraphStyle(
    'ProfileSectionTitleLight', fontName='Helvetica-Bold', fontSize=24,
    textColor=CREAM, leading=28, alignment=TA_LEFT,
)
_PANEL_TITLE = ParagraphStyle(
    'ProfilePanelTitle', fontName='Helvetica-Bold', fontSize=18,
    textColor=INK, leading=22, alignment=TA_LEFT,
)
_PANEL_TITLE_LIGHT = ParagraphStyle(
    'ProfilePanelTitleLight', fontName='Helvetica-Bold', fontSize=18,
    textColor=CREAM, leading=22, alignment=TA_LEFT,
)
_BODY_LIGHT = ParagraphStyle(
    'ProfileBodyLight', fontName='Helvetica', fontSize=9.5,
    textColor=CREAM, leading=14,
)
_SERVICE_LETTER = ParagraphStyle(
    'ProfileServiceLetter', fontName='Helvetica-Bold', fontSize=28,
    textColor=ORANGE, leading=30, alignment=TA_LEFT,
)
_SERVICE_TITLE = ParagraphStyle(
    'ProfileServiceTitle', fontName='Helvetica-Bold', fontSize=11,
    textColor=INK, leading=14, alignment=TA_LEFT,
)
_SERVICE_DESC = ParagraphStyle(
    'ProfileServiceDesc', fontName='Helvetica', fontSize=8.5,
    textColor=CHARCOAL, leading=12, alignment=TA_LEFT,
)
_PROJECT_TITLE = ParagraphStyle(
    'ProfileProjectTitle', fontName='Helvetica-Bold', fontSize=11,
    textColor=INK, leading=14,
)
_PROJECT_META = ParagraphStyle(
    'ProfileProjectMeta', fontName='Helvetica-Bold', fontSize=7,
    textColor=ORANGE, leading=10,
)
_PROJECT_DESC = ParagraphStyle(
    'ProfileProjectDesc', fontName='Helvetica', fontSize=8.5,
    textColor=CHARCOAL, leading=12,
)
_TESTIMONIAL_QUOTE = ParagraphStyle(
    'ProfileTestimonialQuote', fontName='Helvetica-Oblique', fontSize=9.5,
    textColor=CHARCOAL, leading=13,
)
_TESTIMONIAL_NAME = ParagraphStyle(
    'ProfileTestimonialName', fontName='Helvetica-Bold', fontSize=9,
    textColor=INK, leading=11,
)
_TESTIMONIAL_ROLE = ParagraphStyle(
    'ProfileTestimonialRole', fontName='Helvetica', fontSize=8,
    textColor=MUTED, leading=10,
)
_STEP_NUM = ParagraphStyle(
    'StepNum', fontName='Helvetica-Bold', fontSize=28,
    textColor=ORANGE, leading=30,
)
_STEP_TITLE = ParagraphStyle(
    'StepTitle', fontName='Helvetica-Bold', fontSize=11,
    textColor=INK, leading=14,
)
_STEP_BODY = ParagraphStyle(
    'StepBody', fontName='Helvetica', fontSize=9,
    textColor=CHARCOAL, leading=12,
)
_PILLAR_TITLE = ParagraphStyle(
    'PillarTitle', fontName='Helvetica-Bold', fontSize=12,
    textColor=CREAM, leading=15,
)
_PILLAR_BODY = ParagraphStyle(
    'PillarBody', fontName='Helvetica', fontSize=9,
    textColor=CREAM, leading=13,
)
_PILLAR_NUM = ParagraphStyle(
    'PillarNum', fontName='Helvetica-Bold', fontSize=28,
    textColor=ORANGE, leading=30,
)
_BRAND_NAME = ParagraphStyle(
    'BrandName', fontName='Helvetica-Bold', fontSize=12,
    textColor=INK, leading=15,
)
_BRAND_DESC = ParagraphStyle(
    'BrandDesc', fontName='Helvetica', fontSize=8,
    textColor=CHARCOAL, leading=11,
)


# ── Hero (cover) ──────────────────────────────────────────────────

_HERO_IMAGE_URL = 'https://www.taqon.co.zw/kadoma-24kva-1.jpg'


def _cover(*, company, generated_date, ref_number):
    """Cover sheet: brand mark + hero photo + display headline + meta strip."""
    logo = load_logo_image(width_mm=44)
    items = []
    items.append(Spacer(1, 4))
    if logo:
        items.append(logo)
        items.append(Spacer(1, 14))
    items.append(Paragraph(
        f'TAQON ELECTRICO  ·  COMPANY PROFILE  ·  {generated_date}',
        _COVER_EYEBROW,
    ))
    items.append(AccentBar(width=18 * mm, thickness=1.5 * mm))
    items.append(Paragraph('Solar &amp;<br/>Electrical Solutions', _COVER_DISPLAY))
    items.append(Spacer(1, 10))
    items.append(Paragraph(
        'Premium-grade renewable energy systems engineered, supplied, '
        'installed, and maintained across Zimbabwe — for homes, '
        'businesses, and institutions.',
        _COVER_SUB,
    ))
    items.append(Spacer(1, 16))

    # Hero photo — full content width, anchors the cover
    hero_bytes = fetch_image_bytes(_HERO_IMAGE_URL)
    items.append(image_or_placeholder(
        hero_bytes, width_mm=174, height_mm=90, label='Featured install',
    ))
    items.append(Spacer(1, 14))

    # Metadata strip in cream panel — established / licensing / enquiries
    meta_cells = [[
        [
            Paragraph('ESTABLISHED', STYLES['Eyebrow']),
            Spacer(1, 2),
            Paragraph(company.get('founding_year', '2020'), STYLES['CustomerValue']),
        ],
        [
            Paragraph('LICENSING', STYLES['Eyebrow']),
            Spacer(1, 2),
            Paragraph(
                company.get('registration_no', 'Licensed Electrical Contractor'),
                STYLES['Body'],
            ),
        ],
        [
            Paragraph('FOR ENQUIRIES', STYLES['Eyebrow']),
            Spacer(1, 2),
            Paragraph(company.get('phone', ''), STYLES['CustomerValue']),
            Paragraph(company.get('email', ''), STYLES['BodySmall']),
        ],
    ]]
    meta = Table(meta_cells, colWidths=[55 * mm, 60 * mm, 59 * mm])
    meta.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
    ]))
    items.append(meta)
    items.append(PageBreak())
    return items


# ── About + Mission + Stats (one spread) ─────────────────────────

def _about_mission_stats(*, about, mission, stats):
    """Single editorial spread: cream two-column about/mission, big stats below."""

    about_block = [
        Paragraph('ABOUT US', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Who we are', _PANEL_TITLE),
        Spacer(1, 8),
        Paragraph(about, STYLES['Body']),
    ]
    mission_block = [
        Paragraph('OUR MISSION', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Why we do it', _PANEL_TITLE),
        Spacer(1, 8),
        Paragraph(mission, STYLES['Body']),
    ]
    grid = Table(
        [[about_block, mission_block]],
        colWidths=[85 * mm, 85 * mm],
    )
    grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
        ('LINEBEFORE', (1, 0), (1, -1), 2, ORANGE),
    ]))

    # Stats strip — dark band makes it pop after the cream panels
    stat_cells = []
    for s in stats[:4]:
        stat_cells.append([
            Paragraph(
                f'<font color="#F26522"><b>{s.get("value","")}</b></font>',
                ParagraphStyle(
                    'StatValDark', fontName='Helvetica-Bold', fontSize=26,
                    leading=28, alignment=TA_CENTER,
                ),
            ),
            Spacer(1, 4),
            Paragraph(
                f'<font color="#FFFBF5">{s.get("label","").upper()}</font>',
                ParagraphStyle(
                    'StatLblDark', fontName='Helvetica-Bold', fontSize=6.5,
                    leading=10, alignment=TA_CENTER,
                ),
            ),
        ])
    while len(stat_cells) < 4:
        stat_cells.append('')
    col_w = (174 * mm) / 4
    stats_tbl = Table([stat_cells], colWidths=[col_w] * 4)
    stats_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 22),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 22),
    ]))

    # Feature image + pull-quote callout — fills the bottom of the page
    # so the about/mission/stats spread doesn't feel top-heavy
    feature_img_url = 'https://www.taqon.co.zw/chisipiti-10kva-1.jpg'
    feature_bytes = fetch_image_bytes(feature_img_url)
    feature_img = image_or_placeholder(
        feature_bytes, width_mm=86, height_mm=58, label='Recent install',
    )
    pull_quote = [
        Paragraph('OUR STANDARD', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Built once. Built right.', _PANEL_TITLE),
        Spacer(1, 8),
        Paragraph(
            'Every Taqon install is signed off by a certified engineer '
            'before commissioning — and every component carries its '
            'manufacturer-grade warranty. We back the install with our '
            'own 1-year workmanship guarantee.',
            STYLES['Body'],
        ),
    ]
    feature_row = Table(
        [[feature_img, pull_quote]],
        colWidths=[88 * mm, 86 * mm],
    )
    feature_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 16),
    ]))

    return [
        Paragraph('01 · ABOUT TAQON', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Who we are, what we stand for.', _SECTION_TITLE),
        Spacer(1, 14),
        grid,
        Spacer(1, 22),
        Paragraph('TRACK RECORD', STYLES['Eyebrow']),
        AccentBar(),
        Spacer(1, 6),
        stats_tbl,
        Spacer(1, 22),
        feature_row,
    ]


# ── Process timeline ──────────────────────────────────────────────

def _process_section():
    steps = [
        ('01', 'Consult',
         'Free phone or site consultation. We listen to your loads, lifestyle and budget.'),
        ('02', 'Design',
         'Engineering team sizes the system to your appliance list and roof orientation.'),
        ('03', 'Quote',
         'Itemised quotation issued within 24 hours of survey — no hidden charges.'),
        ('04', 'Install',
         'Taqon-certified crew completes the install. Commissioning typically 1–3 days.'),
        ('05', 'Support',
         'Warranty-backed maintenance, monitoring, and 24/7 reachable support line.'),
    ]
    cells = []
    for num, title, body in steps:
        cells.append([
            Paragraph(num, _STEP_NUM),
            Spacer(1, 8),
            Paragraph(title, _STEP_TITLE),
            Spacer(1, 4),
            Paragraph(body, _STEP_BODY),
        ])
    col_w = (174 * mm) / 5
    tbl = Table([cells], colWidths=[col_w] * 5)
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LINEBEFORE', (1, 0), (1, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (2, 0), (2, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (3, 0), (3, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (4, 0), (4, -1), 0.4, HAIRLINE),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
    ]))
    return [
        Paragraph('02 · OUR PROCESS', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('From first call to long-term support.', _SECTION_TITLE),
        Spacer(1, 14),
        tbl,
    ]


# ── Why Taqon — 4 pillars on a dark band ──────────────────────────

def _why_section():
    pillars = [
        ('01', 'Premium components',
         'Only Tier-1 inverters, lithium batteries, and PERC panels — no compromise brands.'),
        ('02', 'Certified engineers',
         'Licensed electrical contractors and ZERA-recommended technicians on every install.'),
        ('03', 'Customer first',
         'Honest sizing, no surprise charges, single point of contact through commissioning.'),
        ('04', 'Lifecycle support',
         'Warranties honoured locally, maintenance plans, and 24/7 reachable support line.'),
    ]
    cells = []
    for num, title, body in pillars:
        cells.append([
            Paragraph(num, _PILLAR_NUM),
            Spacer(1, 8),
            Paragraph(title, _PILLAR_TITLE),
            Spacer(1, 6),
            Paragraph(body, _PILLAR_BODY),
        ])
    col_w = (174 * mm) / 4
    grid = Table([cells], colWidths=[col_w] * 4)
    grid.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 22),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 22),
        ('LINEBEFORE', (1, 0), (1, -1), 0.4, colors.HexColor('#2A2A2A')),
        ('LINEBEFORE', (2, 0), (2, -1), 0.4, colors.HexColor('#2A2A2A')),
        ('LINEBEFORE', (3, 0), (3, -1), 0.4, colors.HexColor('#2A2A2A')),
    ]))
    # Title on a matching dark band above the grid
    title_band = Table(
        [[
            [
                Paragraph(
                    '<font color="#F26522">03 · WHY TAQON</font>',
                    _COVER_EYEBROW,
                ),
                AccentBar(),
                Paragraph('What sets us apart.', _SECTION_TITLE_LIGHT),
            ]
        ]],
        colWidths=[174 * mm],
    )
    title_band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 22),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return [title_band, grid]


# ── Services 3×2 ──────────────────────────────────────────────────

def _services(services):
    rows = []
    triples = [services[i:i + 3] for i in range(0, len(services), 3)]
    for row in triples:
        cells = []
        for s in row:
            letter = s.get('icon_unicode_or_letter') or (s.get('title', '')[:1] or '·')
            cell = [
                Paragraph(letter, _SERVICE_LETTER),
                Spacer(1, 8),
                Paragraph(s.get('title', ''), _SERVICE_TITLE),
                Spacer(1, 4),
                Paragraph(s.get('description', ''), _SERVICE_DESC),
            ]
            cells.append(cell)
        while len(cells) < 3:
            cells.append('')
        rows.append(cells)

    col_w = (174 * mm) / 3
    tbl = Table(rows, colWidths=[col_w] * 3)
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('LINEBEFORE', (1, 0), (1, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (2, 0), (2, -1), 0.4, HAIRLINE),
        ('LINEBELOW', (0, 0), (-1, -2), 0.4, HAIRLINE),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
    ]))
    # Who-we-serve strip — sits below the services grid and fills the
    # bottom half of the page with another visual unit.
    industries = [
        ('Residential',   'Homes, estates, complexes'),
        ('Commercial',    'Offices, retail, banks'),
        ('Industrial',    'Manufacturing, agri-business'),
        ('Institutional', 'Schools, churches, clinics'),
    ]
    serve_body = ParagraphStyle(
        'ServeBody', fontName='Helvetica', fontSize=9,
        textColor=CREAM, leading=13,
    )
    cells = []
    for title, body in industries:
        cells.append([
            Paragraph(title.upper(), STYLES['Eyebrow']),
            AccentBar(),
            Paragraph(body, serve_body),
        ])
    col_w = (174 * mm) / 4
    serve_tbl = Table([cells], colWidths=[col_w] * 4)
    serve_tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('TEXTCOLOR', (0, 0), (-1, -1), CREAM),
    ]))

    return [
        Paragraph('04 · SERVICES', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('What we deliver.', _SECTION_TITLE),
        Spacer(1, 14),
        tbl,
        Spacer(1, 22),
        Paragraph('WHO WE SERVE', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Across every sector.', _PANEL_TITLE),
        Spacer(1, 10),
        serve_tbl,
    ]


# ── Projects gallery ──────────────────────────────────────────────

def _projects_section(projects):
    """Hero + 2-up gallery. Each project gets a real photo from the CDN."""
    if not projects:
        return [Paragraph('Project gallery coming soon.', STYLES['Body'])]

    items = [
        Paragraph('05 · FEATURED PROJECTS', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Real installs, real results.', _SECTION_TITLE),
        Spacer(1, 6),
        Paragraph(
            'A selection of recently commissioned systems across Zimbabwe '
            '— residential back-up to commercial off-grid.',
            _PROJECT_DESC,
        ),
        Spacer(1, 14),
    ]

    hero, *rest = projects

    # Hero image
    hero_bytes = fetch_image_bytes(
        hero.get('hero_image_url') or hero.get('image_url'),
    )
    items.append(image_or_placeholder(
        hero_bytes, width_mm=174, height_mm=100, label=hero.get('title', ''),
    ))
    items.append(Spacer(1, 6))

    # Hero caption strip on cream
    cat = (hero.get('category', '') or '').upper()
    loc = hero.get('location', '')
    kva = hero.get('kva', '')
    meta_bits = ' · '.join(filter(None, [cat, kva, loc]))
    caption = Table([[
        [
            Paragraph(meta_bits, _PROJECT_META),
            Spacer(1, 2),
            Paragraph(hero.get('title', ''), _PROJECT_TITLE),
            Spacer(1, 2),
            Paragraph(hero.get('description', ''), _PROJECT_DESC),
        ],
    ]], colWidths=[174 * mm])
    caption.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
    ]))
    items.append(caption)
    items.append(Spacer(1, 14))

    # 2-up grid for remaining projects
    if rest:
        rows = []
        for i in range(0, len(rest), 2):
            pair = rest[i:i + 2]
            cells = []
            for p in pair:
                img_bytes = fetch_image_bytes(p.get('image_url'))
                img = image_or_placeholder(
                    img_bytes, width_mm=82, height_mm=52,
                    label=p.get('title', ''),
                )
                meta = ' · '.join(filter(None, [
                    (p.get('category', '') or '').upper(),
                    p.get('kva', ''),
                    p.get('location', ''),
                ]))
                cell = [
                    img,
                    Spacer(1, 6),
                    Paragraph(meta, _PROJECT_META),
                    Spacer(1, 2),
                    Paragraph(p.get('title', ''), _PROJECT_TITLE),
                    Spacer(1, 2),
                    Paragraph(p.get('description', ''), _PROJECT_DESC),
                ]
                cells.append(cell)
            while len(cells) < 2:
                cells.append('')
            rows.append(cells)

        grid = Table(rows, colWidths=[86 * mm, 86 * mm])
        grid.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ]))
        items.append(grid)

    return items


# ── Equipment Standards (brands grid) ────────────────────────────

def _equipment_section(brands):
    """Brand pillars with a short note on each — proves the premium claim."""
    brand_notes = {
        'Sunsynk':     'HV hybrid inverters — global Tier-1, 5-year warranty.',
        'Growatt':     'Hybrid inverters with industry-leading inverter efficiency.',
        'JA Solar':    'Tier-1 mono PERC panels — 25-year linear power warranty.',
        'Jinko Solar': 'Tier-1 PV panels — best-in-class temperature coefficient.',
        'Pylontech':   'HV lithium-ion batteries with a 10-year warranty.',
        'Dyness':      'Lithium-ion stacked batteries for residential and commercial.',
        'Kodak':       'Solar inverters and battery packs for hybrid back-up.',
        'Deye':        'High-efficiency hybrid inverters for residential systems.',
    }
    cells = []
    rows = []
    for b in brands:
        cells.append([
            Paragraph(b.upper(), _BRAND_NAME),
            Spacer(1, 4),
            Paragraph(brand_notes.get(b, 'Premium-grade equipment partner.'),
                      _BRAND_DESC),
        ])
        if len(cells) == 4:
            rows.append(cells)
            cells = []
    if cells:
        while len(cells) < 4:
            cells.append('')
        rows.append(cells)

    col_w = (174 * mm) / 4
    grid = Table(rows, colWidths=[col_w] * 4)
    grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LINEBEFORE', (1, 0), (1, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (2, 0), (2, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (3, 0), (3, -1), 0.4, HAIRLINE),
        ('LINEABOVE', (0, 1), (-1, 1), 0.4, HAIRLINE) if len(rows) > 1 else
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return [
        Paragraph('06 · EQUIPMENT STANDARDS', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Premium-grade brands. No exceptions.', _SECTION_TITLE),
        Spacer(1, 14),
        grid,
    ]


# ── Testimonials ──────────────────────────────────────────────────

def _testimonials(items):
    if not items:
        return Spacer(1, 0)
    cells = []
    for t in items[:3]:
        cell = [
            Paragraph(
                f'<font color="#F26522" size="14"><b>“</b></font> {t.get("text", "")}',
                _TESTIMONIAL_QUOTE,
            ),
            Spacer(1, 12),
            Paragraph(t.get('name', ''), _TESTIMONIAL_NAME),
            Paragraph(t.get('role', ''), _TESTIMONIAL_ROLE),
        ]
        cells.append(cell)
    while len(cells) < 3:
        cells.append('')
    col_w = (174 * mm) / 3
    tbl = Table([cells], colWidths=[col_w] * 3)
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
        ('LINEBEFORE', (1, 0), (1, 0), 0.4, HAIRLINE),
        ('LINEBEFORE', (2, 0), (2, 0), 0.4, HAIRLINE),
    ]))
    return [
        Paragraph('07 · WHAT CUSTOMERS SAY', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('In their own words.', _SECTION_TITLE),
        Spacer(1, 14),
        tbl,
    ]


# ── Entry point ───────────────────────────────────────────────────

def build_profile_pdf(*,
                     company,
                     about_paragraph,
                     mission_paragraph,
                     cta_paragraph,
                     services,
                     stats,
                     projects,
                     brands,
                     testimonials,
                     ref_number,
                     generated_date=None):
    generated_date = generated_date or format_date_label()

    story = []

    # 1. Cover
    story.extend(_cover(
        company=company,
        generated_date=generated_date,
        ref_number=ref_number,
    ))

    # 2. About + Mission + Stats — all on one editorial spread
    story.extend(_about_mission_stats(
        about=about_paragraph, mission=mission_paragraph, stats=stats,
    ))
    story.append(PageBreak())

    # 3. Process timeline + Why Taqon (dark band) — paired on one page
    story.extend(_process_section())
    story.append(Spacer(1, 22))

    # 4. Why Taqon — dark band 4-pillar — sits on the same page as process
    story.extend(_why_section())
    story.append(PageBreak())

    # 5. Services
    story.extend(_services(services))
    story.append(PageBreak())

    # 6. Featured Projects
    story.extend(_projects_section(projects))
    story.append(Spacer(1, 18))

    # 7. Equipment Standards — flows after the gallery tail so the page
    # below the last two project cards doesn't sit half-empty
    story.extend(_equipment_section(brands))
    story.append(Spacer(1, 22))

    # 8. Testimonials — paired with equipment so neither page sits half-empty
    story.extend(_testimonials(testimonials))
    story.append(Spacer(1, 22))

    # 9. Closing manifesto — large statement + hero image to seal the doc
    closing_img = image_or_placeholder(
        fetch_image_bytes('https://www.taqon.co.zw/bulawayo-16kva-2.jpg'),
        width_mm=86, height_mm=58, label='Recent install',
    )
    closing_panel = Table(
        [[closing_img, [
            Paragraph('CLOSING', STYLES['Eyebrow']),
            AccentBar(),
            Paragraph('Built for Zimbabwe.', _SECTION_TITLE),
            Spacer(1, 8),
            Paragraph(
                'Every system we commission is sized for Zimbabwean '
                'loads, Zimbabwean grids, and Zimbabwean weather — '
                'engineered to keep your home, business or institution '
                'running through whatever the day brings.',
                STYLES['Body'],
            ),
        ]]],
        colWidths=[88 * mm, 86 * mm],
    )
    closing_panel.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 16),
    ]))
    story.append(closing_panel)
    story.append(Spacer(1, 22))

    # 10. Closing CTA
    story.append(cta_band(
        'Get in touch',
        'Free consultation. Free site survey.',
        cta_paragraph,
        right_label='Talk to us',
        right_value=company.get('phone', '+263 77 277 1036'),
        right_sub=company.get('email', 'info@taqon.co.zw'),
    ))
    story.append(Spacer(1, 14))

    # 10. Contact strip
    story.append(contact_strip({
        'address': company.get('address', '203 Sherwood Drive, Strathaven, Harare'),
        'phone':   company.get('phone', '+263 77 277 1036'),
        'email':   company.get('email', 'info@taqon.co.zw'),
        'website': company.get('website', 'www.taqon.co.zw'),
        'generated_date': generated_date,
    }))

    return render_doc(
        story,
        doc_title=f'Taqon Company Profile · {ref_number}',
        suppress_first_page=True,
    )
