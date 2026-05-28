"""Build the Canva-style packages catalogue via WeasyPrint.

Shapes the live PackageFamily/variant data into the row-style needed by
templates/pdfs/packages_catalogue_canva.html: each page hosts two
package blocks with a product-shot composite (panels + inverter +
battery) and the Components/Includes split.

All assets are inlined as base64 data URIs so the rendered HTML is
self-contained — no relative-path resolution needed, no race with
static-file collection, works identically under WeasyPrint and
headless Chromium.
"""
import base64
import os
import logging
import mimetypes

logger = logging.getLogger(__name__)

# Where the Canva-extracted images live.
_ASSETS_DIR = os.path.join(
    os.path.dirname(__file__), 'static', 'catalogue_assets',
)


def _data_uri(filename):
    """Return a base64 data: URI for an asset under static/catalogue_assets,
    or an empty string if the file is missing (template handles None)."""
    path = os.path.join(_ASSETS_DIR, filename)
    if not os.path.exists(path):
        logger.warning('catalogue asset missing: %s', filename)
        return ''
    mime, _ = mimetypes.guess_type(path)
    mime = mime or 'application/octet-stream'
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('ascii')
    return f'data:{mime};base64,{data}'


# ── ASSET MAP ─────────────────────────────────────────────────────
# Brand keyword → image filename in catalogue_assets/. Picked by
# matching against the variant's inverter / battery labels.

_INVERTER_ASSETS = {
    'must':    'inverter_must.png',
    'growatt': 'inverter_growatt.png',
    'sunsynk': 'inverter_sunsynk.png',
}
_INVERTER_DEFAULT = 'inverter_sunsynk.png'

# Choose the larger Sunsynk hero photo for the higher-tier kVA bands.
_SUNSYNK_XL_THRESHOLD_KVA = 10

_BATTERY_ASSETS_BY_BRAND = {
    'dyness': 'battery_dyness_d.png',
    'pylontech': 'battery_dyness_d.png',  # closest visual fallback
}
_BATTERY_FOR_SMALL = 'battery_dyness_dl25.png'  # the short DL2.5 unit
_BATTERY_FOR_LARGE = 'battery_dyness_d.png'     # tall 'D' branded
_BATTERY_DEFAULT = 'battery_dyness_d.png'


def _pick_inverter_image(inverter_label, inverter_kva):
    label = (inverter_label or '').lower()
    for keyword, fname in _INVERTER_ASSETS.items():
        if keyword in label:
            # Prefer the larger Sunsynk hero for big-kVA systems.
            if keyword == 'sunsynk':
                try:
                    if float(inverter_kva or 0) >= _SUNSYNK_XL_THRESHOLD_KVA:
                        return 'inverter_sunsynk_xl.png'
                except (TypeError, ValueError):
                    pass
            return fname
    return _INVERTER_DEFAULT


def _pick_battery_image(battery_label, battery_kwh):
    """Short stacked battery for <5 kWh, taller 'D' unit for the rest."""
    try:
        kwh = float(battery_kwh or 0)
    except (TypeError, ValueError):
        kwh = 0
    if 0 < kwh <= 5:
        return _BATTERY_FOR_SMALL
    return _BATTERY_FOR_LARGE


# ── DATA SHAPING ──────────────────────────────────────────────────

