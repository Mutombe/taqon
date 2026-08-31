from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inquiries', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inquiry',
            name='source',
            field=models.CharField(
                max_length=20,
                default='public_form',
                choices=[
                    ('public_form', 'Public form'),
                    ('contact_form', 'Contact page form'),
                    ('whatsapp_link', 'WhatsApp link'),
                    ('email_link', 'Email link'),
                    ('shop_request', 'Shop checkout request'),
                    ('other', 'Other'),
                ],
            ),
        ),
    ]
