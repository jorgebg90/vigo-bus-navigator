import type {
  Arrival,
  DatasetManifest,
  Favorite,
  LineDetails,
  Line,
  Stop,
  Timetable,
  UserPreferences
} from '../domain/types';
import type { MapStop } from '../domain/map-stops';

export interface ScheduleRepository {
  getManifest(): Promise<DatasetManifest>;
  listLines(): Promise<Line[]>;
  listStops(): Promise<Stop[]>;
  getLineDetails(lineId: string): Promise<LineDetails>;
}

export type DataStatus = 'current' | 'stale' | 'empty';

export type ArrivalsResult =
  | { kind: 'live'; arrivals: Arrival[]; fetchedAt: string; dataStatus: DataStatus }
  | { kind: 'unavailable'; reason: 'stop-not-exist' | 'upstream' | 'unknown' | 'offline' };

export interface ArrivalsGateway {
  getArrivals(stopCode: string): Promise<ArrivalsResult>;
}

export interface ArrivalsCachePort {
  get(stopId: string): { arrivals: Arrival[]; fetchedAt: string } | undefined;
  set(stopId: string, value: { arrivals: Arrival[]; fetchedAt: string }): void;
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

export interface StopMapPort {
  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void;
  setTheme(theme: 'light' | 'dark'): void;
  unmount(): void;
  setStops(stops: MapStop[]): void;
  setSelectedStop(stopId: string | null): void;
  onStopSelected(listener: (stopId: string) => void): () => void;
  onChooserRequested(listener: (stopIds: string[]) => void): () => void;
  fitToStops(): void;
  focusStop(stopId: string): void;
  zoomIn(): void;
  zoomOut(): void;
  getMapCenter(): [number, number];
  getStopsInView(stops: Stop[]): Stop[];
}
