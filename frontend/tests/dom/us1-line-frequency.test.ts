// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderLineFrequency } from '../../src/ui/line/frequency-view';
import type { Timetable } from '../../src/domain/types';
import { setDocumentLanguage } from '../../src/i18n';

const testTimetables: Record<string, Timetable> = {
  l4a: {
    lineId: 'l4a',
    byDayType: {
      weekday: { firstDeparture: 360, lastDeparture: 1380, bands: [{ startMinute: 360, endMinute: 1380, intervalMinutes: 12 }], stopIds: ['stop-1', 'stop-2'] },
      saturday: { firstDeparture: 420, lastDeparture: 1320, bands: [{ startMinute: 420, endMinute: 1320, intervalMinutes: 20 }], stopIds: ['stop-1', 'stop-2'] },
      sunday_holiday: { firstDeparture: 480, lastDeparture: 1260, bands: [{ startMinute: 480, endMinute: 1260, intervalMinutes: 30 }], stopIds: ['stop-1', 'stop-2'] }
    }
  },
  l7: {
    lineId: 'l7',
    byDayType: {
      weekday: { firstDeparture: 390, lastDeparture: 1350, bands: [{ startMinute: 390, endMinute: 1350, intervalMinutes: 15 }], stopIds: ['stop-3'] }
    }
  }
};

describe('US1 line frequency view', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('renders day type, frequency, and dataset metadata', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L4A',
      timetable: testTimetables.l4a,
      dayType: 'weekday',
      datasetVersion: 'fixture-2026.10'
    });
    expect(root.textContent).toContain('L4A');
    expect(root.textContent).toContain('12');
    expect(root.textContent).toContain('fixture-2026.10');
    expect(root.querySelector('select[aria-label="Day type"]')).not.toBeNull();
  });

  it('offers the nearest served day when the selected day has no service', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L7',
      timetable: testTimetables.l7,
      dayType: 'saturday',
      datasetVersion: 'fixture-2026.10',
      onDayTypeChange: () => undefined
    });

    expect(root.textContent).toContain('No service on this day type');
    expect(root.querySelector('[data-nearest-day]')).not.toBeNull();
  });

  it('shows a localized unavailable state when a line has no API timetable', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: '4C',
      dayType: 'weekday',
      datasetVersion: 'fixture-2026.10'
    });

    expect(root.textContent).toContain('No published frequency data is available for this line.');
    expect(root.querySelector('table')).toBeNull();
  });
});
