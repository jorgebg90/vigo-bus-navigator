# Tasks: Holistic Menu Experience

**Input**: Design documents from `/specs/012-holistic-menu-experience/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/menu-and-search.md, quickstart.md

**Tests**: Required by constitution Principle III (test-first). Test tasks precede implementation within each story and must fail before the implementation task.

**Organization**: Grouped by user story. Paths are relative to the repository root; the app lives in `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 from spec.md

## Phase 1: Setup

- [x] T001 Record baseline by running `npm run typecheck`, `npm test` and `npm run size`; note current gzip JS/CSS/first-map sizes in `specs/012-holistic-menu-experience/quickstart.md` under a "Baseline" heading
- [ ] T002 [P] Capture baseline screenshots of the journey planner at 390x844 and 1280x900 (reference for "planner not degraded", FR-001) via the existing e2e harness in `frontend/tests/e2e/responsive.spec.ts`

---

## Phase 2: Foundational (blocks all stories)

- [x] T003 Add i18n keys for new/changed copy (nav labels, global search entry, result type labels `stop`/`line`/`address`, handoff actions "use as origin"/"use as destination"/"back to …", loading/empty/error/offline messages, retry) to `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts` and `frontend/src/i18n/en.ts`; verify with `frontend/tests/i18n/key-parity.test.ts`
- [x] T004 [P] Add shared status component `renderContentState(root, state, options)` supporting `loading | empty | error | offline` with message, optional retry/alternative action, `role="status"`/`role="alert"` as appropriate, in `frontend/src/ui/content-state.ts`; unit/DOM test in `frontend/tests/dom/content-state.test.ts`
- [x] T005 [P] Extract shared design patterns (section heading, content group, selectable filter chip, list item, empty state, expandable panel; all interactive targets `min-height/min-width: 44px`) from the journey planner styles into reusable classes in `frontend/src/ui/styles.css`, keeping existing planner selectors visually unchanged; verify against T002 screenshots
- [x] T006 Define in-memory navigation handoff and search-session types per data-model.md (`category`: `all|stops|lines|addresses`; `status`: `idle|loading|results|empty|error|offline`; `targetKind`: `stop|line|address`; `journeyEndpoint`: `origin|destination`; never serialized to localStorage, URL or logs) in `frontend/src/ui/search/search-session.ts`

**Checkpoint**: shared copy, state and style primitives ready.

---

## Phase 3: User Story 1 - Navigate a consistent app (P1) 🎯 MVP

**Goal**: Labeled, responsive primary navigation with clear active state and consistent visual language.

**Independent Test**: Visit all five destinations at 320, 390, 768, 1024 and 1280 px; active destination is clear, content reachable, planner unchanged.

- [x] T007 [P] [US1] Extend `frontend/tests/dom/shell.test.ts`: each destination button has a visible text label and accessible name, active one has `aria-current="page"`, heading and `document.title` update on navigate and on language change, settings/language remains in header outside `nav`
- [x] T008 [P] [US1] Extend `frontend/tests/e2e/responsive.spec.ts`: at 320x700, 390x844, 768x1024, 1024x768, 1280x900 assert bottom bar (phone) vs persistent rail (tablet/desktop), every destination reachable in one action (SC-001), no horizontal overflow, nav does not overlap map controls or panel actions, targets ≥ 44px
- [x] T009 [US1] Update `frontend/src/ui/shell.ts` to render labeled destination buttons (icon + text via `setIconButton`/`translateCurrent` keys `navMap`…`navSaved`), set `aria-current="page"` on active, update section heading and `document.title`, and re-translate labels on language change
- [x] T010 [US1] Update `frontend/src/ui/styles.css` for the bottom-bar layout (< 600px) and labeled persistent rail (≥ 600px, incl. 1024px portrait rule), safe-area insets, long-label wrapping/ellipsis safe for gl/es/en, visible focus, reduced-motion safe transitions; reserve space so map controls and sheets are not obscured
- [x] T011 [P] [US1] Apply shared patterns from T005 to the lines list, saved/favorites view and privacy view: `frontend/src/ui/line/lines-list.ts`, `frontend/src/ui/home/favorites.ts`, `frontend/src/ui/privacy/privacy-view.ts`; keep `frontend/src/ui/search/journey-search-view.ts` and `journey-results-view.ts` behavior unchanged
- [ ] T012 [US1] Run `frontend/tests/dom/shell.test.ts`, responsive e2e and journey-search e2e; compare planner screenshots to T002 baseline; fix regressions

