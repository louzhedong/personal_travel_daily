import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Personal Travel Daily',
        short_name: 'Travel Daily',
        theme_color: '#f8f4ec',
        background_color: '#f8f4ec',
        display: 'standalone',
        start_url: '/',
      },
      workbox: {
        navigateFallback: '/',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/auth'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'travel-daily-api-get',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 },
            },
            method: 'GET',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api/guides': {
        target: 'http://127.0.0.1:8383',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
});
