import React from 'react';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X } from '@phosphor-icons/react';

function extractYouTubeId(url) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/
  );
  return match ? match[1] : null;
}

function YouTubeLogo() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      <rect width="28" height="20" rx="4" fill="#FF0000" />
      <path d="M18.5 10L11.5 14V6L18.5 10Z" fill="white" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect width="20" height="20" rx="4" fill="#1877F2" />
      <path d="M13.9 10.6H11.7V17.5H9V10.6H7.3V8.2H9V6.7C9 5 10 3.5 12.3 3.5C13.2 3.5 13.9 3.6 13.9 3.6L13.8 5.8C13.8 5.8 13.1 5.8 12.4 5.8C11.6 5.8 11.7 6.2 11.7 6.7V8.2H13.9L13.9 10.6Z" fill="white" />
    </svg>
  );
}

export default function VideoTestimonial({ thumbnail, videoUrl, name, role, quote, platform = 'youtube' }) {
  const [isOpen, setIsOpen] = useState(false);

  const isFacebook = platform === 'facebook';
  const videoId = !isFacebook ? extractYouTubeId(videoUrl) : null;

  const openModal = useCallback(() => {
    if (isFacebook) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  }, [isFacebook, videoUrl]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, []);

  const srcdocContent = videoId
    ? `
    <style>
      * { padding:0; margin:0; overflow:hidden; }
      html, body { height:100%; background:#000; }
      img, span { position:absolute; width:100%; top:0; bottom:0; margin:auto; }
      span {
        height:1.5em; text-align:center; font:48px/1.5 sans-serif; color:white;
        text-shadow:0 0 0.5em black;
      }
    </style>
    <a href="https://www.youtube.com/embed/${videoId}?autoplay=1">
      <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="${name} video">
      <span>&#x25B6;</span>
    </a>
  `.replace(/\n\s+/g, '')
    : '';

  return (
    <>
      {/* Thumbnail Card */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="group cursor-pointer"
        onClick={openModal}
      >
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-taqon-charcoal">
          <img
            src={thumbnail}
            alt={`${name} video`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-taqon-dark/80 via-taqon-dark/20 to-transparent" />

          {/* Platform Logo — top-right corner */}
          <div className="absolute top-3 right-3 z-10 opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-lg">
            {isFacebook ? <FacebookLogo /> : <YouTubeLogo />}
          </div>

          {/* Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full bg-taqon-orange flex items-center justify-center shadow-xl shadow-taqon-orange/30"
            >
              <Play size={28} className="text-white ml-1" fill="white" />
            </motion.div>
          </div>

          {/* Name & Role Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="font-bold font-syne text-white text-lg">{name}</p>
            <p className="text-white/60 text-sm">{role}</p>
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <div className="mt-4 px-1">
            <p className="text-taqon-muted dark:text-white/50 text-sm leading-relaxed italic line-clamp-2">
              "{quote}"
            </p>
          </div>
        )}
      </motion.div>

      {/* Video Modal (YouTube only) */}
      <AnimatePresence>
        {isOpen && videoId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={closeModal}
              className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </motion.button>

            {/* Video Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                srcDoc={srcdocContent}
                title={`${name} video`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </motion.div>

            {/* Name under video */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 z-10 text-center"
            >
              <p className="text-white font-syne font-bold">{name}</p>
              <p className="text-white/50 text-sm">{role}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
