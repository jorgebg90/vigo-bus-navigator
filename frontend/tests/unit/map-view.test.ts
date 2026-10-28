// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { StopMapPort } from '../../src/application/ports';
import type { MapStop } from '../../src/domain/map-stops';
import { BrowserMapPort } from '../../src/infrastructure/map/map-port';
import { renderMap } from '../../src/ui/map/map-view';
import type { CurrentLocation, SelectedLineRouteDisplay, Stop } from '../../src/domain/types';
import { setDocumentLanguage } from '../../src/i18n';

const stops: Stop[] = [{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['l4a'] }];

describe('map view', () => {
  it('keeps a location marker independent of stops and applies a pending position after map load', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const sources = new Map<string, { data: unknown; setData(data: unknown): void }>();
    const layers: Array<{ id: string; source?: string }> = [];
    const handlers = new Map<string, (event?: { originalEvent?: unknown }) => void>();
    const jumpTo = vi.fn();
    const fakeMap = {
      on: (event: string, listener: string | ((event?: { originalEvent?: unknown }) => void), callback?: (event?: { originalEvent?: unknown }) => void) => {
        const handler = typeof listener === 'function' ? listener : callback;
        if (event === 'load' && handler) queueMicrotask(() => handler());
        else if (handler) handlers.set(event, handler);
        return fakeMap;
      },
      addSource: (id: string, source: { data: unknown }) => {
        sources.set(id, { data: source.data, setData(data) { this.data = data; } });
      },
      addLayer: (layer: { id: string; source?: string }) => layers.push(layer),
      getSource: (id: string) => sources.get(id),
      setFeatureState: () => undefined,
      getCanvas: () => ({ style: {} }),
      getZoom: () => 12,
      fitBounds: vi.fn(),
      jumpTo,
      easeTo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getCenter: () => ({ lng: -8.72, lat: 42.24 }),
      getBounds: () => ({ contains: () => true }),
      queryRenderedFeatures: () => [],
      project: () => ({ x: 0, y: 0 }),
      setStyle: vi.fn(),
      remove: vi.fn()
    };
    const container = document.createElement('div');
    const port = new BrowserMapPort(async () => fakeMap as unknown as import('maplibre-gl').Map);
    port.mount(container, { theme: 'light' });
    port.setStops([{ id: 's1', code: '1001', vitrasaId: null, name: 'Central', lineIds: [], coordinates: [-8.7, 42.2] }]);
    const shown = port.showLocation({ latitude: 42.25, longitude: -8.71, accuracyMeters: 10 });

    await expect(shown).resolves.toEqual({ cameraCentered: true, hasVisibleStops: true });
    const source = sources.get('user-location');
    expect(source?.data).toMatchObject({
      type: 'FeatureCollection',
      features: [{ geometry: { type: 'Point', coordinates: [-8.71, 42.25] } }]
    });
    expect(layers).toContainEqual(expect.objectContaining({ id: 'user-location-marker', source: 'user-location' }));
    expect(jumpTo).toHaveBeenCalledWith({ center: [-8.71, 42.25], zoom: expect.any(Number) });
    expect(container.dataset.motion).toBe('instant');
    expect(fakeMap.easeTo).not.toHaveBeenCalled();

    port.clearLocation();
    expect(source?.data).toMatchObject({ features: [] });
    port.unmount();
    vi.unstubAllGlobals();
  });

  it('does not recenter on a location returned after manual map movement', async () => {
    const handlers = new Map<string, (event?: { originalEvent?: unknown }) => void>();
    const jumpTo = vi.fn();
    const zoomIn = vi.fn();
    const fakeMap = {
      on: (event: string, listener: string | ((event?: { originalEvent?: unknown }) => void), callback?: (event?: { originalEvent?: unknown }) => void) => {
        const handler = typeof listener === 'function' ? listener : callback;
        if (event === 'load' && handler) queueMicrotask(() => handler());
        else if (handler) handlers.set(event, handler);
        return fakeMap;
      },
      addSource: () => undefined,
      addLayer: () => undefined,
      getSource: () => undefined,
      setFeatureState: () => undefined,
      getCanvas: () => ({ style: {} }),
      getZoom: () => 12,
      fitBounds: vi.fn(),
      jumpTo,
      easeTo: vi.fn(),
      zoomIn,
      zoomOut: vi.fn(),
      getCenter: () => ({ lng: -8.72, lat: 42.24 }),
      getBounds: () => ({ contains: () => true }),
      queryRenderedFeatures: () => [],
      project: () => ({ x: 0, y: 0 }),
      setStyle: vi.fn(),
      remove: vi.fn()
    };
    const port = new BrowserMapPort(async () => fakeMap as unknown as import('maplibre-gl').Map);
    port.mount(document.createElement('div'), { theme: 'light' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    port.zoomIn();
    handlers.get('movestart')?.({ originalEvent: {} });

    await port.showLocation({ latitude: 42.25, longitude: -8.71, accuracyMeters: 10 });

    expect(zoomIn).toHaveBeenCalledOnce();
    expect(jumpTo).not.toHaveBeenCalled();
    port.unmount();
  });

  it('still opens the stop chooser for a maximum-zoom cluster', async () => {
    const handlers = new Map<string, (event?: { point: { x: number; y: number } }) => void>();
    const queriedFeature = {
      geometry: { type: 'Point', coordinates: [-8.72, 42.24] },
      properties: { cluster: 1, cluster_id: 7 }
    };
    const sources = new Map<string, {
      data: unknown;
      setData(data: unknown): void;
      getClusterExpansionZoom(): Promise<number>;
      getClusterLeaves(): Promise<Array<{ geometry: { type: 'Point'; coordinates: number[] }; properties: { stopId: string } }>>;
    }>();
    const fakeMap = {
      on: (event: string, listener: string | ((event?: { point: { x: number; y: number } }) => void), callback?: (event?: { point: { x: number; y: number } }) => void) => {
        const handler = typeof listener === 'function' ? listener : callback;
        if (event === 'load' && handler) queueMicrotask(() => handler());
        else if (handler) handlers.set(event, handler);
        return fakeMap;
      },
      addSource: (id: string, source: { data: unknown }) => {
        sources.set(id, {
          data: source.data,
          setData(data) { this.data = data; },
          getClusterExpansionZoom: async () => 17,
          getClusterLeaves: async () => [{
            geometry: { type: 'Point' as const, coordinates: [-8.72, 42.24] },
            properties: { stopId: 'stop-1' }
          }]
        });
      },
      addLayer: () => undefined,
      getSource: (id: string) => sources.get(id),
      setFeatureState: () => undefined,
      getCanvas: () => ({ style: {} }),
      getZoom: () => 12,
      fitBounds: vi.fn(),
      jumpTo: vi.fn(),
      easeTo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getCenter: () => ({ lng: -8.72, lat: 42.24 }),
      getBounds: () => ({ contains: () => true }),
      queryRenderedFeatures: () => [queriedFeature],
      project: () => ({ x: 100, y: 100 }),
      setStyle: vi.fn(),
      remove: vi.fn()
    };
    const port = new BrowserMapPort(async () => fakeMap as unknown as import('maplibre-gl').Map);
    const chooserRequested = vi.fn();
    port.onChooserRequested(chooserRequested);
    port.mount(document.createElement('div'), { theme: 'light' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await handlers.get('click')?.({ point: { x: 100, y: 100 } });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(chooserRequested).toHaveBeenCalledWith(['stop-1']);
    port.unmount();
  });

  it('replaces and clears route overlays, fitting all directions around the visible panel', async () => {
    const sources = new Map<string, { data: unknown; setData(data: unknown): void }>();
    const layers: Array<{ id: string }> = [];
    const fitBounds = vi.fn();
    const handlers = new Map<string, (event?: { point: { x: number; y: number } }) => void>();
    const queryRenderedFeatures = vi.fn((_bounds: unknown, _options: { layers: string[] }) => [{
      geometry: { type: 'Point', coordinates: [-8.72, 42.24] },
      properties: { stopId: 'stop-1' }
    }]);
    const fakeMap = {
      on: (event: string, listenerOrLayer: string | (() => void), listener?: () => void) => {
        const handler = typeof listenerOrLayer === 'function' ? listenerOrLayer : listener;
        if (event === 'load' && handler) queueMicrotask(handler);
        else if (handler) handlers.set(event, handler);
        return fakeMap;
      },
      addSource: (id: string, source: { data: unknown }) => {
        sources.set(id, { data: source.data, setData(data) { this.data = data; } });
      },
      addLayer: (layer: { id: string }) => layers.push(layer),
      getSource: (id: string) => sources.get(id),
      setFeatureState: () => undefined,
      getCanvas: () => ({ style: {} }),
      getZoom: () => 12,
      fitBounds,
      jumpTo: vi.fn(),
      easeTo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getCenter: () => ({ lng: -8.72, lat: 42.24 }),
      getBounds: () => ({ contains: () => true }),
      queryRenderedFeatures,
      project: () => ({ x: 100, y: 100 }),
      setStyle: vi.fn(),
      remove: vi.fn()
    };
    const container = document.createElement('div');
    let mapBounds = ({
      x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700,
      toJSON: () => ({})
    }) as DOMRect;
    const panel = document.createElement('div');
    panel.className = 'destination-view';
    let panelBounds = ({
      x: 76, y: 12, left: 76, top: 12, right: 460, bottom: 600, width: 384, height: 588,
      toJSON: () => ({})
    }) as DOMRect;
    container.getBoundingClientRect = () => mapBounds;
    panel.getBoundingClientRect = () => panelBounds;
    document.body.append(container, panel);

    const route: SelectedLineRouteDisplay = {
      lineId: 'line-a',
      lineCode: 'A',
      directions: [
        { direction: 0, headsign: 'Outbound', shapeId: 'shape-a', geometry: { type: 'LineString', coordinates: [[-8.75, 42.2], [-8.7, 42.25]] } },
        { direction: 1, headsign: 'Inbound', shapeId: 'shape-b', geometry: { type: 'LineString', coordinates: [[-8.7, 42.25], [-8.65, 42.3]] } }
      ]
    };
    const port = new BrowserMapPort(async () => fakeMap as unknown as import('maplibre-gl').Map);
    const stopSelected = vi.fn();
    port.onStopSelected(stopSelected);
    port.mount(container, { theme: 'light' });
    const lineStops: MapStop[] = [
      { id: 'stop-a', code: '1001', vitrasaId: null, name: 'A Stop', lineIds: ['line-a'], coordinates: [-8.75, 42.2] },
      { id: 'stop-b', code: '1002', vitrasaId: null, name: 'B Stop', lineIds: ['line-b'], coordinates: [-8.7, 42.25] },
      { id: 'stop-a-shared', code: '1003', vitrasaId: null, name: 'Shared Stop', lineIds: ['line-a', 'line-b'], coordinates: [-8.65, 42.3] }
    ];
    port.setStops(lineStops);
    port.setLineRoute(route);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sources.get('bus-stops')?.data).toMatchObject({
      type: 'FeatureCollection',
      features: [
        { id: 'stop-a', properties: { stopId: 'stop-a', lineIds: ['line-a'] } },
        { id: 'stop-a-shared', properties: { stopId: 'stop-a-shared', lineIds: ['line-a', 'line-b'] } }
      ]
    });
    expect(container.dataset.stopCount).toBe('2');
    expect(container.dataset.stopCoordinates).toBe(JSON.stringify([[-8.75, 42.2], [-8.65, 42.3]]));
    const source = sources.get('line-routes');
    expect(source?.data).toMatchObject({
      type: 'FeatureCollection',
      features: [
        { properties: { lineCode: 'A', shapeId: 'shape-a', direction: 0 } },
        { properties: { lineCode: 'A', shapeId: 'shape-b', direction: 1 } }
      ]
    });
    expect(layers.findIndex(({ id }) => id === 'line-route-direction-0'))
      .toBeLessThan(layers.findIndex(({ id }) => id === 'stop-hit-targets'));
    expect(fitBounds).toHaveBeenLastCalledWith(
      [[-8.75, 42.2], [-8.65, 42.3]],
      expect.objectContaining({ padding: expect.objectContaining({ left: 484 }), duration: 300 })
    );
    await handlers.get('click')?.({ point: { x: 100, y: 100 } });
    expect(queryRenderedFeatures.mock.calls[0]?.[1]).toEqual({ layers: ['stop-clusters', 'stop-hit-targets'] });
    expect(stopSelected).toHaveBeenCalledWith('stop-1');

    port.setLineRoute({
      lineId: 'line-b',
      lineCode: 'B',
      directions: [{ direction: 0, headsign: 'Central', shapeId: 'shape-c', geometry: { type: 'LineString', coordinates: [[-8.6, 42.1], [-8.55, 42.15]] } }]
    });
    expect(source?.data).toMatchObject({ features: [{ properties: { lineCode: 'B', shapeId: 'shape-c' } }] });
    expect(sources.get('bus-stops')?.data).toMatchObject({
      features: [
        { id: 'stop-b' },
        { id: 'stop-a-shared' }
      ]
    });
    mapBounds = {
      ...mapBounds,
      right: 320,
      width: 320
    };
    panelBounds = {
      ...panelBounds,
      right: 308,
      width: 232
    };
    port.setLineRoute({
      lineId: 'line-mobile',
      lineCode: 'M',
      directions: [{ direction: 0, headsign: 'Route', shapeId: 'shape-mobile', geometry: { type: 'LineString', coordinates: [[-8.6, 42.1], [-8.55, 42.15]] } }]
    });
    expect(fitBounds).toHaveBeenLastCalledWith(
      [[-8.6, 42.1], [-8.55, 42.15]],
      expect.objectContaining({ padding: expect.objectContaining({ left: 240 }) })
    );
    port.setLineRoute({
      lineId: 'line-c',
      lineCode: 'C',
      directions: [
        { direction: 0, headsign: 'Outbound', shapeId: 'shape-shared', geometry: { type: 'LineString', coordinates: [[-8.6, 42.1], [-8.55, 42.15]] } },
        { direction: 1, headsign: 'Inbound', shapeId: 'shape-shared', geometry: { type: 'LineString', coordinates: [[-8.6, 42.1], [-8.55, 42.15]] } }
      ]
    });
    expect(source?.data).toMatchObject({ features: [{ properties: { lineCode: 'C', shapeId: 'shape-shared' } }] });
    port.setLineRoute({
      lineId: 'line-invalid',
      lineCode: 'INVALID',
      directions: [{ direction: 0, headsign: 'Invalid', shapeId: 'shape-invalid', geometry: { type: 'LineString', coordinates: [[-8.6, 42.1], [Number.NaN, 42.15]] } }]
    });
    expect(source?.data).toMatchObject({ features: [] });
    port.setLineRoute(null);
    expect(source?.data).toMatchObject({ features: [] });
    expect(container.dataset.routeCount).toBe('0');
    expect(sources.get('bus-stops')?.data).toMatchObject({
      features: lineStops.map((stop) => ({ id: stop.id }))
    });
    expect(container.dataset.stopCount).toBe('3');
    port.unmount();
    panel.remove();
  });

  it('uses an immediate camera fit when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const fitBounds = vi.fn();
    const fakeMap = {
      on: (event: string, listener: string | (() => void), callback?: () => void) => {
        const handler = typeof listener === 'function' ? listener : callback;
        if (event === 'load' && handler) queueMicrotask(handler);
        return fakeMap;
      },
      addSource: () => undefined,
      addLayer: () => undefined,
      getSource: () => undefined,
      setFeatureState: () => undefined,
      getCanvas: () => ({ style: {} }),
      getZoom: () => 12,
      fitBounds,
      jumpTo: vi.fn(),
      easeTo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getCenter: () => ({ lng: -8.72, lat: 42.24 }),
      getBounds: () => ({ contains: () => true }),
      queryRenderedFeatures: () => [],
      project: () => ({ x: 0, y: 0 }),
      setStyle: vi.fn(),
      remove: vi.fn()
    };
    const container = document.createElement('div');
    const port = new BrowserMapPort(async () => fakeMap as unknown as import('maplibre-gl').Map);
    try {
      port.mount(container, { theme: 'light' });
      port.setLineRoute({
        lineId: 'line-a',
        lineCode: 'A',
        directions: [{ direction: 0, headsign: 'Outbound', shapeId: 'shape-a', geometry: { type: 'LineString', coordinates: [[-8.75, 42.2], [-8.7, 42.25]] } }]
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container.dataset.routeFitMotion).toBe('instant');
      expect(fitBounds).toHaveBeenLastCalledWith(
        [[-8.75, 42.2], [-8.7, 42.25]],
        expect.objectContaining({ duration: 0 })
      );
    } finally {
      port.unmount();
      vi.unstubAllGlobals();
    }
  });

  it('maps only located in-bounds stops and does not expose coordinates in fallback list', () => {
    setDocumentLanguage('en');
    const shownStops: MapStop[][] = [];
    const calls: string[] = [];
    const map: StopMapPort = {
      mount: () => undefined, setStops: (visibleStops) => shownStops.push(visibleStops), fitToStops: () => calls.push('fit'), focusStop: () => undefined,
      showLocation: async () => ({ cameraCentered: false, hasVisibleStops: false }), clearLocation: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      setLineRoute: () => undefined,
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
      showLocation: async () => ({ cameraCentered: false, hasVisibleStops: false }), clearLocation: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      setLineRoute: () => undefined,
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
      showLocation: async () => ({ cameraCentered: false, hasVisibleStops: false }), clearLocation: () => undefined,
      setSelectedStop: () => undefined, onStopSelected: () => () => undefined, onChooserRequested: () => () => undefined,
      setLineRoute: () => undefined,
      zoomIn: () => undefined, zoomOut: () => undefined, getMapCenter: () => [-8.72, 42.24], getStopsInView: () => [],
      setTheme: () => undefined, unmount: () => undefined
    };
    renderMap(root, map, stops, 'light', false);

    expect(root.querySelector('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelector('[data-map-retry]')).toBeTruthy();
    expect(root.querySelector('[data-map-use-search]')).toBeTruthy();
  });
});
