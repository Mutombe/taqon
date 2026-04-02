from apps.accounts.models import User
from django.contrib.auth.hashers import make_password

email = 'admin@taqon.co.zw'
password = 'TaqonAdmin2026'

# Delete old
deleted = User.objects.filter(email=email).delete()
print('Deleted: ' + str(deleted))

# Create fresh with explicit password hash
u = User(
    email=email,
    first_name='Admin',
    last_name='Taqon',
    role='superadmin',
    is_staff=True,
    is_superuser=True,
    is_active=True,
    is_verified=True,
)
u.password = make_password(password)
u.save()

# Verify it works
assert u.check_password(password), 'PASSWORD CHECK FAILED!'
print('Created admin: ' + email)
print('Password check: ' + str(u.check_password(password)))
