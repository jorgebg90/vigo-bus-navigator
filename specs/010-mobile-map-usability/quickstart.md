# Quickstart: Improve Mobile Map Usability

**Date**: 2026-10-29
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js and the repository's installed dependencies.
- Run all scenarios locally with fixture data; do not use live municipal
  services or a real browser location permission.

## Focused Automated Validation

```bash
npm test -- frontend/tests/dom/location-status.test.ts frontend/tests/dom/us1-line-frequency.test.ts frontend/tests/dom/line-loading-view.test.ts frontend/tests/dom/shell.test.ts
npm test -- frontend/tests/dom/stop-view.test.ts
npm run test:e2e -- frontend/tests/e2e/mobile-location.spec.ts frontend/tests/e2e/municipal-line-service.spec.ts frontend/tests/e2e/reduced-motion.spec.ts frontend/tests/e2e/municipal-catalog.spec.ts
npm run typecheck
```

Expected results:

- DOM tests verify suppression of mobile failure/out-of-coverage messages,
  retention of the usable-location no-nearby status, immediate full-screen
  translucent line-loading feedback, localized accessible close control, and
  map destination restore.
- Stop-view tests verify that catalog-backed arrival line icons are
  keyboard-operable route links, while other line icons remain unchanged.
- Browser tests verify denied, outside-coverage, and usable-location outcomes;
  delayed and failed line/route data; closing details at mobile viewport sizes;
  arrival line-icon navigation; and behavior when reduced motion is enabled.
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

The detailed state and interaction rules are in
[data-model.md](./data-model.md) and
[contracts/mobile-map-usability.md](./contracts/mobile-map-usability.md).
