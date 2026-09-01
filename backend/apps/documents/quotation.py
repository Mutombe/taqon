"""Build the customer-facing instant quote PDF with ReportLab.

Replaces the HTML→PDF (xhtml2pdf / WeasyPrint) path with native
flowable-based layout. Predictable, fast, brand-true.

The shape of the quote — per the user's explicit ask:
  - Header with logo + Quotation title + ref/date
  - "Prepared for" customer block
  - System specifications strip (kVA / kWh / panels / tier)
  - Items table: Description + Qty only (no per-line prices)
  - Indicators column on the left of the totals strip:
        $/kW, $/kWh, system kW, distance km
  - Totals stack: Materials / Labour & Transport / Total
  - Bank transfer details (FBC + Swift)
  - Warranty coverage (general, brand-agnostic)
  - Contact strip (address / phone+email / web+date)
"""
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether, Paragraph, Spacer, Table, TableStyle,
)

from .base import format_date_label, render_doc
from .elements import (
    AccentBar, HRule, contact_strip, cta_band, doc_header_table,
    load_logo_image, section_header, soft_panel, spec_strip,
)
from .styles import (
    STYLES, ORANGE, ORANGE_DARK, ORANGE_LIGHT, CREAM, INK, CHARCOAL,
    MUTED, HAIRLINE, ZEBRA, WHITE,
)


# ── BANK + WARRANTY DEFAULTS — pulled into the quote unless overridden ──

DEFAULT_BANK = [
    ('Bank',           'FBC'),
    ('Branch',         'Southerton'),
    ('Branch Code',    '8103'),
    ('Account Name',   'Taqon Electrico'),
    ('Account Number', '6832967310002'),
    ('Swift Code',     'FBCPZWHA'),
]
DEFAULT_CORRESPONDENT = 'Standard Chartered Bank, New York'

# Brand-agnostic warranty coverage — the quote communicates general coverage
# without committing Taqon to a specific manufacturer's terms (the exact
# warranty for the selected equipment is confirmed in the final quotation).
# Each entry is (equipment category, coverage).
DEFAULT_WARRANTIES = [
    ('Inverters',                  'Up to 10 Years'),
    ('Lithium Batteries',          'Up to 10 Years'),
    ('Solar PV Modules',           'Up to 25 Years'),
    ('Installation & Workmanship', 'Up to 5 Years'),
]

WARRANTY_NOTE = (
    'Warranty periods vary by product, model and manufacturer. The applicable '
    'warranty for equipment selected will be confirmed in your final quotation. '
    'Manufacturer warranty terms and conditions apply.'
)


# ─────────────────────────────────────────────────────────────────


def _header(ref_number, generated_date, tier_label):
    """Logo + brand wordmark on the left, document metadata on the right."""
    logo = load_logo_image(width_mm=36)
    if logo:
        left = [logo, Spacer(1, 8)]
    else:
        left = [
            Paragraph(
                '<font color="#0D0D0D"><b>TAQON</b></font> '
                '<font color="#F26522"><b>ELECTRICO.</b></font>',
                STYLES['H1']),
            Spacer(1, 4),
            Paragraph('Customer is King!', STYLES['BodySmall']),
            Spacer(1, 8),
        ]

    right = [
        Paragraph('<para align="right"><b>QUOTATION</b></para>',
                  ParagraphStyle_or_make('right_title', size=20, weight='bold')),
        Spacer(1, 6),
        _meta_row('Ref',          ref_number),
        _meta_row('Date',         generated_date),
        _meta_row('Tier',         tier_label or 'Standard'),
        _meta_row('Validity',     '10 days'),
    ]
    return doc_header_table(left, right)


def ParagraphStyle_or_make(name, *, size=10, weight='bold'):
    """Tiny right-aligned title style, generated inline for the header."""
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT
    return ParagraphStyle(
        name, fontName=('Helvetica-Bold' if weight == 'bold' else 'Helvetica'),
        fontSize=size, leading=size + 2,
        textColor=INK, alignment=TA_RIGHT,
    )


def _meta_row(label, value):
    """One row of the right-side metadata stack — label + value.

    Labels left-aligned in their column so Ref/Date/Tier/Validity start
    at the same x position; values stay right-aligned against the page edge.
    """
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_RIGHT
    style = ParagraphStyle(
        f'meta_{label}', fontName='Helvetica', fontSize=8, leading=11,
        textColor=MUTED, alignment=TA_LEFT,
    )
    bold = ParagraphStyle(
        f'meta_{label}_v', fontName='Helvetica-Bold', fontSize=9, leading=11,
        textColor=INK, alignment=TA_RIGHT,
    )
    return Table(
        [[Paragraph(label, style), Paragraph(str(value), bold)]],
        colWidths=[20 * mm, 56 * mm],
        style=TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 1),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ]),
    )


