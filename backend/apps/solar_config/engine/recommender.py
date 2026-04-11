"""
Package-first solar recommendation engine v3.

Scores ALL packages per-tier (with tier-specific smart-load adjustments).
Budget = cheapest that can carry the load.
Good Fit = best balanced score.
Excellent = next stronger above Good Fit.
Always returns 3 distinct packages.
"""

import logging
from decimal import Decimal

from .constants import SCORING_WEIGHTS, SMART_LOAD_MODIFIERS, RECHARGE_RANK, COMFORT_RANK, PRICING
from .pricing import calculate_price

logger = logging.getLogger(__name__)
D = Decimal

# Minimum score threshold — package must score at least this to be "workable"
# 0.45 ensures only packages that genuinely fit the load are considered
MIN_WORKABLE_SCORE = D('0.45')


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


def _adjust_for_smart_load(base_pp, base_ep, smart_eligible, package, tier, prefs):
    if not smart_eligible:
        return base_pp, base_ep

    willing = prefs.get('willing_to_manage', False)
    wants_smart = prefs.get('wants_smart', False)
    brand = (package.inverter_brand or '').lower()

    smart_pp = D('0')
    smart_ep = D('0')

    for appliance, qty_d, app_pp, app_ep in smart_eligible:
        if package.smart_load_supported and (wants_smart or willing):
            key = (brand, tier)
            mods = SMART_LOAD_MODIFIERS.get(key, {'pp': D('1'), 'ep': D('1')})
        elif willing and not package.smart_load_supported:
            key = (brand, tier)
            mods = SMART_LOAD_MODIFIERS.get(key, {'pp': D('1'), 'ep': D('1')})
        else:
            mods = {'pp': D('1'), 'ep': D('1')}

        smart_pp += app_pp * mods['pp']
        smart_ep += app_ep * mods['ep']

    non_smart_pp = base_pp - sum(app_pp for _, _, app_pp, _ in smart_eligible)
    non_smart_ep = base_ep - sum(app_ep for _, _, _, app_ep in smart_eligible)

    return non_smart_pp + smart_pp, non_smart_ep + smart_ep


def _pp_fit_score(user_pp, pkg):
    if pkg.pp_max == 0:
        return D('0')
    mid = (pkg.pp_min + pkg.pp_max) / 2
    half_range = (pkg.pp_max - pkg.pp_min) / 2
    if half_range == 0:
        half_range = D('1')

    if pkg.pp_min <= user_pp <= pkg.pp_max:
        distance = abs(user_pp - mid)
        return max(D('0.7'), D('1') - (distance / half_range) * D('0.3'))

    if user_pp < pkg.pp_min:
        overshoot = pkg.pp_min - user_pp
    else:
        overshoot = user_pp - pkg.pp_max

    decay = overshoot / half_range
    return max(D('0'), D('0.7') - decay * D('0.35'))


def _ep_fit_score(user_ep, pkg):
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
    pkg_rank = RECHARGE_RANK.get(pkg.recharge_class, 2)
    if use_style == 'independence':
        return D(str(min(1.0, pkg_rank / 5)))
    elif use_style == 'backup':
        return D('0.6') + D(str(min(0.4, pkg_rank / 10)))
    else:
        return D(str(min(1.0, (pkg_rank + 1) / 5)))


def _smart_load_score(pkg, has_smart_eligible, willing, wants_smart):
    if not has_smart_eligible:
        return D('0.5')
    if pkg.smart_load_supported and wants_smart:
        return D('1.0')
    elif pkg.smart_load_supported:
        return D('0.8')
    elif willing:
        return D('0.5')
    else:
        return D('0.3')


def _score_package(pkg, user_pp, user_ep, prefs):
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

    # Right-sizing bonus: prefer packages where the user's PP/EP lands
    # near the top of the range (well-utilized inverter). A package where
    # PP sits at 95% of pp_max is better than one where PP sits at 70%.
    if pkg.pp_max > 0 and user_pp > 0:
        pp_utilization = min(user_pp / pkg.pp_max, D('1.0'))
        # Bonus up to 10% for high utilization, penalty for low
        score *= (D('0.90') + pp_utilization * D('0.10'))

    return score, {'pp_fit': pp, 'ep_fit': ep, 'pv_recharge': pv, 'smart_load': sl}


def _compute_battery_kwh(pkg):
    if pkg.battery_capacity_kwh and pkg.battery_capacity_kwh > 0:
        return pkg.battery_capacity_kwh
    total = D('0')
    for item in pkg.items.all():
        if item.component.category == 'battery':
            cap = item.component.capacity_kwh or D('0')
            total += cap * item.quantity
    return total


