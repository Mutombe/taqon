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
python manage.py seed_capability_bands
python manage.py sync_appliances_to_spec
python manage.py shell < scripts/reset_admin.py
