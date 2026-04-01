"""
Package-first solar recommendation engine v2.

Instead of routing PP/EP to inverter sizes, the engine:
1. Computes effective PP/EP from appliance selections
2. Scores ALL 28 packages against the customer's demand profile
3. Applies smart-load modifiers per-appliance per-package
4. Returns up to 3 distinct packages: Budget, Good Fit, Excellent
"""

import logging
from decimal import Decimal

from .constants import SCORING_WEIGHTS, SMART_LOAD_MODIFIERS, RECHARGE_RANK, COMFORT_RANK, PRICING
from .pricing import calculate_price

logger = logging.getLogger(__name__)

D = Decimal


def _compute_base_scores(appliance_selections):
    """
    Compute base effective PP/EP and track smart-load-eligible appliances.
    Returns (total_pp, total_ep, smart_eligible_appliances)
    """
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


def _adjust_for_smart_load(base_pp, base_ep, smart_eligible, package, tier, prefs):
    """
    Apply smart-load modifiers per appliance.
    Returns adjusted (total_pp, total_ep).
    """
    if not smart_eligible:
        return base_pp, base_ep

    willing = prefs.get('willing_to_manage', False)
    wants_smart = prefs.get('wants_smart', False)
    brand = (package.inverter_brand or '').lower()

    # Sum the PP/EP contribution from smart-eligible appliances
    smart_pp = D('0')
    smart_ep = D('0')

    for appliance, qty_d, app_pp, app_ep in smart_eligible:
        # Determine which modifier to apply
        if package.smart_load_supported and (wants_smart or willing):
            # Case 1: Package supports smart load
            key = (brand, tier)
            mods = SMART_LOAD_MODIFIERS.get(key, {'pp': D('1'), 'ep': D('1')})
        elif willing and not package.smart_load_supported:
            # Case 2: No smart load support but user accepts manual management
            key = (brand, tier)
            mods = SMART_LOAD_MODIFIERS.get(key, {'pp': D('1'), 'ep': D('1')})
        else:
            # Case 3: No discount
            mods = {'pp': D('1'), 'ep': D('1')}

        smart_pp += app_pp * mods['pp']
        smart_ep += app_ep * mods['ep']

    # Non-smart PP/EP stays unchanged
    non_smart_pp = base_pp - sum(app_pp for _, _, app_pp, _ in smart_eligible)
    non_smart_ep = base_ep - sum(app_ep for _, _, _, app_ep in smart_eligible)

    return non_smart_pp + smart_pp, non_smart_ep + smart_ep


def _pp_fit_score(user_pp, pkg):
    """Score how well user's PP fits within package's PP range. Returns 0-1."""
    if pkg.pp_max == 0:
        return D('0')
    mid = (pkg.pp_min + pkg.pp_max) / 2
    half_range = (pkg.pp_max - pkg.pp_min) / 2
    if half_range == 0:
        half_range = D('1')

    if pkg.pp_min <= user_pp <= pkg.pp_max:
        # Perfect fit — score based on how centered
        distance = abs(user_pp - mid)
        return max(D('0.7'), D('1') - (distance / half_range) * D('0.3'))

    # Outside range — linear decay
    if user_pp < pkg.pp_min:
        overshoot = pkg.pp_min - user_pp
    else:
        overshoot = user_pp - pkg.pp_max

    decay = overshoot / half_range
    return max(D('0'), D('0.7') - decay * D('0.35'))


def _ep_fit_score(user_ep, pkg):
    """Score how well user's EP fits within package's EP range. Returns 0-1."""
    if pkg.ep_max == 0:
        return D('0')
    mid = (pkg.ep_min + pkg.ep_max) / 2
    half_range = (pkg.ep_max - pkg.ep_min) / 2
    if half_range == 0:
        half_range = D('1')

    if pkg.ep_min <= user_ep <= pkg.ep_max:
        distance = abs(user_ep - mid)
        return max(D('0.7'), D('1') - (distance / half_range) * D('0.3'))

    if user_ep < pkg.ep_min:
        overshoot = pkg.ep_min - user_ep
    else:
        overshoot = user_ep - pkg.ep_max

    decay = overshoot / half_range
    return max(D('0'), D('0.7') - decay * D('0.35'))


def _pv_recharge_score(pkg, use_style):
    """Score PV recharge capability match. Returns 0-1."""
    pkg_rank = RECHARGE_RANK.get(pkg.recharge_class, 2)

    if use_style == 'independence':
        # Prefer strong/premium recharge
        return D(str(min(1.0, pkg_rank / 5)))
    elif use_style == 'backup':
        # Any recharge is fine, slight preference for balanced
        return D('0.6') + D(str(min(0.4, pkg_rank / 10)))
    else:
        # backup_solar — balanced preference
        return D(str(min(1.0, (pkg_rank + 1) / 5)))


def _smart_load_score(pkg, has_smart_eligible, willing, wants_smart):
    """Score smart-load compatibility. Returns 0-1."""
    if not has_smart_eligible:
        return D('0.5')  # Neutral if no smart-eligible appliances

    if pkg.smart_load_supported and wants_smart:
        return D('1.0')
    elif pkg.smart_load_supported:
        return D('0.8')
    elif willing:
        return D('0.5')
    else:
        return D('0.3')


