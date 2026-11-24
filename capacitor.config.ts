import type { CapacitorConfig } from '@capacitor/cli';

/** iPhone-App: dieselbe Web-App, gebaut mit `npm run build:app` (ohne Service Worker, relative Pfade) */
const config: CapacitorConfig = {
  appId: 'de.oinano.app',
  appName: 'Oina no?',
  webDir: 'dist-app',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f3f0ea',
    // Zurück-Wischen übernimmt die App selbst (src/lib/backnav.ts)
    allowsLinkPreview: false
  }
};

export default config;
