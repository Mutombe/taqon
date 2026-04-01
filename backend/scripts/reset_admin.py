"""Reset or create admin account. Run via: python manage.py shell < scripts/reset_admin.py"""
import django
django.setup()

from apps.accounts.models import User

email = 'admin@taqon.co.zw'
password = 'TaqonAdmin2026'

try:
    u = User.objects.get(email=email)
    u.set_password(password)
    u.is_verified = True
    u.save()
    print(f'Admin password reset: {email}')
except User.DoesNotExist:
    u = User.objects.create_superuser(email=email, password=password, first_name='Admin', last_name='Taqon')
    u.is_verified = True
    u.save()
    print(f'Admin created: {email}')
