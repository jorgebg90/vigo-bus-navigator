// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderLineFrequency } from '../../src/ui/line/frequency-view';
import type { Line, Stop, Timetable } from '../../src/domain/types';
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

const testStops: Stop[] = [
  { id: 'stop-1', code: '101', vitrasaId: null, name: 'Praza de América', lat: 42, lon: -8, lineIds: ['l4a'] },
  { id: 'stop-2', code: '102', vitrasaId: null, name: 'Urzáiz', lat: 42, lon: -8, lineIds: ['l4a'] },
  { id: 'stop-3', code: '103', vitrasaId: null, name: 'Bouzas', lat: 42, lon: -8, lineIds: ['l7'] }
];
const testLines: Line[] = [
  { id: 'l4a', code: '4A', name: 'Praza de América', color: '#009900' },
  { id: 'l7', code: '7', name: 'Bouzas', color: '#14532D' }
];

describe('US1 line frequency view', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('renders day type and frequency without technical dataset metadata', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L4A',
      timetable: testTimetables.l4a,
      dayType: 'weekday',
    });
    expect(root.textContent).toContain('L4A');
    expect(root.textContent).toContain('12');
    expect(root.textContent).not.toContain('fixture');
    expect(root.querySelector('[role="tablist"][aria-label="Day type"]')).not.toBeNull();
  });

  it('provides a captioned frequency table and keyboard-operable day-type tabs', () => {
    const root = document.createElement('main');
    const changes: string[] = [];
    renderLineFrequency(root, {
      lineCode: 'L4A',
      timetable: testTimetables.l4a,
      dayType: 'weekday',
      onDayTypeChange: (dayType) => changes.push(dayType)
    });

    expect(root.querySelector('table caption')?.textContent).toContain('L4A');
    const tabs = root.querySelector('[role="tablist"]');
    expect(tabs).toBeTruthy();
    expect(tabs?.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(root.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Weekday');
    expect([...root.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual(['Time band', 'First departure', 'Last departure', 'Interval']);
    root.querySelector<HTMLButtonElement>('[data-day-type="saturday"]')?.click();
    expect(changes).toEqual(['saturday']);
  });

  it('renders route stops as an ordered list of names, not internal IDs', () => {
    const root = document.createElement('main');
    const selectStop = vi.fn();
    renderLineFrequency(root, {
      lineCode: 'L4A', timetable: testTimetables.l4a, patterns: [{
        id: 'outbound', headsign: 'Urzáiz', stopIds: ['stop-1', 'stop-2'],
        stops: testStops.slice(0, 2)
      }], favoriteStopIds: [],
      dayType: 'weekday', onStopSelect: selectStop
    });

    const stopList = root.querySelector('ol[aria-label="Stops · Urzáiz"]');
    expect([...stopList!.querySelectorAll('li button')].map((button) => button.textContent)).toEqual([
      'Praza de América', 'Urzáiz'
    ]);
    expect(stopList?.textContent).not.toContain('stop-1');
    stopList?.querySelector<HTMLButtonElement>('li button')?.click();
    expect(selectStop).toHaveBeenCalledWith('stop-1');
  });

  it('renders every API route direction in order with a favorite toggle on each stop', () => {
    const root = document.createElement('main');
    const toggleStop = vi.fn();
    renderLineFrequency(root, {
      lineCode: 'L4A', timetable: testTimetables.l4a,
      patterns: [
        { id: 'out', headsign: 'Urzáiz', stopIds: ['stop-1', 'stop-2'], stops: testStops.slice(0, 2) },
        { id: 'back', headsign: 'Bouzas', stopIds: ['stop-2', 'stop-1'], stops: testStops.slice(0, 2) }
      ], lines: testLines,
      favoriteStopIds: ['stop-2'], dayType: 'weekday',
      onStopFavoriteToggle: toggleStop
    });

    const directions = [...root.querySelectorAll('[data-route-pattern]')];
    expect(directions.map((direction) => direction.querySelector('h2')?.textContent)).toEqual(['Urzáiz', 'Bouzas']);
    expect(directions.map((direction) => [...direction.querySelectorAll('[data-route-stop]')].map((item) => item.querySelector('.stop-open')?.textContent))).toEqual([
      ['Praza de América', 'Urzáiz'], ['Urzáiz', 'Praza de América']
    ]);
    expect([...root.children].indexOf(root.querySelector('table')!)).toBeLessThan(
      [...root.children].indexOf(directions[0]!)
    );
    expect(directions[0]?.querySelector('[data-route-stop="stop-1"] [data-line-code-badge]')?.textContent).toBe('4A');
    expect(directions[0]?.querySelector('[data-route-stop="stop-1"] .route-stop-info .line-badges')).toBeTruthy();
    expect(root.querySelectorAll('[data-route-stop] .favorite-toggle')).toHaveLength(4);
    expect(root.querySelector('[data-route-stop="stop-2"] .favorite-toggle')?.getAttribute('aria-pressed')).toBe('true');
    root.querySelector<HTMLButtonElement>('[data-route-stop="stop-1"] .favorite-toggle')?.click();
    expect(toggleStop).toHaveBeenCalledWith('stop-1');
  });

  it('states explicitly when the selected day type has no published service', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L7', timetable: testTimetables.l7, dayType: 'saturday'
    });
    expect(root.textContent).toContain('No published service for this day type');
  });

  it('offers the nearest served day when the selected day has no service', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L7',
      timetable: testTimetables.l7,
      dayType: 'saturday',
      onDayTypeChange: () => undefined
    });

    expect(root.textContent).toContain('No published service for this day type');
    expect(root.querySelector('[data-nearest-day]')).not.toBeNull();
  });

  it('shows a localized unavailable state when a line has no API timetable', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: '4C',
      dayType: 'weekday'
    });

    expect(root.textContent).toContain('No published frequency data is available for this line.');
    expect(root.querySelector('table')).toBeNull();
  });
});
