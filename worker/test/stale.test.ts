import { describe, expect, it, beforeEach, vi } from 'vitest';
import { handleRequest } from '../src';
import { MemoryCache, STALE_BOUND_SECONDS, ageSeconds } from '../src/cache';
import { fixtureVitrasaFetcher } from '../src/fixtures';
import type { WorkerEnv } from '../src/env';

const base: WorkerEnv = { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'true' };
const NOW = new Date('2026-10-25T18:29:45Z');

async function primeCache(cache: MemoryCache, stopId = '1234', storedAt = '2026-10-25T18:29:00Z'): Promise<void> {
  await cache.putLastKnown(stopId, {
    storedAt,
    response: { stopId, generatedAt: storedAt, dataStatus: 'current', arrivals: [{ lineCode: 'L4A', destination: 'Bouzas', minutes: 4, eta: '2026-10-25T18:33:00.000Z' }] }
  });
}

function privateStateFetcher(stopId: string, fault?: string): ReturnType<typeof fixtureVitrasaFetcher> {
  const fixture = fixtureVitrasaFetcher(stopId, fault);
  return async (input, init = {}) => {
    const response = await fixture(input, init);
    if (!response.ok) return response;
    const pageNumber = init.method === 'POST'
      ? Number(new URLSearchParams(String(init.body)).get('__EVENTARGUMENT')?.replace('Page$', ''))
      : 1;
    const html = await response.text();
    return new Response(html
      .replace(`value="view-${pageNumber}"`, `value="private-view-state-${pageNumber}"`)
      .replace(`value="event-${pageNumber}"`, `value="private-event-state-${pageNumber}"`), {
      status: response.status,
      headers: { 'set-cookie': `ASP.NET_SessionId=secret-cookie-${pageNumber}; Path=/` }
    });
  };
}

