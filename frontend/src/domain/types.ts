export type DayType = 'weekday' | 'saturday' | 'sunday_holiday';
export type Theme = 'light' | 'dark' | 'system';
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
  lat: number;
  lon: number;
  lineIds: string[];
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

export interface Arrival {
  lineCode: string;
  destination: string;
  minutes: number;
  eta: string;
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
