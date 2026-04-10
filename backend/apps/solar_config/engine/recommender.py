"""
Package-first solar recommendation engine v2.

Scores ALL packages against customer demand, always returns 3 distinct
packages: Budget, Good Fit (Best Match), Excellent.
"""

import logging
from decimal import Decimal

from .constants import SCORING_WEIGHTS, SMART_LOAD_MODIFIERS, RECHARGE_RANK, COMFORT_RANK, PRICING
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
    return score, {'pp_fit': pp, 'ep_fit': ep, 'pv_recharge': pv, 'smart_load': sl}


def _compute_battery_kwh(pkg):
    """Compute battery kWh from components if stored value is 0."""
    if pkg.battery_capacity_kwh and pkg.battery_capacity_kwh > 0:
        return pkg.battery_capacity_kwh
    total = D('0')
    for item in pkg.items.all():
        if item.component.category == 'battery':
            cap = item.component.capacity_kwh or D('0')
            total += cap * item.quantity
    return total


def _select_tiers(scored_packages, prefs):
    """
    ALWAYS return 3 distinct packages: budget, good_fit, excellent.
    Also marks which tier is the 'best_match' based on user preferences.
    """
    if not scored_packages:
        return {}

    # Sort by score descending
    by_score = sorted(scored_packages, key=lambda x: x[1], reverse=True)
    # Sort by price ascending
    by_price = sorted(scored_packages, key=lambda x: x[0].price)

    seen_ids = set()
    tiers = {}

    # 1. Good Fit = highest scoring package
    good_fit = by_score[0]
    tiers['good_fit'] = good_fit
    seen_ids.add(good_fit[0].id)

    # 2. Budget = cheapest package not already used
    for pkg, score in by_price:
        if pkg.id not in seen_ids:
            tiers['budget'] = (pkg, score)
            seen_ids.add(pkg.id)
            break

    # 3. Excellent = next stronger/more expensive package above good_fit, not already used
    gf_price = good_fit[0].price
    for pkg, score in by_score:
        if pkg.id not in seen_ids and pkg.price > gf_price:
            tiers['excellent'] = (pkg, score)
            seen_ids.add(pkg.id)
            break

    # If still missing excellent, pick next best scored not used
    if 'excellent' not in tiers:
        for pkg, score in by_score:
            if pkg.id not in seen_ids:
                tiers['excellent'] = (pkg, score)
                seen_ids.add(pkg.id)
                break

    # If still missing budget (all same package), pick next cheapest
    if 'budget' not in tiers:
        for pkg, score in by_price:
            if pkg.id not in seen_ids:
                tiers['budget'] = (pkg, score)
                seen_ids.add(pkg.id)
                break

    # Determine best_match based on user priority
    priority = prefs.get('priority', 'balanced')
    if priority == 'lowest_cost' and 'budget' in tiers:
        best_match_tier = 'budget'
    elif priority == 'max_comfort' and 'excellent' in tiers:
        best_match_tier = 'excellent'
    else:
        best_match_tier = 'good_fit'

    return tiers, best_match_tier


def recommend_packages(appliance_selections, distance_km=None, preferences=None):
    """
    Generate 3 package recommendations using capability-band scoring.
    Always returns 3 distinct packages with a best_match indicator.
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

    all_scored = []
    for pkg in packages:
        adj_pp, adj_ep = _adjust_for_smart_load(
            base_pp, base_ep, smart_eligible, pkg, 'good_fit', preferences
        )
        score, details = _score_package(pkg, adj_pp, adj_ep, preferences)
        all_scored.append((pkg, score, details, adj_pp, adj_ep))

    tier_input = [(pkg, score) for pkg, score, _, _, _ in all_scored]
    tiers_raw, best_match_tier = _select_tiers(tier_input, preferences)

    tiers = {}
    for tier_name, (pkg, score) in tiers_raw.items():
        adj_pp, adj_ep = _adjust_for_smart_load(
            base_pp, base_ep, smart_eligible, pkg, tier_name, preferences
        )
        price_breakdown = calculate_price(pkg, distance_km)
        detail = next((d for p, s, d, _, _ in all_scored if p.id == pkg.id), {})

        # Compute battery kWh dynamically if stored value is 0
        battery_kwh = _compute_battery_kwh(pkg)

        tiers[tier_name] = {
            'package': pkg,
            'score': float(score),
            'pp_fit': float(detail.get('pp_fit', 0)),
            'ep_fit': float(detail.get('ep_fit', 0)),
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
