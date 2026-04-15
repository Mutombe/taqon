"""
Dynamic pricing calculator for solar packages.

Implements: material + sundries(0.5%) + labour(8%) + transport($0.65/km)
"""

from decimal import Decimal
from .constants import PRICING


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
    transport = distance_km * PRICING['transport_per_km']
    total = material + sundries + labour + transport

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
    transport = distance_km * PRICING['transport_per_km']
    total = material + sundries + labour + transport

    return {
        'material': material,
        'sundries': sundries,
        'labour': labour,
        'transport': transport,
        'total': total,
    }
