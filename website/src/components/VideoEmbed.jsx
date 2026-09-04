import React from 'react';

/** Extract a YouTube video id from any common YouTube URL form. */
export function ytId(url = '') {
  const m = (url || '').match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#/]+)/,
  );
  return m ? m[1] : '';
}

/**
 * A responsive 16:9 inline YouTube player. Renders nothing when the URL has no
 * valid video id, so it's safe to drop in with an optional `url`.
 */
export default function VideoEmbed({ url, title = 'Video', className = '' }) {
  const id = ytId(url);
  if (!id) return null;
  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0`}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
