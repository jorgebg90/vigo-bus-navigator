import type {
  Arrival,
  DatasetManifest,
  Favorite,
  LineDetails,
  Line,
  NetworkStop,
  ArrivalReceipt,
  BundledScheduleSnapshot,
  CurrentLocation,
  DayType,
  Language,
  LineRoutePattern,
  NetworkLineSummary,
  PublishedLineSchedule,
  RouteShapeReceipt,
  SelectedLineRouteDisplay,
  TripStopSequence,
  LineStopDetail,
  Provenance,
  Stop,
  Timetable,
  UserPreferences
} from '../domain/types';
import type { MunicipalFailureReason } from '../domain/municipal-failures';
import type { MapStop } from '../domain/map-stops';

export interface ScheduleRepository {
  getManifest(): Promise<DatasetManifest>;
  listLines(): Promise<Line[]>;
  listStops(): Promise<Stop[]>;
  getLineDetails(lineId: string): Promise<LineDetails>;
}

export type MunicipalOperationResult<T> =
  | { kind: 'success'; value: T }
  | { kind: 'unavailable'; reason: MunicipalFailureReason };

export interface StopDiscoveryCatalog {
  lines: NetworkLineSummary[];
  stops: NetworkStop[];
  patternsByLine: Readonly<Record<string, BundledRoutePattern[]>>;
  completeness: 'bundled-seed' | 'municipal-online';
  provenance: Provenance;
}

export interface BundledRoutePattern {
  id: string;
  headsign: string;
  stopIds: string[];
}

export interface MunicipalLineCatalogReceipt {
  lines: NetworkLineSummary[];
  provenance: Provenance;
  serviceMetadata:
    | { kind: 'available'; provenance: Provenance }
    | { kind: 'unavailable'; reason: MunicipalFailureReason };
}

export interface MunicipalServingLinesReceipt {
  lines: NetworkLineSummary[];
  provenance: Provenance;
}

export interface ScheduleRepositoryV5 {
  getMunicipalLineCatalog(language: Language): Promise<MunicipalOperationResult<MunicipalLineCatalogReceipt>>;
  getStopDiscoveryCatalog(): Promise<StopDiscoveryCatalog>;
  getRoutePatterns(lineId: string): Promise<LineRoutePattern[]>;
  getMunicipalStopDetail(stop: NetworkStop): Promise<MunicipalOperationResult<NetworkStop>>;
  getMunicipalServingLines(stop: NetworkStop): Promise<MunicipalOperationResult<MunicipalServingLinesReceipt>>;
  getPublishedLineSchedule(
    lineCode: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<PublishedLineSchedule>>;
  getBundledScheduleSnapshot(
    lineId: string,
    lineCode: string,
    directionId: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<BundledScheduleSnapshot>>;
  getRouteShape(lineCode: string): Promise<MunicipalOperationResult<RouteShapeReceipt>>;
  getTripStops(lineCode: string, dayType: DayType): Promise<MunicipalOperationResult<TripStopSequence>>;
  getLineStopDetail(
    stop: NetworkStop,
    lineCode: string
  ): Promise<MunicipalOperationResult<LineStopDetail>>;
}

export interface MunicipalArrivalsGateway {
  getArrivals(stop: NetworkStop, signal?: AbortSignal): Promise<MunicipalOperationResult<ArrivalReceipt>>;
}

export interface LineScheduleGateway {
  getLineSchedule(
    lineCode: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<PublishedLineSchedule>>;
}

export interface MunicipalArrivalCachePort {
  get(stopId: string): ArrivalReceipt | undefined;
  set(receipt: ArrivalReceipt): boolean;
}

export interface StoragePort {
  loadFavorites(): Favorite[];
  saveFavorites(favorites: Favorite[]): void;
  loadPreferences(): UserPreferences;
  savePreferences(preferences: UserPreferences): void;
  readonly persisted: boolean;
}

export interface ClockPort {
  now(): Date;
  onDateChange(listener: () => void): () => void;
}

export interface VisibilityPort {
  readonly visible: boolean;
  onVisibilityChange(listener: (visible: boolean) => void): () => void;
}

export type GeolocationResult =
  | { kind: 'success'; location: CurrentLocation }
  | { kind: 'unavailable'; reason: 'unsupported' | 'denied' | 'timeout' | 'error' | 'invalid' };

export interface GeolocationPort {
  getCurrentPosition(): Promise<GeolocationResult>;
}

export interface LocationDisplayResult {
  cameraCentered: boolean;
  hasVisibleStops: boolean;
}

export interface StopMapPort {
  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void;
  setTheme(theme: 'light' | 'dark'): void;
  unmount(): void;
  setStops(stops: MapStop[]): void;
  showLocation(location: CurrentLocation, center?: boolean): Promise<LocationDisplayResult>;
  clearLocation(): void;
  setLineRoute(route: SelectedLineRouteDisplay | null): void;
  setSelectedStop(stopId: string | null): void;
  onStopSelected(listener: (stopId: string) => void): () => void;
  onChooserRequested(listener: (stopIds: string[]) => void): () => void;
  fitToStops(userInitiated?: boolean): void;
  focusStop(stopId: string): void;
  zoomIn(): void;
  zoomOut(): void;
  getMapCenter(): [number, number];
  getStopsInView(stops: Stop[]): Stop[];
}
