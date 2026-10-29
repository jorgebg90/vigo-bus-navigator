import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, sep } from 'node:path';

const distRoot = resolve('dist');
const basePath = process.env.VITE_BASE_PATH || '/';
const basePrefix = basePath === '/' ? '' : `/${basePath.split('/').filter(Boolean).join('/')}`;
const port = Number(process.env.PORT ?? 4173);
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2'
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('Invalid URL path');
    return;
  }
  if (basePrefix && pathname !== basePrefix && !pathname.startsWith(`${basePrefix}/`)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relativePath = basePrefix ? pathname.slice(basePrefix.length) : pathname;
  const requestedPath = relativePath === '/' ? '/index.html' : relativePath;
  const resolvedPath = resolve(distRoot, `.${requestedPath}`);
  if (resolvedPath !== distRoot && !resolvedPath.startsWith(`${distRoot}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  let filePath = resolvedPath;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html');
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error('Requested path is not a file');
    response.writeHead(200, {
      'Cache-Control': 'no-cache',
      'Content-Length': file.size,
      'Content-Type': contentTypes[filePath.slice(filePath.lastIndexOf('.'))] ?? 'application/octet-stream'
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static test preview listening on http://127.0.0.1:${port}${basePath}`);
});
