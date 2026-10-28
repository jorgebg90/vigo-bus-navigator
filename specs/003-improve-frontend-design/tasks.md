# Tasks: Improve Frontend Design

**Input**: `/specs/003-improve-frontend-design/` (plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/)
**Prerequisites**: G3 closed ([gate-g3-plan-review.md](gate-g3-plan-review.md)). G4 review round 1 findings (QA, UX, Frontend) are folded into this version; implementation starts only after G4 is recorded in `gate-g4-tasks-review.md`.
**Tests**: Included. Constitution Principle III: every test task precedes its implementation task and must be seen failing (record red, then green).
**Design reference** for UI tasks: [contracts/ui-design-contract.md](contracts/ui-design-contract.md) ("UI contract"). **API reference**: [contracts/realtime-api-v4.openapi.yaml](contracts/realtime-api-v4.openapi.yaml).

## Format

`- [ ] Txxx [P?] [USn?] Description (path). Needs: ... Verify: command -> expected`

- **[P]** only when the task writes files no other incomplete task writes.
- "Extend" or "rewrite" means the file already exists; "new" means it does not.
- Stories: US1 map and arrivals, US2 favorites, US3 lines and search, US4 design/accessibility/privacy/i18n, US5 attribution. The minimal shell is foundation work shared by all stories (Phase 3).

## Phase 1: Setup (baselines and gates)

- [X] T001 Extend `scripts/check-payload-budget.test.ts` first (red), then `scripts/check-payload-budget.ts`: read the Vite manifest and report the first-map-ready JS+CSS gzip graph (entry, static imports, MapLibre chunk, CSS, deduplicated); print time to `map.on('load')` as information only; run it on the untouched build and record the baseline in `specs/003-improve-frontend-design/quickstart.md`. Verify: `npm run build && npm run size` -> prints graph size; `npx vitest run scripts/check-payload-budget.test.ts` -> pass.
- [X] T002 Extend `scripts/openapi-regression.test.ts` first (red): v4 file keeps v3 operations and operation IDs; strict pair rule (both numbers in bounds or both null; mixed pairs, `0/0`, `42.2/0`, `50/-8.7` rejected); v3 bounds (latitude 42.10-42.32, longitude -8.85 to -8.60). Verify: `npx vitest run scripts/openapi-regression.test.ts` -> pass against the reviewed v4 file.
- [X] T003 Update `package.json` so `lint:openapi` lints both the v3 and the v4 files. Needs: T002. Verify: `npm run lint:openapi` -> 0 errors for both files.
- [X] T004 [P] New `frontend/tests/unit/architecture.test.ts` (red): fail if `frontend/src/application/` or `frontend/src/domain/` import `infrastructure`, `ui`, `maplibre-gl`, `@deck.gl/*`, or DOM-only modules, and assert `frontend/src/application/select-stop.ts` and `frontend/src/domain/map-stops.ts` exist. Verify: `npx vitest run frontend/tests/unit/architecture.test.ts` -> fails (missing files); green after T013 and T015.

---

## Phase 2: Foundational data and application layer (repo compiles and tests stay green at the end)

### Catalog and Worker (Backend)

- [X] T005 [P] Write failing tests (new `scripts/catalog/generate.test.ts`, extend `scripts/snapshot/test/geo-validation.test.ts` if shared): generator retains stops without coordinates; empty/null/NaN become null, never `0`; out-of-bounds pairs become null/null; in-bounds coordinates are exact. Verify: `npx vitest run scripts/catalog/generate.test.ts` -> red.
- [X] T006 Fix `scripts/catalog/generate.ts` (remove the non-finite drop near line 132, replace `Number(...)` coercion, add Vigo bounds, fix the `stop.lat === 0` merge logic near line 148). Needs: T005. Verify: same command -> green.
- [X] T007 Regenerate `worker/src/catalog-data.json`; review the diff (unlocated stops present, no `0` coordinates); record counts in `quickstart.md`. Needs: T006. Verify: `npm run catalog:generate && git diff --stat worker/src/catalog-data.json`.
- [X] T008 [P] Extend `worker/test/contract.test.ts` first (red): an unlocated stop in `GET /stops` and in `GET /lines/{lineCode}` (nested `NetworkStop`) matches v4 with `lat` and `lon` both null; mixed pair never emitted. Needs: T007. Verify: `npm run test:contract` -> red.
- [X] T009 Update `worker/src/types.ts`, `worker/src/catalog.ts`, `worker/src/index.ts` for nullable coordinates and API version 4.0.0; located stops behave as in v3. Needs: T008. Verify: `npm run test:contract` -> green.
- [X] T010 [P] Extend `worker/test/stale.test.ts` with boundaries at 29, 30, 299, 300 s (fresh under 30 s; stale only after upstream failure and under 300 s; unavailable at 300 s); record red or green; fix `worker/src/cache.ts` only if red. Verify: `npm run test:contract` -> green.
- [X] T011 [P] Update `postman/vigo-bus-navigator-worker.postman_collection.json` for v4 null coordinates. Verify: `npx vitest run scripts/openapi-regression.test.ts` -> green; JSON parses (`node -e "JSON.parse(require('fs').readFileSync('postman/vigo-bus-navigator-worker.postman_collection.json'))"`).

