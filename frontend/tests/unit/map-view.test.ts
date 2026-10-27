// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { StopMapPort } from '../../src/application/ports';
import type { MapStop } from '../../src/domain/map-stops';
import { renderMap } from '../../src/ui/map/map-view';
import type { Stop } from '../../src/domain/types';
import { setDocumentLanguage } from '../../src/i18n';

const stops: Stop[] = [{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['l4a'] }];

describe('map view', () => {
  it('maps only located in-bounds stops and does not expose coordinates in fallback list', () => {
    setDocumentLanguage('en');
    const shownStops: MapStop[][] = [];
    const calls: string[] = [];
    const map: StopMapPort = {
      mount: () => undefined, setStops: (visibleStops) => shownStops.push(visibleStops), fitToStops: () => calls.push('fit'), focusStop: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      zoomIn: () => undefined, zoomOut: () => undefined, getMapCenter: () => [-8.72, 42.24], getStopsInView: () => [],
      setTheme: () => undefined, unmount: () => undefined
    };
    const root = document.createElement('main');
    renderMap(root, map, [
      stops[0],
      { id: 's2', code: '1002', vitrasaId: null, name: 'Outside Vigo', lat: 40.0, lon: -8.7, lineIds: ['l4a'] }
    ]);

    expect(root.querySelector('[role="status"]')).toBeNull();
    expect(shownStops).toEqual([[{
      id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', coordinates: [-8.7, 42.2], lineIds: ['l4a']
    }]]);
    expect(calls).toEqual(['fit']);

    renderMap(root, map, [{ ...stops[0], lat: null, lon: null }], 'light', false);
    expect(root.textContent).not.toContain('42.2');
    expect(root.textContent).not.toContain('-8.7');
  });

  it('mounts, renders stops, fits them, and unmounts', () => {
    const calls: string[] = [];
    const map: StopMapPort = {
      mount: () => calls.push('mount'), setStops: () => calls.push('stops'), fitToStops: () => calls.push('fit'), focusStop: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      zoomIn: () => undefined, zoomOut: () => undefined, getMapCenter: () => [-8.72, 42.24], getStopsInView: () => [],
      setTheme: () => undefined, unmount: () => calls.push('unmount')
    };
    const root = document.createElement('main');
    const cleanup = renderMap(root, map, stops);
    expect(calls).toEqual(['mount', 'stops', 'fit']);
    cleanup();
    expect(calls).toContain('unmount');
  });

  it('announces map tile failures and exposes Retry and Use search actions', () => {
    const root = document.createElement('main');
    const map: StopMapPort = {
      mount: () => undefined, setStops: () => undefined, fitToStops: () => undefined, focusStop: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      zoomIn: () => undefined, zoomOut: () => undefined, getMapCenter: () => [-8.72, 42.24], getStopsInView: () => [],
      setTheme: () => undefined, unmount: () => undefined
    };
    renderMap(root, map, stops, 'light', false);

    expect(root.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelector('[data-map-retry]')).toBeTruthy();
    expect(root.querySelector('[data-map-use-search]')).toBeTruthy();
  });
});
