import { describe, expect, it, vi } from 'vitest';
import { loadLineView, loadOnlineLineRoute } from '../../src/application/load-line-view';
import type { PublishedLineSchedule } from '../../src/domain/types';

const line = { id: 'line-4a', code: 'L4A', name: 'Line 4A', color: '#000000' };
const pattern = { id: 'outbound', headsign: 'Center', stopIds: [], stops: [] };
const schedule: PublishedLineSchedule = {
  lineCode: line.code,
  dayType: 'weekday',
  scheduleId: 'schedule-4a',
  departures: ['06:00'],
  provenance: { kind: 'municipal', sourceName: 'Vigo JSP' }
};
const offline = { kind: 'unavailable' as const, reason: 'offline' as const };

function createRepository(scheduleResult: typeof offline | { kind: 'success'; value: PublishedLineSchedule } = offline) {
  return {
    getBundledScheduleSnapshot: vi.fn(async () => ({
      kind: 'unavailable' as const,
      reason: 'invalid' as const
    })),
    getPublishedLineSchedule: vi.fn(async () => scheduleResult),
    getRoutePatterns: vi.fn(async () => [pattern]),
    getRouteShape: vi.fn(async () => offline),
    getTripStops: vi.fn(async () => offline)
  };
}

describe('loadLineView', () => {
  it('loads line details and bundled fallback when offline', async () => {
    const repository = createRepository();
    const result = await loadLineView(repository, line, undefined, false, new Date('2026-10-28T12:00:00.000Z'));

    expect(result.dayType).toBe('weekday');
    expect(result.scheduleResult).toEqual(offline);
    expect(result.patterns).toEqual([pattern]);
    expect(result.snapshotFallback).toEqual({ attempted: true, snapshots: [] });
    expect(repository.getPublishedLineSchedule).not.toHaveBeenCalled();
    expect(repository.getBundledScheduleSnapshot).toHaveBeenCalledWith(
      line.id,
      line.code,
      pattern.id,
      'weekday'
    );
  });

  it('does not request snapshots after an online schedule succeeds', async () => {
    const repository = createRepository({ kind: 'success', value: schedule });
    const result = await loadLineView(repository, line, 'saturday', true, new Date('2026-10-28T12:00:00.000Z'));

    expect(result.dayType).toBe('saturday');
    expect(repository.getPublishedLineSchedule).toHaveBeenCalledWith(line.code, 'saturday');
    expect(result.snapshotFallback).toEqual({ attempted: false, snapshots: [] });
    expect(repository.getBundledScheduleSnapshot).not.toHaveBeenCalled();
  });

  it('loads the supplementary online route through the application port', async () => {
    const route = { patterns: [pattern] };
    const getOnlineLineRoute = vi.fn(async () => route);

    await expect(loadOnlineLineRoute({ getOnlineLineRoute }, schedule)).resolves.toEqual(route);
    expect(getOnlineLineRoute).toHaveBeenCalledWith(schedule);
  });
});
