import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStopArrivals, startStopArrivalsRefresh } from '../../src/application/get-stop-arrivals';
import type { ArrivalReceipt, NetworkStop } from '../../src/domain/types';

const stop: NetworkStop = {
  id: 's1',
  code: '1',
  municipalCode: '2789',
  vitrasaId: '1001',
  name: 'Central',
  lat: 0,
  lon: 0,
  lineIds: []
};
const clock = { now: () => new Date('2026-01-01T10:00:00Z'), onDateChange: () => () => undefined };
const receipt = (overrides: Partial<ArrivalReceipt> = {}): ArrivalReceipt => ({
  stopId: stop.id,
  vitrasaId: stop.vitrasaId!,
  fetchedAt: '2026-01-01T10:00:00.000Z',
  arrivals: [],
  provenance: { kind: 'fixture', sourceName: 'Synthetic fixture', fetchedAt: '2026-01-01T10:00:00.000Z' },
  ...overrides
});

afterEach(() => vi.useRealTimers());

describe('getStopArrivals', () => {
  it('returns validated arrivals and caches the complete receipt', async () => {
    let cached: ArrivalReceipt | undefined;
    const result = await getStopArrivals(
      stop,
      { getArrivals: async (selectedStop) => {
        expect(selectedStop).toBe(stop);
        return { kind: 'success', value: receipt() };
      } },
      clock,
      { get: () => cached, set: (value) => { cached = value; return true; } }
    );

    expect(result).toMatchObject({ source: 'live', dataStatus: 'empty', fetchedAt: receipt().fetchedAt });
    expect(cached).toEqual(receipt());
  });

  it('makes no gateway request when a stop has no Vitrasa ID', async () => {
    const stopWithoutVitrasaId: NetworkStop = { ...stop, vitrasaId: null };
    const getArrivals = vi.fn();
    const result = await getStopArrivals(stopWithoutVitrasaId, { getArrivals }, clock);

    expect(getArrivals).not.toHaveBeenCalled();
    expect(result.dataStatus).toBe('unavailable');
    expect(result.arrivals).toEqual([]);
  });

  it('keeps network loss distinct from an upstream failure', async () => {
    const result = await getStopArrivals(
      stop,
      { getArrivals: async () => ({ kind: 'unavailable', reason: 'offline' }) },
      clock
    );
    expect(result.dataStatus).toBe('offline');
    expect(result.arrivals).toEqual([]);
  });

  it('falls back to a complete cached receipt on gateway failure', async () => {
    const cached = receipt();
    const result = await getStopArrivals(
      stop,
      { getArrivals: async () => ({ kind: 'unavailable', reason: 'http' }) },
      clock,
      { get: () => cached, set: () => true }
    );
    expect(result).toMatchObject({ source: 'cached', dataStatus: 'stale', arrivals: cached.arrivals });
  });

  it('rejects a receipt for a different stop identity', async () => {
    const result = await getStopArrivals(
      stop,
      { getArrivals: async () => ({ kind: 'success', value: receipt({ stopId: 'other-stop' }) }) },
      clock
    );
    expect(result).toMatchObject({ source: 'unavailable', dataStatus: 'unavailable', arrivals: [] });
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
