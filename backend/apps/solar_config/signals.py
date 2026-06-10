"""
Bidirectional sync between a Shop Product and the SolarComponent(s) linked to it.

A SolarComponent may point at a ``shop.Product`` via its ``product`` FK. When it
does, the two describe the same physical item, so their display fields are kept
in lockstep — **price, name, description, and brand**. Editing from EITHER side
(the product admin, the component admin, the Django admin, the API) propagates to
the other, and a price change recalculates every package that uses the component
(which is what the package cards and the "What's Included" section render).

Loop safety: every write is guarded by compare-before-save. A Product→Component
→Product (or the reverse) round trip therefore terminates the moment the values
already match — there is no infinite loop. ``brand`` is the one asymmetric field:
text on the component, a FK on the product, so it is mapped name⇄Brand.
"""
import logging

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(pre_save, sender='solar_config.SolarComponent')
def _stash_old_product(sender, instance, **kwargs):
    """Remember the component's previous product link so post_save can tell a
    (re)link apart from an ordinary field edit — works even on a full save where
    ``update_fields`` is None."""
    from .models import SolarComponent

    if instance.pk:
        instance._old_product_id = (
            SolarComponent.objects.filter(pk=instance.pk)
            .values_list('product_id', flat=True).first()
        )
    else:
        instance._old_product_id = None


def _product_brand_name(product):
    """The product's brand as plain text (the component stores brand as text)."""
    return product.brand.name if (product.brand_id and product.brand) else ''


@receiver(post_save, sender='shop.Product')
def sync_components_from_product(sender, instance, **kwargs):
    """Shop Product saved → push price/name/description/brand onto every linked
    SolarComponent, recalculating any package whose pricing the change affects."""
    from .models import SolarComponent

    components = list(SolarComponent.objects.filter(product=instance, is_deleted=False))
    if not components:
        return

    brand_name = _product_brand_name(instance)
    desc = instance.description or ''

    for component in components:
        changed = {}
        if component.price != instance.price:
            changed['price'] = instance.price
        if component.name != instance.name:
            changed['name'] = instance.name
        if (component.description or '') != desc:
            changed['description'] = desc
        if (component.brand or '') != brand_name:
            changed['brand'] = brand_name
        if not changed:
            continue
        for field, value in changed.items():
            setattr(component, field, value)
        # Saving fires sync_product_and_packages_from_component below; it finds
        # the product already equal (we copied FROM it) and stops, and it
        # recalculates packages when 'price' is among the changed fields.
        component.save(update_fields=list(changed.keys()) + ['updated_at'])
        logger.info(
            'Product "%s" → component "%s" synced: %s',
            instance.name, component.name, ', '.join(changed.keys()),
        )


@receiver(post_save, sender='solar_config.SolarComponent')
def sync_product_and_packages_from_component(sender, instance, **kwargs):
    """SolarComponent saved →
      - on (re)link to a product, adopt the product's fields (the product is the
        source of truth for a freshly linked component);
      - otherwise mirror the component's price/name/description/brand back to the
        linked product so a component-side edit also reflects in the shop;
      - recalculate every package that uses the component when its price changed.
    """
    update_fields = kwargs.get('update_fields')
    created = kwargs.get('created', False)
    price_in_scope = (not update_fields) or ('price' in update_fields)
    old_product_id = getattr(instance, '_old_product_id', None)
    is_link_event = created or (instance.product_id and instance.product_id != old_product_id)

    if instance.product_id:
        from apps.shop.models import Brand, Product

        try:
            product = Product.objects.select_related('brand').get(pk=instance.product_id)
        except Product.DoesNotExist:
            product = None

        if product and is_link_event:
            # Freshly linked/created → the component adopts the product's fields.
            brand_name = _product_brand_name(product)
            pull = {}
            if instance.price != product.price:
                pull['price'] = product.price
            if product.name and instance.name != product.name:
                pull['name'] = product.name
            if (instance.description or '') != (product.description or ''):
                pull['description'] = product.description or ''
            if (instance.brand or '') != brand_name:
                pull['brand'] = brand_name
            if pull:
                for field, value in pull.items():
                    setattr(instance, field, value)
                # Re-fires this signal as a plain edit (no 'product' in fields →
                # the push branch below runs, finds the product equal, stops).
                instance.save(update_fields=list(pull.keys()) + ['updated_at'])
                logger.info(
                    'Component "%s" linked → adopted product "%s" fields: %s',
                    instance.name, product.name, ', '.join(pull.keys()),
                )
                return

        elif product:
            # Component-side edit → mirror display fields back to the product.
            prod_changed = []
            if price_in_scope and product.price != instance.price:
                product.price = instance.price
                prod_changed.append('price')
            if instance.name and product.name != instance.name:
                product.name = instance.name
                prod_changed.append('name')
            if (product.description or '') != (instance.description or ''):
                product.description = instance.description or ''
                prod_changed.append('description')
            if instance.brand and _product_brand_name(product) != instance.brand:
                brand_obj, _ = Brand.objects.get_or_create(name=instance.brand)
                product.brand = brand_obj
                prod_changed.append('brand')
            if prod_changed:
                # product.save fires sync_components_from_product, which finds the
                # component already equal (it is the source here) and stops.
                product.save(update_fields=prod_changed + ['updated_at'])
                logger.info(
                    'Component "%s" → product "%s" synced: %s',
                    instance.name, product.name, ', '.join(prod_changed),
                )

    # Recalculate packages that use this component when its price changed.
    if price_in_scope:
        for pkg_component in instance.package_uses.select_related('package').all():
            pkg_component.package.recalculate_price()
