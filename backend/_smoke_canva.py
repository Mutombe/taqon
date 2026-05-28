"""Throwaway smoke test — render the Canva-style catalogue HTML to PDF
via Playwright + Chromium (Windows-friendly QA path; production uses
WeasyPrint). Renders the template with real data shaping so the smoke
match what the production view will produce."""
import os
import django
from playwright.sync_api import sync_playwright

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.template.loader import render_to_string
from apps.documents.catalogue_canva import _shape_variant, _pair_variants, _data_uri


def v(name, kva, inv, bat_lbl, bat_kwh, pan_lbl, panels, phase, price):
    return {
        'name': name, 'inverter_kva': str(kva), 'inverter_label': inv,
        'battery_label': bat_lbl, 'battery_kwh': str(bat_kwh),
        'panel_label': pan_lbl, 'panel_count': panels,
        'phase': phase, 'tier': '', 'price': price,
    }


# Replicate the Canva draft's exact packages
families = [
    {'name': 'Home Economy 3kVA', 'variants': [
        v('Home Economy 3kVA', 3, '3KVA MUST INVERTER 24V', '2.4 kWh', 2.4, '4 panels', 4, 'Single', '$1,579'),
    ]},
    {'name': 'Home LUXURY 1.0 6KVA', 'variants': [
        v('Home LUXURY 1.0 6KVA', 6, '6KVA GROWATT HYBRID INVERTER', '5.1 kWh', 5.1, '4 panels', 4, 'Single', '$2,425'),
    ]},
    {'name': 'HOME LUXURY 1.1 6KVA', 'variants': [
        v('HOME LUXURY 1.1 6KVA', 6, '6KVA GROWATT HYBRID INVERTER 48V', '5.1 kWh', 5.1, '6 panels', 6, 'Single', '$2,710'),
        v('HOME LUXURY 2.0 5KVA', 5, '5KVA HYBRID SUNSYNK INVERTER 48V', '5.1 kWh', 5.1, '6 panels', 6, 'Single', '$3,455'),
    ]},
    {'name': 'HOME LUXURY 1.1 6KVA-b', 'variants': [
        v('HOME LUXURY 1.1 6KVA', 6, '6KVA GROWATT HYBRID INVERTER 48V', '10.2 kWh', 10.2, '8 panels', 8, 'Single', '$4,049'),
        v('HOME LUXURY 2.1 5KVA', 5, '5KVA HYBRID SUNSYNK INVERTER 48V', '10.2 kWh', 10.2, '8 panels', 8, 'Single', '$4,799'),
    ]},
    {'name': 'HOME LUXURY PERFORMANCE 5KVA', 'variants': [
        v('HOME LUXURY PERFORMANCE 5KVA', 5, '5KVA HYBRID SUNSYNK INVERTER 48V', '14.28 kWh', 14.28, '10 panels', 10, 'Single', '$5,464'),
        v('Home DELUX 2.0 8KVA', 8, '8KVA HYBRID SUNSYNK', '10.2 kWh', 10.2, '10 panels', 10, 'Single', '$5,634'),
    ]},
    {'name': 'HOME DELUXE 2.18KVA', 'variants': [
        v('HOME DELUXE 2.18KVA', 8, '8KVA HYBRID SUNSYNK INVERTER 48V', '14.28 kWh', 14.28, '12 panels', 12, 'Single', '$6,408'),
        v('Home DELUXE 2.0 8KVA', 8, '10KVA HYBRID SUNSYNK INVERTER 48V', '14.28 kWh', 14.28, '14 panels', 14, 'Single', '$6,408'),
    ]},
    {'name': 'ULTRA POWER V2.1 10KVA', 'variants': [
        v('ULTRA POWER V2.1 10KVA', 10, '10KVA HYBRID SUNSYNK INVERTER 48V', '20.4 kWh', 20.4, '16 panels', 16, 'Single', '$6,408'),
        v('PREMIUM POWER 1.0 12KVA', 12, '12KVA HYBRID SUNSYNK INVERTER 48V', '14.28 kWh', 14.28, '14 panels', 14, 'Single', '$7,819'),
    ]},
    {'name': 'PREMIUM POWER 2.0 12KVA', 'variants': [
        v('PREMIUM POWER 2.0 12KVA', 12, '12KVA HYBRID SUNSYNK INVERTER 3 PHASE 48V', '14.28 kWh', 14.28, '14 panels', 14, 'Three', '$8,408'),
        v('PRO POWER 1.0', 16, '16KVA HYBRID SUNSYNK INVERTER 48V', '20.4 kWh', 20.4, '18 panels', 18, 'Single', '$11,229'),
    ]},
    {'name': 'PRO POWER 1.1', 'variants': [
        v('PRO POWER 1.1', 16, '16KVA HYBRID SUNSYNK INVERTER 48V', '28.56 kWh', 28.56, '21 panels', 21, 'Three', '$12,775'),
        v('MASTER POWER V1.0', 20, '20KVA HYBRID SUNSYNK INVERTER 48V', '28.56 kWh', 28.56, '24 panels', 24, 'Single', '$11,229'),
    ]},
]

shaped = []
for family in families:
    for variant in family.get('variants', []):
        shaped.append(_shape_variant(variant, family_name=family.get('name', '')))

variant_pairs = _pair_variants(shaped)

static_images = {
    'logo':         _data_uri('logo.png'),
    'hero_house':   _data_uri('cover_hero_house.jpg'),
    'collage_a':    _data_uri('cover_collage_battery_techs.jpg'),
    'collage_b':    _data_uri('cover_collage_solar_pole.jpg'),
    'collage_c':    _data_uri('cover_collage_aircon.jpg'),
    'bg_blocks':    _data_uri('bg_white_blocks.jpg'),
    'closing_box':  _data_uri('closing_collage_battery_install.jpg'),
    'closing_hero': _data_uri('closing_sunsynk_techs.jpg'),
}

ctx = {
    'doc_title':     'Taqon Product Catalog',
    'ref_number':    'CAT-CANVA-SMOKE',
    'generated_date': '28 May 2026',
    'variant_pairs': variant_pairs,
    'images':        static_images,
}
html = render_to_string('pdfs/packages_catalogue_canva.html', ctx)
html_path = r'C:\Users\PC\documents\taqon\catalogue assets\smoke.html'
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print('html written:', html_path, 'size:', len(html))

out_pdf = r'C:\Users\PC\documents\taqon\Taqon-Canva-Catalogue.pdf'
url = 'file:///' + html_path.replace('\\', '/')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(url, wait_until='networkidle')
    page.pdf(
        path=out_pdf, format='A4', print_background=True,
        margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'},
    )
    browser.close()

print('pdf size:', os.path.getsize(out_pdf))
