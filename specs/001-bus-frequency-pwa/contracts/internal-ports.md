# Internal Port Contracts (Hexagonal Boundaries)

- **Date**: 2026-10-25
- **Purpose**: explicit interface contracts between the domain/application core
  and infrastructure adapters (constitution Principle II). These are
  framework-free TypeScript interfaces; every port has exactly one production
  adapter and one or more test/local-profile fakes.

## ScheduleRepository (driven port)

Provides read access to the bundled schedule snapshot.

```ts
interface ScheduleRepository {
  getManifest(): Promise<DatasetManifest>;          // datasetVersion, validity, holidays, line index
  listLines(): Promise<Line[]>;                     // from the manifest index (no per-line fetch)
  listStops(): Promise<Stop[]>;                     // shared stops dictionary
  getTimetable(lineId: string): Promise<Timetable>; // lazy per-line load (D5)
}
```

- Production adapter: fetch over bundled `public/data/**` (SW-precached).
- Local profile: identical adapter pointed at fixture data (same contract).

## ArrivalsGateway (driven port)

Provides live arrival estimates per stop, conforming to
[stop-arrivals.openapi.yaml](stop-arrivals.openapi.yaml).

```ts
interface ArrivalsGateway {
  getArrivals(stopCode: string): Promise<ArrivalsResult>;
}

type ArrivalsResult =
  | { kind: 'live'; arrivals: Arrival[]; fetchedAt: string }
  | { kind: 'unavailable'; reason: 'timeout' | 'upstream' | 'network' | 'validation' };
```

- Production adapter: HTTP client against the edge proxy; maps the OpenAPI
  error codes to `unavailable` reasons; never throws for upstream failures
  (the use case decides the scheduled-times fallback, FR-017).
- Local profile: fixture-backed fake (including timeout/error fixtures).

## StoragePort (driven port)

Device persistence for favorites and preferences (research D6).

```ts
interface StoragePort {
  loadFavorites(): Favorite[];            // migrated to current schema; defaults on corruption
  saveFavorites(favorites: Favorite[]): void;
  loadPreferences(): UserPreferences;     // merged over defaults
  savePreferences(prefs: UserPreferences): void;
  readonly persisted: boolean;            // false after quota failure (session-only mode)
}
```

- Production adapter: `localStorage` with namespaced versioned envelopes,
  quota guard, corruption backup/reset.
- Tests: in-memory `Storage` fake (deterministic migrations/guard coverage).

## ClockPort (driven port)

Time and date source, enabling deterministic tests of day-type derivation and
midnight rollover.

```ts
interface ClockPort {
  now(): Date;
  onDateChange(listener: () => void): () => void; // unsubscribe
}
```

## VisibilityPort (driven port)

Page visibility for refresh pause/resume (FR-010, FR-017).

```ts
interface VisibilityPort {
  readonly visible: boolean;
  onVisibilityChange(listener: (visible: boolean) => void): () => void;
}
```

## MapPort (driven port)

Rendering boundary for the map view (adapter: MapLibre GL JS + deck.gl).

```ts
interface MapPort {
  mount(container: HTMLElement, options: { theme: 'light' | 'dark' }): void;
  showStops(stops: Stop[], selection: { selectedId?: string }): void;
  fitTo(stopIds: string[]): void;
  onStopSelected(listener: (stopId: string) => void): () => void;
  setTheme(theme: 'light' | 'dark'): void;
  unmount(): void;
}
```

- The domain never imports MapLibre/deck.gl types; positions pass as domain
  `Stop` entities. Theme maps to CartoDB Positron/Dark Matter base layers.

## Rules

- Dependency direction is strictly inward: adapters implement these ports;
  the domain/application layers define them and import nothing from adapters.
- Ports are exercised in tests via fakes; adapters are exercised against the
  OpenAPI contract (ArrivalsGateway) and the `Storage` fake (StoragePort).
- Adding a network call requires declaring it here and, when it crosses the
  device boundary, in an OpenAPI document first (Principle V).
