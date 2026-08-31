"""Seed the Projects gallery from seed_data.json (extracted from the original
frontend projectsData.js). Idempotent by slug.

    python manage.py seed_projects           # create missing projects only
    python manage.py seed_projects --force   # also refresh existing ones
"""
import json
import os

from django.core.management.base import BaseCommand

from apps.projects.models import Project, ProjectImage

SEED_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'seed_data.json')


class Command(BaseCommand):
    help = 'Seed the Projects gallery from seed_data.json (idempotent by slug).'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true',
                            help='Refresh existing projects (and their images) too.')

    def handle(self, *args, **opts):
        with open(SEED_PATH, encoding='utf-8') as f:
            data = json.load(f)

        created = updated = skipped = 0
        for i, p in enumerate(data):
            obj = Project.objects.filter(slug=p['slug']).first()
            if obj and not opts['force']:
                skipped += 1
                continue

            fields = dict(
                title=p.get('title', ''),
                category=p.get('category', 'residential'),
                location=p.get('location', ''),
                kva=p.get('kva', ''),
                date_label=p.get('date', ''),
                hero_image_url=p.get('heroImage', ''),
                description=p.get('description', ''),
                full_description=p.get('fullDescription', []),
                specs=p.get('specs', {}),
                benefits=p.get('benefits', []),
                is_published=True,
                sort_order=i,
            )

            if obj:
                for k, v in fields.items():
                    setattr(obj, k, v)
                obj.save()
                updated += 1
            else:
                obj = Project.objects.create(slug=p['slug'], **fields)
                created += 1

            obj.images.all().delete()
            for j, img in enumerate(p.get('images', [])):
                ProjectImage.objects.create(
                    project=obj,
                    image_url=img.get('src', ''),
                    caption=img.get('caption', ''),
                    order=j,
                )

        self.stdout.write(self.style.MIGRATE_HEADING(
            f'Done - created {created}, updated {updated}, skipped {skipped}.'))
