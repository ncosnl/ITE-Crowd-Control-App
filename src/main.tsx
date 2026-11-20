import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initInstallPrompt } from './install';
import './styles.css';

initInstallPrompt();

// The native shell has no server to serve sw.js and no navigations to cache.
if (import.meta.env.PROD && !import.meta.env.VITE_NATIVE && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.warn('Service worker registration failed:', error));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
