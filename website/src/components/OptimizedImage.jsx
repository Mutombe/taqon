import React from 'react';

const defaultSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

function getResponsiveSrcSet(src, widths = [400, 800, 1200]) {
  // If it's an Unsplash URL, we can append width params
  if (src.includes('unsplash.com')) {
    const base = src.split('?')[0];
    return widths.map(w => `${base}?w=${w}&q=80&auto=format ${w}w`).join(', ');
  }
  // For local images, just return the src
  return '';
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  sizes = defaultSizes,
  loading = 'lazy',
  fetchPriority,
  widths = [400, 800, 1200],
  ...props
}) {
  const srcSet = getResponsiveSrcSet(src, widths);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      {...(fetchPriority && { fetchpriority: fetchPriority })}
      {...(srcSet && { srcSet, sizes })}
      {...props}
    />
  );
}
