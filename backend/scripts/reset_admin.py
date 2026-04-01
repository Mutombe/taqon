from apps.accounts.models import User

email = 'admin@taqon.co.zw'
password = 'TaqonAdmin2026'

# Delete old account and everything attached to it
User.objects.filter(email=email).delete()
print('Deleted old admin (if existed)')

# Create fresh
u = User.objects.create_superuser(
    email=email,
    password=password,
    first_name='Admin',
    last_name='Taqon',
)
u.is_verified = True
u.role = 'superadmin'
u.save()
print('Created fresh admin: ' + email)
