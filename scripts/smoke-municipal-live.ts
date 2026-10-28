import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { buildMunicipalRequest, type MunicipalAction } from '../frontend/src/infrastructure/municipal/request-builder';
import { decodeMunicipalBytes } from '../frontend/src/infrastructure/municipal/response-decoder';

const maximumRequests = 20;
const minimumIntervalMs = 1000;
const requestTimeoutMs = 5000;
const maximumResponseBytes = 262144;

const smokeCases: ReadonlyArray<{
  action: MunicipalAction;
  parameters: Readonly<Record<string, string>>;
  expectedRoot: 'array' | 'object';
}> = [
  { action: 'TRANSPORTE_LINEAS_ES', parameters: {}, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEAS_GA', parameters: {}, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEAS_SERVICIOS_ES', parameters: {}, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEAS_SERVICIOS_GA', parameters: {}, expectedRoot: 'array' },
  { action: 'TRANSPORTE_PARADA_ID', parameters: { id: '90' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEAS_PARADA', parameters: { id: '2789' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE-ESTIMACION-PARADA', parameters: { id: '90' }, expectedRoot: 'object' },
  { action: 'TRANSPORTE_LINEA_HORARIOS_EXTEND', parameters: { id: 'A', dia: '1' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEA_HORARIOS_EXTEND', parameters: { id: 'A', dia: '6' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEA_HORARIOS_EXTEND', parameters: { id: 'A', dia: '0' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEA_GEOJSON', parameters: { id: 'Route_1005' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_PARADAS_TRIP', parameters: { id: 'A  02LP000_008002_4' }, expectedRoot: 'array' },
  { action: 'TRANSPORTE_LINEA_INFO_PARADA', parameters: { stop_id: '2789', linea: 'A' }, expectedRoot: 'array' }
];

interface BrowserFetchResult {
  status: number;
  contentType: string | null;
  bytes: number[];
  durationMs: number;
}

if (!process.argv.includes('--confirm-live')) {
  throw new Error('Live requests are opt-in. Re-run with --confirm-live to issue the documented read-only samples.');
}
if (smokeCases.length > maximumRequests) {
  throw new Error(`Smoke plan exceeds the ${maximumRequests}-request cap`);
}

const originServer = createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html><head><title>Municipal live smoke</title></head><body></body></html>');
});

const origin = await new Promise<string>((resolve, reject) => {
  originServer.once('error', reject);
  originServer.listen(0, '127.0.0.1', () => {
    const address = originServer.address();
    if (!address || typeof address === 'string') {
      reject(new Error('Could not determine local smoke origin'));
      return;
    }
    resolve(`http://127.0.0.1:${address.port}/`);
  });
});

let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let failures = 0;
let lastStartedAt = 0;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(origin);

  console.log(JSON.stringify({
    kind: 'smoke-start',
    origin,
    startedAt: new Date().toISOString(),
    requestCount: smokeCases.length,
    rateLimitMs: minimumIntervalMs,
    timeoutMs: requestTimeoutMs,
    responseLimitBytes: maximumResponseBytes,
    credentials: 'omit',
    note: 'Read-only public sample GETs; this records browser/CORS and JSON root shape, not independent provider semantics or complete normalization.'
  }));

  for (const smokeCase of smokeCases) {
    const waitMs = minimumIntervalMs - (Date.now() - lastStartedAt);
    if (lastStartedAt > 0 && waitMs > 0) await delay(waitMs);
    const url = buildMunicipalRequest(smokeCase.action, smokeCase.parameters).toString();
    lastStartedAt = Date.now();

    try {
      const result = await page.evaluate(async ({ requestUrl, timeoutMs, byteLimit }): Promise<BrowserFetchResult> => {
        const controller = new AbortController();
        const startedAt = performance.now();
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(requestUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            redirect: 'error',
            referrerPolicy: 'no-referrer',
            signal: controller.signal
          });
          const reader = response.body?.getReader();
          if (!reader) throw new Error('response-body-unavailable');
          const chunks: Uint8Array[] = [];
          let byteCount = 0;
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            if (!part.value) continue;
            byteCount += part.value.byteLength;
            if (byteCount > byteLimit) {
              await reader.cancel();
              throw new Error('response-too-large');
            }
            chunks.push(part.value);
          }
          const bytes = new Uint8Array(byteCount);
          let offset = 0;
          for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return {
            status: response.status,
            contentType: response.headers.get('content-type'),
            bytes: Array.from(bytes),
            durationMs: Math.round(performance.now() - startedAt)
          };
        } finally {
          window.clearTimeout(timeout);
        }
      }, { requestUrl: url, timeoutMs: requestTimeoutMs, byteLimit: maximumResponseBytes });

      let parseResult = 'invalid';
      try {
        const text = decodeMunicipalBytes(Uint8Array.from(result.bytes), result.contentType);
        const parsed: unknown = JSON.parse(text);
        const root = Array.isArray(parsed) ? 'array' : typeof parsed === 'object' && parsed !== null ? 'object' : 'primitive';
        parseResult = root === smokeCase.expectedRoot ? `json-${root}-root` : `unexpected-${root}-root`;
      } catch {
        parseResult = 'decode-or-json-invalid';
      }

      const passed = result.status >= 200 && result.status < 300 && parseResult === `json-${smokeCase.expectedRoot}-root`;
      if (!passed) failures += 1;
      console.log(JSON.stringify({
        kind: 'smoke-result',
        at: new Date().toISOString(),
        action: smokeCase.action,
        parameters: smokeCase.parameters,
        requestUrl: url,
        corsFetch: 'completed',
        status: result.status,
        contentType: result.contentType,
        bytes: result.bytes.length,
        durationMs: result.durationMs,
        result: parseResult,
        passed
      }));
    } catch (error) {
      failures += 1;
      const reason = error instanceof Error ? error.message : 'unknown-error';
      const result = /response-too-large/i.test(reason)
        ? 'oversized'
        : /abort|timeout/i.test(reason)
          ? 'timeout'
          : /failed to fetch|cors/i.test(reason)
            ? 'cors-or-network-failed'
            : 'fetch-or-decode-failed';
      console.log(JSON.stringify({
        kind: 'smoke-result',
        at: new Date().toISOString(),
        action: smokeCase.action,
        parameters: smokeCase.parameters,
        requestUrl: url,
        corsFetch: result === 'cors-or-network-failed' ? 'failed' : 'not-confirmed',
        result,
        passed: false
      }));
    }
  }
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => {
    originServer.close((error) => error ? reject(error) : resolve());
  });
}

console.log(JSON.stringify({ kind: 'smoke-summary', total: smokeCases.length, failures }));
if (failures > 0) process.exitCode = 1;
