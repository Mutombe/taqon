"""Generate self-hosted JPEG og:image derivatives for product link previews.

LinkedIn / WhatsApp / Facebook crawlers don't render WebP, so each product's
primary image is rendered to a 1200×1200 white-background JPEG stored on the
same media backend (DigitalOcean Spaces in production) and served as og:image.

    python manage.py generate_og_images            # only products missing one
    python manage.py generate_og_images --force    # regenerate all
    python manage.py generate_og_images --slug foo # a single product
    python manage.py generate_og_images --dry-run
"""
from django.core.management.base import BaseCommand

from apps.shop.models import Product


class Command(BaseCommand):
    help = 'Generate JPEG og:image derivatives for social link previews.'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true',
                            help='Regenerate even if an og_image already exists.')
        parser.add_argument('--slug', help='Limit to a single product slug.')
        parser.add_argument('--dry-run', action='store_true',
                            help='List what would be generated without writing.')

    def handle(self, *args, **opts):
        qs = Product.objects.all().order_by('slug')
        if opts.get('slug'):
            qs = qs.filter(slug=opts['slug'])

        made = skipped = failed = 0
        for p in qs.iterator():
            if p.og_image and not opts['force']:
                skipped += 1
                continue
            if opts['dry_run']:
                self.stdout.write(f'would generate: {p.slug}')
                continue
            if p.generate_og_image(force=opts['force']):
                made += 1
                self.stdout.write(self.style.SUCCESS(f'[ok]   {p.slug}'))
            else:
                failed += 1
                self.stdout.write(self.style.WARNING(f'[skip] no usable source image: {p.slug}'))

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f'\nDone - generated {made}, skipped {skipped} (already had one), '
                f'{failed} without a source image.'
            )
        )
