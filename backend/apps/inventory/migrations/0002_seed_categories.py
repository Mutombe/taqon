from django.db import migrations
from django.utils.text import slugify

CATEGORIES = [
    ('Plumbing', 1),
    ('Electrical', 2),
    ('Construction', 3),
]


def seed_categories(apps, schema_editor):
    MaterialCategory = apps.get_model('inventory', 'MaterialCategory')
    for name, order in CATEGORIES:
        MaterialCategory.objects.get_or_create(
            name=name,
            defaults={'slug': slugify(name), 'sort_order': order},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, noop_reverse),
    ]
