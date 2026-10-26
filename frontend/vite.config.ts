import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProduction = process.env.NODE_ENV === 'production';
const apiOrigin = process.env.VITE_ARRIVALS_BASE_URL ?? 'http://localhost:8787';
const escapedApiOrigin = apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apiCatalogPattern = new RegExp(`^${escapedApiOrigin}/(?:lines(?:/[^/]+)?|stops)$`);

export default defineConfig(({ mode }) => ({
  root: resolve(__dirname),
  base: mode === 'production' ? '/vigo-bus-navigator/' : '/',
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre';
          if (id.includes('@deck.gl') || id.includes('luma.gl')) return 'deck';
          return undefined;
        }
      }
    }
  },
  define: {
    __PROFILE__: JSON.stringify(mode)
  },
  plugins: [
    VitePWA({
      disable: mode === 'local',
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        navigateFallback: `${mode === 'production' ? '/vigo-bus-navigator/' : '/'}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: apiCatalogPattern,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'vbn-api-catalog',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 120, maxAgeSeconds: 86400 }
          }
        }]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
}));
