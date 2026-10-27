import type { StopMapPort } from '../../application/ports';
import type { MapStop } from '../../domain/map-stops';
import { translateCurrent } from '../../i18n';
import 'maplibre-gl/dist/maplibre-gl.css';

const SOURCE_ID = 'bus-stops';
const CLUSTER_LAYER_ID = 'stop-clusters';
const CLUSTER_COUNT_LAYER_ID = 'stop-cluster-count';
const STOP_LAYER_ID = 'stop-points';
const STOP_HIT_LAYER_ID = 'stop-hit-targets';
const SELECTION_LAYER_ID = 'selected-stop-ring';
const CLUSTER_MAX_ZOOM = 16;
const HIT_HALF_SIZE = 22;

const styles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
} as const;

type StopFeatureCollection = Exclude<import('maplibre-gl').GeoJSONSourceSpecification['data'], string>;

function featureCollection(stops: MapStop[]): StopFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stops.map((stop) => ({
      type: 'Feature',
      id: stop.id,
      geometry: { type: 'Point', coordinates: stop.coordinates },
      properties: { stopId: stop.id, name: stop.name, code: stop.code, lineIds: stop.lineIds }
    }))
  } as StopFeatureCollection;
}

export class BrowserMapPort implements StopMapPort {
  private container?: HTMLElement;
  private map?: import('maplibre-gl').Map;
  private stops: MapStop[] = [];
  private selectedStopId: string | null = null;
  private focusedStopId: string | null = null;
  private ready = false;
  private stopSelected?: (stopId: string) => void;
  private chooserRequested?: (stopIds: string[]) => void;
  private reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void {
    this.container = container;
    container.dataset.theme = options.theme;
    container.dataset.mapStyle = styles[options.theme];
    container.dataset.engine = 'maplibre-clustered-geojson';
    container.dataset.motion = this.reducedMotion ? 'instant' : 'standard';
    container.dataset.stopCount = String(this.stops.length);
    container.dataset.stopCoordinates = JSON.stringify(this.stops.map((stop) => stop.coordinates));
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', translateCurrent('mapLabel'));
    const canvas = document.createElement('div');
    canvas.className = 'map-canvas';
    container.append(canvas);
    void this.loadMap(canvas, options.theme);
  }

