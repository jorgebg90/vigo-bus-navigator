// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderMap } from '../../src/ui/map/map-view';
import type { MapPort } from '../../src/application/ports';
import { setDocumentLanguage } from '../../src/i18n';

describe('US3 map fallback', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('shows an accessible stop list when tiles are unavailable', () => {
    const root = document.createElement('main');
    const map: MapPort = { mount: () => undefined, showStops: () => undefined, fitTo: () => undefined, onStopSelected: () => () => undefined, setTheme: () => undefined, unmount: () => undefined };
    renderMap(root, map, [{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['l4a'] }], 'light', false);
    expect(root.textContent).toContain('Map unavailable');
    expect(root.textContent).toContain('Central');
    expect(root.textContent).toContain('42.2');
  });
});
