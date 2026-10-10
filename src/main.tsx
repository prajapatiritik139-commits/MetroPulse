import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for offline-first capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // SW active
      })
      .catch((err) => {
        console.warn('[PWA] Service worker register failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
