"""
Package recommendation engine v4.

Logic:
1. Calculate per-tier PP/EP (with smart-load adjustments)
2. PP → selects FAMILY (inverter class)
3. EP → selects VARIANT within that family
4. Budget.price <= GoodFit.price <= Excellent.price guaranteed
"""

import logging
from decimal import Decimal

from .constants import SMART_LOAD_MODIFIERS, PRICING
from .pricing import calculate_price

logger = logging.getLogger(__name__)
D = Decimal


def _compute_base_scores(appliance_selections):
    total_pp = D('0')
    total_ep = D('0')
    smart_eligible = []

    for appliance, qty in appliance_selections:
        qty_d = D(str(qty))
        base_pp = appliance.power_points * qty_d * appliance.concurrency_factor
        base_ep = appliance.energy_points * qty_d * appliance.night_use_factor
        total_pp += base_pp
        total_ep += base_ep

        if appliance.smart_load_eligible:
            smart_eligible.append((appliance, qty_d, base_pp, base_ep))

    return total_pp, total_ep, smart_eligible


def _adjust_for_smart_load(base_pp, base_ep, smart_eligible, tier, prefs):
    """Apply smart-load modifiers for a specific tier. Brand-aware."""
    if not smart_eligible:
        return base_pp, base_ep

    willing = prefs.get('willing_to_manage', False)
    wants_smart = prefs.get('wants_smart', False)

    # For tier-level adjustment, use sunsynk modifiers as default
    # (most packages are sunsynk; budget may use growatt)
    brand = 'sunsynk' if tier != 'budget' else 'growatt'

    smart_pp = D('0')
    smart_ep = D('0')

    for appliance, qty_d, app_pp, app_ep in smart_eligible:
        if willing or wants_smart:
            key = (brand, tier)
            mods = SMART_LOAD_MODIFIERS.get(key, {'pp': D('1'), 'ep': D('1')})
        else:
            mods = {'pp': D('1'), 'ep': D('1')}

        smart_pp += app_pp * mods['pp']
        smart_ep += app_ep * mods['ep']

    non_smart_pp = base_pp - sum(app_pp for _, _, app_pp, _ in smart_eligible)
    non_smart_ep = base_ep - sum(app_ep for _, _, _, app_ep in smart_eligible)

    return non_smart_pp + smart_pp, non_smart_ep + smart_ep


def _compute_battery_kwh(pkg):
    if pkg.battery_capacity_kwh and pkg.battery_capacity_kwh > 0:
        return pkg.battery_capacity_kwh
    total = D('0')
    for item in pkg.items.all():
        if item.component.category == 'battery':
            cap = item.component.capacity_kwh or D('0')
            total += cap * item.quantity
    return total


def _select_family(pp, families):
    """
    PP → Family selection.
    Find the family whose PP range best contains the adjusted PP.
    If PP exceeds all families, pick the largest.
    """
    # Find families where PP falls within their range
    matching = []
    for family_kva, pkgs in families.items():
        pp_min = min(p.pp_min for p in pkgs)
        pp_max = max(p.pp_max for p in pkgs)
        if pp_min <= pp <= pp_max:
            matching.append((family_kva, pkgs, pp_min, pp_max))

    if matching:
        # Pick the smallest family that contains PP (right-sized)
        matching.sort(key=lambda x: x[0])
        return matching[0][1]

    # PP doesn't fall exactly in any range — find closest family above
    above = []
    for family_kva, pkgs in families.items():
        pp_min = min(p.pp_min for p in pkgs)
        if pp_min > pp:
            above.append((family_kva, pkgs))

    if above:
        above.sort(key=lambda x: x[0])
        return above[0][1]

    # PP exceeds all — pick largest family
    largest_kva = max(families.keys())
    return families[largest_kva]


def _select_variant(ep, family_pkgs):
    """
    EP → Variant selection within a family.
    Find the variant whose EP range best contains the adjusted EP.
    """
    # Find variants where EP falls within range
    matching = []
    for pkg in family_pkgs:
        if pkg.ep_min <= ep <= pkg.ep_max:
            matching.append(pkg)

    if matching:
        # Pick the one where EP is most centered
        best = min(matching, key=lambda p: abs(ep - (p.ep_min + p.ep_max) / 2))
        return best

    # EP doesn't match exactly — find closest variant
    # Prefer the variant whose ep_min is just below EP (closest fit going up)
    below = [(p, ep - p.ep_max) for p in family_pkgs if p.ep_max <= ep]
    above = [(p, p.ep_min - ep) for p in family_pkgs if p.ep_min > ep]

    if below:
        # EP is above this variant's range — pick the highest one below
        return min(below, key=lambda x: x[1])[0]
    elif above:
        # EP is below all variants — pick the lowest one above
        return min(above, key=lambda x: x[1])[0]

    # Fallback — cheapest in family
    return sorted(family_pkgs, key=lambda p: p.price)[0]


