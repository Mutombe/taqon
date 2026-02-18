import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Page view: ${location.pathname}`);
    }
    // Forward to Plausible if loaded
    if (window.plausible) {
      window.plausible('pageview');
    }
  }, [location.pathname]);

  const trackEvent = useCallback((category, action, label) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Event: ${category} / ${action} / ${label}`);
    }
    if (window.plausible) {
      window.plausible(action, { props: { category, label } });
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
}
