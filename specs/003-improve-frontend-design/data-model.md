# Data Model: Improve Frontend Design

**Date**: 2026-10-26
**Feature**: [spec.md](spec.md)

## Scope

The redesign reuses existing catalog, arrivals, schedule, favorite, and preference concepts. It adds no accounts, server-side user profiles, or new arrival entities. The stop-coordinate change is documented in the v4 contract proposal at [contracts/realtime-api-v4.openapi.yaml](contracts/realtime-api-v4.openapi.yaml).

## Entities

### Stop

A public stop in the Worker catalog.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `id` | string | Unique catalog identity; stable across views. |
| `code` | string | Display code, not interchangeable with the Vitrasa arrival identifier. |
| `municipalCode` | string or null | GTFS stop identifier when available. |
| `vitrasaId` | string or null | Public identifier used for arrival lookup; null means arrivals are unavailable. |
| `name` | string | Localized only when the source catalog provides localized values; otherwise preserve source text. |
| `lat` | number or null | Vigo catalog latitude in `[42.10, 42.32]`; null when absent or invalid. |
| `lon` | number or null | Vigo catalog longitude in `[-8.85, -8.60]`; null whenever `lat` is null or vice versa. |
| `lineIds` | string[] | Catalog line identities serving the stop. |

**Coordinate invariant**: both `lat` and `lon` are finite numbers within the existing v3 Vigo bounds, or both are null. A stop with null coordinates stays searchable and can show arrivals when it has a `vitrasaId`, but is not placed on the map. A stop with valid coordinates is placed at exactly `[lon, lat]`; the Worker contract owns coordinate-range validation so the frontend does not apply a second hard-coded filter.

### Arrival Estimate

A Worker-provided estimate for one bus at a selected stop.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `lineCode` | string | Public line code. |
| `destination` | string | Normalized display destination. |
| `minutes` | integer | Estimated minutes remaining, from 0 through 1440 per current API contract. |
| `eta` | date-time | Source generation time plus minutes; preserve the response's `generatedAt` for freshness display. |

### Arrival View State

A presentation state for the selected stop. This is not persisted.

| State | Entry condition | Exit / behavior |
| --- | --- | --- |
| `loading` | Stop selected or refresh begins | Show non-disruptive progress; do not move focus. |
| `current` | Worker result age <30 seconds | Show arrivals or explicit empty state and generated time. |
| `stale` | Upstream failed; last-known result age >=30 and <300 seconds | Show stale label and retry action; never relabel as current. |
| `unavailable` | No eligible response or last-known age >=300 seconds | Show a clear message and retry where available. |
| `offline` | Browser has no network | May show a locally cached prior result as stale, otherwise unavailable. |
| `empty` | Current response has no arrivals | Show no-upcoming-arrivals state; do not treat as an error. |

### Day-Type Frequency

A published timetable service for a line and one of `weekday`, `saturday`, or `sunday_holiday`. Existing fields remain first departure, last departure, time bands, and ordered stop IDs. Missing data for a line/day type is represented as unavailable/no-service according to the existing Worker catalog, never fabricated by the UI.

### Favorite

A device-local reference to a stop. Lines are not favorite entities.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `type` | `stop` | Favorite target type. |
| `targetId` | string | Stable stop identity. |
| `order` | non-negative integer | Ordering in the Saved view. |

Favorites are saved only in the current browser's `localStorage`. They are not sent in API or tile requests. A target missing from the current catalog remains removable and is presented as unavailable.

### Recent View and User Preferences

Recent views continue to record `{type, targetId, viewedAt}` and may represent lines or stops. User preferences contain fixed `light` theme, language, optional last line, and recent views. These are stored only in `localStorage`; none is sent over the network. A new profile defaults to Castellano; old `system` or `dark` theme values migrate to `light`.

### Design Tokens

The design baseline defines named semantic colors for canvas, primary/secondary text, soft-red surfaces, accent, focus, status, and map selection in the light theme. Each foreground/background pairing is validated against the applicable contrast ratio; see [contracts/ui-design-contract.md](contracts/ui-design-contract.md).

## Relationships and Selection Flow

- A stop may reference many line IDs; a line timetable lists the stops in its service pattern.
- A favorite points to one stop; a recent view points to one line or stop.
- Map, stop search, line details, favorites, and recent views all resolve to the same catalog `Stop` and call the same stop-selection application flow.
- A cluster contains stop points only as a map presentation grouping. It is not a persisted domain entity and does not change stop coordinates or identities.
- Privacy disclosures are not rendered in the product UI; required data-minimization behavior remains enforced independently.
