"""
Routing tables and pricing constants for the solar recommendation engine.

All values are version-controlled Python constants — no DB round-trips needed.
Derived from the Taqon Electrico web development focus PDF.
"""

from decimal import Decimal

# ── PP (Power Points) Routing Table ──
# Maps total PP score → minimum inverter kVA rating
PP_ROUTING = [
    (Decimal('3.5'), Decimal('3')),     # 0–3.5 PP → 3 kVA
    (Decimal('7.0'), Decimal('5')),     # 3.6–7.0 PP → 5 kVA
    (Decimal('11.5'), Decimal('8')),    # 7.1–11.5 PP → 8 kVA
    (Decimal('15.0'), Decimal('10')),   # 11.6–15.0 PP → 10 kVA
    (Decimal('19.0'), Decimal('12')),   # 15.1–19.0 PP → 12 kVA
    (Decimal('24.0'), Decimal('16')),   # 19.1–24.0 PP → 16 kVA
    (Decimal('30.0'), Decimal('20')),   # 24.1–30.0 PP → 20 kVA
    (Decimal('999'), Decimal('25')),    # 30.1+ PP → 25 kVA
]

# ── EP (Energy Points) Routing Table ──
# Maps total EP score → minimum battery capacity in kWh
EP_ROUTING = [
    (Decimal('3.0'), Decimal('2.4')),    # 0–3.0 EP → 2.4 kWh
    (Decimal('6.5'), Decimal('5.1')),    # 3.1–6.5 EP → 5.1 kWh
    (Decimal('10.5'), Decimal('10.2')),  # 6.6–10.5 EP → 10.2 kWh
    (Decimal('14.5'), Decimal('15')),    # 10.6–14.5 EP → 15 kWh
    (Decimal('19.5'), Decimal('20.4')),  # 14.6–19.5 EP → 20.4 kWh
    (Decimal('25.0'), Decimal('28.8')),  # 19.6–25.0 EP → 28.8 kWh
    (Decimal('34.0'), Decimal('43.2')),  # 25.1–34.0 EP → 43.2 kWh
    (Decimal('999'), Decimal('57.6')),   # 34.1+ EP → 57.6 kWh
]

# ── Philosophy Multipliers ──
# Adjust PP/EP totals based on customer's sizing philosophy
PHILOSOPHY_MULTIPLIERS = {
    'budget': {
        'pp': Decimal('0.9'),
        'ep': Decimal('0.85'),
    },
    'good_fit': {
        'pp': Decimal('1.0'),
        'ep': Decimal('1.0'),
    },
    'excellent': {
        'pp': Decimal('1.1'),
        'ep': Decimal('1.2'),
    },
}

# ── Battery → Minimum Inverter Override ──
# Certain battery sizes require at least this inverter kVA
BATTERY_MIN_INVERTER = {
    Decimal('2.4'): Decimal('3'),
    Decimal('5.1'): Decimal('3'),
    Decimal('10.2'): Decimal('5'),
    Decimal('15'): Decimal('5'),
    Decimal('20.4'): Decimal('8'),
    Decimal('28.8'): Decimal('10'),
    Decimal('43.2'): Decimal('16'),
    Decimal('57.6'): Decimal('20'),
}

# ── Pricing Constants ──
PRICING = {
    'sundries_rate': Decimal('0.005'),       # 0.5% of material cost
    'labour_rate': Decimal('0.08'),          # 8% of (material + sundries)
    'transport_per_km': Decimal('0.65'),     # $0.65/km
    'default_distance_km': Decimal('10'),    # default 10km from Harare
}

# ── Family Code Mapping ──
# Maps family code → display info
FAMILY_CODES = {
    '3kva': {'kva_rating': Decimal('3'), 'name': 'Home Luxury 3kVA'},
    '5kva': {'kva_rating': Decimal('5'), 'name': 'Home Luxury Beta 5kVA'},
    '5kva_deluxe': {'kva_rating': Decimal('5'), 'name': 'Home Deluxe 5kVA'},
    '8kva': {'kva_rating': Decimal('8'), 'name': '8KVA Ultra Power'},
    '10kva': {'kva_rating': Decimal('10'), 'name': '10KVA Premium Power'},
    '12kva': {'kva_rating': Decimal('12'), 'name': '12KVA ProPower'},
    '16kva': {'kva_rating': Decimal('16'), 'name': '16KVA MasterPower'},
}

# ── Appliance Categories ──
APPLIANCE_CATEGORIES = [
    ('lighting', 'Lighting'),
    ('kitchen', 'Kitchen'),
    ('entertainment', 'Entertainment'),
    ('cooling', 'Cooling & Heating'),
    ('laundry', 'Laundry & Cleaning'),
    ('water', 'Water & Pumps'),
    ('office', 'Office & Computing'),
    ('security', 'Security'),
    ('outdoor', 'Outdoor & Garden'),
    ('other', 'Other'),
]
