import React from 'react';
import { useEffect } from 'react';

export default function SEO({ title, description, keywords, canonical }) {
  const siteName = 'Taqon Electrico';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Zimbabwe's Premier Solar & Electrical Company`;
  const defaultDesc = 'Taqon Electrico provides professional solar installations, electrical maintenance, and renewable energy solutions in Harare, Zimbabwe. ZERA recommended solar company.';

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
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description || defaultDesc);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [fullTitle, description, keywords, canonical]);

  return null;
}
