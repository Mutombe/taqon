from django.contrib import admin
from .models import BlogCategory, BlogPost


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'category', 'author', 'is_published',
        'views_count', 'published_at', 'created_at',
    ]
    list_filter = ['is_published', 'category', 'created_at']
    search_fields = ['title', 'excerpt', 'content']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['is_published']
    raw_id_fields = ['author']
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    fieldsets = (
        (None, {'fields': ('title', 'slug', 'category', 'author')}),
        ('Content', {'fields': ('excerpt', 'content', 'tags', 'read_time')}),
        ('Media', {'fields': ('image', 'image_url')}),
        ('Publishing', {'fields': ('is_published', 'published_at')}),
        ('SEO', {'fields': ('meta_title', 'meta_description')}),
        ('Stats', {'fields': ('views_count', 'created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