def recommend_packages(appliance_selections, distance_km=None, preferences=None):
    """
    Generate 3 recommendations: Budget, Good Fit, Excellent.

    For each tier:
    1. Adjust PP/EP with tier-specific smart-load modifiers
    2. PP → select Family (inverter class)
    3. EP → select Variant within family
    4. Enforce: Budget.price <= GoodFit.price <= Excellent.price
    """
    from apps.solar_config.models import SolarPackageTemplate

    if preferences is None:
        preferences = {}

    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = D(str(distance_km))

    # Step 1: Compute base PP/EP
    base_pp, base_ep, smart_eligible = _compute_base_scores(appliance_selections)
    preferences['has_smart_eligible'] = len(smart_eligible) > 0

    # Load all active packages with capability bands, grouped by family kVA
    packages = list(SolarPackageTemplate.objects.select_related('family').prefetch_related(
        'items__component'
    ).filter(
        is_active=True, is_deleted=False, family__isnull=False,
        pp_max__gt=0,
    ).order_by('family__kva_rating', 'price'))

    if not packages:
        return {'total_pp': base_pp, 'total_ep': base_ep, 'distance_km': distance_km, 'tiers': {}}

    # Group packages by family kVA rating
    families = {}
    for pkg in packages:
        kva = float(pkg.family.kva_rating) if pkg.family else float(pkg.inverter_kva)
        if kva not in families:
            families[kva] = []
        families[kva].append(pkg)

    # Step 2: Calculate per-tier adjusted PP/EP
    budget_pp, budget_ep = _adjust_for_smart_load(base_pp, base_ep, smart_eligible, 'budget', preferences)
    goodfit_pp, goodfit_ep = _adjust_for_smart_load(base_pp, base_ep, smart_eligible, 'good_fit', preferences)
    excellent_pp, excellent_ep = _adjust_for_smart_load(base_pp, base_ep, smart_eligible, 'excellent', preferences)

    # Step 3: PP → Family, EP → Variant for each tier
    budget_family = _select_family(budget_pp, families)
    budget_pkg = _select_variant(budget_ep, budget_family)

    goodfit_family = _select_family(goodfit_pp, families)
    goodfit_pkg = _select_variant(goodfit_ep, goodfit_family)

    excellent_family = _select_family(excellent_pp, families)
    excellent_pkg = _select_variant(excellent_ep, excellent_family)

    # Step 4: Enforce price ordering Budget <= GoodFit <= Excellent
    # If GoodFit is cheaper than Budget, swap them
    if goodfit_pkg.price < budget_pkg.price:
        budget_pkg, goodfit_pkg = goodfit_pkg, budget_pkg
        budget_pp, goodfit_pp = goodfit_pp, budget_pp
        budget_ep, goodfit_ep = goodfit_ep, budget_ep

    # If Excellent is cheaper than GoodFit, find next variant up
    if excellent_pkg.price <= goodfit_pkg.price:
        # Look for a more expensive package in the same or next family
        candidates = [p for p in packages if p.price > goodfit_pkg.price and p.id != budget_pkg.id and p.id != goodfit_pkg.id]
        if candidates:
            # Pick the cheapest one above good_fit
            excellent_pkg = sorted(candidates, key=lambda p: p.price)[0]

    # If excellent ended up same as good_fit or budget, find ANY different package above
    if excellent_pkg.id == goodfit_pkg.id or excellent_pkg.id == budget_pkg.id:
        for p in sorted(packages, key=lambda x: x.price):
            if p.id != budget_pkg.id and p.id != goodfit_pkg.id and p.price >= goodfit_pkg.price:
                excellent_pkg = p
                break

    # Determine best_match
    priority = preferences.get('priority', 'balanced')
    if priority == 'lowest_cost':
        best_match_tier = 'budget'
    elif priority == 'max_comfort':
        best_match_tier = 'excellent'
    else:
        best_match_tier = 'good_fit'

    # Build response
    tier_data = {
        'budget': (budget_pkg, budget_pp, budget_ep),
        'good_fit': (goodfit_pkg, goodfit_pp, goodfit_ep),
        'excellent': (excellent_pkg, excellent_pp, excellent_ep),
    }

    tiers = {}
    for tier_name, (pkg, adj_pp, adj_ep) in tier_data.items():
        price_breakdown = calculate_price(pkg, distance_km)
        battery_kwh = _compute_battery_kwh(pkg)

        tiers[tier_name] = {
            'package': pkg,
            'score': 0,
            'pp_fit': 0,
            'ep_fit': 0,
            'adjusted_pp': adj_pp,
            'adjusted_ep': adj_ep,
            'inverter_kva': str(pkg.inverter_kva),
            'battery_kwh': str(battery_kwh),
            'price_breakdown': price_breakdown,
            'best_match': tier_name == best_match_tier,
        }

    return {
        'total_pp': base_pp,
        'total_ep': base_ep,
        'distance_km': distance_km,
        'best_match_tier': best_match_tier,
        'tiers': tiers,
    }
