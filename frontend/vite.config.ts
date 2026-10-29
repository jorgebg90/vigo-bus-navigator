import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');
  const base = env.VITE_BASE_PATH || '/';
  const docsPage = resolve(__dirname, 'public/docs/openapi/index.html');
  const docsPageUrl = `${base}docs/openapi/`;
  const docsPageRevision = existsSync(docsPage)
    ? createHash('sha256').update(readFileSync(docsPage)).digest('hex')
    : undefined;
  if (mode !== 'development' && !docsPageRevision) {
    throw new Error('Generated OpenAPI documentation is missing; run npm run build to validate and generate it first.');
  }
  const basePrefix = base === '/' ? '' : base.replace(/\/+$/, '');
  const documentationPath = `${basePrefix}/docs/openapi`;
  const docsNavigationDenylist = new RegExp(
    `^${documentationPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/|$)`
  );

  return {
    root: resolve(__dirname),
    base,
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
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [docsNavigationDenylist],
          additionalManifestEntries: docsPageRevision
            ? [{ url: docsPageUrl, revision: docsPageRevision }]
            : [],
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  };
});
