export type DayType = 'weekday' | 'saturday' | 'sunday_holiday';
export type Theme = 'light';
export type Language = 'es' | 'gl' | 'en';

export interface Line {
  id: string;
  code: string;
  name: string;
  color: string;
  notes?: string;
}

export interface Stop {
  id: string;
  code: string;
  vitrasaId: string | null;
  name: string;
  lat: number | null;
  lon: number | null;
  lineIds: string[];
}

export interface NetworkLineSummary {
  id: string;
  code: string;
  name: string;
  color: string;
  textColor?: string;
  displayOrder?: number;
  serviceType?: string;
  serviceSubtype?: string;
}

export interface NetworkStop {
  id: string;
  code: string;
  municipalCode: string;
  vitrasaId: string | null;
  name: string;
  lat: number | null;
  lon: number | null;
  lineIds: string[];
}

export interface MunicipalArrival {
  lineCode: string;
  destination: string;
  minutes: number;
}

export type ProvenanceKind = 'municipal' | 'cached-municipal' | 'bundled-catalog' | 'snapshot' | 'fixture' | 'provisional-fixture';
export type ProvenanceDateKind = 'publication' | 'effective' | 'capture';

export interface Provenance {
  kind: ProvenanceKind;
  sourceName: string;
  fetchedAt?: string;
  evidenceRef?: string;
  snapshotDate?: string;
  dateKind?: ProvenanceDateKind;
}

export interface PublishedTrip {
  tripId: string;
  shapeId: string;
  direction: 0 | 1;
  headsign: string;
  origin: string | null;
  destination: string | null;
  departures: string[];
  active: boolean;
}

export interface PublishedLineSchedule {
  lineCode: string;
  dayType: DayType;
  scheduleId: string;
  departures: string[];
  trips?: PublishedTrip[];
  provenance: Provenance;
}

export interface BundledScheduleSnapshot {
  lineId: string;
  lineCode: string;
  directionId: string;
  dayType: DayType;
  service: DayService;
  provenance: Provenance;
}

export interface RouteGeometry {
  type: 'LineString';
  coordinates: Array<[number, number]>;
}

export interface RouteShapeReceipt {
  lineCode: string;
  shapeId: string;
  crs: 'OGC:CRS84';
  geometry: RouteGeometry;
  provenance: Provenance;
}

export interface DirectionalRoute {
  direction: 0 | 1;
  headsign: string;
  shapeId: string;
  geometry: RouteGeometry;
}

export interface SelectedLineRouteDisplay {
  lineId: string;
  lineCode: string;
  directions: DirectionalRoute[];
}

export interface TripStopSequence {
  lineCode: string;
  dayType: DayType;
  tripId: string;
  stops: Array<{ sequence: number; stop: NetworkStop }>;
  provenance: Provenance;
}

export interface MunicipalRoutePattern {
  tripId: string;
  shapeId: string | null;
  direction: string | null;
  departureTimes: string[];
}

export interface LineStopDetail {
  municipalCode: string;
  lineCode: string;
  patterns: MunicipalRoutePattern[];
  provenance: Provenance;
}

export interface ArrivalReceipt {
  stopId: string;
  vitrasaId: string;
  fetchedAt: string;
  arrivals: MunicipalArrival[];
  provenance: Provenance;
}

export interface TimeBand {
  startMinute: number;
  endMinute: number;
  intervalMinutes: number;
}

export interface DayService {
  firstDeparture: number;
  lastDeparture: number;
  bands: TimeBand[];
  stopIds: string[];
}

export interface Timetable {
  lineId: string;
  byDayType: Partial<Record<DayType, DayService>>;
}

export interface LineRoutePattern {
  id: string;
  headsign: string;
  stopIds: string[];
  stops: Stop[];
}

export interface LineDetails {
  timetable?: Timetable;
  patterns: LineRoutePattern[];
}

export interface Arrival {
  lineCode: string;
  destination: string;
  minutes: number;
}

export interface Favorite {
  type: 'line' | 'stop';
  targetId: string;
  order: number;
}

export interface RecentView {
  type: 'line' | 'stop';
  targetId: string;
  viewedAt: string;
}

export interface UserPreferences {
  theme: Theme;
  language: Language;
  lastLineId?: string;
  recentViews: RecentView[];
}

export interface DatasetManifest {
  datasetVersion: string;
  validFrom: string;
  validUntil: string;
  generatedAt: string;
  holidays: string[];
  lines: Array<Line & { file: string; size: number; sha: string }>;
}