### Frontend domain and application

- [X] T012 [P] New `frontend/tests/unit/map-stops.test.ts` (red): `toMapStops` drops null pairs and pairs outside the v4 bounds, converts to `[lon, lat]` exactly once, never emits null.
- [X] T013 Make `Stop.lat/lon` `number | null` in `frontend/src/domain/types.ts`; add `frontend/src/domain/map-stops.ts`; adapt consumers minimally so everything still compiles (`frontend/src/infrastructure/schedule/api-schedule-repository.ts`, `frontend/src/ui/map/map-view.ts`, `frontend/src/ui/map/stop-markers.ts`, `frontend/src/ui/home/line-catalog.ts`, `frontend/src/main.ts`; the tile-fallback list prints no coordinates); update broken tests `frontend/tests/unit/schedule-repository.test.ts`, `frontend/tests/unit/map-view.test.ts`, `frontend/tests/unit/stop-view.test.ts`, `frontend/tests/unit/helpers/ports.ts`; confirm `frontend/tests/dom/map-adapter.test.ts`, `frontend/tests/dom/us3-map.test.ts`, `frontend/tests/dom/stop-view.test.ts`, `frontend/tests/dom/us2-stop-arrivals.test.ts` compile and pass unchanged (update only if they reference `lat`/`lon` as non-null). Constraint (data-model.md): `lat` and `lon` are both numbers inside v3 bounds or both null. Needs: T012. Verify: `npm run typecheck && npx vitest run frontend/tests/unit` -> green.
- [X] T014 [P] New `frontend/tests/unit/select-stop.test.ts` (red): stale result of a previous stop dropped; refresh does not change selection state; a null-coordinate stop is selectable from search; map, chooser, search, favorites, recents each call only `selectStop` (adapter-level fake ports).
- [X] T015 Implement `frontend/src/application/select-stop.ts` (active stop, request token, `subscribe(listener)` view model) reusing `frontend/src/application/get-stop-arrivals.ts`; additively add `StopMapPort` to `frontend/src/application/ports.ts` (`setStops`, `setSelectedStop`, `onStopSelected`, `onChooserRequested`, `fitToStops`) without removing the old `MapPort` (removed in T041); no `maplibre-gl` import in `ports.ts`. Needs: T014, T013. Verify: `npx vitest run frontend/tests/unit/select-stop.test.ts frontend/tests/unit/architecture.test.ts` -> green.
- [X] T016 [P] New `frontend/tests/unit/freshness-labels.test.ts` (red): label at 29, 30, 299, 300 s; stale only after upstream failure; unavailable at 300 s or none; "Still loading" polite announcement once after 3 s and silence for loads under 3 s; announce on refresh only when the first arrival changes.
- [X] T017 Implement the freshness view-model rules in `frontend/src/domain/freshness.ts` (new) and use them from `frontend/src/application/select-stop.ts` and `frontend/src/ui/stop/stop-arrivals-view.ts`. Needs: T016, T015. Verify: `npx vitest run frontend/tests/unit/freshness-labels.test.ts` -> green.

**Exit criteria**: `npm run typecheck && npm test && npm run test:contract` all green.

---

## Phase 3: Shell, tokens, and base i18n (foundation shared by all stories)

