import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, YoutubeLogo, ArrowSquareOut, Clock } from '@phosphor-icons/react';

/**
 * A package "video selection guide" CTA. Given a YouTube URL it renders a
 * "Watch …" button that plays the video in a lightbox, plus a "Watch on
 * YouTube" secondary link. With no URL it shows a clean "Video coming soon"
 * state — never an empty/broken player.
 *
 * Props: title, text, url, buttonLabel
 */
function ytId(url = '') {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#/]+)/,
  );
  return m ? m[1] : '';
}

export default function VideoGuide({
  title = 'Solar Package Guide',
  text = '',
  url = '',
  buttonLabel = 'Watch Guide',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const videoId = ytId(url);
  const available = !!videoId;

  const openModal = useCallback(() => {
    if (!available) return;
    setOpen(true);
    document.body.style.overflow = 'hidden';
  }, [available]);

  const closeModal = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, []);

  return (
    <div className={`rounded-2xl border border-taqon-orange/15 bg-white dark:bg-taqon-charcoal p-5 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Thumbnail / icon */}
        <button
          type="button"
          onClick={openModal}
          disabled={!available}
          className="relative w-full sm:w-44 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-taqon-charcoal group disabled:cursor-default"
          aria-label={available ? buttonLabel : 'Video coming soon'}
        >
          {available ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-taqon-dark/25 group-hover:bg-taqon-dark/10 transition-colors" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-taqon-orange/95 flex items-center justify-center shadow-lg ring-4 ring-white/15">
                  <Play size={20} className="text-white ml-0.5" weight="fill" />
                </span>
              </span>
            </>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/40">
              <YoutubeLogo size={26} />
              <span className="text-[11px] font-medium">Coming soon</span>
            </span>
          )}
        </button>

        {/* Copy + actions */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <YoutubeLogo size={18} className="text-taqon-orange flex-shrink-0" weight="fill" />
            <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">{title}</h3>
          </div>
          {text && <p className="mt-1.5 text-sm text-taqon-muted dark:text-white/55 leading-relaxed">{text}</p>}

          {available ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-all active:scale-95"
              >
                <Play size={15} weight="fill" /> {buttonLabel}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-taqon-orange hover:text-taqon-amber transition-colors"
              >
                Watch on YouTube <ArrowSquareOut size={14} />
              </a>
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-taqon-muted dark:text-white/50 bg-taqon-cream dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-3 py-1.5">
              <Clock size={14} /> Video coming soon
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {open && available && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
