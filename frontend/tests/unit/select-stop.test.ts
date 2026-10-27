import { describe, expect, it, vi } from 'vitest';
import { createStopSelection } from '../../src/application/select-stop';
import type { Stop } from '../../src/domain/types';

const locatedStop: Stop = {
  id: 'stop-a', code: '1001', vitrasaId: '1001', name: 'Central',
  lat: 42.2, lon: -8.7, lineIds: []
};
const unlocatedStop: Stop = {
  id: 'stop-b', code: '1002', vitrasaId: '1002', name: 'Search-only',
  lat: null, lon: null, lineIds: []
};
const clock = { now: () => new Date('2026-10-26T12:00:00Z'), onDateChange: () => () => undefined };
const visibility = { visible: false, onVisibilityChange: () => () => undefined };
const live = (destination: string) => ({
  kind: 'live' as const,
  arrivals: [{ lineCode: '4A', destination, minutes: 3, eta: '2026-10-26T12:03:00Z' }],
  fetchedAt: '2026-10-26T12:00:00Z',
  dataStatus: 'current' as const
});

describe('createStopSelection', () => {
  it('drops a stale result after a different stop becomes active', async () => {
    let resolveFirst!: (value: ReturnType<typeof live>) => void;
    const getArrivals = vi.fn((stopId: string) => stopId === '1001'
      ? new Promise<ReturnType<typeof live>>((resolve) => { resolveFirst = resolve; })
      : Promise.resolve(live('New destination')));
    const selection = createStopSelection({ stops: [locatedStop, unlocatedStop], arrivals: { getArrivals }, clock, visibility });
    const observed: string[] = [];
    selection.subscribe((model) => { if (model.arrivals) observed.push(model.arrivals.arrivals[0]?.destination ?? ''); });

    const first = selection.selectStop('stop-a');
    await selection.selectStop('stop-b');
    resolveFirst(live('Old destination'));
    await first;

    expect(selection.getSnapshot().stop?.id).toBe('stop-b');
    expect(selection.getSnapshot().arrivals?.arrivals[0]?.destination).toBe('New destination');
    expect(observed).not.toContain('Old destination');
    selection.dispose();
  });

  it('keeps selection state stable when refreshing arrivals', async () => {
    const selection = createStopSelection({
      stops: [locatedStop], arrivals: { getArrivals: vi.fn().mockResolvedValue(live('Bouzas')) }, clock, visibility
    });
    await selection.selectStop('stop-a');
    const before = selection.getSnapshot();
    await selection.refresh();

    expect(selection.getSnapshot().selectedStopId).toBe(before.selectedStopId);
    expect(selection.getSnapshot().stop).toBe(before.stop);
    selection.dispose();
  });

  it('selects a stop with null coordinates from a non-map entry point', async () => {
    const getArrivals = vi.fn().mockResolvedValue(live('Centro'));
    const selection = createStopSelection({ stops: [unlocatedStop], arrivals: { getArrivals }, clock, visibility });

    await selection.selectStop('stop-b');

    expect(selection.getSnapshot().stop).toEqual(unlocatedStop);
    expect(getArrivals).toHaveBeenCalledWith('1002');
    selection.dispose();
  });

  it('does not expose cached arrivals at the 300-second unavailable boundary', async () => {
    const selection = createStopSelection({
      stops: [locatedStop],
      arrivals: { getArrivals: vi.fn().mockResolvedValue({ kind: 'unavailable', reason: 'upstream' }) },
      cache: { get: () => ({ arrivals: [live('Expired').arrivals[0]], fetchedAt: '2026-10-26T11:55:00Z' }), set: () => undefined },
      clock,
      visibility
    });

    await selection.selectStop('stop-a');

    expect(selection.getSnapshot().arrivals).toMatchObject({ dataStatus: 'unavailable', source: 'unavailable', arrivals: [] });
    selection.dispose();
  });
});
