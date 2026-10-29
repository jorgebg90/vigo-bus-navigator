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

## Selected Line Stops

- When a line is selected, the map stop source contains only eligible stops
  served by that line; stops shared with other lines remain included.
- Stop markers and cluster counts are derived from that filtered set, not from
  all stops in the visible area.
- When the person leaves the line view, restore the complete stop set.
- A selected line with no eligible mapped stops must not display unrelated
  stops as if they were served by that line.

## Mobile Content Layout

- At the existing mobile breakpoint (`max-width: 599px`), stop search results,
  selected-stop details, and selected-line details occupy a lower content
  region while a map region remains visible above.
- Search results and line details scroll within their content region.
- The selected-stop panel can expand; its growth reduces the map region rather
  than covering it.
- Closing the active panel or leaving its view returns the map to the
  available screen area.

## Line Schedule Disclosure

- Published or bundled departure/frequency content starts collapsed.
- The compact localized disclosure heading is “Departures and arrivals” in
  English, “Salidas y llegadas” in Spanish, and “Saídas e chegadas” in
  Galician.
- Activating the heading toggles schedule visibility without changing the
  heading text.
- When route geometry is displayed, do not add a redundant textual message
  listing route directions alongside it.

## Privacy

- The application does not persist current location or permission-attempt
  state.
- The application does not append coordinates to any municipal request.
- No analytics, location history, or continuous location tracking is added.
