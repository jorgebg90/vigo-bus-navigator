import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  root: resolve(__dirname),
  base: mode === 'production' ? '/vigo-bus-navigator/' : '/',
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre';
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
}));
