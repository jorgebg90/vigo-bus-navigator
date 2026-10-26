import { describe, expect, it } from 'vitest';
import { getDayService, validateDayService } from '../../src/domain/frequency';
import type { Timetable } from '../../src/domain/types';

describe('frequency rules', () => {
  const timetable: Timetable = {
    lineId: 'l4a',
    byDayType: {
      weekday: {
        firstDeparture: 360,
        lastDeparture: 1380,
        bands: [{ startMinute: 360, endMinute: 1380, intervalMinutes: 12 }],
        stopIds: ['stop-1']
      }
    }
  };

  it('returns service and validates ordered bands', () => {
    expect(getDayService(timetable, 'weekday')?.firstDeparture).toBe(360);
    expect(() => validateDayService(timetable.byDayType.weekday!)).not.toThrow();
  });

  it('returns undefined for no service', () => {
    expect(getDayService(timetable, 'sunday_holiday')).toBeUndefined();
  });

  it('rejects overlapping or invalid bands', () => {
    expect(() => validateDayService({ firstDeparture: 10, lastDeparture: 30, bands: [{ startMinute: 20, endMinute: 10, intervalMinutes: 5 }], stopIds: [] })).toThrow();
  });
});