- [X] T018 [P] New `frontend/tests/unit/token-contrast.test.ts` (red): compute WCAG ratios for every pairing in UI contract section 3 from the CSS custom properties in `frontend/src/ui/styles.css` (4.5:1 text, 3:1 non-text and focus, both themes). Verify: `npx vitest run frontend/tests/unit/token-contrast.test.ts` -> red.
- [X] T019 Define tokens (colors, status, border, focus, map, typography, spacing, radius, elevation, motion) as CSS custom properties in `frontend/src/ui/styles.css` exactly as UI contract section 3, add `prefers-reduced-motion` rules from section 8, retire `.map-stop-marker`. Needs: T018. Verify: T018 test -> green.
- [X] T020 [P] Extend `frontend/tests/i18n/key-parity.test.ts` and `frontend/tests/unit/i18n.test.ts` (red): new shell, panel, state, search, saved, privacy, "No map position", and settings keys exist in es, gl, en; Spanish default for a cleared profile (SC-014).
- [X] T021 Add the base i18n keys for shell, navigation, panel states (UI contract section 7), settings, and "No map position" to `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts`, `frontend/src/i18n/en.ts` (privacy keys land in T062). Needs: T020. Verify: `npx vitest run frontend/tests/i18n frontend/tests/unit/i18n.test.ts` -> green for base keys.
- [X] T022 [P] New `frontend/tests/dom/shell.test.ts` (red): landmarks (`header`, `nav` "Main" with `aria-current`, one `main`, `aside`), one `h1` per destination, focus moves to `h1` and `document.title` updates on destination change, DOM source order equals visual and tab order for the rail and bottom nav, bottom-nav labels wrap and are never truncated.
- [X] T023 [P] New `frontend/tests/dom/focus-history.test.ts` (red): opening a panel focuses its `h2`; selecting a second stop moves focus to the new `h2`; panels and sheet never trap focus while the chooser and settings menu do; Tab order header, panel, main, navigation; Escape and Close; browser Back closes the panel first and then returns to the previous destination; Privacy Back returns to its opener; focus fallback when the opener is gone (destination `h1`, or "Stops in view" on Map).
- [X] T024 [P] New `frontend/tests/dom/sheet.test.ts` (red): peek and expanded snap points, Expand/Collapse button as non-drag alternative, 85% phone and 50% tablet-portrait limits, panel widths 360 px (landscape) and 340-400 px (desktop), Close and Escape, reduced motion makes it instant.
- [X] T025 Implement the app shell in new `frontend/src/ui/shell.ts` and `frontend/index.html`: landmarks, bottom navigation (phone and tablet portrait) and rail (landscape and desktop) with DOM order equal to visual order, destination focus and title, panel history entry, breakpoints per UI contract section 2. Needs: T019, T021, T022, T023, T077. Verify: `npx vitest run frontend/tests/dom/shell.test.ts frontend/tests/dom/focus-history.test.ts` -> green for shell items.
- [X] T026 Implement the sheet and side panel host in new `frontend/src/ui/panel/sheet.ts`. Needs: T024, T025. Verify: `npx vitest run frontend/tests/dom/sheet.test.ts` -> green.
- [X] T027 Implement the Settings menu in new `frontend/src/ui/settings/settings-menu.ts` (button "Settings and privacy", `menuitemradio` for language and theme, Privacy, About; traps focus while open) replacing `frontend/src/ui/settings/language-settings.ts`; update `frontend/src/ui/theme.ts`, `frontend/src/ui/i18n-renderer.ts`, and `frontend/tests/dom/us6-language.test.ts`; delete `language-settings.ts`. Needs: T025, T078. Verify: `npx vitest run frontend/tests/dom/us6-language.test.ts frontend/tests/dom/focus-history.test.ts` -> green.
- [X] T028 Rewire `frontend/src/main.ts` to the shell, settings menu, and existing home modules (still present until their replacement tasks) so the app runs. Needs: T025-T027. Verify: `npm run typecheck && npx vitest run frontend/tests/dom` -> green (shell test mounts the wired `main.ts` entry).

**Exit criteria**: typecheck and unit/DOM tests green; shell hosts the existing views.

---

## Phase 4: User Story 1 - Find a stop on the map and see upcoming buses (P1) MVP

**Goal**: Stops at API coordinates, clustering, chooser, keyboard route, shared stop details with all states.
**Independent test**: With the fixture Worker, select a stop on the map (including a cluster and a coincident-stop chooser) and via "Stops in view", and see arrivals or a clear state.

