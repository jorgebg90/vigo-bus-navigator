import { describe, expect, it } from 'vitest';
import { HttpArrivalsGateway } from '../../src/infrastructure/arrivals/http-arrivals-gateway';

describe('HttpArrivalsGateway', () => {
  it('maps a successful response to live arrivals with dataStatus', async () => {
    let requestedUrl = '';
    const gateway = new HttpArrivalsGateway('https://worker.test', async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ stopId: '1', arrivals: [], generatedAt: 'now', dataStatus: 'empty' }), { status: 200 });
    });
    await expect(gateway.getArrivals('1')).resolves.toEqual({ kind: 'live', arrivals: [], fetchedAt: 'now', dataStatus: 'empty' });
    expect(requestedUrl).toBe('https://worker.test/stops/1/arrivals');
  });

  it('maps upstream failures to an unavailable result', async () => {
    const gateway = new HttpArrivalsGateway('https://worker.test', async () => new Response(JSON.stringify({ error: { code: 'UPSTREAM_ERROR', message: 'boom' } }), { status: 502 }));
    await expect(gateway.getArrivals('1')).resolves.toEqual({ kind: 'unavailable', reason: 'upstream' });
  });

  it('maps STOP_NOT_EXIST to its dedicated reason', async () => {
    const gateway = new HttpArrivalsGateway('https://worker.test', async () => new Response(JSON.stringify({ error: { code: 'STOP_NOT_EXIST', message: 'missing' } }), { status: 404 }));
    await expect(gateway.getArrivals('999999')).resolves.toEqual({ kind: 'unavailable', reason: 'stop-not-exist' });
  });

  it('preserves stale responses as live with stale status', async () => {
    const gateway = new HttpArrivalsGateway('https://worker.test', async () => new Response(JSON.stringify({ stopId: '1', arrivals: [], generatedAt: 'earlier', dataStatus: 'stale' }), { status: 200 }));
    await expect(gateway.getArrivals('1')).resolves.toEqual({ kind: 'live', arrivals: [], fetchedAt: 'earlier', dataStatus: 'stale' });
  });
});
