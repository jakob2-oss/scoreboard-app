import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appRepo } from './db';
import { createStore, setAppStore } from './store';
import { applyStoredTheme } from './useTheme';
import { registerSW } from 'virtual:pwa-register';
// Schrift Jost liegt in der App (kein Google Fonts: offline und ohne Verbindung zu Dritten)
import '@fontsource/jost/latin-400.css';
import '@fontsource/jost/latin-500.css';
import '@fontsource/jost/latin-600.css';
import '@fontsource/jost/latin-700.css';
import './styles/tokens.css';
import './styles/proto.css';
import './styles/app.css';

applyStoredTheme();
setAppStore(createStore(appRepo()));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Dauerhafter Speicher: das iPhone soll die Spieldaten nicht bei Speichermangel löschen
navigator.storage?.persist?.().catch(() => undefined);

// Updates: Die App vom Homescreen startet auf dem iPhone oft nicht neu, sondern wird nur wieder angezeigt.
// Deshalb beim Zurückkehren und alle 30 Minuten nach einer neuen Version fragen; sie lädt sich dann selbst.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) reg.update().catch(() => undefined); };
    setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  },
  onNeedRefresh() {
    // Wer gerade in einer Partie ist, landet nach dem Update wieder dort
    try { if (sessionStorage.getItem('pz:screen') === 'game') sessionStorage.setItem('pz:resumeGame', '1'); } catch { /* egal */ }
    updateSW(true);
  }
});
