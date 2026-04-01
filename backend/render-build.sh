#!/usr/bin/env bash
set -o errexit

# Install system dependencies for WeasyPrint PDF generation
apt-get update && apt-get install -y \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libcairo2 \
  libffi-dev \
  shared-mime-info \
  2>/dev/null || echo "apt-get not available, skipping system deps"

pip install --upgrade pip
pip install -r requirements/prod.txt
python manage.py collectstatic --noinput
python manage.py migrate

# Seed capability bands for recommendation engine
python manage.py seed_capability_bands

# Reset admin password (one-time, safe to re-run)
python manage.py shell -c "
from apps.accounts.models import User
try:
    u = User.objects.get(email='admin@taqon.co.zw')
    u.set_password('TaqonAdmin2026')
    u.is_verified = True
    u.save()
    print('Admin password reset OK')
except User.DoesNotExist:
    print('Admin user not found, creating...')
    User.objects.create_superuser(email='admin@taqon.co.zw', password='TaqonAdmin2026', first_name='Admin', last_name='Taqon')
    print('Admin created OK')
"
