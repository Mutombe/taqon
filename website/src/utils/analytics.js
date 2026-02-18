export function trackEvent(category, action, label) {
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${category} / ${action} / ${label}`);
  }
  if (window.plausible) {
    window.plausible(action, { props: { category, label } });
  }
}

export function trackConversion(type, value) {
  trackEvent('Conversion', type, value);
}
