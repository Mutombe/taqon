from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Create a superadmin user for the Taqon Electrico platform'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email')
        parser.add_argument('--password', type=str, help='Admin password')
        parser.add_argument('--first-name', type=str, default='Admin', help='First name')
        parser.add_argument('--last-name', type=str, default='Taqon', help='Last name')

    def handle(self, *args, **options):
        email = options['email'] or input('Email: ')
        password = options['password'] or input('Password: ')
        first_name = options['first_name']
        last_name = options['last_name']

        if User.objects.filter(email__iexact=email).exists():
            self.stdout.write(self.style.WARNING(f'User {email} already exists.'))
            return

        user = User.objects.create_superuser(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        self.stdout.write(self.style.SUCCESS(f'Superadmin created: {user.email}'))
