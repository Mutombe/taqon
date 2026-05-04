import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, X, ArrowRight } from '@phosphor-icons/react';

const STORAGE_KEY = 'taqon-hiring-banner-dismissed-v1';
const BANNER_EVENT = 'taqon:hiring-banner-state';

// Read once on mount; persists per-browser. Navbar listens to BANNER_EVENT
// to shift its top offset down by ~36px when the banner is showing.
function readDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function emitBannerState(visible) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BANNER_EVENT, { detail: { visible } }));
}

export const HIRING_BANNER_EVENT = BANNER_EVENT;

export default function HiringBanner() {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  useEffect(() => {
    // Tell the navbar whether we are currently visible so it can offset itself.
    emitBannerState(!dismissed);
  }, [dismissed]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore — we'll just show it again next visit
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="hiring-banner"
        initial={{ y: -40, opacity: 0 }}
        animate={{
          y: isScrolled ? -40 : 0,
          opacity: isScrolled ? 0 : 1,
        }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-[65] pointer-events-auto"
        role="region"
        aria-label="Hiring announcement"
      >
        <div className="relative bg-gradient-to-r from-taqon-orange via-orange-500 to-taqon-orange text-white shadow-sm">
          {/* subtle moving sheen */}
          <motion.div
            aria-hidden
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(110deg, transparent 0%, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPositionX: ['200%', '-100%'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <Link
              to="/careers"
              className="group flex items-center gap-2 min-w-0 text-xs sm:text-sm font-semibold"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 flex-shrink-0">
                <Briefcase size={13} weight="fill" />
              </span>
              <span className="truncate">
                <span className="font-bold tracking-wide uppercase mr-2 hidden sm:inline">We're hiring</span>
                Sales Representative position open in Harare.
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-white/95 underline-offset-2 group-hover:underline whitespace-nowrap">
                Apply <ArrowRight size={13} weight="bold" />
              </span>
            </Link>

            <button
              onClick={handleDismiss}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/15 transition-colors flex-shrink-0"
              aria-label="Dismiss hiring announcement"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
