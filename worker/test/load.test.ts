import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src';
import { MemoryCache } from '../src/cache';
import type { WorkerEnv } from '../src/env';

describe('fixture-only Worker load target (SC-014)', () => {
  it('handles 600 arrivals requests at 10 rps for 60 seconds with p95 at most 3 seconds and no source calls', async () => {
    const cache = new MemoryCache();
    const env = {
      DEPLOYMENT_ENV: 'development',
      UPSTREAM_FIXTURES: 'true'
    } as unknown as WorkerEnv;
    const latencies: number[] = [];
    let sourceCalls = 0;
    const fetcher = async (): Promise<Response> => {
      sourceCalls += 1;
      throw new Error('Live source access is forbidden in this fixture-only test');
    };
    const startedAt = performance.now();

    for (let index = 0; index < 600; index += 1) {
      const requestStarted = performance.now();
      const response = await handleRequest(
        new Request('https://worker.test/stops/1234/arrivals'),
        env,
        cache,
        fetcher,
        new Date('2026-10-26T10:00:00.000Z')
      );
      latencies.push(performance.now() - requestStarted);
      expect(response.status).toBe(200);

      const nextRequestAt = startedAt + (index + 1) * 100;
      const remainingMs = nextRequestAt - performance.now();
      if (remainingMs > 0) await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }

    latencies.sort((left, right) => left - right);
    const p95 = latencies[Math.ceil(latencies.length * 0.95) - 1];
    console.info(`SC-014 p95 response latency: ${p95.toFixed(2)} ms`);
    expect(p95).toBeLessThanOrEqual(3_000);
    expect(sourceCalls).toBe(0);
  }, 70_000);
});
