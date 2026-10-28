import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_JS_GZIP_BYTES = 850 * 1024;
export const MAX_CSS_GZIP_BYTES = 150 * 1024;
export const MAX_FIRST_MAP_GZIP_BYTES = 500 * 1024;

export interface ManifestChunk {
  file: string;
  name?: string;
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}
export type ViteManifest = Record<string, ManifestChunk>;

// Map renderers loaded dynamically by the entry count toward first-map readiness.
const MAP_CHUNK_NAMES = new Set(['maplibre', 'deck']);

export function firstMapGraphFiles(manifest: ViteManifest): { js: Set<string>; css: Set<string> } {
  const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
  if (!entryKey) throw new Error('Vite manifest has no entry chunk');
  const js = new Set<string>();
  const css = new Set<string>();
  const seen = new Set<string>();
  const visit = (key: string): void => {
    if (seen.has(key) || !manifest[key]) return;
    seen.add(key);
    const chunk = manifest[key];
    js.add(chunk.file);
    chunk.css?.forEach((file) => css.add(file));
    chunk.imports?.forEach(visit);
  };
  visit(entryKey);
  for (const key of manifest[entryKey].dynamicImports ?? []) {
    if (MAP_CHUNK_NAMES.has(manifest[key]?.name ?? '')) visit(key);
  }
  return { js, css };
}

export async function checkFirstMapGraph(distDir = resolve(process.cwd(), 'dist')): Promise<number> {
  const manifest = JSON.parse(await readFile(resolve(distDir, '.vite/manifest.json'), 'utf8')) as ViteManifest;
  const files = firstMapGraphFiles(manifest);
  const sizes = await Promise.all([...files.js, ...files.css].map(async (file) => gzipSync(await readFile(resolve(distDir, file))).byteLength));
  return sizes.reduce((sum, size) => sum + size, 0);
}

export function assertPayloadBudget(javascriptBytes: number, cssBytes: number): void {
  if (javascriptBytes > MAX_JS_GZIP_BYTES) {
    throw new Error(`Aggregate JavaScript gzip size ${javascriptBytes} exceeds ${MAX_JS_GZIP_BYTES} bytes`);
  }
  if (cssBytes > MAX_CSS_GZIP_BYTES) {
    throw new Error(`Aggregate CSS gzip size ${cssBytes} exceeds ${MAX_CSS_GZIP_BYTES} bytes`);
  }
}

export async function checkPayloadBudget(assetsDir = resolve(process.cwd(), 'dist/assets')): Promise<{
  javascriptBytes: number;
  cssBytes: number;
}> {
  const files = await readdir(assetsDir, { withFileTypes: true });
  const assets = files.filter((file) => file.isFile());
  const javascript = assets.filter((file) => file.name.endsWith('.js'));
  const stylesheets = assets.filter((file) => file.name.endsWith('.css'));
  if (javascript.length === 0 || stylesheets.length === 0) {
    throw new Error(`No built JavaScript or CSS assets found in ${assetsDir}; run npm run build first`);
  }

  const [javascriptSizes, cssSizes] = await Promise.all([
    Promise.all(javascript.map(async (file) => gzipSync(await readFile(resolve(assetsDir, file.name))).byteLength)),
    Promise.all(stylesheets.map(async (file) => gzipSync(await readFile(resolve(assetsDir, file.name))).byteLength))
  ]);
  const javascriptBytes = javascriptSizes.reduce((total, size) => total + size, 0);
  const cssBytes = cssSizes.reduce((total, size) => total + size, 0);
  assertPayloadBudget(javascriptBytes, cssBytes);
  return { javascriptBytes, cssBytes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const sizes = await checkPayloadBudget();
    console.info(`Aggregate gzip payload: JavaScript ${(sizes.javascriptBytes / 1024).toFixed(1)} KiB; CSS ${(sizes.cssBytes / 1024).toFixed(1)} KiB`);
    const firstMap = await checkFirstMapGraph();
    console.info(`First-map-ready gzip graph: ${(firstMap / 1024).toFixed(1)} KiB (limit ${MAX_FIRST_MAP_GZIP_BYTES / 1024} KiB)`);
    // Baseline recording mode (T001): report without failing; enforcement starts at T042.
    if (firstMap > MAX_FIRST_MAP_GZIP_BYTES && process.env.ENFORCE_FIRST_MAP_BUDGET === '1') {
      throw new Error(`First-map-ready gzip graph ${firstMap} exceeds ${MAX_FIRST_MAP_GZIP_BYTES} bytes`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Payload budget check failed');
    process.exitCode = 1;
  }
}
