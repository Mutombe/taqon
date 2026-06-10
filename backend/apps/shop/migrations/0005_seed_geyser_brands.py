from django.db import migrations
from django.utils.text import slugify

# Brands geyser products are sold under (so they appear in the admin product
# modal's brand dropdown). Idempotent — safe to re-run.
GEYSER_BRANDS = ['Suntask', 'Ecosolar', 'Electrosales', 'Solara', 'Powerite']


def add_geyser_brands(apps, schema_editor):
    Brand = apps.get_model('shop', 'Brand')
    for name in GEYSER_BRANDS:
        # Historical model: no custom save(), so set the slug explicitly.
        Brand.objects.get_or_create(
            name=name,
            defaults={'slug': slugify(name), 'is_active': True},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0004_seed_geysers_category_victron_brand'),
    ]

    operations = [
        migrations.RunPython(add_geyser_brands, noop_reverse),
    ]
