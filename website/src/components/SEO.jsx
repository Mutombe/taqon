import React from 'react';
import { useEffect } from 'react';

const SITE_URL = 'https://www.taqon.co.zw';
const DEFAULT_OG_IMAGE = `${SITE_URL}/downloads/taqon-robot.jpeg`;

export default function SEO({ title, description, keywords, canonical, image }) {
  const siteName = 'Taqon Electrico';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Zimbabwe's Premier Solar & Electrical Company`;
  const defaultDesc = 'Taqon Electrico provides professional solar installations, electrical maintenance, and renewable energy solutions in Harare, Zimbabwe. ZERA recommended solar company.';
  // Resolve to an absolute URL — crawlers and share sheets require it.
  const ogImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`)
    : DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description || defaultDesc);
    if (keywords) setMeta('keywords', keywords);
    setMeta('og:title', fullTitle);
    setMeta('og:description', description || defaultDesc);
    setMeta('og:type', 'website');
    setMeta('og:site_name', siteName);
    setMeta('og:image', ogImage);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description || defaultDesc);
    setMeta('twitter:image', ogImage);
    if (canonical) setMeta('og:url', canonical);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [fullTitle, description, keywords, canonical, ogImage]);

  return null;
}
