from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel, SoftDeleteModel
from apps.core.utils import generate_unique_slug


class BlogCategory(TimeStampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Blog Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(BlogCategory, self.name)
        super().save(*args, **kwargs)


class BlogPost(SoftDeleteModel):
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True, db_index=True)
    excerpt = models.TextField(blank=True, help_text='Short summary of the post')
    content = models.TextField(help_text='Full HTML content of the post')
    category = models.ForeignKey(
        BlogCategory, on_delete=models.PROTECT, related_name='posts',
    )
    tags = models.JSONField(default=list, blank=True, help_text='List of tag strings')
    image = models.ImageField(upload_to='blog/', blank=True, null=True)
    image_url = models.CharField(
        max_length=500, blank=True,
        help_text='Image URL or path (alternative to upload)',
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_posts',
    )
    read_time = models.CharField(
        max_length=50, blank=True,
        help_text='Estimated read time, e.g. "5 min read"',
    )
    is_published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    meta_title = models.CharField(max_length=200, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['is_published', 'published_at']),
            models.Index(fields=['category', 'is_published']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(BlogPost, self.title)
        super().save(*args, **kwargs)