### Tests (write first, red)

- [X] T029 [P] [US1] Rewrite `frontend/tests/dom/map-adapter.test.ts`: native cluster source (`cluster: true`, `clusterRadius: 50`, `clusterMaxZoom: 16`), `onStopSelected` emits only `stopId`, `onChooserRequested` for coincident stops, selection ring, no per-stop DOM marker buttons, no `showStopDetails`, no deck.gl or PathLayer, `jumpTo` under reduced motion, instant selection ring under reduced motion.
- [X] T030 [P] [US1] Rewrite `frontend/tests/unit/map-view.test.ts` and `frontend/tests/dom/us3-map.test.ts` for the new map view: only `toMapStops` output reaches the map, tile error banner with Retry and Use search (announced politely), fallback list prints no coordinates.
- [X] T031 [P] [US1] Extend `frontend/tests/dom/stop-view.test.ts` and `frontend/tests/dom/us2-stop-arrivals.test.ts`: every state in UI contract section 7 (loading, current, stale, empty, unavailable, no live id, offline, missing coordinates, catalog error) with its next action (Try again, link to lines serving the stop, link to line frequencies), announcement politeness, offline strip announcement and clearing when online, announce-only-when-first-arrival-changes.
- [X] T032 [P] [US1] Extend `frontend/tests/e2e/map-position.spec.ts`: exact positions for a reference set of at least 30 located stops taken from `worker/src/catalog-data.json` (SC-002) plus an assertion that every rendered stop matches a service-provided pair and none appears at an unreported position, cluster expansion, chooser trigger for coincident stops, chooser rows at least 44 high, and the 44 x 44 hit area verified by dispatching pointer events at the edges of the 44 x 44 box around a marker (hit) and just outside (miss).
- [X] T033 [P] [US1] New `frontend/tests/e2e/keyboard-map.spec.ts`: map canvas is `aria-hidden`; toolbar "Stops in view" opens the chooser (focus trapped); choosing a row calls `selectStop` and focuses the panel `h2`; Escape and Close return focus to "Stops in view".
- [X] T034 [P] [US1] Extend `frontend/tests/e2e/arrivals-accessibility.spec.ts`: 30 s refresh only while visible and foregrounded, no focus movement, "Still loading" once after 3 s and none under 3 s.
- [X] T035 [P] [US1] New `frontend/tests/e2e/performance-network.spec.ts` (SC-003): Chromium throttled to 10 Mbps down, 2 Mbps up, 100 ms RTT, 20 stop selections, at least 95% show a loading state within 1 s and a terminal state within 10 s.

### Implementation