**Checkpoint**: MVP — consistent labeled navigation across viewports.

---

## Phase 4: User Story 2 - Find and continue a transit journey (P1)

**Goal**: One search surface from every section; stop/line/address handoffs into map and planner with in-memory context and return.

**Independent Test**: From lines/saved/map, open search, find a stop and a line, continue to map or planner with context preserved; return to origin section.

- [x] T013 [P] [US2] DOM tests for unified search in `frontend/tests/dom/unified-search.test.ts`: blank query issues no address request; stop/line results are labeled by type; address suggestions appear only through a stubbed `AddressGeocodingPort`, show the privacy disclosure and are cancelled/discarded when the query changes (stale results never replace newer ones); category filter; clear while results visible
- [x] T014 [P] [US2] DOM tests for handoffs in `frontend/tests/dom/handoff.test.ts`: stop with valid coordinates offers use-as-origin/destination, stop without coordinates omits them; address fills chosen endpoint and does not submit the journey; line offers favorite/route and requires selecting a route stop before endpoint use; return action restores originating destination; no localStorage/URL writes
- [ ] T015 [P] [US2] E2E in `frontend/tests/e2e/search-lines.spec.ts` and `frontend/tests/e2e/journey-search.spec.ts`: search reachable from map, lines, saved and journeys; stop→planner origin; address→planner destination; line→route stop→planner; return to originating section keeps in-progress state (SC-007); extend `frontend/tests/e2e/privacy-network.spec.ts` to assert no address request on blank input and no query in URL/storage
- [x] T016 [US2] Implement unified search view in `frontend/src/ui/search/unified-search.ts` composing `frontend/src/ui/search/stop-search.ts` logic, line matching from `frontend/src/ui/line/lines-list.ts` and address suggestions via `AddressGeocodingPort` (`frontend/src/application/ports.ts`) with debounce, cancellation and stale-result discard; use `search-session.ts` and `content-state.ts`
- [x] T017 [US2] Add global search entry point to the shell header/nav in `frontend/src/ui/shell.ts` that opens the search destination from any section, reusing the existing `search` destination
- [x] T018 [US2] Wire handoff state in `frontend/src/main.ts`: stop/address → `journeyOrigin`/`journeyDestination` (existing in-memory state) then `shell.navigate('journeys')` without submitting; stop → map details; line → existing line details; maintain return destination and expose a return control; clear handoff on dismiss or new task
- [x] T019 [P] [US2] Add stop/line detail actions (journey origin/destination, view on map, favorite) shown only when supported in `frontend/src/ui/stop/stop-view.ts` and `frontend/src/ui/line/frequency-view.ts`; route-stop action in line details feeds T018
- [x] T020 [US2] Preserve in-progress context across destination switches (search query/results, journey form, selected line) unless explicitly reset, in `frontend/src/main.ts`; cover with test in `frontend/tests/dom/handoff.test.ts`
- [x] T021 [US2] Run T013–T015 suites; verify existing `frontend/tests/dom/stop-search.test.ts` and `lines-list.test.ts` still pass

---

## Phase 5: User Story 3 - Understand every interface state (P2)

**Goal**: Consistent loading, empty, error and offline states with recovery actions.

**Independent Test**: Force each state in map/stop panel, search, lines, saved and journeys; each explains the situation and offers retry/alternative where possible.

