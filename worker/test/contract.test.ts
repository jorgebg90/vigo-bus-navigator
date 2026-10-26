import { describe, expect, it, beforeEach } from 'vitest';
import { handleRequest } from '../src';
import { MemoryCache } from '../src/cache';
import type { WorkerEnv } from '../src/env';

const env: WorkerEnv = { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'true' };

describe('official catalog and arrivals worker contract v3 (fixture mode)', () => {
  let cache: MemoryCache;
  beforeEach(() => { cache = new MemoryCache(); });

  it('serves the official network catalog on the canonical resource paths', async () => {
    const linesResponse = await handleRequest(new Request('https://worker.test/lines'), env, cache);
    const lines = await linesResponse.json() as {
      datasetVersion: string;
      scheduleMetadata: { datasetVersion: string; holidays: string[] };
      lines: Array<{ code: string; name: string; stopCount: number; patternCount: number }>;
    };
    expect(linesResponse.status).toBe(200);
    expect(lines.datasetVersion).toContain('vigo-open-data-');
    expect(lines.scheduleMetadata.datasetVersion).toBe('fixture-2026.10');
    expect(lines.scheduleMetadata.holidays).toContain('2026-12-25');
    expect(lines.lines.length).toBeGreaterThan(40);
    expect(lines.lines.every((line) => line.name.length > 0 && Number.isInteger(line.stopCount) && line.stopCount >= 0)).toBe(true);
    expect(lines.lines.some((line) => line.code === '4A' && line.patternCount > 0)).toBe(true);
    expect(linesResponse.headers.get('cache-control')).toBe('public, max-age=86400');
    expect(linesResponse.headers.get('access-control-allow-origin')).toBe('*');

    const stopsResponse = await handleRequest(new Request('https://worker.test/stops'), env, cache);
    const stopsBody = await stopsResponse.json() as {
      datasetVersion: string;
      stops: Array<{ id: string; code: string; municipalCode: string | null; vitrasaId: string | null }>;
    };
    expect(stopsBody.datasetVersion).toBe(lines.datasetVersion);
    expect(stopsBody.stops.length).toBeGreaterThan(1000);
    expect(stopsBody.stops.every((stop) => stop.municipalCode && stop.vitrasaId)).toBe(true);
    expect(stopsBody.stops.some((stop) => stop.municipalCode !== stop.vitrasaId)).toBe(true);

    const lineResponse = await handleRequest(new Request('https://worker.test/lines/4A'), env, cache);
    const line = await lineResponse.json() as {
      code: string;
      timetable: { lineId: string; byDayType: { weekday: { stopIds: string[] } } };
      patterns: Array<{ stopIds: string[]; stops: Array<{ id: string; vitrasaId: string | null }> }>;
    };
    expect(lineResponse.status).toBe(200);
    expect(line.code).toBe('4A');
    expect(line.patterns.length).toBeGreaterThan(0);
    expect(line.patterns.every((pattern) => pattern.stopIds.length === pattern.stops.length)).toBe(true);
    expect(line.patterns.every((pattern) => pattern.stops.every((stop) => stop.vitrasaId !== null))).toBe(true);
    expect(line.timetable.lineId).toBe('line-4a');
    expect(line.timetable.byDayType.weekday.stopIds).toEqual(line.patterns[0].stopIds);
  });

  it('rejects unknown official lines', async () => {
    const unknown = await handleRequest(new Request('https://worker.test/lines/unknown'), env, cache);
    expect(unknown.status).toBe(404);
    expect((await unknown.json() as { error: { code: string } }).error.code).toBe('NOT_FOUND');
  });

  it('serves arrivals through a resource-oriented stop path', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), env, cache);
    expect(res.status).toBe(200);
    expect((await res.json() as { stopId: string; dataStatus: string }).stopId).toBe('1234');
  });

  it('returns schema-shaped current arrivals for a valid stop', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), env, cache);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body).toMatchObject({ stopId: '1234', dataStatus: 'current' });
    expect(Array.isArray(body.arrivals)).toBe(true);
    expect(res.headers.get('cache-control')).toBe('public, max-age=30');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('x-edge-stored-at')).toBeTruthy();
  });

  it('returns empty status without treating it as an error', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/2000/arrivals'), env, cache);
    expect(res.status).toBe(200);
    expect((await res.json() as Record<string, unknown>).dataStatus).toBe('empty');
  });

  it('rejects invalid stop ids and unknown paths, with CORS on errors', async () => {
    const bad = await handleRequest(new Request('https://worker.test/stops/abc/arrivals'), env, cache);
    expect(bad.status).toBe(400);
    expect((await bad.json() as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
    expect(bad.headers.get('access-control-allow-origin')).toBe('*');

    const unknown = await handleRequest(new Request('https://worker.test/nope'), env, cache);
    expect(unknown.status).toBe(404);
    expect((await unknown.json() as { error: { code: string } }).error.code).toBe('NOT_FOUND');
    expect(unknown.headers.get('access-control-allow-origin')).toBe('*');

    const legacy = await handleRequest(new Request('https://worker.test/?stop_id=1234'), env, cache);
    expect(legacy.status).toBe(404);

    const oldCatalog = await handleRequest(new Request('https://worker.test/catalog/lines'), env, cache);
    expect(oldCatalog.status).toBe(404);
  });

  it('returns 404 STOP_NOT_EXIST when the upstream reports a missing stop', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/999999/arrivals'), env, cache);
    expect(res.status).toBe(404);
    expect((await res.json() as { error: { code: string } }).error.code).toBe('STOP_NOT_EXIST');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('answers CORS preflight with 204', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals', { method: 'OPTIONS' }), env, cache);
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('rejects non-GET methods with 405 and CORS', async () => {
    const res = await handleRequest(new Request('https://worker.test/stops/1/arrivals', { method: 'POST' }), env, cache);
    expect(res.status).toBe(405);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('exposes liveness at /health', async () => {
    const res = await handleRequest(new Request('https://worker.test/health'), env, cache);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('source-change profiles and stop identifier boundary', () => {
  it('rejects invalid stop IDs before making any source request', async () => {
    let calls = 0;
    const response = await handleRequest(
      new Request('https://worker.test/stops/1234567/arrivals'),
      { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'false' } as unknown as WorkerEnv,
      new MemoryCache(),
      async () => {
        calls += 1;
        return new Response('');
      }
    );

    expect(response.status).toBe(400);
    expect(calls).toBe(0);
  });

  it('rejects unexpected arrivals query parameters before making any source request', async () => {
    let calls = 0;
    const response = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals?sourceUrl=https://untrusted.example'),
      { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'false' } as unknown as WorkerEnv,
      new MemoryCache(),
      async () => {
        calls += 1;
        return new Response('');
      }
    );

    expect(response.status).toBe(400);
    expect((await response.json() as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
    expect(calls).toBe(0);
  });

  it('uses fixtures by default in development without source network access', async () => {
    let calls = 0;
    const response = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { DEPLOYMENT_ENV: 'development' } as unknown as WorkerEnv,
      new MemoryCache(),
      async () => {
        calls += 1;
        return new Response('');
      }
    );

    expect(response.status).toBe(200);
    expect(calls).toBe(0);
  });

  it.each(['preview', 'production'])('rejects fixture mode in %s', async (deploymentEnv) => {
    let calls = 0;
    const response = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { DEPLOYMENT_ENV: deploymentEnv, UPSTREAM_FIXTURES: 'true' } as unknown as WorkerEnv,
      new MemoryCache(),
      async () => {
        calls += 1;
        return new Response('');
      }
    );

    expect(response.status).not.toBe(200);
    expect(calls).toBe(0);
  });

  it('rejects unknown deployment profiles without contacting the source', async () => {
    let calls = 0;
    const response = await handleRequest(
      new Request('https://worker.test/stops/1234/arrivals'),
      { DEPLOYMENT_ENV: 'staging' } as unknown as WorkerEnv,
      new MemoryCache(),
      async () => {
        calls += 1;
        return new Response('');
      }
    );

    expect(response.status).toBe(503);
    expect((await response.json() as { error: { message: string } }).error.message).toMatch(/profile/i);
    expect(calls).toBe(0);
  });
});
