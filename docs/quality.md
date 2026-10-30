# Quality Validation

## Browser matrix

The Playwright configuration covers Chrome desktop, Chrome Android, and Safari
iOS. Run `npm run test:e2e` after installing the required browsers.

## Municipal contracts and data

- `npm run lint:openapi` validates the retained historical arrivals contract
  and the current municipal browser contract.
- `npm run test` runs deterministic frontend, domain, and script tests without
  municipal network traffic.
- `npm run validate:municipal-api-contract` and
  `npm run validate:production-artifact` validate the current browser-facing
  source contract and production artifact.
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
storage only. The browser sends only the public identifiers needed for
municipal data lookups; it sends no profile data or credentials.