def _score_package(pkg, user_pp, user_ep, prefs):
    """
    Compute weighted fit score for a package. Returns 0-1.
    """
    pp = _pp_fit_score(user_pp, pkg)
    ep = _ep_fit_score(user_ep, pkg)
    pv = _pv_recharge_score(pkg, prefs.get('use_style', 'backup_solar'))
    sl = _smart_load_score(
        pkg,
        prefs.get('has_smart_eligible', False),
        prefs.get('willing_to_manage', False),
        prefs.get('wants_smart', False),
    )

    score = (
        pp * SCORING_WEIGHTS['pp_fit'] +
        ep * SCORING_WEIGHTS['ep_fit'] +
        pv * SCORING_WEIGHTS['pv_recharge'] +
        sl * SCORING_WEIGHTS['smart_load']
    )
    return score, {'pp_fit': pp, 'ep_fit': ep, 'pv_recharge': pv, 'smart_load': sl}


def _select_tiers(scored_packages, prefs):
    """
    Select Budget, Good Fit, Excellent from scored packages.
    Returns dict with 1-3 tiers, only distinct packages.
    """
    if not scored_packages:
        return {}

    # Sort by score descending
    by_score = sorted(scored_packages, key=lambda x: x[1], reverse=True)

    # Good Fit = highest scoring
    good_fit = by_score[0]

    # Budget = lowest price among packages with score >= 0.3 (workable threshold)
    workable = [p for p in scored_packages if p[1] >= D('0.3')]
    if not workable:
        workable = scored_packages  # fallback
    by_price = sorted(workable, key=lambda x: x[0].price)
    budget = by_price[0]

    # Excellent = next stronger package above Good Fit
    # "Stronger" = higher comfort_class, or same class but more panels/battery
    gf_comfort = COMFORT_RANK.get(good_fit[0].comfort_class, 2)
    gf_price = good_fit[0].price

    excellent_candidates = [
        p for p in scored_packages
        if (COMFORT_RANK.get(p[0].comfort_class, 2) > gf_comfort or p[0].price > gf_price)
        and p[0].id != good_fit[0].id
        and p[1] >= D('0.2')
    ]
    excellent = sorted(excellent_candidates, key=lambda x: x[1], reverse=True)[0] if excellent_candidates else None

    # Build tiers, deduplicate
    tiers = {}
    seen_ids = set()

    # Always include Good Fit
    tiers['good_fit'] = good_fit
    seen_ids.add(good_fit[0].id)

    # Budget only if different from Good Fit
    if budget[0].id not in seen_ids:
        tiers['budget'] = budget
        seen_ids.add(budget[0].id)

    # Excellent only if different from both
    if excellent and excellent[0].id not in seen_ids:
        tiers['excellent'] = excellent
        seen_ids.add(excellent[0].id)

    return tiers


def recommend_packages(appliance_selections, distance_km=None, preferences=None):
    """
    Generate package recommendations using capability-band scoring.

    Args:
        appliance_selections: list of (Appliance, quantity) tuples
        distance_km: distance from depot (default 10)
        preferences: {priority, willing_to_manage, use_style, wants_smart}

    Returns:
        {total_pp, total_ep, distance_km, tiers: {budget?, good_fit, excellent?}}
    """
    from apps.solar_config.models import SolarPackageTemplate

    if preferences is None:
        preferences = {}

    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = D(str(distance_km))

    # Step 1-2: Compute base PP/EP
    base_pp, base_ep, smart_eligible = _compute_base_scores(appliance_selections)
    preferences['has_smart_eligible'] = len(smart_eligible) > 0

    # Step 3: Load all active packages with capability bands
    packages = list(SolarPackageTemplate.objects.select_related('family').prefetch_related(
        'items__component'
    ).filter(
        is_active=True, is_deleted=False, family__isnull=False,
        pp_max__gt=0,  # Only packages with capability bands set
    ))

    if not packages:
        # Fallback: use all packages if none have bands yet
        packages = list(SolarPackageTemplate.objects.select_related('family').prefetch_related(
            'items__component'
        ).filter(is_active=True, is_deleted=False, family__isnull=False))

    # Step 4-5: Score each package for each tier
    # The smart-load adjustments are tier-dependent, so we score per-tier
    all_scored = []

    for pkg in packages:
        # For scoring, use Good Fit (neutral) adjustments
        adj_pp, adj_ep = _adjust_for_smart_load(
            base_pp, base_ep, smart_eligible, pkg, 'good_fit', preferences
        )
        score, details = _score_package(pkg, adj_pp, adj_ep, preferences)
        all_scored.append((pkg, score, details, adj_pp, adj_ep))

    # Step 6: Select tiers
    tier_input = [(pkg, score) for pkg, score, _, _, _ in all_scored]
    tiers_raw = _select_tiers(tier_input, preferences)

    # Step 7: Build response with price breakdowns
    tiers = {}
    for tier_name, (pkg, score) in tiers_raw.items():
        # Re-adjust PP/EP for this specific tier
        adj_pp, adj_ep = _adjust_for_smart_load(
            base_pp, base_ep, smart_eligible, pkg, tier_name, preferences
        )
        price_breakdown = calculate_price(pkg, distance_km)

        # Find the detail scores
        detail = next((d for p, s, d, _, _ in all_scored if p.id == pkg.id), {})

        tiers[tier_name] = {
            'package': pkg,
            'score': float(score),
            'pp_fit': float(detail.get('pp_fit', 0)),
            'ep_fit': float(detail.get('ep_fit', 0)),
            'adjusted_pp': adj_pp,
            'adjusted_ep': adj_ep,
            'inverter_kva': str(pkg.inverter_kva),
            'battery_kwh': str(pkg.battery_capacity_kwh),
            'price_breakdown': price_breakdown,
        }

    return {
        'total_pp': base_pp,
        'total_ep': base_ep,
        'distance_km': distance_km,
        'tiers': tiers,
    }
