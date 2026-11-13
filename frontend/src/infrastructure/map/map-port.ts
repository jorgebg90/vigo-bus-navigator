import type { LocationDisplayResult, StopMapPort } from '../../application/ports';
import type { MapStop } from '../../domain/map-stops';
import type { CurrentLocation, DirectionalRoute, SelectedLineRouteDisplay } from '../../domain/types';
import type { JourneyPlace, TransitJourney } from '../../domain/transit-journey';
import 'maplibre-gl/dist/maplibre-gl.css';

const SOURCE_ID = 'bus-stops';
const CLUSTER_LAYER_ID = 'stop-clusters';
const CLUSTER_COUNT_LAYER_ID = 'stop-cluster-count';
const STOP_LAYER_ID = 'stop-points';
const STOP_HIT_LAYER_ID = 'stop-hit-targets';
const SELECTION_LAYER_ID = 'selected-stop-ring';
const ROUTE_SOURCE_ID = 'line-routes';
const JOURNEY_SOURCE_ID = 'journey-stops';
const JOURNEY_LAYER_ID = 'journey-stop-markers';
const ITINERARY_SOURCE_ID = 'journey-route';
const ITINERARY_PLACES_SOURCE_ID = 'journey-places';
const ROUTE_DIRECTION_0_LAYER_ID = 'line-route-direction-0';
const ROUTE_DIRECTION_1_LAYER_ID = 'line-route-direction-1';
const LOCATION_SOURCE_ID = 'user-location';
const LOCATION_LAYER_ID = 'user-location-marker';
const CLUSTER_MAX_ZOOM = 16;
const HIT_HALF_SIZE = 22;

const styles = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
} as const;

type StopFeatureCollection = Exclude<import('maplibre-gl').GeoJSONSourceSpecification['data'], string>;
type MapFactory = (container: HTMLElement, style: string) => Promise<import('maplibre-gl').Map>;
interface RouteFeature {
  type: 'Feature';
  properties: { lineCode: string; shapeId: string; direction: 0 | 1; headsign: string };
  geometry: DirectionalRoute['geometry'];
}
interface RouteFeatureCollection {
  type: 'FeatureCollection';
  features: RouteFeature[];
}
interface JourneyStopFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id: string;
    properties: { endpoint: 'origin' | 'destination'; stopId: string; name: string };
    geometry: { type: 'Point'; coordinates: [number, number] };
  }>;
}
interface LocationFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, never>;
    geometry: { type: 'Point'; coordinates: [number, number] };
  }>;
}

function itineraryFeatureCollection(journey: TransitJourney | null) {
  return {
    type: 'FeatureCollection' as const,
    features: journey?.legs.map((leg) => ({
      type: 'Feature' as const,
      properties: { mode: leg.mode },
      geometry: { type: 'LineString' as const, coordinates: leg.coordinates }
    })) ?? []
  };
}

function itineraryPlaces(journey: TransitJourney | null, focused: JourneyPlace | null) {
  const places = journey ? [journey.legs[0].from, ...journey.legs.flatMap((leg) => (
    leg.mode === 'BUS' ? [leg.from, leg.to] : []
  )), journey.legs[journey.legs.length - 1].to] : [];
  if (focused) places.push(focused);
  return {
    type: 'FeatureCollection' as const,
    features: places.map((place) => ({
      type: 'Feature' as const,
      properties: { name: place.name, selected: place === focused },
      geometry: { type: 'Point' as const, coordinates: [place.longitude, place.latitude] }
    }))
  };
}

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

function routeFeatureCollection(route: SelectedLineRouteDisplay | null): RouteFeatureCollection {
  const seenShapeIds = new Set<string>();
  const features = route ? route.directions.flatMap((direction) => {
    if (!isDisplayableDirection(direction) || seenShapeIds.has(direction.shapeId)) return [];
    seenShapeIds.add(direction.shapeId);
    return [{
      type: 'Feature' as const,
      properties: {
        lineCode: route.lineCode,
        shapeId: direction.shapeId,
        direction: direction.direction,
        headsign: direction.headsign
      },
      geometry: direction.geometry
    }];
  }) : [];
  return { type: 'FeatureCollection', features };
}

