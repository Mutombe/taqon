"""The universal Packages Catalogue — every active family + every variant.

Editorially dense. Every spread is built to fill the page: a hero image
beside the family numeral, variant cards, a use-cases band, and a
"standard inclusions" strip. The catalogue also ships a sizing guide,
process timeline, and warranties matrix between the cover and close.
"""
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, Spacer, Table, TableStyle,
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


# ── Local typography ───────────────────────────────────────────────

_GIANT = ParagraphStyle(
    'GiantNumeral', fontName='Helvetica-Bold', fontSize=72,
    textColor=ORANGE, leading=72, alignment=TA_LEFT,
)
_GIANT_UNIT = ParagraphStyle(
    'GiantUnit', fontName='Helvetica-Bold', fontSize=14,
    textColor=ORANGE, leading=16, alignment=TA_LEFT,
)
_COVER_DISPLAY = ParagraphStyle(
    'CoverDisplay', fontName='Helvetica-Bold', fontSize=46,
    textColor=INK, leading=50, alignment=TA_LEFT,
)
_COVER_SUB = ParagraphStyle(
    'CoverSub', fontName='Helvetica', fontSize=11,
    textColor=CHARCOAL, leading=16, alignment=TA_LEFT,
)
_TOC_ROW_NAME = ParagraphStyle(
    'TocRowName', fontName='Helvetica-Bold', fontSize=10,
    textColor=INK, leading=14,
)
_TOC_ROW_META = ParagraphStyle(
    'TocRowMeta', fontName='Helvetica', fontSize=8.5,
    textColor=MUTED, leading=12,
)
_FAMILY_TITLE = ParagraphStyle(
    'FamilyTitle', fontName='Helvetica-Bold', fontSize=26,
    textColor=INK, leading=30, alignment=TA_LEFT,
)
_FAMILY_DESC = ParagraphStyle(
    'FamilyDesc', fontName='Helvetica', fontSize=10,
    textColor=CHARCOAL, leading=15,
)
_FAMILY_DESC_LIGHT = ParagraphStyle(
    'FamilyDescLight', fontName='Helvetica', fontSize=9.5,
    textColor=CREAM, leading=14,
)
_VARIANT_NAME = ParagraphStyle(
    'VariantName', fontName='Helvetica-Bold', fontSize=10.5,
    textColor=INK, leading=13,
)
_VARIANT_TIER = ParagraphStyle(
    'VariantTier', fontName='Helvetica-Bold', fontSize=7,
    textColor=ORANGE, leading=10, alignment=TA_LEFT,
)
_VARIANT_LABEL = ParagraphStyle(
    'VariantLabel', fontName='Helvetica-Bold', fontSize=6.5,
    textColor=MUTED, leading=9,
)
_VARIANT_VALUE = ParagraphStyle(
    'VariantValue', fontName='Helvetica', fontSize=8.5,
    textColor=INK, leading=11,
)
_VARIANT_PRICE = ParagraphStyle(
    'VariantPrice', fontName='Helvetica-Bold', fontSize=14,
    textColor=ORANGE, leading=17,
)
_BIG_NUMBER = ParagraphStyle(
    'BigNumber', fontName='Helvetica-Bold', fontSize=34,
    textColor=ORANGE, leading=36, alignment=TA_LEFT,
)
_BIG_LABEL = ParagraphStyle(
    'BigLabel', fontName='Helvetica-Bold', fontSize=8,
    textColor=INK, leading=11, alignment=TA_LEFT,
)
_STEP_NUM = ParagraphStyle(
    'StepNum', fontName='Helvetica-Bold', fontSize=22,
    textColor=ORANGE, leading=24,
)
_STEP_TITLE = ParagraphStyle(
    'StepTitle', fontName='Helvetica-Bold', fontSize=10.5,
    textColor=INK, leading=13,
)
_STEP_BODY = ParagraphStyle(
    'StepBody', fontName='Helvetica', fontSize=8.5,
    textColor=CHARCOAL, leading=12,
)
_DARK_EYEBROW = ParagraphStyle(
    'DarkEyebrow', fontName='Helvetica-Bold', fontSize=8,
    textColor=ORANGE, leading=11,
)
_DARK_TITLE = ParagraphStyle(
    'DarkTitle', fontName='Helvetica-Bold', fontSize=20,
    textColor=CREAM, leading=24,
)


