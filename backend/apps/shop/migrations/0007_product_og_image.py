from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0006_shopsetting'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='og_image',
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to='og/products/',
                help_text=(
                    'Auto-generated 1200×1200 JPEG for social link previews. '
                    'LinkedIn/WhatsApp/Facebook crawlers do not render WebP, so '
                    'this self-hosted JPEG is served as the og:image.'
                ),
            ),
        ),
    ]