- [X] T036 [US1] Rewrite `frontend/src/infrastructure/map/map-port.ts` to `StopMapPort`: GeoJSON source with clustering, count labels, selection ring, invisible hit circle layer `circle-radius: 22`, 44 x 44 `queryRenderedFeatures` box, `getClusterExpansionZoom` and `getClusterLeaves` chooser trigger, `jumpTo` under reduced motion, no deck.gl or PathLayer. Needs: T015, T029 (T032 turns green at T041). Verify: `npx vitest run frontend/tests/dom/map-adapter.test.ts` -> green.
- [X] T037 [US1] Remove `@deck.gl/core`, `@deck.gl/layers`, `@deck.gl/mapbox` from `package.json` and the lockfile; remove the `@deck.gl`/`luma.gl` `manualChunks` rule in `frontend/vite.config.ts` (line 21) and the deck entry in `.size-limit.json`. Needs: T036. Verify: `npm install && npm run build && npm run size` -> no deck chunk in `dist`, graph at or under 500 KiB gzip, record before and after in `quickstart.md`.
- [X] T038 [P] [US1] New `frontend/src/ui/map/stop-chooser.ts` (modal `dialog` "Stops here (N)", rows with name, code, serving lines, sorted by distance then name, 60% max height, rows at least 44 high, Escape and Close return focus) and new `frontend/src/ui/map/map-toolbar.ts` (zoom in, zoom out, Stops in view with up to 50 stops nearest the center, Recenter; all 44 x 44; no geolocation). Needs: T033. Verify: `npm run typecheck && npx vitest run frontend/tests/unit/architecture.test.ts` -> green (T033 turns green at T041).
- [X] T039 [US1] Rewrite `frontend/src/ui/map/map-view.ts` using `toMapStops` and `StopMapPort` (remove the hard-coded bounding box and the per-stop button strip; tile error banner). Needs: T030, T036, T038. Verify: `npx vitest run frontend/tests/unit/map-view.test.ts frontend/tests/dom/us3-map.test.ts` -> green.
- [X] T040 [US1] Rework `frontend/src/ui/stop/stop-view.ts` and `frontend/src/ui/stop/stop-arrivals-view.ts` into the stop panel inside the sheet host (section 4, 5, 7 of the UI contract). Needs: T017, T026, T031. Verify: `npx vitest run frontend/tests/dom/stop-view.test.ts frontend/tests/dom/us2-stop-arrivals.test.ts` -> green.
- [X] T041 [US1] Rewire `frontend/src/main.ts`: map `onStopSelected` and chooser results call `selectStop`; render the subscribed view model; delete the `showStop` closure and `activeStopId`; delete `ui/map/stop-markers.ts`; remove the old `MapPort` from `ports.ts`. Needs: T036, T039, T040. Verify: `npm run typecheck && npm test && npx playwright test frontend/tests/e2e/map-position.spec.ts frontend/tests/e2e/keyboard-map.spec.ts frontend/tests/e2e/arrivals-accessibility.spec.ts frontend/tests/e2e/performance-network.spec.ts` -> green.
- [X] T042 [US1] Record the first-map-graph size and the T035 results in `quickstart.md`; fail the task if the graph exceeds 500 KiB gzip. Needs: T041. Verify: `npm run build && npm run size`.

**Checkpoint**: US1 demonstrable alone.

---

## Phase 5: User Story 2 - Save and reopen favorites (P2)

**Independent test**: Save a stop and a line, reload, open each from Saved, remove each.

- [X] T043 [P] [US2] Extend `frontend/tests/dom/us4-favorites.test.ts` (red): toggle `aria-pressed` and accessible names; state visible in details, search rows, and Saved; unavailable favorite stays removable; Remove is a visible text button; recents, language, theme restored after reload.
- [X] T044 [P] [US2] Extend `frontend/tests/unit/storage-adapter.test.ts` and `frontend/tests/unit/toggle-favorite.test.ts` (red): storage unavailable or full shows "Favorites cannot be saved on this device"; user-defined order kept.
- [X] T045 [P] [US2] New `frontend/tests/e2e/favorites.spec.ts` (red): reload persistence (SC-004) and one-action save or remove from stop details.
- [X] T046 [US2] New `frontend/src/ui/favorite-toggle.ts` and use it in the stop panel (`frontend/src/ui/stop/stop-view.ts`) and line details. Needs: T043, T040. Verify: `npx vitest run frontend/tests/dom/us4-favorites.test.ts` -> green for toggle items.
- [X] T047 [US2] Rework `frontend/src/ui/home/favorites.ts` into the Saved destination (Favorites and Recent `tablist`, Open and Remove, unavailable target) keeping `frontend/src/application/toggle-favorite.ts` and `frontend/src/domain/favorites.ts` as the only logic; update `frontend/src/main.ts` and the import path in `frontend/tests/dom/us4-favorites.test.ts` to the reworked Saved module. Needs: T046. Verify: `npx vitest run frontend/tests/dom/us4-favorites.test.ts && npx playwright test frontend/tests/e2e/favorites.spec.ts` -> green.
- [X] T048 [US2] New `frontend/src/ui/settings/storage-notice.ts` (banner with Dismiss, polite announcement) wired in `frontend/src/main.ts`. Needs: T044, T047. Verify: `npx vitest run frontend/tests/unit/storage-adapter.test.ts` -> green.

---

## Phase 6: User Story 3 - Browse lines and find stops without the map (P3)

**Independent test**: Search a stop and open its arrivals; open a line and each day type; no map interaction.