- [ ] T022 [P] [US3] Extend `frontend/tests/e2e/a11y-states.spec.ts` and `frontend/tests/e2e/offline.spec.ts` to cover loading, empty, error and offline for search, lines, saved and stop panel, including going offline mid-request then reconnecting; assert retry only where repeatable
- [ ] T023 [P] [US3] DOM tests for state mapping in `frontend/tests/dom/content-state.test.ts` (extend): switching destination during a load discards the stale result; no favorites/recents and unavailable local storage render empty/notice states
- [ ] T024 [US3] Use `renderContentState` in `frontend/src/ui/line/lines-list.ts`, `frontend/src/ui/line/line-loading-view.ts`, `frontend/src/ui/home/favorites.ts`, `frontend/src/ui/stop/stop-arrivals-view.ts`, `frontend/src/ui/stop/serving-lines-view.ts` and unified search, keeping existing source-reason messages and offline indicator (`frontend/src/ui/offline-status.ts`)
- [x] T025 [US3] Wire retry callbacks in `frontend/src/main.ts` only for repeatable operations; preserve visibility pause and cancellation behavior for real-time requests
- [ ] T026 [US3] Run T022–T023 and existing `frontend/tests/dom/stop-view.test.ts`, `us2-stop-arrivals.test.ts`

---

## Phase 6: User Story 4 - Use menus accessibly (P2)

**Goal**: Keyboard, touch, screen-reader, reduced-motion and localization quality across new menus.

**Independent Test**: Complete navigation, search and handoff by keyboard only; check focus, targets, contrast, reduced motion and all three locales.

- [ ] T027 [P] [US4] Extend axe-backed checks in `frontend/tests/e2e/a11y-states.spec.ts` and keyboard flows in `frontend/tests/e2e/keyboard-map.spec.ts` for nav, search, handoff and panels: logical focus order, visible focus, no traps, Escape closes panels with focus return, 44px targets
- [ ] T028 [P] [US4] Extend `frontend/tests/e2e/reduced-motion.spec.ts` for nav transitions, panel/sheet and search results; add long-label locale checks (gl/es/en) to `frontend/tests/e2e/responsive.spec.ts`
- [x] T029 [US4] Fix gaps found: raise any compact planner controls adopted elsewhere from 40px to ≥ 44px in `frontend/src/ui/styles.css`; ensure labels/`aria-*` on new controls in `frontend/src/ui/shell.ts`, `frontend/src/ui/search/unified-search.ts`, `frontend/src/ui/panel/sheet.ts`
- [x] T030 [US4] Verify `frontend/tests/i18n/key-parity.test.ts` and `frontend/tests/dom/us6-language.test.ts` pass with all new keys; live-region and title update on language change

---

## Phase 7: Polish & Cross-Cutting

- [x] T031 Run full gates: `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`, `npm run size`; confirm budgets (850 KiB JS, 150 KiB CSS, 500 KiB first-map) and that navigation/search do not eagerly import map-only code
- [ ] T032 [P] Capture Android ADB screenshots of the primary destinations and search on a device/emulator and review layout (project UI-verification convention); also manual walkthrough from `specs/012-holistic-menu-experience/quickstart.md`
- [x] T033 [P] Update README sections (`README.md`, `README.en.md`, `README.gl.md`) only if user-visible navigation/search behavior is described there
- [ ] T034 Record G3/G4 harness verdicts and phase blog draft (G6) under `specs/012-holistic-menu-experience/`
- [x] T035 Consolidate final UX refinements: shared rounded Search/Lines fields,
  line cards and Saved tabs/rows, phone Saved bottom sheet, actual navigation
  spacing and final-content focus; add DOM/responsive regression coverage
- [x] T036 Re-run final typecheck, all Vitest tests, affected browser suites,
  production build/artifact guard and payload budgets; record results and
  product-owner closure scope without marking deferred tasks complete

---

## Implementation Status

Verified on 2026-11-14: strict typecheck, all 467 Vitest tests across 93 files,
production build, production-artifact guard and payload budgets. Gzip totals:
JS 388.2 KiB / 850 KiB, CSS 15.9 KiB / 150 KiB, first-map 401.3 KiB / 500 KiB.
Coverage passes at 96.93% lines and 89.61% branches in the configured
application/domain scope; this is not a whole-UI coverage claim.

The pre-refinement single full Playwright run (`npm run test:e2e -- --workers=2`)
passes: **164 passed, seven existing project-specific skips**, out of 171 cases.
The skips are desktop-only camera assertions and Chromium-only network emulation
on unsupported projects, not disabled failing tests. Chromium desktop, Android
Chrome and iOS Safari all execute the applicable journey, menu, search, keyboard,
offline and axe checks. No browser installation was needed in this environment.

