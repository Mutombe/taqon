"""
Constants for the solar recommendation engine v2.
Package-first, capability-band scoring approach.
"""

from decimal import Decimal

# ── Scoring Weights ──
SCORING_WEIGHTS = {
    'pp_fit': Decimal('0.40'),
    'ep_fit': Decimal('0.35'),
    'pv_recharge': Decimal('0.15'),
    'smart_load': Decimal('0.10'),
}

# ── Smart-Load Modifiers ──
# Applied per-appliance when the appliance is smart_load_eligible
# Key: (inverter_brand, tier)
SMART_LOAD_MODIFIERS = {
    # Sunsynk with smart load support → full discount
    ('sunsynk', 'budget'):    {'pp': Decimal('0.8'),  'ep': Decimal('0.6')},
    ('sunsynk', 'good_fit'):  {'pp': Decimal('0.9'),  'ep': Decimal('0.8')},
    ('sunsynk', 'excellent'): {'pp': Decimal('1.0'),  'ep': Decimal('1.0')},
    # Growatt without smart load → weaker discount (manual management)
    ('growatt', 'budget'):    {'pp': Decimal('0.9'),  'ep': Decimal('0.75')},
    ('growatt', 'good_fit'):  {'pp': Decimal('0.95'), 'ep': Decimal('0.9')},
    ('growatt', 'excellent'): {'pp': Decimal('1.0'),  'ep': Decimal('1.0')},
    # Must / other → no discount
    ('must', 'budget'):       {'pp': Decimal('1.0'),  'ep': Decimal('1.0')},
    ('must', 'good_fit'):     {'pp': Decimal('1.0'),  'ep': Decimal('1.0')},
    ('must', 'excellent'):    {'pp': Decimal('1.0'),  'ep': Decimal('1.0')},
}

# ── Recharge class ranking (for PV scoring) ──
RECHARGE_RANK = {
    'basic': 1, 'moderate': 2, 'balanced': 3, 'strong': 4, 'premium': 5,
}

# ── Comfort class ranking ──
COMFORT_RANK = {
    'budget': 1, 'balanced': 2, 'premium': 3,
}

# ── Pricing Constants ──
PRICING = {
    'sundries_rate': Decimal('0.005'),
    'labour_rate': Decimal('0.08'),
    # Transport per km — linear up to TRANSPORT_LINEAR_KM, exponential beyond
    'transport_per_km': Decimal('0.85'),
    'transport_linear_km': Decimal('25'),
    'transport_exp_base': Decimal('1.15'),
    # Baseline installation cost for Job Size Multiplier — a job at this cost
    # yields JSM = 1.0 (no size surcharge). Smaller jobs pay less transport,
    # larger jobs pay more because they are heavier and riskier to transport.
    'transport_baseline_cost': Decimal('5000'),
    'transport_jsm_exponent': Decimal('0.6'),
    'default_distance_km': Decimal('10'),
}