function locationFeatureCollection(location: CurrentLocation | undefined): LocationFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: location ? [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [location.longitude, location.latitude] }
    }] : []
  };
}

function journeyStopFeatureCollection(
  stops: MapStop[],
  originStopId: string | null,
  destinationStopId: string | null
): JourneyStopFeatureCollection {
  const features: JourneyStopFeatureCollection['features'] = [];
  for (const [endpoint, stopId] of [['origin', originStopId], ['destination', destinationStopId]] as const) {
    const stop = stopId ? stops.find((candidate) => candidate.id === stopId) : undefined;
    if (!stop) continue;
    features.push({
      type: 'Feature',
      id: endpoint,
      properties: { endpoint, stopId: stop.id, name: stop.name },
      geometry: { type: 'Point', coordinates: stop.coordinates }
    });
  }
  return { type: 'FeatureCollection', features };
}

function isDisplayableDirection(direction: DirectionalRoute): boolean {
  return direction.headsign.trim().length > 0
    && direction.shapeId.trim().length > 0
    && direction.geometry.type === 'LineString'
    && direction.geometry.coordinates.length >= 2
    && direction.geometry.coordinates.every(([longitude, latitude]) => (
      Number.isFinite(longitude)
      && Number.isFinite(latitude)
      && longitude >= -180
      && longitude <= 180
      && latitude >= -90
      && latitude <= 90
    ));
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
  private lineRoute: SelectedLineRouteDisplay | null = null;
  private journeyOriginStopId: string | null = null;
  private journeyDestinationStopId: string | null = null;
  private journeyRoute: TransitJourney | null = null;
  private focusedJourneyPlace: JourneyPlace | null = null;
  private location?: CurrentLocation;
  private locationShouldCenter = true;
  private userMoved = false;
  private locationResolvers: Array<(result: LocationDisplayResult) => void> = [];
  private reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  constructor(
    private readonly mapFactory: MapFactory = async (container, style) => {
      const maplibre = await import('maplibre-gl');
      return new maplibre.Map({ container, style, center: [-8.72, 42.24], zoom: 12, attributionControl: false });
    }
  ) {}

  mount(target: object, options: { theme: 'light' | 'dark'; ariaLabel?: string }): void {
    if (!(target instanceof HTMLElement)) throw new TypeError('Map mount target must be an HTMLElement');
    const container = target;
    this.container = container;
    container.dataset.theme = options.theme;
    container.dataset.mapStyle = styles[options.theme];
    container.dataset.engine = 'maplibre-clustered-geojson';
    container.dataset.motion = this.reducedMotion ? 'instant' : 'standard';
    this.updateStopAttributes();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', options.ariaLabel ?? 'Map');
    const canvas = document.createElement('div');
    canvas.className = 'map-canvas';
    container.append(canvas);
    void this.loadMap(canvas, options.theme);
  }

  private async loadMap(container: HTMLElement, theme: 'light' | 'dark'): Promise<void> {
    try {
      if (!this.container) return;
      this.map = await this.mapFactory(container, styles[theme]);
      this.map.on('movestart', (event) => {
        if (event.originalEvent) this.userMoved = true;
      });
      const mapCanvas = container.querySelector<HTMLCanvasElement>('.maplibregl-canvas');
      mapCanvas?.setAttribute('aria-hidden', 'true');
      mapCanvas?.setAttribute('tabindex', '-1');
      this.map.on('error', () => { this.container?.setAttribute('data-tiles', 'unavailable'); });
      this.map.on('load', () => {
        if (!this.map) return;
        this.map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: featureCollection(this.getVisibleStops()),
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          promoteId: 'stopId'
        });
        this.map.addSource(ROUTE_SOURCE_ID, {
          type: 'geojson',
          data: routeFeatureCollection(this.lineRoute)
        });
        this.map.addSource(JOURNEY_SOURCE_ID, {
          type: 'geojson',
          data: journeyStopFeatureCollection(this.stops, this.journeyOriginStopId, this.journeyDestinationStopId)
        });
        this.map.addSource(ITINERARY_SOURCE_ID, { type: 'geojson', data: itineraryFeatureCollection(this.journeyRoute) });
        this.map.addSource(ITINERARY_PLACES_SOURCE_ID, {
          type: 'geojson', data: itineraryPlaces(this.journeyRoute, this.focusedJourneyPlace)
        });
        this.map.addSource(LOCATION_SOURCE_ID, {
          type: 'geojson',
          data: locationFeatureCollection(this.location)
        });
        const mapStop = getComputedStyle(document.documentElement).getPropertyValue('--map-stop').trim() || '#9B2F3B';
        const mapHalo = getComputedStyle(document.documentElement).getPropertyValue('--map-halo').trim() || '#FFFFFF';
        const selectionRing = getComputedStyle(document.documentElement).getPropertyValue('--map-selection-ring').trim() || '#7D2230';
        const mapRoute = getComputedStyle(document.documentElement).getPropertyValue('--map-route').trim() || '#174EA6';
        this.map.addLayer({
          id: ROUTE_DIRECTION_0_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'direction'], 0],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': mapRoute, 'line-width': 5, 'line-opacity': 0.95 }
        });
        this.map.addLayer({
          id: ROUTE_DIRECTION_1_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          filter: ['==', ['get', 'direction'], 1],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': mapRoute, 'line-width': 5, 'line-opacity': 0.95, 'line-dasharray': [2, 1] }
        });
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
        this.map.addLayer({
          id: LOCATION_LAYER_ID,
          type: 'circle',
          source: LOCATION_SOURCE_ID,
          paint: {
            'circle-color': '#1769AA',
            'circle-radius': 8,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 3
          }
        });
        this.map.addLayer({
          id: JOURNEY_LAYER_ID,
          type: 'circle',
          source: JOURNEY_SOURCE_ID,
          paint: {
            'circle-color': ['match', ['get', 'endpoint'], 'origin', '#1684D8', '#F28C28'],
            'circle-radius': 10,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 3
          }
        });
        this.map.addLayer({
          id: 'journey-bus-route', type: 'line', source: ITINERARY_SOURCE_ID,
          filter: ['==', ['get', 'mode'], 'BUS'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1769AA', 'line-width': 6 }
        });
        this.map.addLayer({
          id: 'journey-walk-route', type: 'line', source: ITINERARY_SOURCE_ID,
          filter: ['==', ['get', 'mode'], 'WALK'],
          paint: { 'line-color': '#1769AA', 'line-width': 4, 'line-dasharray': [1, 1.5] }
        });
        this.map.addLayer({
          id: 'journey-place-markers', type: 'circle', source: ITINERARY_PLACES_SOURCE_ID,
          paint: {
            'circle-color': ['case', ['get', 'selected'], '#F28C28', '#1769AA'],
            'circle-radius': ['case', ['get', 'selected'], 10, 6],
            'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 3
          }
        });
        this.map.addLayer({
          id: 'journey-focused-label', type: 'symbol', source: ITINERARY_PLACES_SOURCE_ID,
          filter: ['==', ['get', 'selected'], true],
          layout: { 'text-field': ['get', 'name'], 'text-size': 14, 'text-anchor': 'bottom', 'text-offset': [0, -1.2] },
          paint: { 'text-color': '#202020', 'text-halo-color': '#FFFFFF', 'text-halo-width': 2 }
        });
        this.map.on('click', (event) => { void this.handleMapClick(event); });
        this.map.on('mouseenter', CLUSTER_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', CLUSTER_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
        this.map.on('mouseenter', STOP_HIT_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', STOP_HIT_LAYER_ID, () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
        this.refreshSelectionRing();
        this.ready = true;
        this.container?.setAttribute('data-map-ready', 'true');
        if (this.journeyRoute) this.fitJourneyRoute();
        else if (routeFeatureCollection(this.lineRoute).features.length > 0) this.fitLineRoute();
        else if (journeyStopFeatureCollection(this.stops, this.journeyOriginStopId, this.journeyDestinationStopId).features.length > 0) {
          this.fitJourneyStops();
        } else if (this.focusedStopId) this.applyFocus();
        else this.fitStops(this.stops);
        if (this.location) this.applyLocation();
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
    ], { layers: [CLUSTER_LAYER_ID, STOP_HIT_LAYER_ID, 'journey-place-markers'] });
    const itineraryPlace = queried.find((feature) => feature.source === ITINERARY_PLACES_SOURCE_ID
      && feature.geometry.type === 'Point');
    if (itineraryPlace?.geometry.type === 'Point') {
      this.focusJourneyPlace({
        name: String(itineraryPlace.properties?.name ?? ''),
        latitude: itineraryPlace.geometry.coordinates[1],
        longitude: itineraryPlace.geometry.coordinates[0]
      });
      return;
    }
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
    this.updateStopAttributes();
    this.updateStopSource();
    this.updateJourneySource();
    this.refreshSelectionRing();
  }

  showLocation(location: CurrentLocation, center = true): Promise<LocationDisplayResult> {
    this.location = location;
    this.locationShouldCenter = center;
    this.container?.setAttribute('data-location-visible', 'true');
    return new Promise((resolve) => {
      this.locationResolvers.push(resolve);
      if (this.ready) this.applyLocation();
    });
  }

  clearLocation(): void {
    this.location = undefined;
    this.locationShouldCenter = true;
    this.container?.removeAttribute('data-location-visible');
    const source = this.map?.getSource(LOCATION_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(locationFeatureCollection(undefined));
    this.resolveLocation({ cameraCentered: false, hasVisibleStops: false });
  }

  private applyLocation(): void {
    if (!this.map || !this.ready || !this.location) return;
    const source = this.map.getSource(LOCATION_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(locationFeatureCollection(this.location));
    const cameraCentered = this.locationShouldCenter && !this.userMoved;
    if (cameraCentered) {
      this.container?.setAttribute('data-location-centered', 'true');
      this.map.jumpTo({ center: [this.location.longitude, this.location.latitude], zoom: 15 });
    } else {
      this.container?.removeAttribute('data-location-centered');
    }
    const hasVisibleStops = cameraCentered
      && this.stops.some((stop) => this.map!.getBounds().contains(stop.coordinates));
    this.resolveLocation({ cameraCentered, hasVisibleStops });
  }

  private resolveLocation(result: LocationDisplayResult): void {
    for (const resolve of this.locationResolvers.splice(0)) resolve(result);
  }

  setLineRoute(route: SelectedLineRouteDisplay | null): void {
    this.lineRoute = route;
    this.updateLineRouteAttributes();
    this.updateStopAttributes();
    this.updateStopSource();
    this.refreshSelectionRing();
    const source = this.map?.getSource(ROUTE_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(routeFeatureCollection(route));
    if (this.ready && routeFeatureCollection(route).features.length > 0) this.fitLineRoute();
  }

  setSelectedStop(stopId: string | null): void {
    this.selectedStopId = stopId;
    this.container?.setAttribute('data-selection-motion', this.reducedMotion ? 'instant' : 'standard');
    this.refreshSelectionRing();
  }

  setJourneyStops(originStopId: string | null, destinationStopId: string | null): void {
    if (originStopId === this.journeyOriginStopId && destinationStopId === this.journeyDestinationStopId
      && this.container?.hasAttribute('data-journey-stops')) return;
    this.journeyOriginStopId = originStopId;
    this.journeyDestinationStopId = destinationStopId;
    this.container?.setAttribute('data-journey-stops', JSON.stringify([originStopId, destinationStopId]));
    this.updateJourneySource();
    this.fitJourneyStops();
  }

  setJourneyRoute(journey: TransitJourney | null): void {
    if (this.journeyRoute === journey && this.container?.hasAttribute('data-journey-route')) return;
    this.journeyRoute = journey;
    this.focusedJourneyPlace = null;
    this.container?.setAttribute('data-journey-route', journey?.id ?? '');
    this.container?.setAttribute('data-journey-route-legs', String(journey?.legs.length ?? 0));
    this.container?.removeAttribute('data-journey-focused-place');
    const source = this.map?.getSource(ITINERARY_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(itineraryFeatureCollection(journey));
    this.updateStopAttributes();
    this.updateStopSource();
    this.updateItineraryPlaces();
    if (journey) this.fitJourneyRoute();
  }

  focusJourneyPlace(place: JourneyPlace): void {
    this.focusedJourneyPlace = place;
    this.container?.setAttribute('data-journey-focused-place', place.name);
    this.updateItineraryPlaces();
    const padding = this.getLineRoutePadding();
    this.map?.easeTo({
      center: [place.longitude, place.latitude], zoom: 17,
      offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2],
      duration: this.reducedMotion ? 0 : 300
    });
  }

  private updateItineraryPlaces(): void {
    const source = this.map?.getSource(ITINERARY_PLACES_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(itineraryPlaces(this.journeyRoute, this.focusedJourneyPlace));
  }

  private fitJourneyRoute(): void {
    if (!this.map || !this.ready || !this.journeyRoute) return;
    const coordinates = this.journeyRoute.legs.flatMap((leg) => leg.coordinates);
    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);
    this.map.fitBounds([
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)]
    ], { padding: this.getLineRoutePadding(), maxZoom: 16, duration: this.reducedMotion ? 0 : 300 });
  }

  private fitJourneyStops(): void {
    const endpoints = journeyStopFeatureCollection(
      this.stops,
      this.journeyOriginStopId,
      this.journeyDestinationStopId
    ).features;
    if (!this.ready || !this.map || endpoints.length === 0) return;
    if (endpoints.length === 1) {
      const panelWidth = document.querySelector<HTMLElement>('.destination-view')?.getBoundingClientRect().width ?? 0;
      this.map.easeTo({
        center: endpoints[0].geometry.coordinates,
        zoom: Math.max(this.map.getZoom(), CLUSTER_MAX_ZOOM + 1),
        offset: [Math.round(panelWidth / 2), 0],
        duration: this.reducedMotion ? 0 : 300
      });
      return;
    }
    const longitudes = endpoints.map(({ geometry }) => geometry.coordinates[0]);
    const latitudes = endpoints.map(({ geometry }) => geometry.coordinates[1]);
    const mapWidth = this.container?.getBoundingClientRect().width ?? 0;
    const panelWidth = document.querySelector<HTMLElement>('.destination-view')?.getBoundingClientRect().width ?? 0;
    const leftPadding = Math.max(64, Math.min(Math.ceil(mapWidth * 0.55), Math.ceil(panelWidth + 48)));
    this.map.fitBounds(
      [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
      {
        padding: { top: 64, right: 48, bottom: 64, left: leftPadding },
        maxZoom: CLUSTER_MAX_ZOOM + 1,
        duration: this.reducedMotion ? 0 : 300
      }
    );
  }

  onStopSelected(listener: (stopId: string) => void): () => void {
    this.stopSelected = listener;
    return () => { if (this.stopSelected === listener) this.stopSelected = undefined; };
  }

  onChooserRequested(listener: (stopIds: string[]) => void): () => void {
    this.chooserRequested = listener;
    return () => { if (this.chooserRequested === listener) this.chooserRequested = undefined; };
  }

  fitToStops(userInitiated = false): void {
    if (userInitiated) this.userMoved = true;
    this.focusedStopId = null;
    if (this.journeyRoute) {
      this.fitJourneyRoute();
      return;
    }
    this.fitStops(this.getVisibleStops());
  }

  focusStop(stopId: string): void {
    this.userMoved = true;
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

  private getVisibleStops(): MapStop[] {
    if (this.journeyRoute) return [];
    const route = this.lineRoute;
    return route ? this.stops.filter((stop) => stop.lineIds.includes(route.lineId)) : this.stops;
  }

  private updateStopAttributes(): void {
    if (!this.container) return;
    const visibleStops = this.getVisibleStops();
    this.container.dataset.stopCount = String(visibleStops.length);
    this.container.dataset.stopCoordinates = JSON.stringify(visibleStops.map((stop) => stop.coordinates));
  }

  private updateStopSource(): void {
    const source = this.map?.getSource(SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(featureCollection(this.getVisibleStops()));
  }

  private updateJourneySource(): void {
    const source = this.map?.getSource(JOURNEY_SOURCE_ID) as import('maplibre-gl').GeoJSONSource | undefined;
    source?.setData(journeyStopFeatureCollection(this.stops, this.journeyOriginStopId, this.journeyDestinationStopId));
  }

  private fitLineRoute(): void {
    if (!this.map || !this.container) return;
    const coordinates = routeFeatureCollection(this.lineRoute).features.flatMap((feature) => (
      feature.geometry.type === 'LineString' ? feature.geometry.coordinates : []
    ));
    if (coordinates.length === 0) return;
    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);
    this.container.setAttribute('data-route-fit-motion', this.reducedMotion ? 'instant' : 'standard');
    this.map.fitBounds(
      [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]],
      { padding: this.getLineRoutePadding(), maxZoom: 15, duration: this.reducedMotion ? 0 : 300 }
    );
  }

  private getLineRoutePadding(): Required<import('maplibre-gl').PaddingOptions> {
    const padding = { top: 48, right: 48, bottom: 48, left: 48 };
    const panel = document.querySelector<HTMLElement>('.destination-view');
    if (!panel || !this.container) return padding;
    const mapBounds = this.container.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    if (
      panelBounds.width <= 0
      || panelBounds.height <= 0
      || panelBounds.right <= mapBounds.left
      || panelBounds.left >= mapBounds.right
      || panelBounds.bottom <= mapBounds.top
      || panelBounds.top >= mapBounds.bottom
    ) {
      return padding;
    }
    if (panelBounds.width >= mapBounds.width * 0.8) {
      if (panelBounds.top <= mapBounds.top + mapBounds.height / 2) {
        padding.top = Math.min(
          Math.max(padding.top, panelBounds.bottom - mapBounds.top + 24),
          mapBounds.height * 0.75
        );
      } else {
        padding.bottom = Math.min(
          Math.max(padding.bottom, mapBounds.bottom - panelBounds.top + 24),
          mapBounds.height * 0.75
        );
      }
    } else if (panelBounds.left <= mapBounds.left + mapBounds.width / 2) {
      padding.left = Math.min(
        Math.max(padding.left, panelBounds.right - mapBounds.left + 24),
        mapBounds.width * 0.75
      );
    } else {
      padding.right = Math.min(
        Math.max(padding.right, mapBounds.right - panelBounds.left + 24),
        mapBounds.width * 0.75
      );
    }
    return padding;
  }

  private updateLineRouteAttributes(): void {
    if (!this.container) return;
    const source = routeFeatureCollection(this.lineRoute);
    this.container.dataset.routeLine = this.lineRoute?.lineCode ?? '';
    this.container.dataset.routeCount = String(source.features.length);
    this.container.dataset.routeShapes = source.features
      .map((feature) => String(feature.properties?.['shapeId'] ?? ''))
      .filter(Boolean)
      .join(',');
  }

  zoomIn(): void {
    if (!this.map) return;
    this.userMoved = true;
    if (this.reducedMotion) this.map.jumpTo({ zoom: this.map.getZoom() + 1 });
    else this.map.zoomIn({ duration: 200 });
  }

  zoomOut(): void {
    if (!this.map) return;
    this.userMoved = true;
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
    this.resolveLocation({ cameraCentered: false, hasVisibleStops: false });
    this.map?.remove();
    this.map = undefined;
    this.container?.removeAttribute('data-map-ready');
    this.container?.replaceChildren();
    this.container = undefined;
    this.stops = [];
    this.selectedStopId = null;
    this.focusedStopId = null;
    this.ready = false;
    this.location = undefined;
    this.userMoved = false;
  }
}