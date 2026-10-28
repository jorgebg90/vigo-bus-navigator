// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderLineFrequency } from '../../src/ui/line/frequency-view';
import type { Line, Provenance, SelectedLineRouteDisplay, Stop, Timetable } from '../../src/domain/types';
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

  it('does not render a redundant direction message for a selected map route', () => {
    const root = document.createElement('main');
    const mapRoute: SelectedLineRouteDisplay = {
      lineId: 'line-4c',
      lineCode: '4C',
      directions: [
        { direction: 0, headsign: 'Outbound to Coia', shapeId: 'shape-out', geometry: { type: 'LineString', coordinates: [[-8.72, 42.24], [-8.7, 42.25]] } },
        { direction: 1, headsign: 'Inbound to Urzaiz', shapeId: 'shape-back', geometry: { type: 'LineString', coordinates: [[-8.7, 42.25], [-8.72, 42.24]] } }
      ]
    };

    renderLineFrequency(root, { lineCode: '4C', dayType: 'weekday', mapRoute });

    expect(root.querySelector('[data-line-map-directions]')).toBeNull();
    expect(root.querySelector('[data-line-map-status="unavailable"]')).toBeNull();
  });

  it('announces unavailable map geometry without hiding timetable details', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'N4',
      dayType: 'weekday',
      mapRouteUnavailable: true,
      publishedSchedule: {
        lineCode: 'N4',
        dayType: 'weekday',
        scheduleId: 'N4',
        departures: ['07:00'],
        provenance: { kind: 'municipal', sourceName: 'test' }
      }
    });

    expect(root.querySelector('[data-line-map-status="unavailable"]')?.getAttribute('role')).toBe('status');
    expect(root.querySelector('[data-line-map-status="unavailable"]')?.textContent)
      .toBe('No verified route is available for this line.');
    expect(root.querySelector('[data-line-departures] li')?.textContent).toBe('07:00');

    setDocumentLanguage('es');
    renderLineFrequency(root, { lineCode: 'N4', dayType: 'weekday', mapRouteUnavailable: true });
    expect(root.querySelector('[data-line-map-status="unavailable"]')?.textContent)
      .toBe('No hay un recorrido verificado disponible para esta línea.');
  });
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

  it('attributes bundled fallback data to its exact dated source and direction', () => {
    const root = document.createElement('main');
    const snapshotProvenance: Provenance = {
      kind: 'snapshot',
      sourceName: 'Vigo municipal timetable publication',
      evidenceRef: 'https://example.test/timetables/2026',
      snapshotDate: '2026-10-25',
      dateKind: 'publication'
    };
    renderLineFrequency(root, {
      lineCode: 'L4A',
      bundledScheduleSnapshots: [{
        lineId: 'l4a',
        lineCode: 'L4A',
        directionId: 'outbound',
        dayType: 'weekday',
        service: testTimetables.l4a.byDayType.weekday!,
        provenance: snapshotProvenance
      }],
      dayType: 'weekday',
      onDayTypeChange: () => undefined
    });

    expect(root.querySelector('[data-schedule-provenance="snapshot"]')?.textContent).toContain(
      'Bundled offline timetable · Vigo municipal timetable publication · publication date 2026-10-25 · L4A / outbound · Weekday'
    );
    expect(root.textContent).not.toContain('JSP');
    expect(root.textContent).not.toContain('live');
  });

  it('shows unavailable instead of an untrusted snapshot timetable', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'L4A',
      dayType: 'weekday',
      snapshotFallbackAttempted: true
    });

    expect(root.querySelector('[data-schedule-status="snapshot-unavailable"]')?.textContent)
      .toBe('No trustworthy bundled timetable is available for this line, direction, and day.');
    expect(root.querySelector('table')).toBeNull();
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
    const scheduleDisclosure = root.querySelector<HTMLDetailsElement>('[data-schedule-disclosure]');
    expect(scheduleDisclosure?.open).toBe(false);
    scheduleDisclosure?.querySelector<HTMLElement>('[data-schedule-toggle]')?.click();
    expect(scheduleDisclosure?.open).toBe(true);
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
    const dayPanel = root.querySelector('[role="tabpanel"]')!;
    expect([...dayPanel.children].indexOf(dayPanel.querySelector('table')!)).toBeLessThan(
      [...dayPanel.children].indexOf(directions[0]!)
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

  it('groups online published departures by direction and states days without service', () => {
    const provenance = { kind: 'municipal' as const, sourceName: 'Vigo municipal transit JSP', fetchedAt: '2026-10-28T12:00:00.000Z' };
    const trip = { origin: null, destination: null, active: true };
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: '4C',
      dayType: 'weekday',
      publishedSchedule: {
        lineCode: '4C', dayType: 'weekday', scheduleId: '4C', departures: ['07:00', '08:15'], provenance,
        trips: [
          { ...trip, tripId: 't1', shapeId: 's1', direction: 1, headsign: 'COIA', departures: ['08:15'] },
          { ...trip, tripId: 't0', shapeId: 's0', direction: 0, headsign: 'G. ESPINO', departures: ['07:00'] }
        ]
      }
    });
    expect(root.textContent).not.toContain('Vigo municipal transit JSP');
    expect(root.textContent).not.toContain('Municipal transit data');
    const scheduleDisclosure = root.querySelector<HTMLDetailsElement>('[data-schedule-disclosure]');
    expect(scheduleDisclosure?.open).toBe(false);
    expect(scheduleDisclosure?.querySelector('[data-schedule-toggle]')?.textContent).toBe('Departures and arrivals');
    scheduleDisclosure?.querySelector<HTMLElement>('[data-schedule-toggle]')?.click();
    expect(scheduleDisclosure?.open).toBe(true);
    expect([...root.querySelectorAll('[data-schedule-direction] h3')].map((heading) => heading.textContent))
      .toEqual(['G. ESPINO', 'COIA']);
    expect(scheduleDisclosure?.querySelector('[data-schedule-toggle]')?.textContent).toBe('Departures and arrivals');
    expect(root.querySelector('[data-schedule-direction="1"] li')?.textContent).toBe('08:15');

    renderLineFrequency(root, {
      lineCode: 'N4',
      dayType: 'weekday',
      publishedSchedule: { lineCode: 'N4', dayType: 'weekday', scheduleId: 'N4', departures: [], trips: [], provenance }
    });
    expect(root.querySelector('[data-no-service]')?.textContent).toBe('No published service for this day type');
    expect(root.querySelector('[data-line-departures]')).toBeNull();
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

  it('visibly labels provisional fixture schedules as unverified', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'A',
      dayType: 'weekday',
      publishedSchedule: {
        lineCode: 'A',
        dayType: 'weekday',
        scheduleId: 'A',
        departures: ['08:00'],
        provenance: {
          kind: 'provisional-fixture',
          sourceName: 'Synthetic provisional evaluation fixture',
          evidenceRef: 'spec.md#FR-031',
          fetchedAt: '2026-10-27T12:00:00.000Z'
        }
      }
    });

    expect(root.querySelector('[data-provisional-warning]')?.textContent)
      .toContain('Provisional data — inferred and not verified by the provider.');
    const provenance = root.querySelector('[data-schedule-provenance]')?.textContent ?? '';
    expect(provenance).toContain('Synthetic provisional evaluation fixture');
    expect(provenance).not.toContain('2026-10-27T12:00:00.000Z');
    expect(provenance).toMatch(/2026/);
  });

  it('keeps provisional geometry decorative without a verified stop-by-stop equivalent', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'A',
      dayType: 'weekday',
      routeShape: {
        lineCode: 'A',
        shapeId: 'Route_1005',
        crs: 'OGC:CRS84',
        geometry: { type: 'LineString', coordinates: [[-8.62, 42.23], [-8.63, 42.24]] },
        provenance: {
          kind: 'provisional-fixture',
          sourceName: 'Synthetic provisional geometry evaluation fixture',
          evidenceRef: 'spec.md#FR-025'
        }
      },
      tripStops: {
        lineCode: 'A',
        dayType: 'weekday',
        tripId: 'A  02LP000_008002_4',
        stops: [
          { sequence: 1, stop: { id: 'stop-1', code: '2789', municipalCode: '2789', vitrasaId: null, name: 'Airport', lat: 42.23, lon: -8.62, lineIds: ['A'] } },
          { sequence: 2, stop: { id: 'stop-2', code: '2790', municipalCode: '2790', vitrasaId: null, name: 'City centre', lat: 42.24, lon: -8.63, lineIds: ['A'] } }
        ],
        provenance: {
          kind: 'provisional-fixture',
          sourceName: 'Synthetic provisional trip-stop evaluation fixture',
          evidenceRef: 'spec.md#FR-032'
        }
      }
    });

    expect(root.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(root.querySelector('[data-route-shape-text-alternative]')?.textContent)
      .toContain('no verified stop-by-stop description');
    expect(root.querySelector('[data-route-shape] [data-provenance-source]')?.textContent)
      .toContain('Synthetic provisional geometry evaluation fixture');
    expect(root.querySelectorAll('[data-provisional-warning]')).toHaveLength(2);
    expect(root.querySelector('[data-trip-stop-sequence] [data-provenance-source]')?.textContent)
      .toContain('Synthetic provisional trip-stop evaluation fixture');
    expect([...root.querySelector('[data-trip-stop-sequence] ol')!.querySelectorAll('li')].map((item) => item.textContent))
      .toEqual(['Airport', 'City centre']);
    expect(root.textContent).not.toContain('stop-1');
  });

  it('exposes day tabs as a keyboard-operable tablist with a labeled panel', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: 'A',
      dayType: 'weekday',
      onDayTypeChange: () => undefined,
      publishedSchedule: {
        lineCode: 'A',
        dayType: 'weekday',
        scheduleId: 'A',
        departures: ['08:00'],
        provenance: {
          kind: 'provisional-fixture',
          sourceName: 'Synthetic provisional schedule evaluation fixture',
          evidenceRef: 'spec.md#FR-031',
          fetchedAt: '2026-10-27T12:00:00.000Z'
        }
      }
    });

    const tabList = root.querySelector('[role="tablist"]');
    expect(tabList?.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(root.querySelector('[role="tab"][data-day-type="weekday"]')?.getAttribute('tabindex')).toBe('0');
    expect(root.querySelector('[role="tab"][data-day-type="saturday"]')?.getAttribute('tabindex')).toBe('-1');
    expect(root.querySelector('[role="tabpanel"]')?.getAttribute('aria-labelledby')).toBe('line-day-tab-weekday');
    expect(root.textContent).toContain('Provisional fixture evaluation');
    expect(root.textContent).not.toContain('Published departures');
  });
});