# ── kVA → project image map. Maps each family size to a relevant
# install photo so the catalogue isn't just numerals — it shows real work.
_KVA_TO_PROJECT_IMAGE = {
    '3':  'https://www.taqon.co.zw/chisipiti-10kva-1.jpg',
    '5':  'https://www.taqon.co.zw/chisipiti-10kva-1.jpg',
    '6':  'https://www.taqon.co.zw/chisipiti-10kva-1.jpg',
    '8':  'https://www.taqon.co.zw/nedbank-borrowdale-8kva-1.jpg',
    '10': 'https://www.taqon.co.zw/nedbank-harare-12kva-1.jpg',
    '12': 'https://www.taqon.co.zw/nedbank-harare-12kva-1.jpg',
    '16': 'https://www.taqon.co.zw/bulawayo-16kva-2.jpg',
    '20': 'https://www.taqon.co.zw/kadoma-24kva-1.jpg',
    '24': 'https://www.taqon.co.zw/kadoma-24kva-1.jpg',
    '30': 'https://www.taqon.co.zw/kadoma-24kva-1.jpg',
}
_HERO_IMAGE_URL = 'https://www.taqon.co.zw/kadoma-24kva-1.jpg'


def _pick_image_for_kva(kva):
    """Choose the closest matching project image for a family's kVA rating."""
    if not kva:
        return _HERO_IMAGE_URL
    s = str(kva).strip()
    if s in _KVA_TO_PROJECT_IMAGE:
        return _KVA_TO_PROJECT_IMAGE[s]
    try:
        n = float(s)
    except (TypeError, ValueError):
        return _HERO_IMAGE_URL
    # Pick nearest known
    candidates = []
    for k, url in _KVA_TO_PROJECT_IMAGE.items():
        try:
            candidates.append((abs(float(k) - n), url))
        except ValueError:
            continue
    candidates.sort()
    return candidates[0][1] if candidates else _HERO_IMAGE_URL


# ── Cover ──────────────────────────────────────────────────────────

def _cover(*, ref_number, generated_date, family_count, variant_count, families):
    logo = load_logo_image(width_mm=44)
    items = []
    items.append(Spacer(1, 6))
    if logo:
        items.append(logo)
        items.append(Spacer(1, 14))
    items.append(Paragraph(
        f'TAQON ELECTRICO  ·  PACKAGES CATALOGUE  ·  {generated_date}',
        STYLES['Eyebrow'],
    ))
    items.append(AccentBar(width=18 * mm, thickness=1.5 * mm))
    items.append(Paragraph('Solar Packages<br/>Catalogue', _COVER_DISPLAY))
    items.append(Spacer(1, 12))
    items.append(Paragraph(
        'Every active package, every variant — from single-phase home '
        'back-up to three-phase commercial systems. Engineered, supplied '
        'and installed in Zimbabwe by certified engineers.',
        _COVER_SUB,
    ))
    items.append(Spacer(1, 16))

    spec_pairs = [
        (f'{family_count}', 'Families'),
        (f'{variant_count}', 'Variants'),
        ('25 yr', 'Panel warranty'),
        ('10 yr', 'Battery warranty'),
    ]
    items.append(spec_strip([(label, value) for value, label in spec_pairs]))
    items.append(Spacer(1, 14))

    # Hero install photo + TOC overlaid on a single horizontal spread so
    # the cover doesn't overflow when there are many families.
    hero_bytes = fetch_image_bytes(_HERO_IMAGE_URL)
    hero_img = image_or_placeholder(
        hero_bytes, width_mm=88, height_mm=110, label='Featured install',
    )

    # TOC — compact, sits beside the photo
    toc_rows = []
    for idx, f in enumerate(families, start=1):
        ix = f'{idx:02d}'
        kva_chunk = f"{f.get('kva') or '—'} kVA"
        variants_chunk = f"{f.get('variant_count', 0)} variants"
        meta_bits = ' · '.join(filter(None, [kva_chunk, variants_chunk]))
        toc_rows.append([
            Paragraph(f'<font color="#F26522"><b>{ix}</b></font>', _TOC_ROW_NAME),
            [Paragraph(f.get('name', ''), _TOC_ROW_NAME),
             Paragraph(meta_bits, _TOC_ROW_META)],
        ])
    toc_tbl = Table(toc_rows, colWidths=[10 * mm, 70 * mm]) if toc_rows else None
    if toc_tbl is not None:
        toc_tbl.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
        ]))

    right_block = [
        Paragraph('IN THIS CATALOGUE', STYLES['Eyebrow']),
        AccentBar(),
    ]
    if toc_tbl is not None:
        right_block.append(toc_tbl)

    spread = Table(
        [[hero_img, right_block]],
        colWidths=[90 * mm, 84 * mm],
    )
    spread.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 16),
    ]))
    items.append(spread)
    items.append(PageBreak())
    return items


