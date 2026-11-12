import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Versi baru tidak langsung dipasang; user diberi tahu dan memilih kapan memuat ulang
      registerType: 'prompt',
      manifest: {
        name: 'Simuku – Catatan Keuangan',
        short_name: 'Simuku',
        description: 'Catat transaksi, hutang, split bill, tabungan, dan tagihan rutin.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#047857',
        background_color: '#f8fafc',
        categories: ['finance', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Semua file aplikasi disimpan di HP supaya tetap bisa dibuka tanpa internet
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // Penampil notifikasi pengingat tagihan (public/push-sw.js)
        importScripts: ['push-sw.js'],
        // Jangan sajikan index.html untuk /api (fungsi server di Vercel)
        navigateFallbackDenylist: [/^\/api\//],
        // Langsung kendalikan halaman sejak kunjungan pertama, supaya tombol "Muat ulang"
        // tetap berfungsi walau versi baru muncul di sesi pertama
        clientsClaim: true,
        runtimeCaching: [
          {
            // Font Google: simpan setelah pertama kali diunduh
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
