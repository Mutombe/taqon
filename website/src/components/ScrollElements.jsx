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
 * Floating WhatsApp button — always visible, sits directly above the
 * Tidio chat bubble. Replaces the previous BackToTop button; users
 * prefer a direct line to WhatsApp for quick enquiries.
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
        whileHover={{ y: -3, scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-[90px] right-[18px] z-[60] w-12 h-12 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40 flex items-center justify-center hover:bg-[#1ebe58] transition-colors group"
      >
        {/* Pulsing ring for a bit of attention */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-ping" style={{ animationDuration: '2.2s' }} />
        <WhatsappLogo size={26} weight="fill" className="relative z-10" />
      </motion.a>
    </AnimatePresence>
  );
}
