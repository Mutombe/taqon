import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../data/translations/en';
import sn from '../data/translations/sn';
import nd from '../data/translations/nd';

const translations = { en, sn, nd };
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('taqon-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('taqon-lang', locale);
    document.documentElement.lang = locale === 'sn' ? 'sn' : locale === 'nd' ? 'nd' : 'en';
  }, [locale]);

  const t = useCallback((key) => {
    return translations[locale]?.[key] || translations.en[key] || key;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
