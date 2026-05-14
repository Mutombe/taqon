import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShareNetwork, LinkSimple, WhatsappLogo, EnvelopeSimple, Check, X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

/**
 * Floating share button — sits in the bottom-right stack, above the
 * WhatsApp bubble. Tapping it opens a small sheet with copy-link,
 * WhatsApp and email options. On devices that support the native
 * Web Share API the primary tap shares directly instead.
 */
export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Close the sheet on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pageUrl = () => window.location.href;
  const pageTitle = () => document.title || 'Taqon Electrico';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link — please try again');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${pageTitle()} — ${pageUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(pageTitle());
    const body = encodeURIComponent(
      `I thought you'd find this useful:\n\n${pageUrl()}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setOpen(false);
  };

  const handlePrimary = async () => {
    // Prefer the native share sheet on supported devices (mostly mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: pageTitle(), url: pageUrl() });
        return;
      } catch {
        // user cancelled or share failed — fall back to the sheet
      }
    }
    setOpen((v) => !v);
  };

  const options = [
    {
      key: 'copy',
      label: copied ? 'Copied!' : 'Copy link',
      icon: copied
        ? <Check size={18} weight="bold" className="text-taqon-orange" />
        : <LinkSimple size={18} />,
      onClick: handleCopy,
    },
    {
      key: 'whatsapp',
      label: 'Share on WhatsApp',
      icon: <WhatsappLogo size={18} weight="fill" className="text-[#25D366]" />,
      onClick: handleWhatsApp,
    },
    {
      key: 'email',
      label: 'Share via email',
      icon: <EnvelopeSimple size={18} />,
      onClick: handleEmail,
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="share-sheet"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[60] w-[230px] rounded-2xl overflow-hidden
              bg-white dark:bg-taqon-charcoal
              border border-gray-100 dark:border-white/10
              shadow-[0_12px_40px_rgba(0,0,0,0.18)]
              bottom-[170px] right-[20px] md:bottom-[200px] md:right-[24px]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm font-semibold text-taqon-dark dark:text-white">
                Share this page
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close share menu"
                className="text-gray-400 hover:text-taqon-dark dark:hover:text-white transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={opt.onClick}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm
                  text-taqon-dark dark:text-white/90
                  hover:bg-taqon-cream dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex-shrink-0">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={buttonRef}
        onClick={handlePrimary}
        aria-label="Share this page"
        aria-expanded={open}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2, scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="fixed z-[60] w-[56px] h-[56px] rounded-full
          bg-taqon-orange text-white
          shadow-[0_4px_12px_rgba(0,0,0,0.15)]
          flex items-center justify-center
          hover:brightness-110 transition-[filter]
          bottom-[170px] right-[20px] md:bottom-[200px] md:right-[24px]"
      >
        <ShareNetwork size={26} weight="fill" />
      </motion.button>
    </>
  );
}
