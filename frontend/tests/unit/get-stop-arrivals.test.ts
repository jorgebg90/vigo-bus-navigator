import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStopArrivals, startStopArrivalsRefresh } from '../../src/application/get-stop-arrivals';
import type { Arrival, Stop } from '../../src/domain/types';

const stop: Stop = { id: 's1', code: '1', vitrasaId: '1001', name: 'Central', lat: 0, lon: 0, lineIds: [] };
const clock = { now: () => new Date('2026-01-01T10:00:00Z'), onDateChange: () => () => undefined };

afterEach(() => vi.useRealTimers());

describe('getStopArrivals', () => {
  it('returns live arrivals and caches them', async () => {
    const cache = new Map<string, { arrivals: Arrival[]; fetchedAt: string }>();
    const result = await getStopArrivals(stop, { getArrivals: async (code) => { expect(code).toBe('1001'); return { kind: 'live', arrivals: [], fetchedAt: 'source', dataStatus: 'current' }; } }, clock, { get: (id) => cache.get(id), set: (id, value) => cache.set(id, value) });
    expect(result.source).toBe('live');
    expect(cache.has('s1')).toBe(true);
  });

  it('makes no gateway request when a stop has no Vitrasa ID', async () => {
    const stopWithoutVitrasaId: Stop = { ...stop, vitrasaId: null };
    let calls = 0;
    const result = await getStopArrivals(stopWithoutVitrasaId, {
      getArrivals: async () => {
        calls += 1;
        return { kind: 'live', arrivals: [], fetchedAt: 'source', dataStatus: 'current' };
      }
    }, clock);

    expect(calls).toBe(0);
    expect(result.dataStatus).toBe('unavailable');
    expect(result.arrivals).toEqual([]);
  });

  it('keeps network loss distinct from an upstream failure', async () => {
    const result = await getStopArrivals(stop, {
      getArrivals: async () => ({ kind: 'unavailable', reason: 'offline' })
    }, clock);
    expect(result.dataStatus).toBe('offline');
    expect(result.arrivals).toEqual([]);
  });

  it('falls back to cached arrivals on gateway failure', async () => {
    const result = await getStopArrivals(stop, { getArrivals: async () => ({ kind: 'unavailable', reason: 'upstream' }) }, clock, { get: () => ({ arrivals: [], fetchedAt: 'cached' }), set: () => undefined });
    expect(result.source).toBe('cached');
    expect(result.error).toContain('unavailable');
  });

  it('pauses arrival polling while hidden and resumes when visible', async () => {
    vi.useFakeTimers();
    let visible = true;
    const listeners = new Set<(isVisible: boolean) => void>();
    const visibility = {
      get visible() { return visible; },
      onVisibilityChange(listener: (isVisible: boolean) => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
    const load = vi.fn(async () => ({
      stop,
      arrivals: [],
      source: 'live' as const,
      dataStatus: 'current' as const,
      fetchedAt: 'now'
    }));
    const stopPolling = startStopArrivalsRefresh(load, visibility, 1_000);

    await vi.advanceTimersByTimeAsync(3_000);
    expect(load).toHaveBeenCalledTimes(3);

    visible = false;
    listeners.forEach((listener) => listener(false));
    await vi.advanceTimersByTimeAsync(5_000);
    expect(load).toHaveBeenCalledTimes(3);

    visible = true;
    listeners.forEach((listener) => listener(true));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(load).toHaveBeenCalledTimes(4);

    stopPolling();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(load).toHaveBeenCalledTimes(4);
  });
});