  private async loadMap(container: HTMLElement, theme: 'light' | 'dark'): Promise<void> {
    try {
      const maplibre = await import('maplibre-gl');
      if (!this.container) return;
      this.map = new maplibre.Map({ container, style: styles[theme], center: [-8.72, 42.24], zoom: 12, attributionControl: false });
      const mapCanvas = container.querySelector<HTMLCanvasElement>('.maplibregl-canvas');
      mapCanvas?.setAttribute('aria-hidden', 'true');
      mapCanvas?.setAttribute('tabindex', '-1');
      this.map.on('error', () => { this.container?.setAttribute('data-tiles', 'unavailable'); });
      this.map.on('load', () => {
        if (!this.map) return;
        this.map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: featureCollection(this.stops),
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          promoteId: 'stopId'
        });
        const mapStop = getComputedStyle(document.documentElement).getPropertyValue('--map-stop').trim() || '#9B2F3B';
        const mapHalo = getComputedStyle(document.documentElement).getPropertyValue('--map-halo').trim() || '#FFFFFF';
        const selectionRing = getComputedStyle(document.documentElement).getPropertyValue('--map-selection-ring').trim() || '#7D2230';
        this.map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': mapStop,
            'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 24],
            'circle-stroke-color': mapHalo,
            'circle-stroke-width': 3
          }
        });
        this.map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
          paint: { 'text-color': mapHalo }
        });
        this.map.addLayer({
          id: STOP_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': mapStop, 'circle-radius': 7, 'circle-stroke-color': mapHalo, 'circle-stroke-width': 3 }
        });
        this.map.addLayer({
          id: SELECTION_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': 'rgba(0, 0, 0, 0)',
            'circle-radius': 13,
            'circle-stroke-color': selectionRing,
            'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3, 0]
          }
        });
        this.map.addLayer({
          id: STOP_HIT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: { 'circle-radius': HIT_HALF_SIZE, 'circle-color': 'rgba(0, 0, 0, 0)', 'circle-opacity': 0 }
        });
        this.map.on('click', (event) => { void this.handleMapClick(event); });
        this.map.on('mouseenter', CLUSTER_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', CLUSTER_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
        this.map.on('mouseenter', STOP_HIT_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', STOP_HIT_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
        this.refreshSelectionRing();
        this.ready = true;
        if (this.focusedStopId) this.applyFocus();
        else this.fitStops(this.stops);
      });
    } catch {
      this.container?.setAttribute('data-tiles', 'unavailable');
    }
  }

  private async handleMapClick(event: import('maplibre-gl').MapMouseEvent): Promise<void> {
    if (!this.map) return;
    const queried = this.map.queryRenderedFeatures([
      [event.point.x - HIT_HALF_SIZE, event.point.y - HIT_HALF_SIZE],
      [event.point.x + HIT_HALF_SIZE, event.point.y + HIT_HALF_SIZE]
    ], { layers: [CLUSTER_LAYER_ID, STOP_HIT_LAYER_ID] });
    const nearby = queried.filter((feature) => {
      if (feature.geometry.type !== 'Point') return false;
      const point = this.map!.project(feature.geometry.coordinates as [number, number]);
      return Math.abs(point.x - event.point.x) <= HIT_HALF_SIZE && Math.abs(point.y - event.point.y) <= HIT_HALF_SIZE;
    });
    const cluster = nearby.find((feature) => Number(feature.properties?.cluster) === 1);
    if (cluster) {
      const source = this.map.getSource(SOURCE_ID) as import('maplibre-gl').GeoJSONSource;
      const clusterId = Number(cluster.properties?.cluster_id);
      const expansionZoom = await source.getClusterExpansionZoom(clusterId);
      const leaves = await source.getClusterLeaves(clusterId, 1_000, 0);
      const stopIds = leaves.map((feature) => String(feature.properties?.stopId ?? '')).filter(Boolean);
      const coordinates = leaves.map((feature) => JSON.stringify(feature.geometry.type === 'Point' ? feature.geometry.coordinates : []));
      const coincident = new Set(coordinates).size < stopIds.length;
      if (expansionZoom > CLUSTER_MAX_ZOOM || coincident) {
        this.chooserRequested?.(stopIds);
        return;
      }
      if (this.reducedMotion) this.container?.setAttribute('data-camera-motion', 'instant');
      if (this.reducedMotion) this.map.jumpTo({ center: cluster.geometry.type === 'Point' ? cluster.geometry.coordinates as [number, number] : undefined, zoom: expansionZoom });
      else this.map.easeTo({ center: cluster.geometry.type === 'Point' ? cluster.geometry.coordinates as [number, number] : undefined, zoom: expansionZoom, duration: 300 });
      return;
    }
    const stops = nearby.filter((feature) => feature.sourceLayer !== 'clusters')
      .map((feature) => String(feature.properties?.stopId ?? '')).filter(Boolean);
    const uniqueIds = [...new Set(stops)];
    if (uniqueIds.length > 1) this.chooserRequested?.(uniqueIds);
    else if (uniqueIds[0]) this.stopSelected?.(uniqueIds[0]);
  }

  setStops(stops: MapStop[]): void {
    this.stops = stops;
    if (this.container) {
      this.container.dataset.stopCount = String(stops.length);
      this.container.dataset.stopCoordinates = JSON.stringify(stops.map((stop) => stop.coordinates));
    }
    const source = this.map?.getSource(SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(featureCollection(stops));
    this.refreshSelectionRing();
  }

  setSelectedStop(stopId: string | null): void {
    this.selectedStopId = stopId;
    this.container?.setAttribute('data-selection-motion', this.reducedMotion ? 'instant' : 'standard');
    this.refreshSelectionRing();
  }

  onStopSelected(listener: (stopId: string) => void): () => void {
    this.stopSelected = listener;
    return () => { if (this.stopSelected === listener) this.stopSelected = undefined; };
  }

  onChooserRequested(listener: (stopIds: string[]) => void): () => void {
    this.chooserRequested = listener;
    return () => { if (this.chooserRequested === listener) this.chooserRequested = undefined; };
  }

  fitToStops(): void {
    this.focusedStopId = null;
    this.fitStops(this.stops);
  }

  focusStop(stopId: string): void {
    this.focusedStopId = stopId;
    this.container?.setAttribute('data-focused-stop', stopId);
    if (this.ready) this.applyFocus();
  }

  private applyFocus(): void {
    const stop = this.stops.find((candidate) => candidate.id === this.focusedStopId);
    if (!stop || !this.map) return;
    const zoom = Math.max(this.map.getZoom(), CLUSTER_MAX_ZOOM + 1);
    if (this.reducedMotion) this.map.jumpTo({ center: stop.coordinates, zoom });
    else this.map.easeTo({ center: stop.coordinates, zoom, duration: 300 });
  }

  private fitStops(stops: MapStop[]): void {
    this.container?.setAttribute('data-fit-motion', this.reducedMotion ? 'instant' : 'standard');
    if (stops.length === 0) return;
    const coordinates = stops.map((stop) => stop.coordinates);
    if (coordinates.length === 1) {
      const stop = coordinates[0];
      this.map?.jumpTo({ center: stop, zoom: Math.max(this.map.getZoom(), 14) });
      return;
    }
    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);
    this.map?.fitBounds(
      [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
      { padding: 48, maxZoom: 15, duration: this.reducedMotion ? 0 : 300 }
    );
  }

  zoomIn(): void {
    if (!this.map) return;
    if (this.reducedMotion) this.map.jumpTo({ zoom: this.map.getZoom() + 1 });
    else this.map.zoomIn({ duration: 200 });
  }

  zoomOut(): void {
    if (!this.map) return;
    if (this.reducedMotion) this.map.jumpTo({ zoom: this.map.getZoom() - 1 });
    else this.map.zoomOut({ duration: 200 });
  }

  getMapCenter(): [number, number] {
    const center = this.map?.getCenter();
    return center ? [center.lng, center.lat] : [-8.72, 42.24];
  }

  getStopsInView(stops: import('../../domain/types').Stop[]): import('../../domain/types').Stop[] {
    if (!this.map) return stops.slice(0, 50);
    const bounds = this.map.getBounds();
    const center = this.getMapCenter();
    return stops.filter((stop) => stop.lat !== null && stop.lon !== null
      && bounds.contains([stop.lon, stop.lat]))
      .sort((left, right) => {
        const distance = (stop: import('../../domain/types').Stop) =>
          (stop.lon! - center[0]) ** 2 + (stop.lat! - center[1]) ** 2;
        return distance(left) - distance(right) || left.name.localeCompare(right.name);
      })
      .slice(0, 50);
  }

  private refreshSelectionRing(): void {
    if (!this.map?.getSource(SOURCE_ID)) return;
    for (const stop of this.stops) {
      this.map.setFeatureState({ source: SOURCE_ID, id: stop.id }, { selected: stop.id === this.selectedStopId });
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    if (this.container) {
      this.container.dataset.theme = theme;
      this.container.dataset.mapStyle = styles[theme];
    }
    this.map?.setStyle(styles[theme]);
  }

  unmount(): void {
    this.map?.remove();
    this.map = undefined;
    this.container?.replaceChildren();
    this.container = undefined;
    this.stops = [];
    this.selectedStopId = null;
    this.focusedStopId = null;
    this.ready = false;
  }
}