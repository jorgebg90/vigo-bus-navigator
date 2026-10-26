import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_JS_GZIP_BYTES = 850 * 1024;
export const MAX_CSS_GZIP_BYTES = 150 * 1024;

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
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Payload budget check failed');
    process.exitCode = 1;
  }
}
