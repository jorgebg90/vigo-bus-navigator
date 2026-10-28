# Data Model: Mobile Location and Map Controls

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Current Location

A transient, permission-authorized coordinate used only to orient the map.

| Field | Type | Validation / meaning |
| --- | --- | --- |
| `latitude` | finite number | Between -90 and 90 degrees |
| `longitude` | finite number | Between -180 and 180 degrees |
| `accuracyMeters` | finite non-negative number | Browser-reported accuracy; informational only |

The coordinate is held in memory only. It is not written to localStorage,
included in municipal requests, or added to analytics.

## Location Request State

One in-memory state for the location attempt during the open app visit.

| State | Meaning |
| --- | --- |
| `not-requested` | No mobile location attempt has started |
| `requesting` | A one-shot browser position request is pending |
| `located` | A valid in-coverage position is available |
| `unavailable` | Access is unsupported, denied, failed, or timed out |
| `outside-coverage` | Position is valid but outside Vigo map coverage |

Transitions:

- `not-requested` → `requesting` only on initial mobile map mount.
- `requesting` → `located` for a valid position within the supported map area.
- `requesting` → `outside-coverage` for a valid position outside the area.
- `requesting` → `unavailable` on denial, unsupported access, timeout, or
  invalid position.
- No state causes an automatic retry during the same app visit.

## Vigo Map Coverage

Reuse the coordinate envelope already used to admit stop markers in
`frontend/src/domain/map-stops.ts`:

- Latitude: 42.1 through 42.32 degrees, inclusive.
- Longitude: -8.85 through -8.6 degrees, inclusive.

This envelope is the application's existing map eligibility area, not a new
claim about an official administrative boundary. A location inside it is
accepted even when no stop is close. An outside location is not drawn and does
not move the camera from the default Vigo view.

The nearby-stop message is based on whether at least one valid stop marker is
within the map's resulting visible bounds after the one-time location camera
fit. This is a presentation signal, not a threshold for accepting the location.

## Map Location Display

The map displays zero or one location point, independently from stop clusters
and selected line route features. It has no stop identifier, is not selectable
as a stop, and is cleared when the map adapter is unmounted or the location
result is outside coverage.

## Map Control Set

The toolbar retains recenter, zoom-in, and zoom-out. The stops-in-view list
action is removed. Cluster/collocated-stop selection remains available via the
existing map interaction and chooser.
