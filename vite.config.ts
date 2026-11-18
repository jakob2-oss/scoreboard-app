import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages liefert die App unter /scoreboard-app/ aus. Die iPhone-App (`--mode app`) lädt aus dem App-Paket:
// relative Pfade, kein Service Worker, eigener Ausgabeordner für Capacitor.

import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
  const app = mode === 'app', base = app ? './' : '/scoreboard-app/';
  return {
  base,
  build: { outDir: app ? 'dist-app' : 'dist' },
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      disable: app,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Oina no?',
        short_name: 'Oina no?',
        description: 'Punkte, Leben und Deckel zählen für Spieleabende',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3f0ea',
        theme_color: '#f3f0ea',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ],
  test: { environment: 'node' }
  };
});
