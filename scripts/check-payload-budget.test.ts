import { describe, expect, it } from 'vitest';
import { assertPayloadBudget, firstMapGraphFiles, MAX_CSS_GZIP_BYTES, MAX_FIRST_MAP_GZIP_BYTES, MAX_JS_GZIP_BYTES, type ViteManifest } from './check-payload-budget';

describe('first-map-ready graph', () => {
  const manifest: ViteManifest = {
    'index.html': { file: 'assets/index-a.js', isEntry: true, imports: ['_shared.js'], dynamicImports: ['map.ts', 'lines.ts'], css: ['assets/index-a.css'] },
    '_shared.js': { file: 'assets/shared-b.js', css: ['assets/shared-b.css'] },
    'map.ts': { file: 'assets/maplibre-c.js', name: 'maplibre', imports: ['_shared.js'] },
    'deck.ts': { file: 'assets/deck-d.js', name: 'deck' },
    'lines.ts': { file: 'assets/lines-e.js', name: 'lines' }
  };

  it('includes the entry, its static imports, the map chunk, and CSS once each', () => {
    const files = firstMapGraphFiles(manifest);
    expect([...files.js].sort()).toEqual(['assets/index-a.js', 'assets/maplibre-c.js', 'assets/shared-b.js']);
    expect([...files.css].sort()).toEqual(['assets/index-a.css', 'assets/shared-b.css']);
  });

  it('counts deck.gl only while the entry still loads it', () => {
    const withDeck: ViteManifest = { ...manifest, 'index.html': { ...manifest['index.html'], dynamicImports: ['map.ts', 'deck.ts'] } };
    expect(firstMapGraphFiles(withDeck).js.has('assets/deck-d.js')).toBe(true);
    expect(firstMapGraphFiles(manifest).js.has('assets/deck-d.js')).toBe(false);
  });

  it('exposes the 500 KiB limit', () => {
    expect(MAX_FIRST_MAP_GZIP_BYTES).toBe(500 * 1024);
  });
});

describe('aggregate gzip payload budget', () => {
  it('accepts aggregate JavaScript and CSS exactly at their limits', () => {
    expect(() => assertPayloadBudget(MAX_JS_GZIP_BYTES, MAX_CSS_GZIP_BYTES)).not.toThrow();
  });

  it('rejects aggregate JavaScript or CSS one byte over budget', () => {
    expect(() => assertPayloadBudget(MAX_JS_GZIP_BYTES + 1, MAX_CSS_GZIP_BYTES)).toThrow(/JavaScript/);
    expect(() => assertPayloadBudget(MAX_JS_GZIP_BYTES, MAX_CSS_GZIP_BYTES + 1)).toThrow(/CSS/);
  });

  it('keeps the existing per-file size-limit caps', async () => {
    const config = await import('node:fs/promises').then(({ readFile }) =>
      readFile(new URL('../.size-limit.json', import.meta.url), 'utf8')
    ).then((text) => JSON.parse(text) as Array<{ path: string; limit: string }>);

    expect(config).toEqual([
      { path: 'dist/assets/index-*.js', limit: '150 KB' },
      { path: 'dist/assets/maplibre-*.js', limit: '350 KB' },
      { path: 'dist/assets/index-*.css', limit: '150 KB' }
    ]);
  });
});