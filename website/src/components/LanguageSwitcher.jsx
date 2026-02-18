import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'sn', label: 'Shona', flag: 'SN' },
  { code: 'nd', label: 'Ndebele', flag: 'ND' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = languages.find(l => l.code === locale) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 p-2.5 rounded-full transition-all duration-300 ${className}`}
        aria-label="Change language"
      >
        <Globe size={16} />
        <span className="text-xs font-semibold">{current.flag}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-taqon-charcoal rounded-xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-all flex items-center gap-2 ${
                  locale === lang.code
                    ? 'bg-taqon-orange/10 text-taqon-orange font-semibold'
                    : 'text-taqon-charcoal dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <span className="text-xs font-bold w-6">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
