import React, { useState, useEffect } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import AnimatedSection from './AnimatedSection';
import VideoTestimonial from './VideoTestimonial';
import { confirmExternalNavigation } from './ContentLink';
import { downloadsApi } from '../api/downloads';
import { videoTestimonials } from '../data/siteData';

const CHANNEL_URL = 'https://youtube.com/@smartsolarchoiceszim';

/**
 * "Video Stories – Solar Insights & Guides" — the admin-managed homepage
 * video wall. Reused on the Home page and Solar Secrets. Falls back to the
 * built-in list until the API responds / if it's empty.
 */
export default function VideoStoriesSection({ className = 'py-16 lg:py-24 bg-white dark:bg-taqon-charcoal' }) {
  const [videoStories, setVideoStories] = useState(null);

  useEffect(() => {
    let cancelled = false;
    downloadsApi.videoStories()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setVideoStories(rows);
      })
      .catch(() => { if (!cancelled) setVideoStories([]); });
    return () => { cancelled = true; };
  }, []);

  const videos = (videoStories && videoStories.length > 0)
    ? videoStories.map((v) => ({
        id: v.id,
        name: v.title,
        role: v.subtitle,
        thumbnail: v.thumbnail_url,
        videoUrl: v.youtube_url,
        platform: 'youtube',
      }))
    : videoTestimonials;

  return (
    <section className={className}>
      <div className="max-w-7xl mx-auto px-4">
        <AnimatedSection className="text-center mb-12">
          <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Video Stories</span>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
            Solar Insights & <span className="text-gradient">Guides</span>
          </h2>
        </AnimatedSection>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((v, i) => (
            <AnimatedSection key={v.id} delay={i * 0.1}>
              <VideoTestimonial {...v} />
            </AnimatedSection>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a
            href={CHANNEL_URL}
            onClick={(e) => confirmExternalNavigation(CHANNEL_URL, e)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-taqon-orange hover:text-taqon-amber transition-colors cursor-pointer"
          >
            More Solar Guides on YouTube
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
