from django.db import migrations

SEED = [
    ('6 Things to Check Before Buying a Solar Lithium Battery', 'https://youtu.be/hFyo2JjGVjM'),
    ('5 Common Mistakes People Make When Buying a Solar System', 'https://youtu.be/XELh-kQG6dQ'),
    ('Top 5 Solar Inverters in Zimbabwe (2025 Buyers Guide)', 'https://youtu.be/cLcKy5p_JOQ'),
    ('10+1 Things to Look for When Choosing a Solar Inverter', 'https://youtu.be/3TE1Lu6PCoU'),
]


def seed(apps, schema_editor):
    VideoStory = apps.get_model('downloads', 'VideoStory')
    if VideoStory.objects.exists():
        return  # don't clobber anything already curated
    for i, (title, url) in enumerate(SEED):
        VideoStory.objects.create(
            title=title,
            subtitle='Smart Solar Choices Zimbabwe',
            youtube_url=url,
            order=i,
            is_active=True,
        )


def unseed(apps, schema_editor):
    # No-op reverse: leave curated rows in place.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('downloads', '0003_videostory'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
