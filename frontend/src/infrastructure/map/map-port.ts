import type { MapPort } from '../../application/ports';
import type { Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import 'maplibre-gl/dist/maplibre-gl.css';

const styles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
} as const;

export class BrowserMapPort implements MapPort {
  private container?: HTMLElement;
  private map?: import('maplibre-gl').Map;
  private markerConstructor?: typeof import('maplibre-gl').Marker;
  private stopMarkers: import('maplibre-gl').Marker[] = [];
  private overlay?: import('@deck.gl/mapbox').MapboxOverlay;
  private updateLayers?: () => void;
  private stops: Stop[] = [];
  private fitStopIds: string[] = [];
  private selected?: (stopId: string) => void;

  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void {
    this.container = container;
    container.dataset.theme = options.theme;
    container.dataset.mapStyle = styles[options.theme];
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', translateCurrent('mapLabel'));
    const canvas = document.createElement('div');
    canvas.className = 'map-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.append(canvas);
    void this.loadMap(canvas, options.theme);
  }

  private async loadMap(container: HTMLElement, theme: 'light' | 'dark'): Promise<void> {
    try {
      const [maplibreModule, deck, layers] = await Promise.all([
        import('maplibre-gl'),
        import('@deck.gl/mapbox'),
        import('@deck.gl/layers')
      ]);
      const maplibre = maplibreModule;
      if (!this.container) return;
      this.markerConstructor = maplibre.Marker;
      this.map = new maplibre.Map({ container, style: styles[theme], center: [-8.72, 42.24], zoom: 12 });
      this.map.on('error', () => { this.container?.setAttribute('data-tiles', 'unavailable'); });
      const createLayers = () => {
        const ordered = this.stops;
        const path = ordered.map((stop) => [stop.lon, stop.lat] as [number, number]);
        return [
          new layers.PathLayer({
            id: 'line-route',
            data: path.length > 1 ? [{ path }] : [],
            getPath: (d: { path: [number, number][] }) => d.path,
            getColor: [6, 96, 123, 220],
            getWidth: 4,
            widthUnits: 'pixels'
          }),
          new layers.ScatterplotLayer({
            id: 'bus-stops',
            data: this.stops,
            getPosition: (stop: Stop) => [stop.lon, stop.lat],
            radiusUnits: 'pixels',
            getRadius: 12,
            getFillColor: [6, 96, 123, 245],
            getLineColor: [255, 255, 255, 255],
            getLineWidth: 3,
            lineWidthUnits: 'pixels',
            pickable: true,
            onClick: (info: { object?: Stop }) => {
              if (info.object) {
                this.selected?.(info.object.id);
                this.showStopDetails(info.object);
              }
            }
          })
        ];
      };
      this.overlay = new deck.MapboxOverlay({ interleaved: false, layers: createLayers() });
      this.updateLayers = () => this.overlay?.setProps({ layers: createLayers() });
      this.map.addControl(this.overlay);
      this.showStops(this.stops, {});
      this.fitTo(this.fitStopIds);
      this.container.dataset.engine = 'maplibre-deckgl';
    } catch {
      this.container?.setAttribute('data-tiles', 'unavailable');
    }
  }

  showStops(stops: Stop[], selection: { selectedId?: string }): void {
    this.stops = stops;
    if (!this.container) return;
    this.updateLayers?.();
    this.renderStopMarkers(selection.selectedId);
    const controls = document.createElement('div');
    controls.className = 'map-stop-controls';
    controls.setAttribute('aria-label', translateCurrent('mapStops'));
    controls.append(...stops.map((stop) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = stop.name;
      button.dataset.selected = String(stop.id === selection.selectedId);
      button.setAttribute('aria-label', `${stop.name} (${stop.code})`);
      button.addEventListener('click', () => {
        this.selected?.(stop.id);
        this.showStopDetails(stop);
      });
      return button;
    }));
    this.container.querySelector('.map-stop-controls')?.remove();
    this.container.append(controls);
  }

  private renderStopMarkers(selectedId?: string): void {
    this.stopMarkers.forEach((marker) => marker.remove());
    this.stopMarkers = [];
    if (!this.map || !this.markerConstructor) return;
    const Marker = this.markerConstructor;
    this.stopMarkers = this.stops.map((stop) => {
      const markerElement = document.createElement('button');
      markerElement.type = 'button';
      markerElement.className = 'map-stop-marker';
      markerElement.dataset.selected = String(stop.id === selectedId);
      markerElement.setAttribute('aria-label', `${stop.name} (${stop.code})`);
      markerElement.addEventListener('click', () => {
        this.selected?.(stop.id);
        this.showStopDetails(stop);
      });
      return new Marker({ element: markerElement, anchor: 'center' })
        .setLngLat([stop.lon, stop.lat])
        .addTo(this.map!);
    });
  }

  private showStopDetails(stop: Stop): void {
    if (!this.container) return;
    const details = document.createElement('aside');
    details.className = 'map-stop-details';
    details.setAttribute('role', 'status');
    details.textContent = translateCurrent('stopDetails', {
      name: stop.name,
      code: stop.code,
      lines: stop.lineIds.join(', '),
      lat: stop.lat,
      lon: stop.lon
    });
    this.container.querySelector('.map-stop-details')?.remove();
    this.container.append(details);
  }
  fitTo(stopIds: string[]): void {
    this.fitStopIds = stopIds;
    this.container?.setAttribute('data-fit-count', String(stopIds.length));
    if (!this.map) return;
    const selected = this.stops.filter((stop) => stopIds.includes(stop.id));
    if (selected.length === 0) return;
    const longitudes = selected.map((stop) => stop.lon);
    const latitudes = selected.map((stop) => stop.lat);
    this.map.fitBounds(
      [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
      { padding: 48, maxZoom: 15 }
    );
  }
  onStopSelected(listener: (stopId: string) => void): () => void { this.selected = listener; return () => { this.selected = undefined; }; }
  setTheme(theme: 'light' | 'dark'): void {
    if (this.container) {
      this.container.dataset.theme = theme;
      this.container.dataset.mapStyle = styles[theme];
    }
    this.map?.setStyle(styles[theme]);
  }
  unmount(): void { this.updateLayers = undefined; this.stopMarkers.forEach((marker) => marker.remove()); this.stopMarkers = []; this.markerConstructor = undefined; this.overlay?.finalize(); this.overlay = undefined; this.map?.remove(); this.map = undefined; this.container?.replaceChildren(); this.container = undefined; this.stops = []; this.fitStopIds = []; }
}
