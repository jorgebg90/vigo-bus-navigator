# Quickstart: Improve Mobile Map Usability

**Date**: 2026-10-29
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js and the repository's installed dependencies.
- Run all scenarios locally with fixture data; do not use live municipal
  services or a real browser location permission.

## Focused Automated Validation

```bash
npm test -- frontend/tests/dom/location-status.test.ts frontend/tests/dom/us1-line-frequency.test.ts frontend/tests/dom/line-loading-view.test.ts frontend/tests/dom/shell.test.ts frontend/tests/dom/settings-menu.test.ts
npm test -- frontend/tests/dom/stop-view.test.ts
npm run test:e2e -- frontend/tests/e2e/mobile-location.spec.ts frontend/tests/e2e/municipal-line-service.spec.ts frontend/tests/e2e/reduced-motion.spec.ts frontend/tests/e2e/municipal-catalog.spec.ts frontend/tests/e2e/search-lines.spec.ts
npm run typecheck
```

Expected results:

- DOM tests verify suppression of mobile failure/out-of-coverage messages,
  retention of the usable-location no-nearby status, immediate full-screen
  translucent line-loading feedback, localized accessible close control, and
  map destination restore.
- Stop-view tests verify that catalog-backed arrival line icons are
  keyboard-operable route links, while other line icons remain unchanged.
- Line-view tests verify that catalog-backed route-stop badges navigate to the
  matching line and expose a localized accessible name.
- Settings tests verify that only Castellano and Galego are offered and that a
  saved English preference is migrated to Castellano.
- Browser tests verify denied, outside-coverage, and usable-location outcomes;
  delayed and failed line/route data; closing details at mobile viewport sizes;
  arrival and route-stop line-icon navigation; full-width line details at
  390 px and 768 px portrait viewports; compact route headings at all viewports;
  and behavior when reduced motion is enabled.
- TypeScript checking passes with no added external dependency.

## Manual Responsive Check

1. Start the fixture-backed local application with `npm run dev`.
2. Use a mobile viewport around 390 × 844 and deny or simulate unavailable
   geolocation. Confirm no location-failure notice is shown and line/map
   controls remain usable.
3. Configure delayed fixture data, select a line, and confirm a full-screen
   translucent overlay with a visible loader, followed by line details or an
   explicit failure outcome. Confirm map navigation and the close control
   remain usable while loading.
4. Open and expand line details, then use the close control. Confirm the full
   map returns without a reload or extra gesture.
5. Repeat with reduced motion enabled and at a 320 px viewport; confirm
   essential content remains perceivable and no horizontal scrolling appears.
6. Open a stop and activate the line icon beside an arrival. Confirm the
   selected line route opens; verify that icons without catalog details remain
   informational.
7. Open a line at 390 × 844 and 768 × 1024 portrait viewports. Confirm the
   detail panel spans the available width and its stop list stays inside it.
8. Open language settings and confirm only Castellano and Galego are offered.
   Existing English preferences should load as Castellano.
9. At a desktop width, open a line and confirm route-direction headings are
   compact and do not add excessive default spacing.

The detailed state and interaction rules are in
[data-model.md](./data-model.md) and
[contracts/mobile-map-usability.md](./contracts/mobile-map-usability.md).