def _customer_block(name, email, phone, address):
    """'Prepared For' two-column block with customer name + contacts."""
    lines = [
        Paragraph('PREPARED FOR', STYLES['Eyebrow']),
        Spacer(1, 4),
        Paragraph(name, STYLES['H2']),
    ]
    detail = [
        Paragraph(email, STYLES['Body']),
    ]
    if phone:
        detail.append(Paragraph(phone, STYLES['Body']))
    if address:
        detail.append(Paragraph(address, STYLES['BodySmall']))

    tbl = Table(
        [[lines, detail]],
        colWidths=[80 * mm, 94 * mm],
        style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CREAM),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('LINEBEFORE', (0, 0), (0, -1), 2, ORANGE),
        ]),
    )
    return tbl


def _items_table(item_groups):
    """The line-items table — Description + Qty only. No prices.

    `item_groups` is a list of dicts: { 'label': '<category>', 'items': [...] }
    Each item is { 'num', 'name', 'brand', 'specs', 'qty', ... }.
    """
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT

    name_style = ParagraphStyle(
        'item_name', fontName='Helvetica-Bold', fontSize=9, leading=12,
        textColor=INK,
    )
    brand_style = ParagraphStyle(
        'item_brand', fontName='Helvetica', fontSize=7.5, leading=10,
        textColor=MUTED,
    )
    specs_style = ParagraphStyle(
        'item_specs', fontName='Helvetica', fontSize=7, leading=10,
        textColor=MUTED,
    )
    qty_style = ParagraphStyle(
        'item_qty', fontName='Helvetica-Bold', fontSize=10, leading=12,
        textColor=INK, alignment=TA_RIGHT,
    )
    section_style = ParagraphStyle(
        'item_section', fontName='Helvetica-Bold', fontSize=7.5, leading=10,
        textColor=INK,
    )

    rows = [
        [
            Paragraph('#', STYLES['Eyebrow']),
            Paragraph('DESCRIPTION', STYLES['Eyebrow']),
            Paragraph('<para align="right">QTY</para>', STYLES['Eyebrow']),
        ]
    ]
    row_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('TEXTCOLOR', (0, 0), (-1, 0), ORANGE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    body_row_idx = 1
    for group in item_groups:
        # Category header row — SPAN takes content from FIRST cell, so put label there.
        rows.append([
            Paragraph(group['label'].upper(), section_style), '', ''
        ])
        row_styles += [
            ('BACKGROUND', (0, body_row_idx), (-1, body_row_idx), ORANGE_LIGHT),
            ('SPAN', (0, body_row_idx), (-1, body_row_idx)),
            ('TOPPADDING', (0, body_row_idx), (-1, body_row_idx), 6),
            ('BOTTOMPADDING', (0, body_row_idx), (-1, body_row_idx), 6),
            ('LEFTPADDING', (0, body_row_idx), (-1, body_row_idx), 14),
        ]
        body_row_idx += 1
        for item in group.get('items', []):
            # Build a multi-line description: name (bold), brand, specs
            desc_flowables = [Paragraph(str(item.get('name', '')), name_style)]
            if item.get('brand'):
                desc_flowables.append(Paragraph(str(item['brand']), brand_style))
            if item.get('specs'):
                desc_flowables.append(Paragraph(str(item['specs']), specs_style))

            rows.append([
                Paragraph(f"<font color='#6B7280'>{item.get('num', '')}</font>",
                          STYLES['BodySmall']),
                desc_flowables,
                Paragraph(str(item.get('qty', '')), qty_style),
            ])
            row_styles += [
                ('LINEBELOW', (0, body_row_idx), (-1, body_row_idx), 0.4, HAIRLINE),
                ('TOPPADDING', (0, body_row_idx), (-1, body_row_idx), 8),
                ('BOTTOMPADDING', (0, body_row_idx), (-1, body_row_idx), 8),
            ]
            if body_row_idx % 2 == 0:
                row_styles.append(
                    ('BACKGROUND', (0, body_row_idx), (-1, body_row_idx), ZEBRA),
                )
            body_row_idx += 1

    tbl = Table(rows, colWidths=[12 * mm, 132 * mm, 30 * mm], repeatRows=1)
    tbl.setStyle(TableStyle(row_styles))
    return tbl


def _indicators_and_totals(*, material_total, labour_total, transport_total, grand_total,
                           system_size_kw, usd_per_kw, usd_per_kwh, distance_km):
    """Bottom strip: indicators on the left, totals stack on the right."""
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT, TA_LEFT

    ind_label = ParagraphStyle('ind_label', fontName='Helvetica', fontSize=7,
                               leading=10, textColor=MUTED)
    ind_value = ParagraphStyle('ind_value', fontName='Helvetica-Bold',
                               fontSize=9, leading=12, textColor=INK)

    indicator_rows = []
    indicators = []
    if usd_per_kw:
        indicators.append((f'USD {usd_per_kw}', 'per kW installed'))
    if usd_per_kwh:
        indicators.append((f'USD {usd_per_kwh}', 'per kWh storage'))
    if system_size_kw:
        indicators.append((f'{system_size_kw} kW', 'total system size'))
    if distance_km is not None:
        indicators.append((f'{int(float(distance_km))} km', 'site distance (Harare)'))

    for value, label in indicators:
        indicator_rows.append([
            Paragraph(value, ind_value),
            Paragraph(label, ind_label),
        ])

    left = [
        Paragraph('SYSTEM INDICATORS', STYLES['Eyebrow']),
        Spacer(1, 6),
        Table(indicator_rows, colWidths=[28 * mm, 48 * mm],
              style=TableStyle([
                  ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                  ('LEFTPADDING', (0, 0), (-1, -1), 0),
                  ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                  ('TOPPADDING', (0, 0), (-1, -1), 2),
                  ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
              ])) if indicator_rows else Paragraph('', STYLES['Body']),
    ]

    total_lbl = ParagraphStyle('tlbl', fontName='Helvetica', fontSize=9,
                               leading=12, textColor=MUTED, alignment=TA_LEFT)
    total_val = ParagraphStyle('tval', fontName='Helvetica-Bold', fontSize=9,
                               leading=12, textColor=INK, alignment=TA_RIGHT)
    grand_lbl = ParagraphStyle('glbl', fontName='Helvetica-Bold', fontSize=11,
                               leading=14, textColor=INK, alignment=TA_LEFT)
    grand_val = ParagraphStyle('gval', fontName='Helvetica-Bold', fontSize=18,
                               leading=22, textColor=ORANGE, alignment=TA_RIGHT)

    # Materials, Labour and Transport are itemised separately so the
    # customer can verify each — and so the three component lines add up
    # exactly to the Total (sundries are folded into Materials upstream).
    totals_rows = [
        [Paragraph('Materials', total_lbl),
         Paragraph(f'USD {material_total}', total_val)],
        [Paragraph('Labour', total_lbl),
         Paragraph(f'USD {labour_total}', total_val)],
        [Paragraph('Transport', total_lbl),
         Paragraph(f'USD {transport_total}', total_val)],
        [Paragraph('Total', grand_lbl),
         Paragraph(f'USD {grand_total}', grand_val)],
    ]
    right = Table(totals_rows, colWidths=[36 * mm, 40 * mm], style=TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, 0), (-1, 2), 0.4, HAIRLINE),
        ('LINEABOVE', (0, 3), (-1, 3), 1.5, INK),
    ]))

    outer = Table([[left, right]], colWidths=[97 * mm, 77 * mm],
                  style=TableStyle([
                      ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                      ('LEFTPADDING', (0, 0), (-1, -1), 0),
                      ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                      ('TOPPADDING', (0, 0), (-1, -1), 0),
                      ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                  ]))
    return outer


