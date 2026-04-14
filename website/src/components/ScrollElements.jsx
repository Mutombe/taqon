import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo } from '@phosphor-icons/react';
import { TAQON_WHATSAPP_URL } from '../data/siteData';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] h-[3px]">
      <motion.div
        className="h-full bg-gradient-to-r from-taqon-orange via-taqon-amber to-taqon-gold"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

/**
 * Floating WhatsApp button — sits directly above the Tidio chat bubble,
 * vertically aligned on the same right edge. Tidio's default bubble is
 * ~64px tall at bottom:20px, so we anchor WhatsApp at bottom:100px to
 * leave a clean 16px gap between the two buttons.
 */
export function BackToTop() {
  return (
    <AnimatePresence>
      <motion.a
        key="whatsapp-float"
        href={TAQON_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Taqon on WhatsApp"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ y: -2, scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        style={{ bottom: '100px', right: '20px' }}
        className="fixed z-[60] w-[56px] h-[56px] rounded-full bg-[#25D366] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-[#1ebe58] transition-colors"
      >
        <WhatsappLogo size={28} weight="fill" />
      </motion.a>
    </AnimatePresence>
  );
}
