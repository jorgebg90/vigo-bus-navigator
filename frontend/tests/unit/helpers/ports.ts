import type { ClockPort, MunicipalArrivalsGateway, ScheduleRepository, StoragePort, VisibilityPort } from '../../../src/application/ports';
import type { DatasetManifest, Favorite, Line, LineDetails, Stop, Timetable, UserPreferences } from '../../../src/domain/types';

export class FakeScheduleRepository implements ScheduleRepository {
  constructor(
    private readonly manifest: DatasetManifest,
    private readonly lines: Line[],
    private readonly stops: Stop[],
    private readonly timetables: Record<string, Timetable>
  ) {}

  getManifest(): Promise<DatasetManifest> { return Promise.resolve(this.manifest); }
  listLines(): Promise<Line[]> { return Promise.resolve(this.lines); }
  listStops(): Promise<Stop[]> { return Promise.resolve(this.stops); }
  getLineDetails(lineId: string): Promise<LineDetails> { return Promise.resolve({ timetable: this.timetables[lineId], patterns: [] }); }
}

export class FakeVisibility implements VisibilityPort {
  visible = true;
  private listeners = new Set<(visible: boolean) => void>();
  onVisibilityChange(listener: (visible: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  setVisible(value: boolean): void {
    this.visible = value;
    this.listeners.forEach((listener) => listener(value));
  }
}

export class FakeClock implements ClockPort {
  constructor(private current = new Date('2026-10-25T12:00:00Z')) {}
  now(): Date { return new Date(this.current); }
  onDateChange(): () => void { return () => undefined; }
  set(value: Date): void { this.current = value; }
}

export class MemoryStorage implements StoragePort {
  persisted = true;
  favorites: Favorite[] = [];
  preferences: UserPreferences = { theme: 'light', language: 'es', recentViews: [] };
  loadFavorites(): Favorite[] { return this.favorites; }
  saveFavorites(value: Favorite[]): void { this.favorites = value; }
  loadPreferences(): UserPreferences { return this.preferences; }
  savePreferences(value: UserPreferences): void { this.preferences = value; }
}

export class FakeArrivalsGateway implements MunicipalArrivalsGateway {
  constructor(private readonly result: Awaited<ReturnType<MunicipalArrivalsGateway['getArrivals']>>) {}
  getArrivals(): Promise<typeof this.result> { return Promise.resolve(this.result); }
}
