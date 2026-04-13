"""
Signals for price cascade:
Shop Product price changes → SolarComponent price syncs → Package totals recalculate
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='shop.Product')
def sync_component_price_on_product_save(sender, instance, **kwargs):
    """
    When a Shop Product price changes, update all linked SolarComponents
    and recalculate every package that uses those components.
    """
    from .models import SolarComponent

    # Find all components linked to this product
    components = SolarComponent.objects.filter(product=instance, is_deleted=False)
    if not components.exists():
        return

    updated_packages = set()

    for component in components:
        if component.price != instance.price:
            old_price = component.price
            component.price = instance.price
            component.save(update_fields=['price', 'updated_at'])
            logger.info(
                f'Component "{component.name}" price synced: ${old_price} -> ${instance.price} '
                f'(from Shop Product "{instance.name}")'
            )

            # Find all packages using this component and recalculate
            for pkg_component in component.package_uses.select_related('package').all():
                pkg = pkg_component.package
                if pkg.id not in updated_packages:
                    updated_packages.add(pkg.id)
                    pkg.recalculate_price()
                    logger.info(
                        f'Package "{pkg.name}" price recalculated: ${pkg.price}'
                    )

    if updated_packages:
        logger.info(f'Price cascade: {len(updated_packages)} packages updated from Product "{instance.name}"')


@receiver(post_save, sender='solar_config.SolarComponent')
def recalculate_packages_on_component_save(sender, instance, **kwargs):
    """
    When a SolarComponent is saved:
      - If price changed (or update_fields is not set), recalculate all packages using it.
      - If the linked `product` changed, sync the component price to the new product's price.
    """
    update_fields = kwargs.get('update_fields')

    # When `product` was just re-linked, align the component price with the new product.
    if (not update_fields or 'product' in update_fields) and instance.product_id:
        from apps.shop.models import Product
        try:
            product = Product.objects.only('price').get(pk=instance.product_id)
        except Product.DoesNotExist:
            product = None
        if product and product.price != instance.price:
            logger.info(
                f'Component "{instance.name}" re-linked — syncing price '
                f'${instance.price} -> ${product.price}'
            )
            instance.price = product.price
            instance.save(update_fields=['price', 'updated_at'])
            # Recursive save will re-fire this signal and cascade to packages
            return

    # Skip cascade if update_fields is set and price wasn't in it
    if update_fields and 'price' not in update_fields:
        return

    # Recalculate all packages using this component
    for pkg_component in instance.package_uses.select_related('package').all():
        pkg = pkg_component.package
        pkg.recalculate_price()
