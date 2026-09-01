import api from './axios';

const BASE = '/blog';

export const blogApi = {
  // Public — published posts only
  getPosts: (params = {}) => api.get(`${BASE}/posts/`, { params }),
  getPost: (slug) => api.get(`${BASE}/posts/${slug}/`),
  getCategories: () => api.get(`${BASE}/categories/`),
};

/**
 * Map a backend BlogPost (list or detail serializer) into the shape the
 * public Blog / BlogPost pages render. The pages were originally written
 * against the static blogData.js objects; this adapter lets them consume
 * the live API without a full rewrite of their markup.
 */
export function normalizeBlogPost(p) {
  if (!p) return null;
  const author = p.author || {};
  const authorName =
    [author.first_name, author.last_name].filter(Boolean).join(' ').trim() ||
    'Taqon Electrico';
  return {
    id: p.id,
    slug: p.slug,
    title: p.title || '',
    excerpt: p.excerpt || '',
    content: p.content || '',
    image: p.image_display || p.image_url || '',
    category: p.category?.name || 'News',
    tags: Array.isArray(p.tags) ? p.tags : [],
    author: { name: authorName, role: 'Editorial Team' },
    date: p.published_at || p.created_at || '',
    // read_time is a free CharField: seeded posts store "9 min read",
    // editor-saved posts store a bare number. Normalise to one label.
    readTime: (() => {
      const rt = (p.read_time ?? '').toString().trim();
      if (!rt) return '';
      return /read|min/i.test(rt) ? rt : `${rt} min read`;
    })(),
    views: p.views_count || 0,
    // Author-selected call-to-action button (bottom of the article)
    cta_type: p.cta_type || 'quote',
    cta_label: p.cta_label || '',
    cta_url: p.cta_url || '',
    // detail serializer returns related_posts as full objects
    relatedPosts: Array.isArray(p.related_posts)
      ? p.related_posts.map(normalizeBlogPost)
      : [],
  };
}
