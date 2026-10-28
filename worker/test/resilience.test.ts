import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src';
import { MemoryCache } from '../src/cache';
import type { WorkerEnv } from '../src/env';

const env: WorkerEnv = { DEPLOYMENT_ENV: 'development', UPSTREAM_FIXTURES: 'true' };

describe('SC-005 resilience loop', () => {
  it('handles 100 consecutive valid requests with schema-shaped, secrets-free responses', async () => {
    const cache = new MemoryCache();
    const now = new Date('2026-10-25T18:29:45Z');
    for (let index = 0; index < 100; index += 1) {
      const res = await handleRequest(new Request('https://worker.test/stops/1234/arrivals'), env, cache, undefined, now);
      expect(res.status).toBe(200);
      const text = await res.text();
      const body = JSON.parse(text) as { stopId: string; dataStatus: string; arrivals: unknown[] };
      expect(body.stopId).toBe('1234');
      expect(['current', 'empty', 'stale']).toContain(body.dataStatus);
      expect(text).not.toContain('UPSTREAM_URL');
      expect(text).not.toContain('datos.test');
      expect(text.length).toBeLessThan(32_768);
    }
  });

  it('bounds error payloads on repeated failures', async () => {
    const cache = new MemoryCache();
    for (let index = 0; index < 20; index += 1) {
      const res = await handleRequest(
        new Request('https://worker.test/stops/1234/arrivals'),
        { ...env, UPSTREAM_FIXTURE_FAULT: 'error' },
        cache
      );
      expect([502, 503]).toContain(res.status);
      const text = await res.text();
      expect(text.length).toBeLessThan(1_024);
      expect(text).not.toContain('datos.test');
    }
  });
});