# ── Sizing guide ──────────────────────────────────────────────────

def _sizing_guide():
    """One spread on how to read the catalogue and what each kVA bucket fits."""
    rows = [
        ('3–5 kVA',  'Lights, TV, fridge, Wi-Fi',
         'Compact cottages, flats, single-bedroom homes. Single-phase only.'),
        ('6–8 kVA',  'Family home with mixed loads',
         '3–4 bedroom homes — fridge, freezer, multiple TVs, microwave, geyser back-up.'),
        ('10–12 kVA','Executive homes, small offices',
         'Two-storey homes, light commercial premises, well-pump, air-con and EV charging.'),
        ('16–24 kVA','Commercial, light industry, off-grid capable',
         'Service stations, retail, manufacturing, schools, large estates. Three-phase systems.'),
    ]

    def row_card(rng, head, body):
        return Table([
            [
                Paragraph(rng, _BIG_NUMBER),
            ],
            [
                Paragraph(head.upper(), _BIG_LABEL),
            ],
            [
                Paragraph(body, _FAMILY_DESC),
            ],
        ], colWidths=[81 * mm], style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CREAM),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
        ]))

    cards = [row_card(*r) for r in rows]
    # 2-up grid
    grid_rows = [
        [cards[0], cards[1]],
        [cards[2], cards[3]],
    ]
    grid = Table(grid_rows, colWidths=[86 * mm, 86 * mm], style=TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    items = [
        Paragraph('00 · SIZING GUIDE', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('How to read this catalogue.', _FAMILY_TITLE),
        Spacer(1, 8),
        Paragraph(
            'Pick the kVA bucket that matches your loads — every family '
            'in the catalogue is listed with its kVA rating, available '
            'tiers and what it ships with. Every install is sized by an '
            'engineer before commissioning; the bands below are a guide.',
            _FAMILY_DESC,
        ),
        Spacer(1, 14),
        grid,
        Spacer(1, 22),
        Paragraph('STANDARD INCLUSIONS', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('What every install ships with.', _FAMILY_TITLE),
        Spacer(1, 10),
        _inclusions_strip(),
    ]
    return items


# ── Per-family spread ──────────────────────────────────────────────

def _family_spread(family, *, index):
    """One family per page (or two pages when it has many variants).

    Layout:
      - eyebrow + accent
      - hero row: giant numeral on left | name+desc | install photo on right
      - "use cases" pill row (suitable-for chips)
      - variant grid
      - standard inclusions strip
    """
    items = []

    suitable = family.get('suitable_for') or ''
    kva = family.get('kva') or '—'
    meta_bits = ' · '.join(filter(None, [f'{kva} kVA', suitable]))
    items.append(Paragraph(
        f'FAMILY {index:02d}  ·  {meta_bits.upper()}', STYLES['Eyebrow'],
    ))
    items.append(AccentBar())

    # Hero row: numeral, text, image
    giant_block = [
        Paragraph(str(kva), _GIANT),
        Paragraph('KVA', _GIANT_UNIT),
    ]
    text_block = [
        Paragraph(family.get('name', ''), _FAMILY_TITLE),
        Spacer(1, 6),
        Paragraph(family.get('short_description') or '', _FAMILY_DESC),
    ]
    if family.get('description'):
        text_block += [
            Spacer(1, 4),
            Paragraph(family['description'], STYLES['Body']),
        ]
    # Project image — fetched once, cached for 24h
    img_url = _pick_image_for_kva(kva)
    img_bytes = fetch_image_bytes(img_url)
    img_flow = image_or_placeholder(
        img_bytes, width_mm=58, height_mm=62, label=family.get('name', ''),
    )

    hero = Table(
        [[giant_block, text_block, img_flow]],
        colWidths=[38 * mm, 78 * mm, 58 * mm],
    )
    hero.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    items.append(hero)
    items.append(Spacer(1, 14))

    # "Suitable for" pill row — if we have anything to say
    if suitable:
        chips = [c.strip() for c in suitable.split(',') if c.strip()]
        chip_cells = []
        for c in chips[:6]:
            chip_cells.append(Paragraph(
                f'<font color="#0D0D0D"><b>{c}</b></font>',
                STYLES['BodySmall'],
            ))
        if chip_cells:
            rows = [chip_cells + [''] * (4 - len(chip_cells))][:1]
            chip_tbl = Table(rows, colWidths=[43.5 * mm] * 4)
            chip_tbl.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), ORANGE_LIGHT),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            items.append(Paragraph('SUITABLE FOR', STYLES['Eyebrow']))
            items.append(AccentBar())
            items.append(chip_tbl)
            items.append(Spacer(1, 14))

    # Variant grid
    variants = family.get('variants', [])
    if variants:
        items.append(Paragraph('AVAILABLE VARIANTS', STYLES['Eyebrow']))
        items.append(AccentBar())
        items.append(_variant_grid(variants))
        items.append(Spacer(1, 10))

    # Standard inclusions appear once on the sizing-guide page rather than
    # repeated on every family spread — kept the layout dense without
    # orphaning the band when a family has 3+ variants.

    items.append(PageBreak())
    return items


def _variant_card(variant):
    name = variant.get('name', '')
    tier = (variant.get('tier') or '').strip()
    inverter_kva = variant.get('inverter_kva') or ''
    inverter_label = variant.get('inverter_label') or '—'
    battery_label = variant.get('battery_label') or '—'
    panel_label = variant.get('panel_label') or '—'
    phase = variant.get('phase') or ''
    price = (variant.get('price') or '').strip()

    inv_chunk = inverter_label
    if inverter_kva and inverter_kva not in inverter_label:
        inv_chunk = f'{inverter_kva} kVA · {inverter_label}'

    header = []
    if tier:
        header.append(Paragraph(f'TIER · {tier.upper()}', _VARIANT_TIER))
        header.append(Spacer(1, 2))
    header.append(Paragraph(name, _VARIANT_NAME))
    if price:
        header.append(Spacer(1, 4))
        header.append(Paragraph(price, _VARIANT_PRICE))

    def kv(label, value):
        return [
            Paragraph(label.upper(), _VARIANT_LABEL),
            Paragraph(str(value), _VARIANT_VALUE),
            Spacer(1, 4),
        ]

    detail = []
    detail += kv('Inverter', inv_chunk)
    detail += kv('Battery', battery_label)
    detail += kv('Panels', panel_label)
    if phase:
        detail += kv('Phase', phase)

    body = header + [Spacer(1, 8)] + detail

    card = Table([[body]], colWidths=[84 * mm])
    card.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
    ]))
    return card