describe('stale-on-failure behavior', () => {
  let cache: MemoryCache;
  beforeEach(() => { cache = new MemoryCache(); });

  it('serves the last-known result as stale with no-store and Age on upstream failure', async () => {
    await primeCache(cache);
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), { ...base, UPSTREAM_FIXTURE_FAULT: 'error' }, cache, undefined, NOW);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.dataStatus).toBe('stale');
    expect(body.generatedAt).toBe('2026-10-25T18:29:00Z');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(Number(res.headers.get('age'))).toBe(45);
    expect(res.headers.get('age')).toBeTruthy();
    expect(Number(res.headers.get('age'))).toBeLessThan(STALE_BOUND_SECONDS);
  });

  it('answers 503 STALE_UNAVAILABLE on network-level failure without last-known', async () => {
    const res = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { ...base, UPSTREAM_FIXTURES: 'false' },
      cache,
      async () => { throw new Error('socket hangup'); },
      NOW
    );
    expect(res.status).toBe(503);
    expect((await res.json() as { error: { code: string } }).error.code).toBe('STALE_UNAVAILABLE');
  });

  it('answers 502 UPSTREAM_ERROR on upstream non-200 without last-known', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), { ...base, UPSTREAM_FIXTURE_FAULT: 'error' }, cache, undefined, NOW);
    expect(res.status).toBe(502);
    expect((await res.json() as { error: { code: string } }).error.code).toBe('UPSTREAM_ERROR');
  });

  it('answers 429 RATE_LIMITED on upstream rate limit without last-known', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), { ...base, UPSTREAM_FIXTURE_FAULT: '429' }, cache, undefined, NOW);
    expect(res.status).toBe(429);
    expect((await res.json() as { error: { code: string } }).error.code).toBe('RATE_LIMITED');
  });

  it('answers 504 UPSTREAM_TIMEOUT on upstream timeout without last-known', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), { ...base, UPSTREAM_FIXTURE_FAULT: 'timeout' }, cache, undefined, NOW);
    expect(res.status).toBe(504);
    expect((await res.json() as { error: { code: string } }).error.code).toBe('UPSTREAM_TIMEOUT');
  });

  it('never serves a last-known result older than the staleness bound', async () => {
    const old = '2026-10-25T18:24:00Z';
    expect(ageSeconds(old, NOW)).toBeGreaterThan(STALE_BOUND_SECONDS);
    await primeCache(cache, '1234', old);
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), { ...base, UPSTREAM_FIXTURE_FAULT: 'error' }, cache, undefined, NOW);
    expect(res.status).toBe(502);
  });

  it('populates both fresh and last-known entries on success', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), base, cache, undefined, NOW);
    expect(res.status).toBe(200);
    expect(await cache.getFresh('1234', NOW)).toBeTruthy();
    expect(await cache.getLastKnown('1234', NOW)).toBeTruthy();
  });

  it('serves fresh data at age 29 seconds and revalidates at exactly 30 seconds', async () => {
    const beforeBoundary = new Date(NOW.getTime() - 29_000).toISOString();
    await cache.putFresh('1234', {
      storedAt: beforeBoundary,
      response: { stopId: '1234', generatedAt: beforeBoundary, dataStatus: 'current', arrivals: [] }
    });
    let calls = 0;
    const fetcher = async (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
      calls += 1;
      return fixtureVitrasaFetcher('1234')(input, init);
    };

    const liveEnv = { ...base, UPSTREAM_FIXTURES: 'false' };
    const fresh = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), liveEnv, cache, fetcher, NOW);
    expect(fresh.headers.get('x-edge-stored-at')).toBe(beforeBoundary);
    expect(calls).toBe(0);

    const atBoundary = new Date(NOW.getTime() - 30_000).toISOString();
    await cache.putFresh('1234', {
      storedAt: atBoundary,
      response: { stopId: '1234', generatedAt: atBoundary, dataStatus: 'current', arrivals: [] }
    });
    const revalidated = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), liveEnv, cache, fetcher, NOW);
    expect(revalidated.headers.get('x-edge-stored-at')).toBe(NOW.toISOString());
    expect(calls).toBe(1);
  });

  it('serves last-known at age 299 seconds but rejects it at exactly 300 seconds', async () => {
    const atAge30 = new Date(NOW.getTime() - 30_000).toISOString();
    await primeCache(cache, '1234', atAge30);
    const staleAt30 = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { ...base, UPSTREAM_FIXTURE_FAULT: 'error' },
      cache,
      undefined,
      NOW
    );
    expect(staleAt30.status).toBe(200);
    expect(staleAt30.headers.get('age')).toBe('30');
    expect((await staleAt30.json() as { dataStatus: string }).dataStatus).toBe('stale');

    const atAge299 = new Date(NOW.getTime() - 299_000).toISOString();
    await primeCache(cache, '1234', atAge299);
    const stale = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { ...base, UPSTREAM_FIXTURE_FAULT: 'error' },
      cache,
      undefined,
      NOW
    );
    expect(stale.status).toBe(200);
    expect(stale.headers.get('age')).toBe('299');
    expect((await stale.json() as { dataStatus: string }).dataStatus).toBe('stale');

    const atAge300 = new Date(NOW.getTime() - 300_000).toISOString();
    await primeCache(cache, '1234', atAge300);
    const expired = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { ...base, UPSTREAM_FIXTURE_FAULT: 'error' },
      cache,
      undefined,
      NOW
    );
    expect(expired.status).toBe(502);
  });

  it('discards first-page rows and writes no cache entry when a later page fails', async () => {
    let calls = 0;
    const fixture = privateStateFetcher('2790', 'later-page');
    const fetcher: typeof fixture = async (input, init) => {
      calls += 1;
      return fixture(input, init);
    };
    const response = await handleRequest(
      new Request('https://worker.test/stops/2790/arrivals'),
      { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'false' } as unknown as WorkerEnv,
      cache,
      fetcher,
      NOW
    );

    expect(response.status).toBe(502);
    expect((await response.json() as { dataStatus?: string }).dataStatus).toBeUndefined();
    expect(await cache.getFresh('2790', NOW)).toBeUndefined();
    expect(await cache.getLastKnown('2790', NOW)).toBeUndefined();
    expect(calls).toBe(2);
  });

  it('returns only the prior complete result as stale and never leaks WebForms state', async () => {
    await primeCache(cache, '2790');
    const logs = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')];
    let calls = 0;
    const fixture = privateStateFetcher('2790', 'later-page');
    const fetcher: typeof fixture = async (input, init) => {
      calls += 1;
      return fixture(input, init);
    };
    const response = await handleRequest(
      new Request('https://worker.test/stops/2790/arrivals'),
      { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'false' } as unknown as WorkerEnv,
      cache,
      fetcher,
      NOW
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toMatchObject({ dataStatus: 'stale', generatedAt: '2026-10-25T18:29:00Z' });
    expect(text).not.toContain('__VIEWSTATE');
    expect(text).not.toContain('private-view-state');
    expect(text).not.toContain('secret-cookie');
    expect(response.headers.has('set-cookie')).toBe(false);
    expect(logs.every((log) => !log.mock.calls.length)).toBe(true);
    expect(await cache.getFresh('2790', NOW)).toBeUndefined();
    expect((await cache.getLastKnown('2790', NOW))?.storedAt).toBe('2026-10-25T18:29:00Z');
    expect(calls).toBe(2);
    logs.forEach((log) => log.mockRestore());
  });

  it('stores only normalized arrivals after a successful paginated response', async () => {
    let calls = 0;
    const logs = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error')
    ];
    const fixture = privateStateFetcher('2790');
    const fetcher: typeof fixture = async (input, init) => {
      calls += 1;
      return fixture(input, init);
    };
    const response = await handleRequest(
      new Request('https://worker.test/stops/2790/arrivals'),
      { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'false' } as unknown as WorkerEnv,
      cache,
      fetcher,
      NOW
    );
    const body = await response.text();
    const fresh = await cache.getFresh('2790', NOW);
    const lastKnown = await cache.getLastKnown('2790', NOW);

    expect(response.status, body).toBe(200);
    expect(body).toContain('HOSPITAL MEIXOEIRO');
    expect(body).not.toContain('__VIEWSTATE');
    expect(body).not.toContain('private-view-state');
    expect(body).not.toContain('private-event-state');
    expect(body).not.toContain('secret-cookie');
    expect(response.headers.has('set-cookie')).toBe(false);
    expect(JSON.stringify(fresh)).not.toMatch(/VIEWSTATE|EVENTVALIDATION|private-|secret-cookie/);
    expect(JSON.stringify(lastKnown)).not.toMatch(/VIEWSTATE|EVENTVALIDATION|private-|secret-cookie/);
    expect(logs.every((log) => !log.mock.calls.length)).toBe(true);
    expect(calls).toBe(3);
    logs.forEach((log) => log.mockRestore());
  });
});
