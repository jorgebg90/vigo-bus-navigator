// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderMap } from '../../src/ui/map/map-view';
import type { StopMapPort } from '../../src/application/ports';
import { setDocumentLanguage } from '../../src/i18n';

describe('US3 map fallback', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('shows an accessible stop list when tiles are unavailable', () => {
    const root = document.createElement('main');
    const map: StopMapPort = {
      mount: () => undefined, setStops: () => undefined, fitToStops: () => undefined, focusStop: () => undefined, setSelectedStop: () => undefined,
      showLocation: async () => ({ cameraCentered: false, hasVisibleStops: false }), clearLocation: () => undefined,
      onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      setLineRoute: () => undefined,
      zoomIn: () => undefined, zoomOut: () => undefined, getMapCenter: () => [-8.72, 42.24], getStopsInView: () => [],
      setTheme: () => undefined, unmount: () => undefined
    };
    renderMap(root, map, [{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['l4a'] }], 'light', false);
    expect(root.textContent).toContain('Map unavailable');
    expect(root.textContent).toContain('Central');
    expect(root.textContent).not.toContain('42.2');
    expect(root.textContent).not.toContain('-8.7');
    expect(root.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelector('[data-map-retry]')).toBeTruthy();
    expect(root.querySelector('[data-map-use-search]')).toBeTruthy();
  });
});