def _variant_grid(variants):
    pairs = [variants[i:i + 2] for i in range(0, len(variants), 2)]
    rows = []
    for pair in pairs:
        left = _variant_card(pair[0])
        right = _variant_card(pair[1]) if len(pair) > 1 else ''
        rows.append([left, right])

    grid = Table(rows, colWidths=[87 * mm, 87 * mm])
    grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return grid


def _inclusions_strip():
    """Single-line dark band with the standard-inclusions list. Compact
    enough to fit at the bottom of every family page regardless of how
    many variant cards sit above."""
    inclusion_text = (
        '<font color="#F26522"><b>EVERY INSTALL SHIPS WITH</b></font>'
        '<font color="#FFFBF5">'
        '  &nbsp;&nbsp;Hybrid MPPT inverter &nbsp;·&nbsp; '
        'Lithium-Ion battery bank &nbsp;·&nbsp; '
        'Mono PERC PV panels &nbsp;·&nbsp; '
        'Galvanised mounting &nbsp;·&nbsp; '
        'Tinned copper cabling &nbsp;·&nbsp; '
        'Taqon-certified install'
        '</font>'
    )
    style = ParagraphStyle(
        'InclLine', fontName='Helvetica-Bold', fontSize=8,
        leading=12,
    )
    band = Table([[Paragraph(inclusion_text, style)]], colWidths=[174 * mm])
    band.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), INK),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    return KeepTogether(band)


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
    rows = []
    cells = []
    for num, title, body in steps:
        cell = [
            Paragraph(num, _STEP_NUM),
            Spacer(1, 6),
            Paragraph(title, _STEP_TITLE),
            Spacer(1, 4),
            Paragraph(body, _STEP_BODY),
        ]
        cells.append(cell)
    rows.append(cells)
    col_w = (174 * mm) / 5
    tbl = Table(rows, colWidths=[col_w] * 5)
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LINEBEFORE', (1, 0), (1, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (2, 0), (2, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (3, 0), (3, -1), 0.4, HAIRLINE),
        ('LINEBEFORE', (4, 0), (4, -1), 0.4, HAIRLINE),
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
    ]))
    return [
        Paragraph('OUR PROCESS', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('From first call to long-term support.', _FAMILY_TITLE),
        Spacer(1, 14),
        tbl,
    ]


# ── Warranties matrix ─────────────────────────────────────────────

def _warranties_table():
    rows = [
        ['BRAND', 'EQUIPMENT', 'TERM'],
        ['Sunsynk',     'HV Hybrid Inverters',         '5 Years'],
        ['Growatt',     'Hybrid Inverters',            '5 Years'],
        ['Pylontech',   'HV Lithium-Ion Batteries',    '10 Years'],
        ['Dyness',      'Lithium-Ion Batteries',       '10 Years'],
        ['JA Solar',    'PV Panels',                   '25 Years'],
        ['Jinko Solar', 'PV Panels',                   '25 Years'],
        ['Taqon',       'Installation Workmanship',    '1 Year'],
    ]
    from reportlab.lib.styles import ParagraphStyle as PS
    hdr = PS('whdr', fontName='Helvetica-Bold', fontSize=7, leading=10, textColor=ORANGE)
    bnd = PS('wbnd', fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=INK)
    eqp = PS('weqp', fontName='Helvetica', fontSize=9.5, leading=12, textColor=CHARCOAL)
    yrs = PS('wyrs', fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=ORANGE)

    data = [[Paragraph(c, hdr) for c in rows[0]]]
    for r in rows[1:]:
        data.append([
            Paragraph(r[0], bnd),
            Paragraph(r[1], eqp),
            Paragraph(r[2], yrs),
        ])
    tbl = Table(data, colWidths=[40 * mm, 90 * mm, 44 * mm], repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    for i in range(1, len(data)):
        style += [
            ('TOPPADDING', (0, i), (-1, i), 9),
            ('BOTTOMPADDING', (0, i), (-1, i), 9),
        ]
        if i % 2 == 0:
            style.append(('BACKGROUND', (0, i), (-1, i), ZEBRA))
    tbl.setStyle(TableStyle(style))

    return [
        Paragraph('WARRANTIES', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('What is covered, for how long.', _FAMILY_TITLE),
        Spacer(1, 12),
        Paragraph(
            'Each component carries its manufacturer\'s standard warranty. '
            'Taqon-certified installation workmanship is covered for 1 year '
            'on top of the manufacturer terms.',
            _FAMILY_DESC,
        ),
        Spacer(1, 12),
        tbl,
    ]


# ── Closing ────────────────────────────────────────────────────────

def _closing(*, generated_date):
    items = [
        Paragraph('LET\'S BUILD YOUR SYSTEM', STYLES['Eyebrow']),
        AccentBar(),
        Paragraph('Custom-sized for your loads.', _FAMILY_TITLE),
        Spacer(1, 8),
        Paragraph(
            'Tell us your appliance list and location. We\'ll size, '
            'cost, and commission a system that fits — whether it\'s '
            'one of the families in this catalogue or a bespoke build. '
            'Every install is delivered by Taqon-certified engineers and '
            'backed by manufacturer-grade warranties.',
            STYLES['Body'],
        ),
        Spacer(1, 14),
        cta_band(
            'Next step',
            'Talk to engineering for a free site survey.',
            'Quotation issued within 24 hours of survey completion.',
            right_label='Call us today',
            right_value='+263 77 277 1036',
            right_sub='info@taqon.co.zw',
        ),
        Spacer(1, 14),
        contact_strip({
            'address': '203 Sherwood Drive, Strathaven, Harare',
            'phone':   '+263 77 277 1036',
            'email':   'info@taqon.co.zw',
            'website': 'www.taqon.co.zw',
            'generated_date': generated_date,
        }),
    ]
    return items


# ── Entry point ───────────────────────────────────────────────────

def build_catalogue_pdf(*, families, ref_number,
                       generated_date=None,
                       family_count=None,
                       variant_count=None):
    generated_date = generated_date or format_date_label()
    family_count = family_count if family_count is not None else len(families)
    variant_count = variant_count if variant_count is not None else \
        sum(f.get('variant_count', len(f.get('variants', []))) for f in families)

    story = []
    story.extend(_cover(
        ref_number=ref_number,
        generated_date=generated_date,
        family_count=family_count,
        variant_count=variant_count,
        families=families,
    ))

    # Sizing guide — first spread inside
    story.extend(_sizing_guide())
    story.append(PageBreak())

    # Family spreads
    for idx, family in enumerate(families, start=1):
        story.extend(_family_spread(family, index=idx))

    # Process
    story.extend(_process_section())
    story.append(Spacer(1, 22))

    # Warranties
    story.extend(_warranties_table())
    story.append(PageBreak())

    # Close
    story.extend(_closing(generated_date=generated_date))

    return render_doc(
        story,
        doc_title=f'Taqon Packages Catalogue · {ref_number}',
        suppress_first_page=True,
    )
