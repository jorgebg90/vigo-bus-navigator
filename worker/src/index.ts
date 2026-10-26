import { EdgeCache, ageSeconds, type CachePort, type StoredResult } from './cache';
import { catalogMetadata, getLineByCode, listLines, listStops, scheduleMetadata } from './catalog';
import type { WorkerEnv } from './env';
import { fixtureVitrasaFetcher } from './fixtures';
import { normalizeSourceRows, StopNotExistError } from './normalize';
import { fetchVitrasaArrivals, UpstreamError, UpstreamNetworkError, UpstreamRateLimitError, UpstreamTimeoutError, type Fetcher } from './upstream';
import type { ArrivalsResponse, ErrorCode } from './types';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type'
} as const;

const STOP_ID_PATTERN = /^\d{1,6}$/;
const DEPLOYMENT_PROFILES = new Set(['local', 'development', 'preview', 'production']);

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...CORS, ...headers } });
}

function error(code: ErrorCode, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

function staleResponse(stored: StoredResult, now: Date): Response {
  const stale: ArrivalsResponse = { ...stored.response, dataStatus: 'stale' };
  return json(stale, 200, {
    'cache-control': 'no-store',
    age: String(Math.floor(ageSeconds(stored.storedAt, now))),
    'x-edge-stored-at': stored.storedAt
  });
}

export async function handleRequest(
  request: Request,
  env: WorkerEnv,
  cache?: CachePort,
  fetcher?: Fetcher,
  now: Date = new Date()
): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const lineMatch = url.pathname.match(/^\/lines\/([^/]+)$/);
  const stopArrivalsMatch = url.pathname.match(/^\/stops\/([^/]+)\/arrivals$/);
  const knownPath = url.pathname === '/health' || url.pathname === '/lines'
    || lineMatch !== null || stopArrivalsMatch !== null || url.pathname === '/stops';
  if (!knownPath) return error('NOT_FOUND', 'Unknown path', 404);
  if (request.method !== 'GET') return error('METHOD_NOT_ALLOWED', 'Only GET is supported', 405);

  if (url.pathname === '/health') return json({ status: 'ok' }, 200);
  if (url.pathname === '/lines') {
    return json({ ...catalogMetadata, scheduleMetadata, lines: listLines() }, 200, { 'cache-control': 'public, max-age=86400' });
  }
  if (lineMatch) {
    const lineCode = lineMatch[1];
    const line = getLineByCode(lineCode);
    return line
      ? json(line, 200, { 'cache-control': 'public, max-age=86400' })
      : error('NOT_FOUND', 'Unknown line', 404);
  }
  if (url.pathname === '/stops') {
    return json({ ...catalogMetadata, stops: listStops() }, 200, {
      'cache-control': 'public, max-age=86400'
    });
  }

  const stopId = stopArrivalsMatch?.[1];
  if (!stopId || !STOP_ID_PATTERN.test(stopId)) {
    return error('VALIDATION_ERROR', 'stop_id must match ^\\d{1,6}$', 400);
  }
  if (url.searchParams.size > 0) {
    return error('VALIDATION_ERROR', 'Arrivals requests do not accept query parameters', 400);
  }

  if (!DEPLOYMENT_PROFILES.has(env.DEPLOYMENT_ENV)) {
    return error('UPSTREAM_ERROR', 'Worker deployment profile is missing or invalid', 503);
  }
  const isDevelopment = env.DEPLOYMENT_ENV === 'local' || env.DEPLOYMENT_ENV === 'development';
  if (env.UPSTREAM_FIXTURES !== undefined && !['true', 'false'].includes(env.UPSTREAM_FIXTURES)) {
    return error('UPSTREAM_ERROR', 'Worker fixture configuration is invalid', 503);
  }
  if (!isDevelopment && env.UPSTREAM_FIXTURES === 'true') {
    return error('UPSTREAM_ERROR', 'Fixture mode is not permitted in this deployment profile', 503);
  }
  const fixturesEnabled = isDevelopment && env.UPSTREAM_FIXTURES !== 'false';

  const store = cache ?? (typeof caches === 'undefined' ? undefined : new EdgeCache((caches as unknown as { default: Cache }).default));
  const fresh = await store?.getFresh(stopId, now);
  if (fresh) {
    return json(fresh.response, 200, {
      'cache-control': 'public, max-age=30',
      'x-edge-stored-at': fresh.storedAt
    });
  }

  try {
    const sourceFetcher = fixturesEnabled
      ? fixtureVitrasaFetcher(stopId, env.UPSTREAM_FIXTURE_FAULT)
      : fetcher;
    const sourceRows = await fetchVitrasaArrivals(stopId, sourceFetcher);
    const generatedAt = now.toISOString();
    const arrivals = normalizeSourceRows(sourceRows, generatedAt);
    const response: ArrivalsResponse = {
      stopId,
      generatedAt,
      dataStatus: arrivals.length > 0 ? 'current' : 'empty',
      arrivals
    };
    const storedAt = generatedAt;
    await store?.putFresh(stopId, { response, storedAt });
    await store?.putLastKnown(stopId, { response, storedAt });
    return json(response, 200, { 'cache-control': 'public, max-age=30', 'x-edge-stored-at': storedAt });
  } catch (failure) {
    if (failure instanceof StopNotExistError) {
      return error('STOP_NOT_EXIST', `Stop ${stopId} does not exist`, 404);
    }
    const lastKnown = await store?.getLastKnown(stopId, now);
    if (lastKnown) return staleResponse(lastKnown, now);
    if (failure instanceof UpstreamRateLimitError) {
      return error('RATE_LIMITED', 'Vitrasa arrivals source rate limit reached', 429);
    }
    if (failure instanceof UpstreamTimeoutError) {
      return error('UPSTREAM_TIMEOUT', 'Vitrasa arrivals source timed out', 504);
    }
    if (failure instanceof UpstreamNetworkError) {
      return error('STALE_UNAVAILABLE', 'No current or cached arrival data is available', 503);
    }
    if (failure instanceof UpstreamError) {
      return error('UPSTREAM_ERROR', 'Vitrasa arrivals source returned an error', 502);
    }
    return error('STALE_UNAVAILABLE', 'No current or cached arrival data is available', 503);
  }
}

export default { fetch: (request: Request, env: WorkerEnv) => handleRequest(request, env) };
