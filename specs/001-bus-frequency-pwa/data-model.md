# Phase 1 — Data Model: Vigo Bus Frequency PWA

- **Date**: 2026-10-25
- **Source entities**: [spec.md](spec.md) "Key Entities"; formats per [research.md](research.md) D5/D6.

## Domain entities (pure, no I/O imports)

### Line

| Field | Type | Notes |
| --- | --- | --- |
| id | string | internal stable identifier |
| code | string | public code, e.g. "L4A" (display + search) |
| name | string | display name |
| color | string (hex) | official line color for map/list badges |
| notes | string, optional | service notes (night lines, special calendars) |

### Stop

| Field | Type | Notes |
| --- | --- | --- |
| id | string | internal stable identifier |
| code | string | public stop code — also the `stop_id` used in the arrivals API |
| name | string | display name |
| lat, lon | number | WGS84, rounded to 5 decimals (D5) |
| lineIds | string[] | serving lines (denormalized from lines for popups) |

### DayType

Enum: `weekday` | `saturday` | `sunday_holiday`. Derived from device date +
the dataset's holiday calendar; a holiday always maps to `sunday_holiday`
(spec edge case: holiday precedence).

### TimeBand

| Field | Type | Notes |
| --- | --- | --- |
| startMinute | number | minutes since midnight (serialized as integer, D5) |
| endMinute | number | minutes since midnight |
| intervalMinutes | number | headway within the band |

### Timetable (per line)

| Field | Type | Notes |
| --- | --- | --- |
| lineId | string | owner |
| byDayType | Record<DayType, DayService> | |

### DayService

| Field | Type | Notes |
| --- | --- | --- |
| firstDeparture | number | minutes since midnight |
| lastDeparture | number | minutes since midnight |
| bands | TimeBand[] | contiguous, ordered, non-overlapping |
| stopIds | string[] | ordered stop sequence of the line |

Validation rules: `bands` ordered by `startMinute`, no overlaps; `firstDeparture`
≥ first band start; `lastDeparture` ≤ last band end; every `stopIds` entry
resolves in the stops dictionary. An absent `DayType` key means "no service on
this day type" (spec US1 scenario 3).

### Arrival (live estimate, API boundary)

| Field | Type | Notes |
| --- | --- | --- |
| lineCode | string | public line code |
| destination | string | headsign |
| minutes | number | estimated minutes to arrival |
| eta | string (ISO 8601) | absolute estimated time |

### HolidayCalendar

List of ISO dates (YYYY-MM-DD) within the dataset validity range. Versioned
with the dataset (spec assumption).

### ScheduleDataset (bundle manifest)

| Field | Type | Notes |
| --- | --- | --- |
| datasetVersion | string | displayed to users (FR-011) |
| validFrom, validUntil | string (ISO date) | freshness judgment |
| generatedAt | string (ISO datetime) | pipeline traceability |
| holidays | string[] | ISO dates |
| lines | LineIndexEntry[] | `{ id, code, name, color, file, size, sha }` |

### Favorite (device-only)

| Field | Type | Notes |
| --- | --- | --- |
| type | `line` \| `stop` | |
| targetId | string | Line.id or Stop.id |
| order | number | creation order for stable sorting |

### UserPreferences (device-only)

| Field | Type | Notes |
| --- | --- | --- |
| theme | `light` \| `dark` \| `system` | map base layer + UI |
| language | `es` \| `gl` \| `en` | FR-014 |
| lastLineId | string, optional | resume context |
| recentViews | RecentView[] | newest-first, maximum five line/stop references |

### RecentView

| Field | Type | Notes |
| --- | --- | --- |
| type | `line` \| `stop` | viewed entity type |
| targetId | string | Line.id or Stop.id |
| viewedAt | string (ISO datetime) | ordering timestamp |

## Storage mapping

| Data | Location | Format |
| --- | --- | --- |
| Schedule snapshot (manifest, stops, per-line timetables) | bundled static files + SW precache | minified JSON (D5) |
| Live arrivals | memory + SW runtime cache (`NetworkFirst`, short timeout) | OpenAPI schema |
| Favorites | `localStorage` key `vbn:v1:favorites` | envelope `{ v, data }` (D6) |
| Preferences | `localStorage` key `vbn:v1:prefs` | envelope `{ v, data }` (D6) |

## State transitions

- **Day type**: re-evaluated on visibility resume and on device date change
  (midnight rollover edge case); holiday calendar takes precedence over the
  weekday.
- **Live arrivals**: `loading → live | stale (scheduled fallback) → refreshing`;
  refresh pauses when hidden, resumes when visible (FR-017).
- **Persistence**: `persisted → session-only` on `QuotaExceededError`
  (irreversible for the session; UI notice).
- **Stored schema**: `vN → vN+1` via the ordered migration chain on load;
  unknown/newer versions read as defaults without overwriting (D6).
