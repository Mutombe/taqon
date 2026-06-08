import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { registerSW } from './utils/serviceWorkerRegistration'

registerSW();

// Recover from stale chunk references after a deploy. A new build changes the
// hashed chunk filenames; a tab still running the old index.html will 404 when
// it lazy-loads a route (e.g. the Media tab). Reload once to pull the fresh
// index.html + current chunks. The 10s guard prevents a reload loop if a chunk
// is genuinely missing rather than just stale.
function recoverFromStaleChunk() {
  try {
    const last = Number(sessionStorage.getItem('chunk-reload-ts') || 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem('chunk-reload-ts', String(Date.now()));
  } catch { /* private mode — reload anyway */ }
  window.location.reload();
}
window.addEventListener('vite:preloadError', (e) => { e.preventDefault?.(); recoverFromStaleChunk(); });
window.addEventListener('error', (e) => {
  const msg = e?.message || '';
  if (/dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(msg)) {
    recoverFromStaleChunk();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
