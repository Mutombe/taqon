import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CaretLeft, CircleNotch, UploadSimple, X, FloppyDisk, Globe,
  Tag, Clock, Image as ImageIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminBlogPost, useAdminBlogCategories } from '../../hooks/useQueries';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function estimateReadTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  const add = (val) => {
    const trimmed = val.trim().replace(/,+$/, '').trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (i) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className="auth-input flex flex-wrap gap-1.5 items-center min-h-10 cursor-text" onClick={(e) => e.currentTarget.querySelector('input')?.focus()}>
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-taqon-orange/10 text-taqon-orange text-xs font-medium">
          {tag}
          <button type="button" onClick={() => remove(i)} className="hover:text-taqon-orange/60 transition-colors">
            <X size={10} weight="bold" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && add(input)}
        className="flex-1 min-w-20 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        placeholder={tags.length === 0 ? 'Add tags, press Enter...' : ''}
      />
    </div>
  );
}

export default function AdminBlogEditor() {
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(routeSlug);
  const fileRef = useRef();
  const formPopulated = useRef(false);

  const [saving, setSaving] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    content: '',
    tags: [],
    read_time: 1,
    is_published: false,
    published_at: '',
    meta_title: '',
    meta_description: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // React Query: categories (cached, instant on repeat)
  const { data: categoriesRaw } = useAdminBlogCategories();
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : categoriesRaw?.results || [];

  // React Query: post for editing (cached)
  const { data: postData, isLoading: postLoading } = useAdminBlogPost(routeSlug);
  const loading = isEdit && postLoading;

  // Populate form when post data arrives
  useEffect(() => {
    if (!postData || formPopulated.current) return;
    formPopulated.current = true;
    setForm({
      title: postData.title || '',
      slug: postData.slug || '',
      category: postData.category?.id || postData.category || '',
      excerpt: postData.excerpt || '',
      content: postData.content || '',
      tags: Array.isArray(postData.tags) ? postData.tags : [],
      read_time: postData.read_time || 1,
      is_published: postData.is_published || false,
      published_at: postData.published_at ? postData.published_at.slice(0, 16) : '',
      meta_title: postData.meta_title || '',
      meta_description: postData.meta_description || '',
    });
    if (postData.image_display) setImagePreview(postData.image_display);
    else if (postData.image_url) setImagePreview(postData.image_url);
    setSlugManual(true);
  }, [postData]);

  // Auto-slug from title
  useEffect(() => {
    if (!slugManual && form.title) {
      set('slug', slugify(form.title));
    }
  }, [form.title, slugManual]);

  // Auto read time
  useEffect(() => {
    if (form.content) {
      set('read_time', estimateReadTime(form.content));
    }
  }, [form.content]);

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e, publish = null) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const isPublished = publish !== null ? publish : form.is_published;
      const payload = {
        title: form.title,
        slug: form.slug,
        category: form.category || null,
        excerpt: form.excerpt,
        content: form.content,
        tags: form.tags,
        read_time: form.read_time,
        is_published: isPublished,
        published_at: isPublished && !form.published_at ? new Date().toISOString() : form.published_at || null,
        meta_title: form.meta_title,
        meta_description: form.meta_description,
      };

      // If there's an image file, use FormData
      let data;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (k === 'tags') {
            fd.append(k, JSON.stringify(v));
          } else if (v !== null && v !== undefined) {
            fd.append(k, v);
          }
        });
        fd.append('image', imageFile);
        if (isEdit) {
          ({ data } = await adminApi.updateBlogPost(routeSlug, fd));
        } else {
          ({ data } = await adminApi.createBlogPost(fd));
        }
      } else {
        if (isEdit) {
          ({ data } = await adminApi.updateBlogPost(routeSlug, payload));
        } else {
          ({ data } = await adminApi.createBlogPost(payload));
        }
      }

      toast.success(isEdit ? 'Post updated' : (isPublished ? 'Post published!' : 'Draft saved'));
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['adminBlogPost'] });
      if (!isEdit && data?.slug) {
        navigate(`/admin/blog/${data.slug}/edit`, { replace: true });
      }
    } catch (err) {
      const detail = err?.response?.data;
      if (typeof detail === 'object') {
        const firstError = Object.values(detail).flat()[0];
        toast.error(typeof firstError === 'string' ? firstError : 'Failed to save post');
      } else {
        toast.error('Failed to save post');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <SkeletonBox className="h-8 w-48 rounded-lg" />
        <SkeletonBox className="h-12 w-full rounded-xl" />
        <SkeletonBox className="h-64 w-full rounded-xl" />
        <SkeletonBox className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/blog"
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <CaretLeft size={18} />
          </Link>
          <div>
            <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">
              {isEdit ? 'Edit Post' : 'New Post'}
            </h1>
            {isEdit && <p className="text-xs text-[var(--text-muted)] mt-0.5">/{routeSlug}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-60 transition-colors"
          >
            {saving ? <CircleNotch size={14} className="animate-spin" /> : <FloppyDisk size={15} />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 shadow-lg shadow-taqon-orange/20 transition-colors"
          >
            {saving ? <CircleNotch size={14} className="animate-spin" /> : <Globe size={15} />}
            Publish
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Title *</label>
              <input
                className="auth-input w-full text-lg font-semibold"
                placeholder="Your post title..."
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Slug</label>
              <div className="flex gap-2">
                <input
                  className="auth-input flex-1 text-sm font-mono"
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); set('slug', slugify(e.target.value)); }}
                  placeholder="post-slug"
                />
                {slugManual && (
                  <button
                    type="button"
                    onClick={() => { setSlugManual(false); set('slug', slugify(form.title)); }}
                    className="px-3 py-2 rounded-xl border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Auto
                  </button>
                )}
              </div>
              {form.slug && (
                <p className="text-xs text-[var(--text-muted)] mt-1">/blog/{form.slug}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Excerpt</label>
              <textarea
                className="auth-input w-full resize-none text-sm"
                rows={3}
                placeholder="Short summary shown in post listings..."
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Content</label>
            <textarea
              className="auth-input w-full resize-y font-mono text-sm leading-relaxed"
              rows={20}
              placeholder="Write your post content here (HTML supported)..."
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
            />
            {form.content && (
              <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                <Clock size={12} />
                ~{estimateReadTime(form.content)} min read · {form.content.trim().split(/\s+/).filter(Boolean).length} words
              </p>
            )}
          </div>

          {/* SEO */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">SEO</h3>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Meta Title</label>
              <input
                className="auth-input w-full text-sm"
                placeholder="SEO title (defaults to post title)"
                value={form.meta_title}
                onChange={(e) => set('meta_title', e.target.value)}
                maxLength={70}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">{form.meta_title.length}/70</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Meta Description</label>
              <textarea
                className="auth-input w-full resize-none text-sm"
                rows={3}
                placeholder="SEO meta description..."
                value={form.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                maxLength={160}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">{form.meta_description.length}/160</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Featured Image */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-3">Featured Image</h3>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[var(--bg-tertiary)] mb-2">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleImageChange(e.dataTransfer.files[0]); }}
                className="border-2 border-dashed border-[var(--input-border)] rounded-xl p-8 text-center cursor-pointer hover:border-taqon-orange/50 transition-colors mb-2"
              >
                <ImageIcon size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">Click or drag image</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full text-xs text-taqon-orange hover:underline transition-colors text-center"
            >
              {imagePreview ? 'Change image' : 'Upload image'}
            </button>
          </div>

          {/* Publish Settings */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">Publish Settings</h3>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => set('is_published', !form.is_published)}
                className={`w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0 ${form.is_published ? 'bg-taqon-orange' : 'bg-[var(--input-border)]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {form.is_published ? 'Published' : 'Draft'}
                </span>
                <p className="text-xs text-[var(--text-muted)]">
                  {form.is_published ? 'Visible to all visitors' : 'Only visible to admins'}
                </p>
              </div>
            </label>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Publish Date</label>
              <input
                type="datetime-local"
                className="auth-input w-full text-sm"
                value={form.published_at}
                onChange={(e) => set('published_at', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Read Time (min)</label>
              <input
                type="number"
                min="1"
                className="auth-input w-full text-sm"
                value={form.read_time}
                onChange={(e) => set('read_time', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Category & Tags */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)] text-sm">Category & Tags</h3>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
              <select
                className="auth-input w-full text-sm"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                <Tag size={12} className="inline mr-1" />
                Tags
              </label>
              <TagInput tags={form.tags} onChange={(tags) => set('tags', tags)} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Press Enter or comma to add</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
