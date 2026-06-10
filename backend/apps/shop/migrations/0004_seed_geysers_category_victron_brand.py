from django.db import migrations
from django.utils.text import slugify


def add_catalog_entries(apps, schema_editor):
    """Add the Geysers product category and the Victron brand so they appear in
    the admin product modal's dropdowns. Idempotent — safe to re-run."""
    Category = apps.get_model('shop', 'Category')
    Brand = apps.get_model('shop', 'Brand')

    # Historical models don't run the model's custom save(), so the auto-slug
    # never fires here — set the slug explicitly.
    Category.objects.get_or_create(
        name='Geysers',
        defaults={'slug': slugify('Geysers'), 'is_active': True},
    )
    Brand.objects.get_or_create(
        name='Victron',
        defaults={'slug': slugify('Victron'), 'is_active': True},
    )


def noop_reverse(apps, schema_editor):
    """Don't delete catalog entries on reverse — they may have products linked."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0003_galleryhidden_mediaasset'),
    ]

    operations = [
        migrations.RunPython(add_catalog_entries, noop_reverse),
    ]
