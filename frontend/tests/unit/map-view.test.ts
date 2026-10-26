// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { MapPort } from '../../src/application/ports';
import { renderMap } from '../../src/ui/map/map-view';
import type { Stop } from '../../src/domain/types';
import { setDocumentLanguage } from '../../src/i18n';

const stops: Stop[] = [{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['l4a'] }];

describe('map view', () => {
  it('announces and excludes stops outside Vigo bounds', () => {
    setDocumentLanguage('en');
    const shownStops: Stop[][] = [];
    const map: MapPort = {
      mount: () => undefined, showStops: (visibleStops) => shownStops.push(visibleStops), fitTo: () => undefined,
      onStopSelected: () => () => undefined, setTheme: () => undefined, unmount: () => undefined
    };
    const root = document.createElement('main');
    renderMap(root, map, [
      stops[0],
      { id: 's2', code: '1002', vitrasaId: null, name: 'Outside Vigo', lat: 40.0, lon: -8.7, lineIds: ['l4a'] }
    ]);

    expect(root.querySelector('[role="status"]')?.textContent).toContain('1 stop(s)');
    expect(shownStops).toEqual([[stops[0]]]);
  });

  it('mounts, renders stops, fits them, and unmounts', () => {
    const calls: string[] = [];
    const map: MapPort = {
      mount: () => calls.push('mount'), showStops: () => calls.push('stops'), fitTo: () => calls.push('fit'),
      onStopSelected: () => () => undefined, setTheme: () => undefined, unmount: () => calls.push('unmount')
    };
    const root = document.createElement('main');
    const cleanup = renderMap(root, map, stops);
    expect(calls).toEqual(['mount', 'stops', 'fit']);
    cleanup();
    expect(calls).toContain('unmount');
  });
});
