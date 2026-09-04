from django.db import models

from apps.core.models import SoftDeleteModel, TimeStampedModel
from apps.core.utils import generate_unique_slug


class Project(SoftDeleteModel):
    """A completed installation shown in the public Projects gallery.

    Managed entirely by the Taqon team from the admin — add/edit/publish/
    reorder/feature without a developer. Images live on ProjectImage.
    """

    CATEGORY_CHOICES = [
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
        ('industrial', 'Industrial'),
        ('institutional', 'Institutional'),
        ('agricultural', 'Agricultural'),
        ('other', 'Other'),
    ]

    slug = models.SlugField(max_length=320, unique=True, db_index=True)
    title = models.CharField(max_length=300)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='residential', db_index=True)
    location = models.CharField(max_length=200, blank=True)
    kva = models.CharField(max_length=50, blank=True, help_text='e.g. "24kVA"')
    date_label = models.CharField(max_length=50, blank=True, help_text='Display date, e.g. "Feb 2023"')

    # Hero image: an uploaded file OR a URL/path (seeded projects reference
    # /public assets; the serializer resolves whichever is set).
    hero_image = models.ImageField(upload_to='projects/', blank=True, null=True)
    hero_image_url = models.CharField(max_length=500, blank=True)

    description = models.TextField(blank=True, help_text='Short summary shown on cards.')
    full_description = models.JSONField(default=list, blank=True, help_text='List of paragraphs.')
    specs = models.JSONField(default=dict, blank=True, help_text='Key/value system specs.')
    benefits = models.JSONField(default=list, blank=True, help_text='List of benefit bullets.')

    is_published = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)

    # Call-to-action button at the bottom of the project page. Preset types
    # resolve to a label + link on the frontend; 'custom' uses cta_label/cta_url.
    CTA_CHOICES = [
        ('quote', 'Get a Free Quote'),
        ('contact', 'Contact Us'),
        ('whatsapp', 'WhatsApp Us'),
        ('call', 'Call Us'),
        ('packages', 'View Packages'),
        ('shop', 'Shop Equipment'),
        ('advisor', 'Try the Solar Advisor'),
        ('custom', 'Custom (set label + link)'),
        ('none', 'No button'),
    ]
    cta_type = models.CharField(max_length=20, choices=CTA_CHOICES, default='quote')
    cta_label = models.CharField(max_length=80, blank=True)
    cta_url = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['sort_order', '-created_at']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        indexes = [
            models.Index(fields=['is_published', 'sort_order']),
            models.Index(fields=['category', 'is_published']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(Project, self.title)
        super().save(*args, **kwargs)

    @property
    def hero(self):
        """Resolved hero image URL (uploaded file wins, else the URL field)."""
        try:
            if self.hero_image and self.hero_image.name:
                return self.hero_image.url
        except Exception:
            pass
        return self.hero_image_url or ''


class ProjectImage(TimeStampedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='projects/', blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True)
    caption = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.project_id} · image {self.order}'

    @property
    def src(self):
        try:
            if self.image and self.image.name:
                return self.image.url
        except Exception:
            pass
        return self.image_url or ''
