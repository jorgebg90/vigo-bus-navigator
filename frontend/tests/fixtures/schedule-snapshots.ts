import type { DayType } from '../../src/domain/types';

const directionId = 'pattern-3397b53165d9';
const serviceByDay = {
  weekday: {
    firstDeparture: 360,
    lastDeparture: 1380,
    intervalMinutes: 12
  },
  saturday: {
    firstDeparture: 420,
    lastDeparture: 1320,
    intervalMinutes: 20
  },
  sunday_holiday: {
    firstDeparture: 480,
    lastDeparture: 1260,
    intervalMinutes: 30
  }
} as const;

const dayTypes = ['weekday', 'saturday', 'sunday_holiday'] as const satisfies readonly DayType[];

export const bundledScheduleSnapshots = dayTypes.map((dayType) => {
  const service = serviceByDay[dayType];
  return {
    lineId: 'line-a',
    lineCode: 'A',
    directionId,
    dayType,
    service: {
      firstDeparture: service.firstDeparture,
      lastDeparture: service.lastDeparture,
      bands: [{
        startMinute: service.firstDeparture,
        endMinute: service.lastDeparture,
        intervalMinutes: service.intervalMinutes
      }],
      stopIds: ['stop-2789', 'stop-2851']
    },
    provenance: {
      kind: 'snapshot',
      sourceName: 'Synthetic exact-day snapshot test fixture',
      evidenceRef: 'frontend/tests/fixtures/schedule-snapshots.ts',
      snapshotDate: '2026-10-25',
      dateKind: 'capture'
    }
  };
});

export const untrustedBundledScheduleSnapshots = bundledScheduleSnapshots.map((snapshot) => ({
  ...snapshot,
  provenance: {
    ...snapshot.provenance,
    evidenceRef: undefined
  }
}));
