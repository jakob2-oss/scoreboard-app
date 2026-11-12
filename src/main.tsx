import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appRepo } from './db';
import { createStore, setAppStore } from './store';
import { applyStoredTheme } from './useTheme';
import { registerSW } from 'virtual:pwa-register';
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
  onNeedRefresh() { updateSW(true); }
});
