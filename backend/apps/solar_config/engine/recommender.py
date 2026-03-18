"""
3-tier solar package recommendation engine.

Algorithm:
1. Sum PP/EP from user's appliance selections
2. For each tier (budget/good_fit/excellent):
   a. Apply philosophy multipliers
   b. Route PP → inverter kVA via PP_ROUTING
   c. Route EP → battery kWh via EP_ROUTING
   d. Apply battery-minimum-inverter override
   e. Find best matching package by family kVA rating
   f. Calculate price with user's distance
3. Return all three tiers with scoring details
"""

import logging
from decimal import Decimal

from .constants import (
    PP_ROUTING,
    EP_ROUTING,
    PHILOSOPHY_MULTIPLIERS,
    BATTERY_MIN_INVERTER,
    PRICING,
)
from .pricing import calculate_price

logger = logging.getLogger(__name__)


def _route_value(value, routing_table):
    """Route a score through a routing table to get the target value."""
    for threshold, target in routing_table:
        if value <= threshold:
            return target
    # Return the last (largest) target if value exceeds all thresholds
    return routing_table[-1][1]


def _find_min_inverter_for_battery(battery_kwh):
    """
    Find minimum inverter kVA required for a given battery capacity.
    Uses the battery-minimum-inverter override table.
    """
    sorted_batteries = sorted(BATTERY_MIN_INVERTER.keys())
    for batt_size in sorted_batteries:
        if battery_kwh <= batt_size:
            return BATTERY_MIN_INVERTER[batt_size]
    return BATTERY_MIN_INVERTER[sorted_batteries[-1]]


def _compute_scores(appliance_selections):
    """
    Compute total PP and EP from appliance selections.

    Args:
        appliance_selections: list of (appliance, quantity) tuples

    Returns:
        (total_pp, total_ep)
    """
    total_pp = Decimal('0')
    total_ep = Decimal('0')

    for appliance, qty in appliance_selections:
        qty_d = Decimal(str(qty))
        pp = appliance.power_points * qty_d * appliance.concurrency_factor
        ep = appliance.energy_points * qty_d
        # Night use factor increases EP for appliances that run overnight
        if appliance.night_use_factor > 0:
            ep = ep * (1 + appliance.night_use_factor)
        total_pp += pp
        total_ep += ep

    return total_pp, total_ep


def _find_best_package(inverter_kva, battery_kwh, packages_qs):
    """
    Find the cheapest package that meets or exceeds the required specs.

    Matches on family kVA rating (which represents the system's inverter
    capacity tier) since individual battery_capacity_kwh may not be populated
    from XLSX data. Falls back to next size up if no exact match.
    """
    # Primary match: family kVA rating >= required inverter kVA
    # This correctly routes to the right family tier
    candidates = packages_qs.filter(
        family__kva_rating__gte=inverter_kva,
        is_active=True,
        is_deleted=False,
    ).order_by('family__kva_rating', 'price')

    if candidates.exists():
        # Pick the cheapest package from the lowest matching family
        best_family_kva = candidates.first().family.kva_rating
        same_family = candidates.filter(family__kva_rating=best_family_kva)
        return same_family.first()

    # Fallback: match on inverter_kva field directly
    candidates = packages_qs.filter(
        inverter_kva__gte=inverter_kva,
        is_active=True,
        is_deleted=False,
    ).order_by('inverter_kva', 'price')

    if candidates.exists():
        return candidates.first()

    # Last resort: largest available package
    largest = packages_qs.filter(
        is_active=True,
        is_deleted=False,
    ).order_by('-family__kva_rating', '-price').first()

    return largest


def recommend_packages(appliance_selections, distance_km=None):
    """
    Generate 3-tier recommendations based on user's appliance selections.

    Args:
        appliance_selections: list of (Appliance instance, quantity) tuples
        distance_km: distance from depot in km (default 10)

    Returns:
        {
            'total_pp': Decimal,
            'total_ep': Decimal,
            'tiers': {
                'budget': { package, inverter_kva, battery_kwh, adjusted_pp, adjusted_ep, price_breakdown },
                'good_fit': { ... },
                'excellent': { ... },
            }
        }
    """
    from apps.solar_config.models import SolarPackageTemplate

    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = Decimal(str(distance_km))

    total_pp, total_ep = _compute_scores(appliance_selections)

    packages_qs = SolarPackageTemplate.objects.select_related(
        'family'
    ).prefetch_related(
        'items__component'
    ).filter(is_active=True, is_deleted=False, family__isnull=False)

    tiers = {}

    for tier_name, multipliers in PHILOSOPHY_MULTIPLIERS.items():
        adjusted_pp = total_pp * multipliers['pp']
        adjusted_ep = total_ep * multipliers['ep']

        inverter_kva = _route_value(adjusted_pp, PP_ROUTING)
        battery_kwh = _route_value(adjusted_ep, EP_ROUTING)

        # Apply battery-minimum-inverter override
        min_inv = _find_min_inverter_for_battery(battery_kwh)
        if inverter_kva < min_inv:
            inverter_kva = min_inv

        package = _find_best_package(inverter_kva, battery_kwh, packages_qs)

        price_breakdown = None
        if package:
            price_breakdown = calculate_price(package, distance_km)

        tiers[tier_name] = {
            'package': package,
            'inverter_kva': inverter_kva,
            'battery_kwh': battery_kwh,
            'adjusted_pp': adjusted_pp,
            'adjusted_ep': adjusted_ep,
            'price_breakdown': price_breakdown,
        }

    return {
        'total_pp': total_pp,
        'total_ep': total_ep,
        'distance_km': distance_km,
        'tiers': tiers,
    }
