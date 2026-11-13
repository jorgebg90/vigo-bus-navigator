# Quality Validation

## Browser matrix

The Playwright configuration covers Chrome desktop, Chrome Android, and Safari
iOS. Run `npm run test:e2e` after installing the required browsers.

## Municipal contracts and data

- `npm run lint:openapi` validates historical arrivals contracts and all current
  JSP, autocomplete, OTP and external map-resource contracts.
- `npm run build` validates and publishes the four current contracts in one
  linked static portal. Source DTOs and normalized in-process models are distinct;
  `x-hexagonal` records ports, adapters and use cases.
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
- P5: predict/select both journey addresses with mouse and keyboard, swap/clear,
  plan a trip, select alternatives and stops, inspect walking/bus geometry,
  and verify editing invalidates pending/visible results. Repeat desktop/mobile
  and theme changes; an unavailable provider must not look like no bus service.
- P6: open each OpenAPI contract from the portal, including directly under the
  deployment base path and offline after service-worker installation.
  Verify Swagger UI operations/schemas expand, read-only YAML is available,
  no “Try it out” control exists, no external requests are made, keyboard focus
  works and mobile/enlarged-text layouts do not overflow. Local Swagger assets
  must render offline, not just the static page heading.

The JSP `fixture` profile alone does not isolate autocomplete/OTP traffic.
Journey E2E tests inject both responses explicitly. Live browser checks are
separate evidence, not deterministic suite dependencies. Production-origin
compatibility must still be verified before release.

## Accessibility

The UI uses semantic headings, labelled lists and selects, status regions for
offline/live notices, keyboard-operable buttons, visible focus, and 44px form
controls. Contrast and screen-reader behavior must be checked in the browser
matrix before release.

## Privacy audit

No account, analytics or tracking identifier is required. Favorites/preferences
use browser storage. JSP lookups send public transit identifiers, not profiles
or credentials. Municipal autocomplete receives entered address text; OTP receives
selected coordinates and departure time, including current location when selected.
The map provider receives viewport-related resource requests. Check the collapsed
privacy disclosure in es/gl/en and verify that queries/coordinates/history enter
neither storage, logs nor service-worker caches. Autocomplete/OTP requests use
`cache: no-store`; JSP receipt caching is separate and retains freshness rules.