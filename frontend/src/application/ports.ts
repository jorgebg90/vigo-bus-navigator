import type {
  Arrival,
  DatasetManifest,
  Favorite,
  Line,
  Stop,
  Timetable,
  UserPreferences
} from '../domain/types';

export interface ScheduleRepository {
  getManifest(): Promise<DatasetManifest>;
  listLines(): Promise<Line[]>;
  listStops(): Promise<Stop[]>;
  getTimetable(lineId: string): Promise<Timetable | undefined>;
}

export type DataStatus = 'current' | 'stale' | 'empty';

export type ArrivalsResult =
  | { kind: 'live'; arrivals: Arrival[]; fetchedAt: string; dataStatus: DataStatus }
  | { kind: 'unavailable'; reason: 'stop-not-exist' | 'upstream' | 'unknown' };

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

export interface MapPort {
  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void;
  showStops(stops: Stop[], selection: { selectedId?: string }): void;
  fitTo(stopIds: string[]): void;
  onStopSelected(listener: (stopId: string) => void): () => void;
  setTheme(theme: 'light' | 'dark'): void;
  unmount(): void;
}
