"""Remove ProductImage records whose image file is genuinely missing from storage.

Some product images point to files that were lost (written to ephemeral local
storage before Spaces was configured, then wiped on a redeploy). Those dangling
records make the browser fire 403s for files that don't exist. This deletes only
those records so the product falls back to its next valid image, or to the shop's
placeholder icon.

It checks S3/Spaces directly with head_object and treats ONLY a real 404 as
missing — any other condition (auth/network error, or a present file) keeps the
record. NEVER deletes on doubt.

    python manage.py clean_dangling_images --dry-run    # show what would go
    python manage.py clean_dangling_images              # delete them
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.shop.models import ProductImage


class Command(BaseCommand):
    help = 'Delete ProductImage records whose file is genuinely missing (404) from storage.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List what would be deleted, change nothing.')

    def handle(self, *args, **opts):
        bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        if not bucket:
            raise CommandError('No S3/Spaces bucket configured — run this on production (config.settings.prod).')
        try:
            import boto3
            import botocore
        except ImportError:
            raise CommandError('boto3 is required.')

        client = boto3.client(
            's3',
            endpoint_url=getattr(settings, 'AWS_S3_ENDPOINT_URL', None),
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', None),
        )
        location = (getattr(settings, 'AWS_LOCATION', '') or '').strip('/')

        def is_missing(name):
            key = f'{location}/{name}' if location else name
            try:
                client.head_object(Bucket=bucket, Key=key)
                return False  # present
            except botocore.exceptions.ClientError as e:
                code = str(e.response.get('Error', {}).get('Code', ''))
                status = e.response.get('ResponseMetadata', {}).get('HTTPStatusCode')
                if code in ('404', 'NoSuchKey', 'NotFound') or status == 404:
                    return True  # genuinely missing
                self.stderr.write(f'  ? inconclusive for {key}: {code} — keeping')
                return False  # never delete on doubt

        dry = opts['dry_run']
        dangling = []
        checked = 0
        for img in ProductImage.objects.exclude(image='').select_related('product'):
            checked += 1
            if is_missing(img.image.name):
                dangling.append(img)

        for img in dangling:
            label = img.product.name if img.product else '(no product)'
            self.stdout.write(f"  {'would delete' if dry else 'deleting'}: {label} -> {img.image.name}")
            if not dry:
                img.delete()

        verb = 'Would remove' if dry else 'Removed'
        self.stdout.write(self.style.SUCCESS(
            f'{verb} {len(dangling)} dangling ProductImage record(s) of {checked} checked.'
        ))
