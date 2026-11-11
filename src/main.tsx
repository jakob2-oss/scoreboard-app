import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { appRepo } from './db';
import { createStore, setAppStore } from './store';
import { applyStoredTheme } from './useTheme';
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
