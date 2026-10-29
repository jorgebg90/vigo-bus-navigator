import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStopSelection } from '../../src/application/select-stop';
import type { ArrivalReceipt, NetworkStop } from '../../src/domain/types';

const locatedStop: NetworkStop = {
  id: 'stop-a', code: '1001', municipalCode: '2789', vitrasaId: '1001', name: 'Central',
  lat: 42.2, lon: -8.7, lineIds: []
};
const unlocatedStop: NetworkStop = {
  id: 'stop-b', code: '1002', municipalCode: '2790', vitrasaId: '1002', name: 'Search-only',
  lat: null, lon: null, lineIds: []
};
const fetchedAt = '2026-10-26T12:00:00.000Z';
const clock = { now: () => new Date(fetchedAt), onDateChange: () => () => undefined };
const visibility = { visible: false, onVisibilityChange: () => () => undefined };
const intervals = {
  start(callback: () => void, intervalMs: number) {
    const timer = setInterval(callback, intervalMs);
    return () => clearInterval(timer);
  }
};
const receipt = (stop: NetworkStop, destination: string): ArrivalReceipt => ({
  stopId: stop.id,
  vitrasaId: stop.vitrasaId!,
  fetchedAt,
  arrivals: [{ lineCode: '4A', destination, minutes: 3 }],
  provenance: { kind: 'fixture', sourceName: 'Synthetic fixture', fetchedAt }
});

afterEach(() => vi.useRealTimers());

describe('createStopSelection', () => {
  it('does not request arrivals when the selected stop has no Vitrasa ID', async () => {
    const stopWithoutVitrasaId = { ...locatedStop, vitrasaId: null };
    const getArrivals = vi.fn();
    const selection = createStopSelection({
      stops: [stopWithoutVitrasaId],
      arrivals: { getArrivals },
      clock,
      visibility,
      intervals
    });

    await selection.selectStop(stopWithoutVitrasaId.id);

    expect(getArrivals).not.toHaveBeenCalled();
    expect(selection.getSnapshot().arrivals?.dataStatus).toBe('unavailable');
    selection.dispose();
  });

  it('drops a stale result after a different stop becomes active', async () => {
    let resolveFirst!: (result: { kind: 'success'; value: ArrivalReceipt }) => void;
    const getArrivals = vi.fn((stop: NetworkStop) => stop.id === 'stop-a'
      ? new Promise<{ kind: 'success'; value: ArrivalReceipt }>((resolve) => { resolveFirst = resolve; })
      : Promise.resolve({ kind: 'success' as const, value: receipt(stop, 'New destination') }));
    const selection = createStopSelection({ stops: [locatedStop, unlocatedStop], arrivals: { getArrivals }, clock, visibility, intervals });
    const observed: string[] = [];
    selection.subscribe((model) => { if (model.arrivals) observed.push(model.arrivals.arrivals[0]?.destination ?? ''); });

    const first = selection.selectStop('stop-a');
    await selection.selectStop('stop-b');
    resolveFirst({ kind: 'success', value: receipt(locatedStop, 'Old destination') });
    await first;

    expect(selection.getSnapshot().stop?.id).toBe('stop-b');
    expect(selection.getSnapshot().arrivals?.arrivals[0]?.destination).toBe('New destination');
    expect(observed).not.toContain('Old destination');
    selection.dispose();
  });

  it('keeps selection state stable when refreshing arrivals', async () => {
    const getArrivals = vi.fn(async (stop: NetworkStop) => ({
      kind: 'success' as const,
      value: receipt(stop, 'Bouzas')
    }));
    const selection = createStopSelection({
      stops: [locatedStop],
      arrivals: { getArrivals },
      clock,
      visibility,
      intervals
    });
    await selection.selectStop('stop-a');
    const before = selection.getSnapshot();
    await selection.refresh();

    expect(getArrivals).toHaveBeenCalledTimes(2);
    expect(selection.getSnapshot().selectedStopId).toBe(before.selectedStopId);
    expect(selection.getSnapshot().stop).toBe(before.stop);
    selection.dispose();
  });

  it('refreshes a selected stop every 30 seconds only while visible', async () => {
    vi.useFakeTimers();
    let visible = true;
    const listeners = new Set<(isVisible: boolean) => void>();
    const visiblePort = {
      get visible() { return visible; },
      onVisibilityChange(listener: (isVisible: boolean) => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
    const getArrivals = vi.fn(async (stop: NetworkStop) => ({
      kind: 'success' as const,
      value: receipt(stop, 'Bouzas')
    }));
    const selection = createStopSelection({
      stops: [locatedStop],
      arrivals: { getArrivals },
      clock,
      visibility: visiblePort,
      intervals
    });

    await selection.selectStop(locatedStop.id);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(getArrivals).toHaveBeenCalledTimes(2);

    visible = false;
    listeners.forEach((listener) => listener(false));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(getArrivals).toHaveBeenCalledTimes(2);

    visible = true;
    listeners.forEach((listener) => listener(true));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(getArrivals).toHaveBeenCalledTimes(3);
    selection.dispose();
  });

  it('selects a stop with null coordinates from a non-map entry point', async () => {
    const getArrivals = vi.fn(async (stop: NetworkStop) => ({ kind: 'success' as const, value: receipt(stop, 'Centro') }));
    const selection = createStopSelection({ stops: [unlocatedStop], arrivals: { getArrivals }, clock, visibility, intervals });

    await selection.selectStop('stop-b');

    expect(selection.getSnapshot().stop).toEqual(unlocatedStop);
    expect(getArrivals).toHaveBeenCalledWith(unlocatedStop);
    selection.dispose();
  });

  it('does not expose cached arrivals at the 300-second unavailable boundary', async () => {
    const expired = receipt(locatedStop, 'Expired');
    expired.fetchedAt = '2026-10-26T11:55:00.000Z';
    expired.provenance.fetchedAt = expired.fetchedAt;
    const selection = createStopSelection({
      stops: [locatedStop],
      arrivals: { getArrivals: vi.fn(async () => ({ kind: 'unavailable' as const, reason: 'http' as const })) },
      cache: { get: () => undefined, set: () => true },
      clock,
      visibility,
      intervals
    });

    await selection.selectStop('stop-a');

    expect(selection.getSnapshot().arrivals).toMatchObject({ dataStatus: 'unavailable', source: 'unavailable', arrivals: [] });
    selection.dispose();
  });
});