def _shape_variant(variant, *, family_name):
    """Turn the view-level variant dict into the row the template needs."""
    name = (variant.get('name') or family_name or '').strip()
    inverter_kva = variant.get('inverter_kva') or ''
    inverter_label = variant.get('inverter_label') or ''
    battery_label = variant.get('battery_label') or ''
    battery_kwh = variant.get('battery_kwh') or ''
    panel_count = variant.get('panel_count') or ''
    panel_label = variant.get('panel_label') or ''
    phase = (variant.get('phase') or '').strip().lower()
    tier = (variant.get('tier') or '').strip()
    price = (variant.get('price') or '').strip()

    if phase.startswith('three'):
        phase_text = 'Threephase'
        phase_short = '3P'
    else:
        phase_text = 'Singlephase'
        phase_short = '1P'

    inverter_spec = inverter_label.strip() if inverter_label else (
        f'{inverter_kva} kVA Hybrid Inverter' if inverter_kva else '—'
    )
    battery_spec = battery_label.strip() if battery_label else (
        f'{battery_kwh} kWh' if battery_kwh else '—'
    )
    panel_spec = (
        panel_label.strip() if panel_label else
        f'{panel_count} panels' if panel_count else '—'
    )

    # Display name — wrap onto two lines: <head><br/>KVA tail
    display_name = _format_display_name(name)

    return {
        'display_name':    display_name,
        'phase_text':      phase_text,
        'phase_short':     phase_short,
        'price':           price or 'On request',
        'inverter_spec':   inverter_spec,
        'battery_spec':    battery_spec,
        'panel_spec':      panel_spec,
        'inverter_image':  _data_uri(_pick_inverter_image(inverter_label, inverter_kva)),
        'battery_image':   _data_uri(_pick_battery_image(battery_label, battery_kwh)),
        'panels_image':    _data_uri('panels_pair.png'),
        'tier':            tier,
    }


def _format_display_name(name):
    """Display the variant name in two lines like the Canva draft:
    'HOME LUXURY 1.1' / '6KVA'.

    Pull the kVA chunk to the second line if present; otherwise just
    upcase and return on a single line.
    """
    import re
    s = (name or '').strip()
    if not s:
        return ''
    # Match "... 6kVA" or "... 12 kVA" at end
    m = re.search(r'(\d+\.?\d*\s*kVA)\s*$', s, re.IGNORECASE)
    if m:
        head = s[: m.start()].rstrip(' ,-·')
        tail = m.group(1).upper().replace(' ', '')
        return f'{head.upper()}<br/>{tail}'
    return s.upper()


def _pair_variants(variants):
    """Group flattened variants into pairs (top + bottom of a page)."""
    pairs = []
    for i in range(0, len(variants), 2):
        chunk = variants[i:i + 2]
        if len(chunk) == 1:
            chunk.append(None)
        pairs.append(chunk)
    return pairs


# ── ENTRY POINT ───────────────────────────────────────────────────

def build_canva_catalogue_pdf(*, families, ref_number, generated_date=None):
    """Render the Canva-style packages catalogue as PDF bytes.

    Falls back gracefully: raises on render failure; callers should
    catch and fall back to the ReportLab catalogue or the HTML
    catalogue template.
    """
    from django.template.loader import render_to_string

    # Flatten every variant across every family in price order.
    shaped = []
    for family in families:
        fname = family.get('name', '')
        for v in family.get('variants', []):
            shaped.append(_shape_variant(v, family_name=fname))

    variant_pairs = _pair_variants(shaped)

    # Fixed assets used on the cover and closing pages — encode once.
    static_images = {
        'logo':           _data_uri('logo.png'),
        'hero_house':     _data_uri('cover_hero_house.jpg'),
        'collage_a':      _data_uri('cover_collage_battery_techs.jpg'),
        'collage_b':      _data_uri('cover_collage_solar_pole.jpg'),
        'collage_c':      _data_uri('cover_collage_aircon.jpg'),
        'bg_blocks':      _data_uri('bg_white_blocks.jpg'),
        'closing_box':    _data_uri('closing_collage_battery_install.jpg'),
        'closing_hero':   _data_uri('closing_sunsynk_techs.jpg'),
    }

    ctx = {
        'doc_title':     f'Taqon Product Catalog · {ref_number}',
        'ref_number':    ref_number,
        'generated_date': generated_date or '',
        'variant_pairs': variant_pairs,
        'images':        static_images,
    }
    html_string = render_to_string('pdfs/packages_catalogue_canva.html', ctx)

    # Render via the shared WeasyPrint helper. Pass base_url so relative
    # image paths in the template resolve against the static dir.
    base_url = os.path.join(
        os.path.dirname(__file__), 'static',
    )
    from apps.quotations.pdf import _render_pdf
    pdf_bytes = _render_pdf(html_string, base_url=base_url)
    if pdf_bytes[:4] != b'%PDF':
        raise RuntimeError('WeasyPrint did not produce a valid PDF')
    return pdf_bytes