def _score_all_packages_for_tier(packages, base_pp, base_ep, smart_eligible, tier_name, prefs):
    """Score all packages with tier-specific smart-load adjustments."""
    results = []
    for pkg in packages:
        adj_pp, adj_ep = _adjust_for_smart_load(
            base_pp, base_ep, smart_eligible, pkg, tier_name, prefs
        )
        score, details = _score_package(pkg, adj_pp, adj_ep, prefs)
        results.append((pkg, score, details, adj_pp, adj_ep))
    return results


def recommend_packages(appliance_selections, distance_km=None, preferences=None):
    """
    Generate 3 package recommendations using per-tier scoring.

    Budget: cheapest WORKABLE package (score >= threshold)
    Good Fit: highest scoring package (balanced)
    Excellent: next stronger package above Good Fit
    """
    from apps.solar_config.models import SolarPackageTemplate

    if preferences is None:
        preferences = {}

    if distance_km is None:
        distance_km = PRICING['default_distance_km']
    else:
        distance_km = D(str(distance_km))

    base_pp, base_ep, smart_eligible = _compute_base_scores(appliance_selections)
    preferences['has_smart_eligible'] = len(smart_eligible) > 0

    packages = list(SolarPackageTemplate.objects.select_related('family').prefetch_related(
        'items__component'
    ).filter(
        is_active=True, is_deleted=False, family__isnull=False,
        pp_max__gt=0,
    ))

    if not packages:
        packages = list(SolarPackageTemplate.objects.select_related('family').prefetch_related(
            'items__component'
        ).filter(is_active=True, is_deleted=False, family__isnull=False))

    # Score all packages separately for each tier
    budget_scored = _score_all_packages_for_tier(packages, base_pp, base_ep, smart_eligible, 'budget', preferences)
    goodfit_scored = _score_all_packages_for_tier(packages, base_pp, base_ep, smart_eligible, 'good_fit', preferences)
    excellent_scored = _score_all_packages_for_tier(packages, base_pp, base_ep, smart_eligible, 'excellent', preferences)

    # --- Step 1: Find all CAPABLE packages (pp_max can handle the load) ---
    def _capable(scored_list):
        """Filter to packages whose pp_max can handle the adjusted PP."""
        capable = [
            entry for entry in scored_list
            if entry[0].pp_max >= entry[3] * D('0.85') and entry[1] >= MIN_WORKABLE_SCORE
        ]
        if not capable:
            capable = [e for e in scored_list if e[1] >= D('0.3')]
        if not capable:
            capable = scored_list
        return capable

    budget_capable = _capable(budget_scored)
    goodfit_capable = _capable(goodfit_scored)
    excellent_capable = _capable(excellent_scored)

    # --- Step 2: BUDGET = cheapest capable package ---
    budget = sorted(budget_capable, key=lambda x: x[0].price)[0]

    # --- Step 3: GOOD FIT = highest scoring capable package, BUT must cost >= budget ---
    gf_candidates = sorted(
        [e for e in goodfit_capable if e[0].price >= budget[0].price],
        key=lambda x: x[1], reverse=True
    )
    good_fit = gf_candidates[0] if gf_candidates else sorted(goodfit_capable, key=lambda x: x[1], reverse=True)[0]

    # --- Step 4: EXCELLENT = next stronger above good_fit, must cost >= good_fit ---
    seen_ids = {budget[0].id, good_fit[0].id}
    gf_price = good_fit[0].price
    gf_kva = float(good_fit[0].inverter_kva)

    excellent_candidates = sorted(
        [e for e in excellent_capable
         if e[0].id not in seen_ids
         and e[0].price >= gf_price
         and (float(e[0].inverter_kva) >= gf_kva)],
        key=lambda x: x[1], reverse=True
    )
    excellent = excellent_candidates[0] if excellent_candidates else None

    # Fallback: any package not used, priced above good_fit
    if not excellent:
        for entry in sorted(excellent_capable, key=lambda x: x[0].price):
            if entry[0].id not in seen_ids and entry[0].price >= gf_price:
                excellent = entry
                break

    # Last resort: any package not used
    if not excellent:
        for entry in sorted(excellent_scored, key=lambda x: x[1], reverse=True):
            if entry[0].id not in seen_ids:
                excellent = entry
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
    tier_entries = {
        'good_fit': good_fit,
        'budget': budget,
        'excellent': excellent,
    }

    tiers = {}
    for tier_name, entry in tier_entries.items():
        if not entry:
            continue
        pkg, score, details, adj_pp, adj_ep = entry
        price_breakdown = calculate_price(pkg, distance_km)
        battery_kwh = _compute_battery_kwh(pkg)

        tiers[tier_name] = {
            'package': pkg,
            'score': float(score),
            'pp_fit': float(details.get('pp_fit', 0)),
            'ep_fit': float(details.get('ep_fit', 0)),
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
