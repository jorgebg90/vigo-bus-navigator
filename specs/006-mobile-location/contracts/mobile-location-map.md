# Mobile Location and Map Contract

**Date**: 2026-10-28
**Feature**: [../spec.md](../spec.md)

This is an internal application-to-browser/map contract. No public HTTP
endpoint or municipal data action is added.

## Location Request

- The application requests at most one current position on initial map mount
  when the viewport matches the existing mobile breakpoint (`max-width:
  599px`).
- No browser location access occurs on desktop.
- The browser owns the permission prompt. Application code receives either a
  validated position or a typed unavailable result.
- Coordinates must be finite and within latitude/longitude bounds.
- Location access does not use continuous watching and has no automatic retry.
- The coordinate and request state remain in memory only.

## Coverage

- Use the existing Vigo stop-map coordinate envelope.
- A valid coordinate inside that envelope is eligible regardless of distance
  to the nearest stop.
- If no valid bus stop is in the resulting visible map bounds, announce that no
  nearby stops are shown but keep the location centered.
- An outside-envelope coordinate does not become a marker and does not change
  the default Vigo camera.
- Permission denial, unsupported access, timeout, and invalid coordinates keep
  the existing map available and produce a localized accessible status.

## Map Port

- A location may be submitted before map initialization; the adapter retains it
  in memory and applies it when the map is ready.
- The user marker uses a dedicated non-clustered GeoJSON source and a
  non-interactive visual layer.
- Showing a valid in-coverage location centers the camera once at a useful
  local scale. Reduced-motion preference uses an immediate camera update.
- If the user manually moves the map before a pending location resolves, the
  eventual result must not override that camera movement.
- Stop sources, hit targets, cluster chooser, selected route source, and stop
  selection remain independent from the location feature.

## Toolbar and Accessibility

- Remove the stops-in-view toolbar button and its direct list-opening action.
- Retain recenter, zoom-in, and zoom-out with their existing labels and
  behavior.
- Retain the stop chooser for map clusters/collocated stops; use the recenter
  button as its focus-return element.
- Location outcome messages use semantic status announcements and localized
  wording. No status includes raw coordinates.

## Privacy

- The application does not persist current location or permission-attempt
  state.
- The application does not append coordinates to any municipal request.
- No analytics, location history, or continuous location tracking is added.
