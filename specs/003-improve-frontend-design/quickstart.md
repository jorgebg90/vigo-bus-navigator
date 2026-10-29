# Quickstart: Improve Frontend Design

**Date**: 2026-10-26
**Feature**: [spec.md](spec.md)

## Prerequisites

- Node.js 22 and npm, as used by the repository workflows.
- Dependencies installed with `npm ci`.
- No Worker credentials or deployment are required; Playwright uses a local fixture Worker.

## Run the Application

1. Start the local fixture Worker in one terminal (it defaults to port 8787):

   ```sh
   npm run dev:worker
   ```

2. Start the frontend in another terminal. The local profile defaults to the Worker URL above:

   ```sh
   npm run dev
   ```

3. Open the Vite URL printed by the command. Select a stop on the map, from search, a line, or Saved; all paths should open the same stop-arrivals view. Use the globe button to select Castellano, Galego, or English. The app always uses the light appearance.

> The fixture Worker must provide the v4 `/stops` nullable-coordinate response before implementation acceptance. The commands above match the existing root npm scripts and local defaults.

## Automated Validation

Run the existing gates from the repository root:

```sh
npm run typecheck
npm test
npm run test:contract
npm run test:e2e
npm run build
npm run size
```

Lint both API descriptions while the v4 gate is being implemented:

```sh
npx spectral lint specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml
npx spectral lint specs/003-improve-frontend-design/contracts/realtime-api-v4.openapi.yaml
```

`contracts/realtime-api-v4.openapi.yaml` is the complete standalone v4 contract: v3 operations carried over, with only the stop coordinate pair made nullable (both numbers within the v3 Vigo bounds, or both null), including stops embedded in `/lines/{lineCode}`. Worker and frontend implementation stays blocked until Architect and Backend record review of this artifact. `npm run lint:openapi` currently targets only v3 and must be extended to cover v4; regression tests must cover unchanged operations, the strict pair rule, and an unlocated stop in both `/stops` and `/lines/{lineCode}`.

## Required Scenarios

- Map positions use exactly `[lon, lat]` from API stops; `null` coordinates remain searchable and never become map points.
- Dense and coincident stops expand or open a chooser with an individual 44 × 44 CSS pixel target and shared arrivals details.
- Map, search, line, favorite, and recent selections invoke the same stop flow.
- Arrival freshness uses controlled ages <30, exactly 30, 299, and exactly 300 seconds, including upstream-failure and successful-response cases.
- Browser network inspection confirms only the selected public stop ID goes to the Worker; Worker fixture tests confirm only the required transient source state is forwarded; tile requests disclose visible coordinates to the configured provider; profile data is absent.
- Verify primary flows at 320 × 700, 768 × 1024, 1024 × 768, and 1280 × 900 CSS pixels, plus 200% browser text zoom.
- Verify Castellano default and complete Castellano/Galego/English strings; set reduced motion and confirm nonessential animations are suppressed. Confirm no theme selector or privacy page/link is shown.
- Confirm no ads, sponsored content, app-install promotions, or advertising/analytics requests.
- `npm run size` satisfies per-chunk limits, ≤850 KiB aggregate JS gzip, ≤150 KiB aggregate CSS gzip, and the ≤500 KiB gzip first-map-ready graph. Extend its existing check to read the Vite manifest, include the app entry/static imports/MapLibre chunk/associated CSS once each, and exclude only non-critical dynamic deck.gl. MapLibre is required to show the map; deck.gl remains lazy unless an approved design needs it. Record the measured baseline of this graph before the redesign as the first implementation task.
- Worker contract tests check freshness at 29, 30, 299, and 300 seconds.

## Manual UX Evidence

Automated axe/Playwright checks do not establish full WCAG conformance. UX Designer records keyboard order and focus return, screen-reader announcements, contrast on real tiles, 44 × 44 target usability, 200% reflow, reduced motion, and the rider study (SC-001). Record browser/assistive technology, fixed light appearance, viewport, scenarios, findings, and retest results in the G5 review artifact.

## First-map-ready graph baseline (T001, 2026-10-26)

- Pre-change gzip graph (entry, static imports, MapLibre and deck chunks, CSS; deduplicated): 570.1 KiB, over the 500 KiB target.
- Aggregate gzip JavaScript 562.1 KiB, CSS 10.8 KiB (existing gate).
- Measured with `npm run build && npm run size`; enforcement uses `ENFORCE_FIRST_MAP_BUDGET=1` and is switched on at T042 after deck.gl leaves the map path (T037).

## Generated catalog baseline (T007, 2026-10-26)

- Generated 50 lines, 1,157 stops, and 334 route patterns.
- All 1,157 stops currently have in-bounds coordinates; there are no null pairs, mixed pairs, or `0/0` coordinates in this source snapshot.

## First-map graph after native clustering (T037, 2026-10-26)

- Post-deck-removal first-map-ready gzip graph: 300.7 KiB, down from 570.1 KiB and under the 500 KiB limit.
- Aggregate gzip JavaScript: 291.5 KiB; CSS: 12.0 KiB. The MapLibre chunk is 283.38 KiB gzip.
- `npm run build && npm run size` passes. Vite still reports the MapLibre chunk's uncompressed size as a build warning; the per-chunk and aggregate gzip gates pass.

## US1 first-map graph and network result (T042, 2026-10-26)

- Enforced `ENFORCE_FIRST_MAP_BUDGET=1 npm run build && ENFORCE_FIRST_MAP_BUDGET=1 npm run size`: first-map-ready graph 302.5 KiB gzip (limit 500 KiB), aggregate JavaScript 293.0 KiB gzip, CSS 12.2 KiB gzip.
- T035 Chromium network test passed: 20 stop selections on the 10 Mbps down / 2 Mbps up / 100 ms RTT profile met the threshold of at least 19 loading states within 1 s and terminal states within 10 s.

## Final automated validation and UI polish (T074/T075)

- UI polish applied after the first pipeline pass: the map fills the whole viewport and is always the base layer; navigation (map, search, lines, saved) and settings are icon-only; map controls (stops in view, recenter) are icons and zoom +/− is a compact joined group at the bottom right; stops listed in search navigate to the map; lines use official colour badges; favorites use a star toggle only.
- Passed: `npm run typecheck`, `npm test` (41 files, 158 tests), `npm run test:contract` (56 tests), `npm run test:load`, `npm run test:e2e` (3 browser projects; 7 skipped by design), `npm run lint:openapi`, `npm run build`, `npm run size`.
- First-map-ready graph 308.2 KiB gzip (limit 500 KiB); aggregate JavaScript 298.2 KiB gzip, CSS 12.8 KiB gzip. Vite still warns about the uncompressed MapLibre chunk; the gzip gates pass.
- Not covered by automation (manual blockers): T070-T073 (real devices, assistive technology, usability studies) and T076 / G5 / G6 reviews.

## Settings and Saved Behavior Addendum (2026-10-27)

- The header globe opens only the language choices Castellano, Galego, and English. Claro is fixed; existing `system`/`dark` preferences migrate to light.
- Only stops can be favorited. Lines may appear in Recent but are not favorite targets.
- No privacy or implementation-flow text, page, or link appears in the app. OpenStreetMap and CARTO attribution remains visible.
- Post-adjustment checks: 156 unit tests passed, typecheck passed, and 15 targeted E2E tests passed across the configured browser projects.
