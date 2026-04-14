"""
Dynamic pricing calculator for solar packages.

Breakdown: material + sundries(0.5%) + labour(8%) + transport.

Transport is a two-zone formula scaled by a Job Size Multiplier so that
heavier / more valuable installations carry more of the transport cost:

    JSM = (installation_cost / 5000) ** 0.6

    if D <= 25:
        TC = 0.85 * D * JSM
    else:
        TC = (0.85 * 25  +  0.85 * (D - 25) * 1.15**(D - 25)) * JSM

where D is the distance in km and installation_cost is material + sundries
+ labour (everything but transport — avoids circularity).
"""

from decimal import Decimal
from math import pow
from .constants import PRICING


def _job_size_multiplier(installation_cost):
    """JSM = (installation_cost / baseline)^0.6. Jobs at baseline get 1.0."""
    baseline = float(PRICING['transport_baseline_cost'])
    cost = float(installation_cost or 0)
    if cost <= 0:
        return 1.0
    return pow(cost / baseline, float(PRICING['transport_jsm_exponent']))


def _transport_cost(distance_km, installation_cost):
    """
    Compute transport using the tiered formula.
    Returns a Decimal rounded to cents.

    SAFETY CAP: the exponential zone uses 1.15^(D-25) which grows very
    aggressively (1.15^25 ≈ 32.92, 1.15^50 ≈ 1,083). To prevent runaway
    quotes if a client picks a far-away location we cap transport at
    TRANSPORT_MAX_RATIO of the installation cost. Remove or revise the
    cap once the exponential parameters are finalised.
    """
    D = float(distance_km or 0)
    if D <= 0:
        return Decimal('0.00')

    rate = float(PRICING['transport_per_km'])            # 0.85
    cutoff = float(PRICING['transport_linear_km'])       # 25
    base = float(PRICING['transport_exp_base'])          # 1.15

    jsm = _job_size_multiplier(installation_cost)

    if D <= cutoff:
        tc = rate * D * jsm
    else:
        linear_part = rate * cutoff
        exp_part = rate * (D - cutoff) * pow(base, D - cutoff)
        tc = (linear_part + exp_part) * jsm

    # Sanity cap — transport never exceeds this share of the installation
    # value. Protects against the exponential zone producing absurd totals.
    MAX_RATIO = 0.35
    cost = float(installation_cost or 0)
    if cost > 0:
        tc = min(tc, cost * MAX_RATIO)

    if tc < 0:
        tc = 0.0

    return Decimal(str(round(tc, 2)))


def calculate_price(package, distance_km=None):
    """
    Calculate full price breakdown for a package.

    Args:
        package: SolarPackageTemplate instance (with items prefetched)
        distance_km: Distance from Harare in km (default from PRICING)

    Returns:
        dict with material, sundries, labour, transport, total
    """
    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = Decimal(str(distance_km))

    material = sum(
        (item.component.price * item.quantity
         for item in package.items.select_related('component').all()),
        Decimal('0'),
    )

    sundries = material * PRICING['sundries_rate']
    labour = (material + sundries) * PRICING['labour_rate']

    # Installation cost = the physical value of the job before transport.
    # This is what drives the Job Size Multiplier.
    installation_cost = material + sundries + labour
    transport = _transport_cost(distance_km, installation_cost)

    total = installation_cost + transport

    return {
        'material': material,
        'sundries': sundries,
        'labour': labour,
        'transport': transport,
        'total': total,
    }


def calculate_price_from_material(material_cost, distance_km=None):
    """
    Calculate price breakdown from a known material cost.
    Useful when you already have the material total.
    """
    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = Decimal(str(distance_km))

    material = Decimal(str(material_cost))
    sundries = material * PRICING['sundries_rate']
    labour = (material + sundries) * PRICING['labour_rate']
    installation_cost = material + sundries + labour
    transport = _transport_cost(distance_km, installation_cost)
    total = installation_cost + transport

    return {
        'material': material,
        'sundries': sundries,
        'labour': labour,
        'transport': transport,
        'total': total,
    }
