"""Seed the 16 solar geyser packages from the finalized package workbook."""
from django.db import migrations
from django.utils.text import slugify


def seed(apps, schema_editor):
    GeyserPackage = apps.get_model('geysers', 'GeyserPackage')
    from apps.geysers.seed_data import GEYSER_PACKAGES

    for data in GEYSER_PACKAGES:
        d = dict(data)
        # Historical models skip the model's save(), so set slug/is_smart here.
        slug = slugify(d['name'])
        d['is_smart'] = d.get('variant') == 'smart'
        GeyserPackage.objects.update_or_create(
            slug=slug,
            defaults={**d, 'slug': slug},
        )


def unseed(apps, schema_editor):
    GeyserPackage = apps.get_model('geysers', 'GeyserPackage')
    from apps.geysers.seed_data import GEYSER_PACKAGES
    slugs = [slugify(p['name']) for p in GEYSER_PACKAGES]
    GeyserPackage.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):
    dependencies = [('geysers', '0001_initial')]
    operations = [migrations.RunPython(seed, unseed)]
