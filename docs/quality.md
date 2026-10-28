# Quality Validation

## Browser matrix

The Playwright configuration covers Chrome desktop, Chrome Android, and Safari
iOS. Run `npm run test:e2e` after installing the required browsers.

## Contract gates (feature 002)

- `npm run lint:openapi` validates the real-time arrivals contract v2
  (`specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml`).
- `npm run test:contract` runs the Worker contract suite (fixture mode, no
  network): success/empty/stale, error taxonomy (400/404/405/429/502/503/504),
  OPTIONS preflight, `/health`, CORS `*` on every response, staleness bound,
  and the SC-005 100-request resilience loop.
- Snapshot generation fails when any stop coordinate falls outside the Vigo
  bounding box (lat 42.19–42.31, lon −8.79…−8.67).

## Acceptance checks

- P1: search a line, inspect frequency bands, switch day type, and verify dataset freshness.
- P2: open a stop, verify live arrivals, visibility-paused refresh, and scheduled fallback.
- P3: inspect fitted line stops, accessible stop details, theme switching, and tile fallback.
- P4: add/remove line and stop favorites, reload, and verify session-only storage notice.

## Accessibility

The UI uses semantic headings, labelled lists and selects, status regions for
offline/live notices, keyboard-operable buttons, visible focus, and 44px form
controls. Contrast and screen-reader behavior must be checked in the browser
matrix before release.

## Privacy audit

No account, analytics, tracking identifier, or user-state network request is
present. Favorites, preferences, and recent views use namespaced browser
storage only. The Worker receives only the public stop identifier required for
the arrival lookup.