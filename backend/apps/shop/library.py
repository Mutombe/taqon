"""Media library aggregation.

The library is a single pool of every image on the site so an admin can reuse
one instead of re-uploading. It unions three live sources — standalone uploads
(MediaAsset), product images, and blog post images — deduplicated by URL. The
public gallery is the same union restricted to images on public pages (active
products, published posts, public uploads) minus any individually hidden URLs.
"""
from .models import Product, ProductImage, MediaAsset, GalleryHidden


def _abs(url, request):
    if not url:
        return ''
    if request and url.startswith('/') and not url.startswith('//'):
        # Relative media/static path — leave as-is; the frontend resolves it
        # against its own origin (that's where /photo.jpg assets live).
        return url
    return url


def _product_image_url(img):
    if img.image:
        try:
            return img.image.url
        except Exception:
            return ''
    return img.image_url or ''


def aggregate_library(*, request=None, public_only=False, search=''):
    """Return a list of unified library items, newest-ish first.

    Each item: {id, url, name, kind, source, source_slug, size, is_hidden}.
    """
    hidden = set(GalleryHidden.objects.values_list('url', flat=True))
    items = []
    seen = set()
    q = (search or '').strip().lower()

    def add(*, key, url, name, kind, source='', source_slug='', size=None):
        if not url or url in seen:
            return
        if public_only and url in hidden:
            return
        if q and q not in (name or '').lower() and q not in (source or '').lower():
            return
        seen.add(url)
        items.append({
            'id': key,
            'url': url,
            'name': name or source or 'Image',
            'kind': kind,
            'source': source,
            'source_slug': source_slug,
            'size': size,
            'is_hidden': url in hidden,
        })

    # 1) Standalone uploads
    assets = MediaAsset.objects.all()
    if public_only:
        assets = assets.filter(is_public=True)
    for a in assets:
        add(key=f'asset-{a.pk}', url=_abs(a.src, request), name=a.name,
            kind='upload', size=a.file_size)

    # 2) Product images
    prod_imgs = ProductImage.objects.select_related('product').filter(
        product__is_deleted=False,
    )
    if public_only:
        prod_imgs = prod_imgs.filter(product__is_active=True)
    for img in prod_imgs:
        add(key=f'product-{img.pk}', url=_abs(_product_image_url(img), request),
            name=img.alt_text or (img.product.name if img.product else ''),
            kind='product',
            source=img.product.name if img.product else '',
            source_slug=img.product.slug if img.product else '')

    # 3) Blog post images
    try:
        from apps.blog.models import BlogPost
        posts = BlogPost.objects.filter(is_deleted=False)
        if public_only:
            posts = posts.filter(is_published=True)
        for p in posts:
            url = (p.image.url if p.image else '') or p.image_url or ''
            add(key=f'blog-{p.pk}', url=_abs(url, request), name=p.title,
                kind='blog', source=p.title, source_slug=p.slug)
    except Exception:
        pass

    return items
