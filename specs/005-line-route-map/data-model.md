# Data Model: Show Selected Line Route on the Map

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Existing Source Entities

### Selected Line

The public line selected by the user from line browsing.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `id` | string | Stable application line identity used by the line catalog |
| `code` | string | Public line code passed to existing schedule lookup |
| `color` | string | Existing line presentation color, when valid |

The selected line is transient UI state. It is not a selected stop and is not
persisted.

### Representative Direction

A direction associated with one published schedule representative trip.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `tripId` | string | Opaque source trip identity from a validated schedule row |
| `shapeId` | string | Opaque source shape identity from that schedule row |
| `direction` | `0 \| 1` | Source direction discriminator |
| `headsign` | string | Human-readable destination/direction label |
| `active` | boolean | Source activity indicator normalized by the schedule adapter |
| `departures` | string[] | Validated departure times used to choose a representative |

Selection rule: within each direction, prefer an active trip, then the trip
with the most departures. If multiple candidate trips share the selected
shape ID, they reference one geometry and do not require duplicate route
features.

### Validated Route Geometry

Reuse `RouteShapeReceipt` and `RouteGeometry` from `frontend/src/domain/types.ts`.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `lineCode` | string | Public line code the request belongs to |
| `shapeId` | string | Opaque source shape ID associated with a representative trip |
| `crs` | `OGC:CRS84` | Existing normalized coordinate reference |
| `geometry.type` | `LineString` | Existing route shape geometry |
| `geometry.coordinates` | `[longitude, latitude][]` | Fully validated finite coordinate pairs |
| `provenance` | `Provenance` | Existing source/fixture provenance metadata |

## New Transient View Model

### Selected Line Route Display

The complete route overlay state supplied to the map for the currently
selected line.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `lineId` | string | Selected catalog line ID |
| `lineCode` | string | Public line code; matches the schedule and each route receipt |
| `directions` | `DirectionalRoute[]` | Zero to two unique available directional representatives |

### Directional Route

One displayable directional path. It references the existing normalized
geometry and adds a stable direction label for rendering and accessibility.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `direction` | `0 \| 1` | Unique within a selected line route display |
| `headsign` | non-empty string | Accessible direction label |
| `shapeId` | string | Unique route geometry identity within the display |
| `geometry` | `RouteGeometry` | Validated complete LineString |

## State and Validation Rules

- A route display belongs to exactly one currently selected line.
- There is at most one directional route per source direction.
- A shape ID appears at most once in the map FeatureCollection, even if both
  directions share it; direction labels remain available separately.
- Empty or invalid geometry is not admitted into the route display.
- An unavailable route is represented by an empty direction list and a
  localized UI status, never by synthetic coordinates.
- Replacing a selection replaces the entire previous route display; late
  asynchronous results for superseded selections are discarded.
- Clearing a route display does not clear or modify the stop catalog,
  selected stop, stop clusters, or stop hit targets.
- The view model is transient and is never written to localStorage.
