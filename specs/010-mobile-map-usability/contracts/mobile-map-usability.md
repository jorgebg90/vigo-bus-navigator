# Mobile Map Usability Contract

**Date**: 2026-10-29
**Feature**: [../spec.md](../spec.md)

This is an internal user-interface contract. No public HTTP endpoint,
municipal action, or persisted interface is added.

## Mobile Location Messages

- Determine mobile presentation using the application's existing mobile
  breakpoint.
- When location is denied, unavailable, invalid, or outside supported map
  coverage, do not render a location-failure message on mobile.
- Keep the existing no-nearby-stops status when a usable location was applied.
- Keep existing location-message behavior on non-mobile viewports.
- Suppressing a message must not trigger retries, prevent line/map use, or alter
  location persistence or transit requests.

## Line Selection Feedback

- Selecting a line immediately displays a full-screen translucent loading
  overlay with a visible indicator while existing line data is loaded.
- The pending state is programmatically exposed as a status; the map and
  navigation remain usable, and the close control remains actionable.
- When line data is available, show the selected line details; if route data
  remains pending, use the same full-screen loading presentation until the
  route is displayed or reported unavailable.
- A failed operation must end the pending state and leave map and line
  browsing usable.
- Results for a superseded selection or a closed detail view must not replace
  the current screen.
- Reduced-motion preferences must not remove necessary state information.

## Closing Line Details

- Selected-line details on mobile have a visible, keyboard-operable close
  control with a localized accessible name and visible focus.
- Activating close returns to the map destination and restores the full
  available map viewport, whether the details are loading, ready, or
  unavailable.
- Closing does not reload or reconstruct the map.
- Pending results for the closed line do not reopen details.
- Existing navigation and browser-history behavior remain valid.

## Stop-to-Line Navigation

- Beside each arrival, make its line icon an accessible button only when the
  corresponding line exists in the loaded catalog.
- Give the button a localized accessible name identifying the line and opening
  its route.
- Activating the button opens the existing selected-line route flow, including
  its loading, error, and close behavior.
- Keep arrival icons informational when matching line details are unavailable;
  do not expose a no-op control.
- Catalog-backed badges in the stop summary may open the same route.
- In route-stop rows, make a line badge an accessible button only when the
  corresponding line exists in the loaded catalog; activating it opens that
  line's existing route flow.
- Keep route-stop badges informational when matching line details are
  unavailable. Do not change line badges in other views.

## Supported Interface Languages

- Offer only Castellano (`es`) and Galego (`gl`) in the language selector.
- When loading a saved English (`en`) preference from an older version, replace
  it with Castellano and persist the normalized preference.
- Continue to load municipal line catalogs using the selected Spanish or
  Galician language.

## Portrait Line Details

- In portrait mobile layouts up to 1023 px wide, display selected-line details
  as a full-width bottom panel and place the stop list within the panel.
- Keep the map usable above the panel and avoid horizontal overflow.
- Retain the existing narrower-phone layout and the desktop side-panel layout.
- Use the compact line-view heading style for route directions at every
  viewport size; do not allow browser-default heading size or margins to
  dominate the route list.

## Responsive and Accessibility Requirements

- Keep the existing responsive breakpoints and touch-target conventions.
- Maintain accessible status semantics, keyboard activation, visible focus,
  and localized labels.
- Essential transitions remain understandable with reduced motion enabled.
- At narrow widths and text zoom, line details and controls remain usable
  without horizontal overflow or obscuring the map after close.

## Non-Goals

- No change to transit data sources, route geometry, map engine, or API
  contracts.
- No location tracking, persistence, automatic retry, or user-activity
  collection.
- No redesign of unrelated frontend areas.