Regression fixes and added checks:

- Measure actual phone navigation height (including wrapped labels, text resizing
  and safe-area padding) instead of reserving a hardcoded 64 px. Disconnect the
  resize observer/listener when the shell is destroyed.
- Focus the final composed destination content, not the discarded shell heading;
  verify stop-to-planner handoff with Enter and Escape focus return under reduced
  motion. The DOM focus regression was reproduced before the fix.
- Adapt map/panel assertions to the bottom bar and tablet rail. Performance tests
  use a real local query rather than expecting results for empty search.
- Explicitly select the initial weekday tab rather than depending on today's
  calendar date. Use the existing 15-second line readiness allowance in the
  functional keyboard test; the separate one-/ten-second arrivals performance
  thresholds remain unchanged.
- Verify global search access, stop/address/line-route-stop endpoint handoffs,
  retained search query and other journey endpoint, no implicit OTP submission,
  no query storage/URL writes, and address error/retry/offline/empty states.
- Verify enlarged-text layout and real menu language switches in es/gl. English
  catalog/DOM coverage is retained; the existing menu intentionally has no English
  item. Do not claim browser English selection was tested.

Manual browser checks used real municipal autocomplete and OTP responses on
localhost, with desktop and 390x844 screenshots inspected. The existing published
application at `https://jblueprint.dev/vigo-bus-navigator/` also completed direct
autocomplete and OTP planning; that confirms the deployed planner's origin
compatibility, not deployment of feature 012 or these local corrections.

**Follow-up retained at closure:** T002/T012's pre-change screenshot comparison was not
retroactively manufactured. T015's broader return/selected-line restoration
coverage, T022–T024/T026's complete cross-section state work, T027/T028's full
requirements review and T034's harness/usability verdicts remain separate from
passing existing automated checks. Passing tests do not close those tasks or
establish SC-002's participant success rate.

**Device validation:** ADB was absent from PATH and standard SDK locations.
The product owner explicitly chose to leave T032 pending and finish browser
testing. Playwright Android emulation and browser screenshots are not ADB/device
captures.

### Final Delivery Acceptance

On 2026-11-14 the product owner approved the final Search, Lines and Saved
presentation and chose: "Cerrar la entrega actual y documentar lo restante como
seguimiento pendiente". Feature 012 is closed for this accepted delivery; the
unchecked original tasks above are retained follow-up, not completed or erased.
No participant usability metric, ADB capture, pre-change visual baseline, or
separate harness verdict is claimed.

After all refinements, `npm run typecheck`, `npm test -- --maxWorkers=2`
(467 tests / 93 files), `npm run build`,
`npm run validate:production-artifact`, `npm run size`, and `git diff --check`
pass. The affected responsive/favorites/search-lines/reduced-motion browser suite
passes **28 cases with two existing project-specific skips** across Chromium
desktop, Android Chrome and iOS Safari. This includes the unified Search rounded
field assertions, not just Lines. The full 164-pass run above predates these final
style changes and is not represented as a new full-suite run.

No implementation extension hooks are registered. Local Spec Kit selection now
resolves feature 012 rather than the previous feature's ignored metadata.

Notes: the global search entry is the primary-nav Search destination, reachable in one action from every section. T033: the READMEs do not describe navigation or search, so no change was needed.

## Dependencies & Order

- Phase 1 → Phase 2 → stories. T003–T006 block all stories.
- US1 (MVP) first; US2 depends on US1 shell (T009, T017) and T006; US3 depends on T004 and benefits from US2's search view (T024); US4 validates and fixes after US1–US3.
- Within a story: tests → implementation → verification.

## Parallel Opportunities

- Foundational: T004, T005 in parallel after T003 starts.
- US1: T007, T008, T011 in parallel; US2: T013, T014, T015, T019 in parallel; US3: T022, T023; US4: T027, T028.

## Implementation Strategy

1. MVP: Phases 1–3 (labeled responsive navigation), validate and demo.
2. Add US2 (search + handoffs), then US3 (states), then US4 (accessibility hardening).
3. Finish with Phase 7 gates; no new dependencies, sources or persisted data at any step.
