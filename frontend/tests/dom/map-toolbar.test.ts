// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StopMapPort } from '../../src/application/ports';
import { renderMapToolbar } from '../../src/ui/map/map-toolbar';
import { setDocumentLanguage } from '../../src/i18n';

describe('map toolbar', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it('removes the stops-in-view action while retaining zoom and recenter controls', () => {
    const map: StopMapPort = {
      mount: () => undefined, setTheme: () => undefined, unmount: () => undefined,
      setStops: () => undefined, showLocation: async () => ({ cameraCentered: false, hasVisibleStops: false }), clearLocation: () => undefined,
      setLineRoute: () => undefined, setSelectedStop: () => undefined,
      onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      fitToStops: vi.fn(), focusStop: () => undefined, zoomIn: vi.fn(), zoomOut: vi.fn(),
      getMapCenter: () => [-8.72, 42.24], getStopsInView: () => []
    };
    const onRecenter = vi.fn();
    const root = document.createElement('div');

    renderMapToolbar(root, { map, onRecenter });

    expect(root.querySelector('[data-stops-in-view]')).toBeNull();
    root.querySelector<HTMLButtonElement>('[data-recenter]')?.click();
    root.querySelector<HTMLButtonElement>('[data-zoom="in"]')?.click();
    root.querySelector<HTMLButtonElement>('[data-zoom="out"]')?.click();
    expect(map.fitToStops).toHaveBeenCalledOnce();
    expect(map.fitToStops).toHaveBeenCalledWith(true);
    expect(onRecenter).toHaveBeenCalledOnce();
    expect(map.zoomIn).toHaveBeenCalledOnce();
    expect(map.zoomOut).toHaveBeenCalledOnce();
    expect(root.querySelector('[aria-label="Recenter map"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Zoom in"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Zoom out"]')).not.toBeNull();
  });
});