def _bank_details(ref_number):
    """FBC bank transfer details, two-column."""
    from reportlab.lib.styles import ParagraphStyle
    lbl = ParagraphStyle('bl', fontName='Helvetica', fontSize=8.5, leading=12,
                         textColor=MUTED)
    val = ParagraphStyle('bv', fontName='Helvetica-Bold', fontSize=9, leading=12,
                         textColor=INK)

    def kv(label, value):
        return Table(
            [[Paragraph(label, lbl), Paragraph(str(value), val)]],
            colWidths=[26 * mm, 56 * mm],
            style=TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 2),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ])
        )

    left = [kv(k, v) for k, v in DEFAULT_BANK[:5]]
    right = [
        kv(DEFAULT_BANK[5][0], DEFAULT_BANK[5][1]),
        kv('Correspondent', DEFAULT_CORRESPONDENT),
        Spacer(1, 4),
        kv('Payment Reference', ref_number),
    ]

    title = Paragraph('BANK TRANSFER DETAILS', STYLES['Eyebrow'])
    body = Table(
        [[left, right]],
        colWidths=[83 * mm, 91 * mm],
        style=TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]),
    )
    panel = soft_panel([title, AccentBar(width=14 * mm), body])
    return panel


def _warranties_table(warranties):
    """A two-column table of equipment category · general warranty coverage.

    Deliberately brand-agnostic — see DEFAULT_WARRANTIES / WARRANTY_NOTE.
    """
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT
    hdr = ParagraphStyle('wh', fontName='Helvetica-Bold', fontSize=7,
                         leading=10, textColor=ORANGE)
    hdr_r = ParagraphStyle('whr', fontName='Helvetica-Bold', fontSize=7,
                           leading=10, textColor=ORANGE, alignment=TA_RIGHT)
    equip = ParagraphStyle('we', fontName='Helvetica-Bold', fontSize=9,
                           leading=12, textColor=INK)
    yrs = ParagraphStyle('wy', fontName='Helvetica-Bold', fontSize=9,
                         leading=12, textColor=ORANGE, alignment=TA_RIGHT)

    rows = [[Paragraph('EQUIPMENT', hdr),
             Paragraph('WARRANTY COVERAGE', hdr_r)]]
    for w in warranties:
        rows.append([
            Paragraph(w[0], equip),
            Paragraph(w[1], yrs),
        ])

    tbl = Table(rows, colWidths=[124 * mm, 50 * mm], repeatRows=1)
    row_styles = [
        ('BACKGROUND', (0, 0), (-1, 0), INK),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, HAIRLINE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    for i in range(1, len(rows)):
        row_styles += [
            ('TOPPADDING', (0, i), (-1, i), 7),
            ('BOTTOMPADDING', (0, i), (-1, i), 7),
        ]
        if i % 2 == 0:
            row_styles.append(('BACKGROUND', (0, i), (-1, i), ZEBRA))
    tbl.setStyle(TableStyle(row_styles))
    return tbl


# ─────────────────────────────────────────────────────────────────


def build_quotation_pdf(*,
                        package_name,
                        ref_number,
                        customer_name,
                        customer_email,
                        customer_phone='',
                        customer_address='',
                        item_groups,
                        material_total,
                        labour_total,
                        transport_total,
                        grand_total,
                        inverter_kva='',
                        battery_kwh='',
                        panel_count=None,
                        tier_label='',
                        system_size_kw='',
                        usd_per_kw='',
                        usd_per_kwh='',
                        distance_km=10,
                        warranties=None,
                        generated_date=None):
    """Return the PDF bytes for an instant quote."""

    generated_date = generated_date or format_date_label()

    story = []

    # ── Header — logo + Quotation title + ref/date ──
    story.append(_header(ref_number, generated_date, tier_label))
    story.append(Spacer(1, 18))

    # ── Project description / package family name ──
    story.append(Paragraph(
        f'<b>{package_name}</b> &nbsp;&middot;&nbsp; '
        f'<font color="#6B7280">Sized for your loads, '
        f'installed by certified engineers.</font>',
        STYLES['Lead'],
    ))
    story.append(Spacer(1, 14))

    # ── Customer block ──
    story.append(_customer_block(
        customer_name, customer_email, customer_phone, customer_address,
    ))
    story.append(Spacer(1, 16))

    # ── Spec strip ──
    spec_pairs = []
    if inverter_kva:
        spec_pairs.append(('Inverter (kVA)', inverter_kva))
    if battery_kwh:
        spec_pairs.append(('Battery (kWh)', battery_kwh))
    if panel_count:
        spec_pairs.append(('Panels', panel_count))
    if tier_label:
        spec_pairs.append(('Tier', tier_label))
    if spec_pairs:
        story.append(spec_strip(spec_pairs))
        story.append(Spacer(1, 16))

    # ── Items table ──
    story.extend(section_header('01 / Scope', 'What is included'))
    story.append(_items_table(item_groups))
    story.append(Spacer(1, 14))

    # ── Indicators + totals ──
    story.append(_indicators_and_totals(
        material_total=material_total,
        labour_total=labour_total,
        transport_total=transport_total,
        grand_total=grand_total,
        system_size_kw=system_size_kw,
        usd_per_kw=usd_per_kw,
        usd_per_kwh=usd_per_kwh,
        distance_km=distance_km,
    ))
    story.append(Spacer(1, 18))

    # ── Bank details ──
    story.append(_bank_details(ref_number))
    story.append(Spacer(1, 18))

    # ── Warranties ──
    from reportlab.lib.styles import ParagraphStyle
    story.extend(section_header('02 / Warranties', 'Warranty Coverage'))
    story.append(_warranties_table(warranties or DEFAULT_WARRANTIES))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        WARRANTY_NOTE,
        ParagraphStyle('warr_note', fontName='Helvetica-Oblique', fontSize=7.5,
                       leading=11, textColor=MUTED),
    ))
    story.append(Spacer(1, 18))

    # ── Closing CTA ──
    story.append(cta_band(
        'Next step',
        'Pay 50% deposit to commence work, and the remaining 50% balance due '
        'immediately upon completion of installation.',
        'Final figure confirmed on completion of works. Valid 10 days.',
        right_label='Talk to engineering',
        right_value='+263 77 277 1036',
        right_sub='info@taqon.co.zw',
    ))
    return render_doc(
        story,
        doc_title=f'Taqon Quotation · {ref_number}',
        suppress_first_page=True,
    )
