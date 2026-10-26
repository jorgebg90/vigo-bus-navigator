import { describe, expect, it } from 'vitest';
import { assertPayloadBudget, MAX_CSS_GZIP_BYTES, MAX_JS_GZIP_BYTES } from './check-payload-budget';

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
      { path: 'dist/assets/deck-*.js', limit: '350 KB' },
      { path: 'dist/assets/index-*.css', limit: '150 KB' }
    ]);
  });
});