- [X] T049 [P] [US3] Extend `frontend/tests/dom/us1-line-frequency.test.ts` (red): frequency table with caption, day-type `tablist`, first and last departure, bands, "No published service for this day type", no invented data.
- [X] T050 [P] [US3] New `frontend/tests/dom/lines-list.test.ts` (red, FR-012): every line with badge (text pair at least 4.5:1), code, name; text filter; keyboard operable.
- [X] T051 [P] [US3] New `frontend/tests/dom/stop-search.test.ts` (red): search by name or number, `search` landmark, polite results count in its own live region, no-results message with clear action, "No map position" rows, selecting a result calls `selectStop`.
- [X] T052 [P] [US3] New `frontend/tests/e2e/search-lines.spec.ts` (red): the keyboard flow Search, Lines, line details, stop details with the map hidden.
- [X] T053 [US3] New `frontend/src/ui/search/stop-search.ts`; wire `frontend/src/main.ts`. Needs: T051, T015, T047, T048. Verify: `npx vitest run frontend/tests/dom/stop-search.test.ts` -> green.
- [X] T054 [US3] Rework `frontend/src/ui/home/line-catalog.ts` into the Lines destination and `frontend/src/ui/line/frequency-view.ts` into the table per the UI contract, reusing `frontend/src/application/get-line-frequency.ts` and `frontend/src/domain/frequency.ts` unchanged; update `frontend/src/main.ts`; delete leftover `frontend/src/ui/home/*` files once nothing imports them. Needs: T049, T050, T053. Verify: `npx vitest run frontend/tests/dom && npx playwright test frontend/tests/e2e/search-lines.spec.ts` -> green.

---

## Phase 7: User Story 4 - Friendly, accessible app on any device (P4)

**Independent test**: Stories 1-3 at 320, 768x1024, 1024x768, 1280, 200% text, keyboard only, screen reader.

### Tests (red first)

- [X] T055 [P] [US4] New `frontend/tests/e2e/responsive.spec.ts`: 320 x 700, 768 x 1024, 1024 x 768, 1280 x 900, 200% text; no horizontal scroll or overlap; 44 x 44 for navigation, close, settings, favorite, and map controls; attribution strip visible, not covered by the sheet, and linking to Privacy at each size (SC-006).
- [X] T056 [P] [US4] New `frontend/tests/e2e/a11y-states.spec.ts`: axe at all four viewports in both themes on map, lines, search, details (current), saved, and privacy; on the reduced set of 320 x 700 and 1280 x 900 in both themes for stale, error, offline, chooser, open settings menu, and expanded sheet (their layout does not change between tablet sizes) (SC-005); per-state announcements and next actions per UI contract section 7.
- [X] T057 [P] [US4] New `frontend/tests/e2e/reduced-motion.spec.ts`: each row of UI contract section 8 (sheet instant, `jumpTo` for cluster expand and recenter, selection ring instant, static skeleton, no panel fade) with identical information (SC-015).
- [X] T058 [P] [US4] New `frontend/tests/e2e/privacy-network.spec.ts` (SC-011, FR-021): browser-to-Worker arrival requests carry only the selected public stop id; no favorites, recents, language, theme, account identifiers, or location appear in any request; no geolocation permission request; map tile requests are the only disclosure to the tile provider; plus the SC-007 assertion of no advertisements, sponsored items, install promotions, or analytics requests. Add a Worker test in `worker/test/upstream.test.ts` that Worker-to-source requests contain only the stop id and source-required transient form state.
- [X] T059 [P] [US4] New `frontend/tests/dom/privacy-view.test.ts` (FR-018, FR-022, SC-013): four `h2` sections in order; reachable from Settings, stop-panel footer, and the attribution strip; es/gl/en copy; no "anonymous" or device-location claims; states community open-source and not an official service; the rendered map attribution text equals the CARTO text recorded in `research.md` and the recorded source URL and date are present.
- [X] T060 [P] [US4] Extend `frontend/tests/e2e/offline.spec.ts`: offline strip, offline stop state, cached catalog, clearing when back online.

### Implementation

