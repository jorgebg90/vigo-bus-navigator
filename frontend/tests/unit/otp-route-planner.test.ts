import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OtpRoutePlanner } from '../../src/infrastructure/routing/otp-route-planner';
import type { RequestCancellationPort } from '../../src/application/ports';

const query = {
  origin: { latitude: 42.23419, longitude: -8.71358 },
  destination: { latitude: 42.22151, longitude: -8.7327 },
  departureLocal: '2026-11-13T15:53'
};
const fixture = async () => JSON.parse(await readFile(new URL('../../../specs/example.json', import.meta.url), 'utf8'));

afterEach(() => vi.useRealTimers());

describe('OTP route planner', () => {
  it('encodes the approved fixed query and decodes actual legs, steps and geometry', async () => {
    const fetcher = vi.fn(async () => Response.json(await fixture()));
    const result = await new OtpRoutePlanner(fetcher).plan(query);
    expect(result.kind).toBe('success');
    const [urlText, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const url = new URL(urlText);
    expect(url.origin + url.pathname).toBe('https://planificador-rutas.vigo.org/otp/routers/default/plan');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      fromPlace: '42.23419,-8.71358', toPlace: '42.22151,-8.7327',
      date: '11/13/2026', time: '3:53 PM', maxWalkDistance: '500', maxTransfers: '2'
    });
    expect(init).toMatchObject({ method: 'GET', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    if (result.kind !== 'success') throw new Error('Expected fixture itineraries');
    expect(result.journeys).toHaveLength(4);
    expect(result.journeys[0].legs.map((leg) => leg.mode)).toEqual(['WALK', 'BUS', 'WALK']);
    expect(result.journeys[0].legs[1]).toMatchObject({ line: '4C', realTime: false });
    expect(result.journeys[0].legs[1].intermediateStops.length).toBeGreaterThan(0);
    expect(result.journeys[0].legs[0].steps.length).toBeGreaterThan(0);
    expect(result.journeys[0].legs.every((leg) => leg.coordinates.length >= 2)).toBe(true);
    expect(result.journeys[0].legs[0].coordinates[0][0]).toBeCloseTo(-8.71358, 2);
  });

  it.each([
    ['2026-07-15T00:05', '7/15/2026', '12:05 AM'],
    ['2026-07-15T12:05', '7/15/2026', '12:05 PM']
  ])('serializes Madrid local time %s without system timezone conversion', async (departureLocal, date, time) => {
    const fetcher = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => Response.json(await fixture()));
    await new OtpRoutePlanner(fetcher).plan({ ...query, departureLocal });
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get('date')).toBe(date);
    expect(url.searchParams.get('time')).toBe(time);
  });

  it('rejects invalid input without fetching', async () => {
    const fetcher = vi.fn();
    expect(await new OtpRoutePlanner(fetcher).plan({ ...query, departureLocal: '2026-03-29T02:30' }))
      .toEqual({ kind: 'unavailable', reason: 'invalid' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('distinguishes empty plans, HTTP/OTP failures, invalid JSON and oversized responses', async () => {
    const payload = await fixture();
    payload.plan.itineraries = [];
    expect(await new OtpRoutePlanner(async () => Response.json(payload)).plan(query))
      .toEqual({ kind: 'success', journeys: [] });
    for (const [response, reason] of [
      [new Response('', { status: 503 }), 'http'],
      [Response.json({ error: { id: 404, msg: 'No route', noPath: true } }), 'service'],
      [new Response('{'), 'invalid'],
      [Response.json({ plan: {} }), 'invalid'],
      [new Response('', { headers: { 'content-length': String(2 * 1024 * 1024 + 1) } }), 'oversized']
    ] as const) {
      expect(await new OtpRoutePlanner(async () => response).plan(query))
        .toEqual({ kind: 'unavailable', reason });
    }
  });

  it('rejects corrupt geometry, coordinates and chronology instead of drawing invented routes', async () => {
    for (const mutation of [
      (x: Awaited<ReturnType<typeof fixture>>) => { x.plan.itineraries[0].legs[0].legGeometry.points = '?'; },
      (x: Awaited<ReturnType<typeof fixture>>) => { x.plan.itineraries[0].legs[0].from.lat = 200; },
      (x: Awaited<ReturnType<typeof fixture>>) => { x.plan.itineraries[0].startTime = 1e100; },
      (x: Awaited<ReturnType<typeof fixture>>) => { x.plan.itineraries[0].legs[0].endTime = 0; }
    ]) {
      const payload = await fixture();
      mutation(payload);
      expect(await new OtpRoutePlanner(async () => Response.json(payload)).plan(query))
        .toEqual({ kind: 'unavailable', reason: 'invalid' });
    }
  });

  it('returns cancellation without fetching an already cancelled request', async () => {
    const cancellation: RequestCancellationPort = { isCancelled: () => true, onCancelled: () => () => undefined };
    const fetcher = vi.fn();
    expect(await new OtpRoutePlanner(fetcher).plan(query, cancellation)).toEqual({ kind: 'cancelled' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('aborts on timeout and cancellation and cleans up subscriptions', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const pending = new OtpRoutePlanner(fetcher).plan(query);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await pending).toEqual({ kind: 'unavailable', reason: 'timeout' });
    let cancel: () => void = () => undefined;
    let cancelled = false;
    const unsubscribe = vi.fn();
    const cancellation: RequestCancellationPort = {
      isCancelled: () => cancelled,
      onCancelled: (listener) => { cancel = listener; return unsubscribe; }
    };
    const next = new OtpRoutePlanner(fetcher).plan(query, cancellation);
    cancelled = true;
    cancel();
    expect(await next).toEqual({ kind: 'cancelled' });
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
