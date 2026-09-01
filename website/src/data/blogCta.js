import { TAQON_WHATSAPP_URL, TAQON_PHONE_TEL } from './siteData';

// Preset CTA buttons an author can pick for the bottom of an article.
// `to` = internal route, `href` = external/absolute link.
export const BLOG_CTA_TYPES = [
  { value: 'quote', label: 'Get a Free Quote', to: '/solar-advisor' },
  { value: 'contact', label: 'Contact Us', to: '/contact' },
  { value: 'whatsapp', label: 'WhatsApp Us', href: TAQON_WHATSAPP_URL, external: true },
  { value: 'call', label: 'Call Us', href: `tel:${TAQON_PHONE_TEL}` },
  { value: 'packages', label: 'View Packages', to: '/packages' },
  { value: 'shop', label: 'Shop Equipment', to: '/shop' },
  { value: 'advisor', label: 'Try the Solar Advisor', to: '/solar-advisor' },
  { value: 'custom', label: 'Custom (set your own)', custom: true },
  { value: 'none', label: 'No button', none: true },
];

/**
 * Resolve a blog post's CTA to a renderable descriptor, or null (no button).
 * Returns { label, to?, href?, external? }.
 */
export function resolveBlogCta(post) {
  const type = post?.cta_type || 'quote';
  if (type === 'none') return null;

  if (type === 'custom') {
    const label = (post?.cta_label || '').trim();
    const url = (post?.cta_url || '').trim();
    if (!label || !url) return null;
    const external = /^https?:\/\//i.test(url) || url.startsWith('tel:') || url.startsWith('mailto:');
    return external ? { label, href: url, external: true } : { label, to: url };
  }

  const cfg = BLOG_CTA_TYPES.find((t) => t.value === type) || BLOG_CTA_TYPES[0];
  return { label: cfg.label, to: cfg.to, href: cfg.href, external: !!cfg.external };
}