- [X] T061 [US4] Finish responsive layout, bottom-nav label wrapping, panel widths, and attribution strip in `frontend/src/ui/styles.css` and `frontend/src/ui/shell.ts`; implement the section 8 reduced-motion behavior in `frontend/src/ui/styles.css`, `frontend/src/infrastructure/map/map-port.ts`, and skeleton styles. Needs: T055, T057. Verify: `npx playwright test frontend/tests/e2e/responsive.spec.ts frontend/tests/e2e/reduced-motion.spec.ts` -> green.
- [X] T062 [US4] New `frontend/src/ui/privacy/privacy-view.ts` with the four sections, three entry points, es/gl/en copy in `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts`, `frontend/src/i18n/en.ts`; take CARTO's current attribution text from the provider's documentation and record the source URL and date in `research.md` (G3 open item). Needs: T059, T058. Verify: `npx vitest run frontend/tests/dom/privacy-view.test.ts frontend/tests/i18n && npx playwright test frontend/tests/e2e/privacy-network.spec.ts` -> green.
- [X] T063 [US4] Update `frontend/src/ui/offline-status.ts` and `frontend/src/sw/offline.ts` for the offline strip and recovery. Needs: T060. Verify: `npx playwright test frontend/tests/e2e/offline.spec.ts` -> green.
- [X] T064 [US4] Fix every violation from `frontend/tests/e2e/a11y-states.spec.ts` in the relevant `frontend/src/ui/**` modules. Needs: T056, T061-T063. Verify: `npx playwright test frontend/tests/e2e/a11y-states.spec.ts` -> 0 violations.

---

## Phase 8: User Story 5 - Accurate project attribution (P5)

**Independent test**: Characterization and replacement tests pass; current artifacts contain no retired source name.

- [X] T065 [P] [US5] Extend `worker/unit/normalize.test.ts` first (green on current code, this is characterization): repaired accents, quote and asterisk cleanup, arrival ordering, deduplication; record explicit keep-or-redesign decisions for ordering and deduplication. Verify: `npx vitest run worker/unit/normalize.test.ts` -> green before any change.
- [X] T066 [P] [US5] New `scripts/provenance.test.ts` (red): fails while current product code, `NOTICE`, `README.md`, current docs, contracts, and tests mention the retired source name; explicit allow-list of historical feature-002 paths; asserts every allow-listed historical artifact contains the superseding correction note.
- [X] T067 [US5] Replace the character-repair table and quote/asterisk cleanup in `worker/src/normalize.ts` with independently authored, source-contract-driven normalization; write the provenance record (authored from the source contract and observed outputs, not the copied table) under D10 in `research.md`. Needs: T065. Verify: `npx vitest run worker/unit/normalize.test.ts && npm run test:contract` -> green.
- [X] T068 [US5] Add the superseding correction note to historical feature-002 artifacts (`specs/002-realtime-bus-api/spec.md`, `plan.md`, `research.md`, `blog-draft-specify-plan.md`, and `docs/blog/*` where they mention it) without rewriting approvals. Needs: T066. Verify: provenance test historical-note assertions pass.
- [X] T069 [US5] After T067 is reviewed, remove the retired source name from current product code, `NOTICE`, `README.md`, `docs/quality.md`, `docs/harness-charter.md`, current contracts and tests. Needs: T067, T068. Verify: `npx vitest run scripts/provenance.test.ts` -> green; a case-insensitive repository search lists only allow-listed historical paths.

---

## Phase 9: Polish, evidence, and gates

- [ ] T070 [US4] Record the UX pre-acceptance design-fidelity and accessibility verdict (FR-020, SC-008 second part) in new `specs/003-improve-frontend-design/gate-g5-implementation-review.md`, citing T071-T073 evidence. Needs: T064, T071, T072, T073.
- [ ] T071 [P] UX evidence in new `specs/003-improve-frontend-design/evidence-ux.md`. Needs: T064. Checks with pass thresholds: marker, cluster-count, and attribution contrast sampled on the shipped light basemap at city, district, and street zoom (3:1 non-text, 4.5:1 text); hover and pressed pairs (4.5:1 text, 3:1 non-text) measured with the WebAIM or Colour Contrast Analyser tool; 44 px hit check on one real iOS and one real Android device (pointer hits inside the 44 x 44 box succeed, misses outside do not); 200% reflow at 320 px using browser text zoom in Safari and Chrome with no horizontal scroll or lost content. Record devices, browsers, tools, and limitations. Any unresolved failure or missing manual evidence blocks G5.
- [ ] T072 [P] Manual assistive-technology pass in new `specs/003-improve-frontend-design/evidence-at.md`. Needs: T064. Pairings: VoiceOver with Safari (macOS) and NVDA with Firefox or Chrome (Windows). Scenarios: map to chooser to stop panel, language globe/menu, sheet Expand/Collapse/Close, Saved tabs, and each arrival announcement in UI contract section 7. Pass: every row announced as specified with correct role and name; any failure or unrecorded row blocks G5.
- [ ] T073 [P] Rider study using new `specs/003-improve-frontend-design/rider-study-template.md` (created in T080), focused on SC-001 find-a-stop task; record results in new `specs/003-improve-frontend-design/evidence-riders.md`. Needs: T064, T080.
- [x] T074 Run `npm run typecheck && npm test && npm run test:contract && npm run test:load && npm run test:e2e && npm run lint:openapi && npm run build && npm run size`; fix failures. Needs: T042, T064, T069, T079.
- [x] T075 Run the validation in `quickstart.md` (local Worker on port 8787, `npm run dev`) and update it with final results. Needs: T074.
- [ ] T076 Request G5 reviews (Software Architect, Backend Developer, UX Designer, Frontend Developer, QA Tester, Stakeholder) and the Communicator G6 posts in `docs/blog/`.

