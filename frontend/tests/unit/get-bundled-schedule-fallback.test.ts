import { describe, expect, it, vi } from 'vitest';
import type { ScheduleRepositoryV5 } from '../../src/application/ports';
import { getBundledScheduleFallback } from '../../src/application/get-bundled-schedule-fallback';

const line = { id: 'line-4a', code: 'L4A', name: 'Line 4A', color: '#000000' };
const pattern = { id: 'outbound', headsign: 'Center', stopIds: [], stops: [] };
const snapshot = {
  lineId: line.id,
  lineCode: line.code,
  directionId: pattern.id,
  dayType: 'weekday' as const,
  service: {
    firstDeparture: 360,
    lastDeparture: 1380,
    bands: [{ startMinute: 360, endMinute: 1380, intervalMinutes: 12 }],
    stopIds: ['stop-1']
  },
  provenance: {
    kind: 'snapshot' as const,
    sourceName: 'Published timetable source',
    evidenceRef: 'source-evidence',
    snapshotDate: '2026-10-25',
    dateKind: 'publication' as const
  }
};
const unavailable = { kind: 'unavailable' as const, reason: 'offline' as const };

function createRepository(): Pick<ScheduleRepositoryV5, 'getBundledScheduleSnapshot'> {
  return {
    getBundledScheduleSnapshot: vi.fn(async () => ({ kind: 'success' as const, value: snapshot }))
  };
}

describe('getBundledScheduleFallback', () => {
  it('never masks an online schedule failure with bundled data', async () => {
    const repository = createRepository();

    await expect(getBundledScheduleFallback(repository, line, 'weekday', [pattern], true, unavailable))
      .resolves.toEqual({ attempted: false, snapshots: [] });
    expect(repository.getBundledScheduleSnapshot).not.toHaveBeenCalled();
  });

  it('does not request snapshots when the online schedule succeeded', async () => {
    const repository = createRepository();
    const publishedSchedule = {
      kind: 'success' as const,
      value: {
        lineCode: 'L4A',
        dayType: 'weekday' as const,
        scheduleId: 'schedule-4a',
        departures: ['06:00'],
        provenance: { kind: 'municipal' as const, sourceName: 'Vigo JSP' }
      }
    };

    await expect(getBundledScheduleFallback(repository, line, 'weekday', [pattern], false, publishedSchedule))
      .resolves.toEqual({ attempted: false, snapshots: [] });
    expect(repository.getBundledScheduleSnapshot).not.toHaveBeenCalled();
  });

  it('selects only exact-direction snapshot results while offline', async () => {
    const repository = createRepository();

    await expect(getBundledScheduleFallback(repository, line, 'weekday', [pattern], false, unavailable))
      .resolves.toEqual({ attempted: true, snapshots: [snapshot] });
    expect(repository.getBundledScheduleSnapshot).toHaveBeenCalledWith(
      line.id,
      line.code,
      pattern.id,
      'weekday'
    );
  });
});
