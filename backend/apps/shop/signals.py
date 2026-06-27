"""Keep each product's social og:image in sync with its primary image.

When a product image is added/changed, (re)generate the JPEG og:image so link
previews on LinkedIn/WhatsApp/Facebook stay current. Best-effort and guarded —
image generation never blocks or breaks an image upload.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ProductImage


@receiver(post_save, sender=ProductImage)
def refresh_product_og_image(sender, instance, **kwargs):
    product = instance.product
    try:
        # Regenerate when this is the primary image (the one shown in previews)
        # or when the product doesn't have a derivative yet.
        if instance.is_primary or not product.og_image:
            product.generate_og_image(force=True)
    except Exception:
        # Never let preview generation interfere with saving an image.
        pass