---

## Additional tasks (executed where their dependents indicate)

- [ ] T077 Pre-implementation record of FR-001 and SC-008 first part: append to `specs/003-improve-frontend-design/gate-g4-tasks-review.md` the UX Designer design-baseline approval and the Frontend Developer agreement with `contracts/ui-design-contract.md` (both given at G3); run after Phase 2 and before T025. Needs: T017. Verify: file contains both verdict lines.
- [X] T078 [P] New `frontend/tests/dom/settings-menu.test.ts` (red): button `aria-haspopup="menu"`, `menuitemradio` roles for language (es, gl, en) and theme (system, light, dark), switching language and theme updates text and persists, Privacy and About items present, closes on Escape. Run before T027. Verify: `npx vitest run frontend/tests/dom/settings-menu.test.ts` -> red, then green after T027.
- [X] T079 Rewrite `frontend/tests/e2e/acceptance.spec.ts` (red against the old flows, then green) for the new shell, map marker or chooser selection, Saved, Search, and Lines flows; remove selectors for the removed button strip and home flows. Starts after T041 (map) and finishes after T054. Verify: `npx playwright test frontend/tests/e2e/acceptance.spec.ts` -> green.
- [X] T080 [P] New `specs/003-improve-frontend-design/rider-study-template.md`: at least 10 participants; participant table (id, device, assistive tech, prior use); SC-001 task script (find a named stop and read next bus, timed by observer with a stopwatch from app open, pass if within 30 s, pass rate at least 9 of 10); result recording format per participant and task. Run before T073.

### Post-Implementation Decisions (2026-10-27)

The completed task descriptions above record the approved implementation plan and are retained as history. Owner decisions made after implementation supersede the corresponding UI requirements: fixed light appearance, globe-based language selector (Castellano/Galego/English), stop-only favorites, and no rider-facing privacy page/link. The current requirements are in `spec.md`, `contracts/ui-design-contract.md`, and the updated pending manual tasks T071-T073.

## Dependencies and Execution Order

- Phase 1 first; T001 baseline precedes any frontend change.
- Phase 2 has two parallel tracks: Worker (T005-T011) and frontend (T012-T017); exit criteria require both green.
- Phase 3 (shell, tokens, base i18n) precedes every story because US1-US3 render inside the shell and need the i18n keys.
- US1 (Phase 4) then US2 (needs stop panel T040) and US3 (needs `selectStop` and shell) in parallel; US4 (Phase 7) finalizes cross-cutting evidence after US1-US3.
- US5 (Phase 8) is independent of UI and can run in parallel after Phase 1 by another actor; T069 waits for T067 and T068.
- Polish last.

## Parallel Examples

- Phase 1: T002 and T004.
- Phase 2: Worker track (T005-T011) with frontend track (T012-T017).
- Phase 3 tests: T018, T020, T022, T023, T024.
- US1 tests: T029-T035 together; T038 parallel with T036.
- US5 (T065, T066) in parallel with US2/US3.

## Implementation Strategy

- MVP: Phases 1-4 (T001-T042); validate and demo.
- Increment: US2, US3, then US4 finishing, US5, Polish.
- Each checkpoint must be green before continuing.

## Notes

- Do not revert pre-existing uncommitted work (agent definitions, constitution, charter, `.specify/feature.json`).
- Existing files named above are extended or rewritten; every new file is marked "new".
