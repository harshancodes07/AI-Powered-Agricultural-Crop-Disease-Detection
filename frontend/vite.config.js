import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enables testing the offline behaviour with `npm run dev`.
      devOptions: { enabled: true },
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Crop Disease Detection',
        short_name: 'CropCare',
        description:
          'Detect crop diseases from a photo and get verified treatment advice in your language.',
        theme_color: '#15803d',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Without these, a new deploy's service worker installs but sits
        // "waiting" until every open tab of the old version is closed —
        // registerType: 'autoUpdate' alone does not skip that. In practice
        // that meant a tab left open across a deploy could keep running old,
        // possibly-broken JS indefinitely. skipWaiting + clientsClaim make a
        // new deploy take over on the very next load instead.
        skipWaiting: true,
        clientsClaim: true,
        // Cache the app shell so the app opens with no connection at all.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Map tiles: show previously-viewed areas offline.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // Uploaded crop images, so history screens work offline.
            urlPattern: /\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'crop-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // The frontend calls /api/* and /uploads/* on its own origin; Vite
      // forwards them to FastAPI. Keeps the API base URL out of the code.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true }
    }
  }
})
