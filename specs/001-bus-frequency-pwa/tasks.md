# Tasks: Vigo Bus Frequency PWA

**Input**: Design documents from `specs/001-bus-frequency-pwa/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Required by the feature specification and Constitution Principle III. Test tasks are placed before the implementation tasks they validate.

## Phase 1: Setup

**Purpose**: Initialize the Vite/TypeScript frontend, Worker package, and repository tooling.

- [X] T001 Create the `frontend/`, `worker/`, `scripts/snapshot/`, and test directories from `specs/001-bus-frequency-pwa/plan.md`
- [X] T002 Initialize the root npm workspace with package scripts in `package.json`
- [X] T003 [P] Configure strict TypeScript, ES2022 modules, and shared compiler settings in `tsconfig.json`, `frontend/tsconfig.json`, and `worker/tsconfig.json`
- [X] T004 [P] Configure Vite, GitHub Pages base path, local/production profiles, manual map chunking, and PWA integration in `frontend/vite.config.ts`
- [X] T005 [P] Configure Vitest node and happy-dom projects, v8 coverage, and test globs in `vitest.config.ts`
- [X] T006 [P] Configure Playwright for the offline smoke test and pin the SC-003 matrix (Chrome Android, Safari iOS, and Chrome desktop) in `playwright.config.ts`
- [X] T007 [P] Add repository lint/typecheck/test ignore rules and developer environment defaults in `.gitignore` and `.env.example`

## Phase 2: Foundational

**Purpose**: Implement shared contracts and infrastructure that block all user stories.

**Checkpoint**: Foundation ready; user stories can be implemented and tested independently.

- [X] T008 Define pure domain entities and validation types in `frontend/src/domain/types.ts`
- [X] T009 Define `ScheduleRepository`, `ArrivalsGateway`, `StoragePort`, `ClockPort`, `VisibilityPort`, and `MapPort` in `frontend/src/application/ports.ts`; this is the canonical TypeScript import location and `contracts/internal-ports.md` is its specification
- [X] T010 [P] Add shared test fixtures for lines, stops, timetables, and arrivals covering live, timeout, upstream, network, unparseable, and empty-arrivals cases in `frontend/src/infrastructure/fixtures/`
- [X] T011 [P] Create versioned schedule fixture files in `frontend/public/data/fixtures/` and production snapshot placeholders in `frontend/public/data/`
- [X] T012 [P] Implement local and production profile resolution in `frontend/src/infrastructure/config.ts`
- [X] T013 [P] Implement deterministic clock and visibility adapters in `frontend/src/infrastructure/system/`
- [X] T014 [P] Add domain/application test helpers and in-memory port fakes in `frontend/tests/unit/helpers/`
- [X] T015 [P] Add the Worker package manifest, Wrangler configuration, and typed environment bindings in `worker/package.json`, `worker/wrangler.toml`, and `worker/src/env.ts`
- [X] T016 [P] Add the snapshot source format and regeneration command scaffold in `scripts/snapshot/source/`, `scripts/snapshot/generate.ts`, and `scripts/snapshot/README.md`
- [X] T017 [P] Add OpenAPI Spectral configuration and schema validation scripts for `specs/001-bus-frequency-pwa/contracts/stop-arrivals.openapi.yaml`
- [X] T018 [P] Add CI workflow for linting, typechecking, unit/DOM tests, contract tests, i18n parity, and size limits in `.github/workflows/ci.yml`
- [X] T019 [P] Add the frontend/Worker deployment workflow with Pages and Cloudflare environment placeholders in `.github/workflows/deploy.yml`

## Phase 3: User Story 1 - Check frequencies for a bus line (Priority: P1) MVP

**Goal**: Browse/search Vigo lines and view the correct frequency table, day type, no-service state, and dataset freshness.

**Independent Test**: Run the US1 unit/DOM tests and `VS1` from `quickstart.md` using only bundled local fixtures.

### Tests for User Story 1

- [X] T020 [P] [US1] Test day-type derivation for weekdays, Saturdays, Sundays, holidays, holiday precedence, and midnight rollover in `frontend/tests/unit/day-type.test.ts`
- [X] T021 [P] [US1] Test time-band validation, frequency lookup, first/last departure, no-service, and nearest-served-day behavior in `frontend/tests/unit/frequency.test.ts`
- [X] T022 [P] [US1] Test schedule repository manifest, stops, and lazy per-line timetable loading in `frontend/tests/unit/schedule-repository.test.ts`
- [X] T023 [P] [US1] Test catalog search, selection, day-type switching, dataset metadata, and no-service rendering in `frontend/tests/dom/us1-line-frequency.test.ts`

### Implementation for User Story 1

- [X] T024 [P] [US1] Implement date plus holiday-calendar day-type derivation in `frontend/src/domain/day-type.ts`
- [X] T025 [P] [US1] Implement time-band validation and frequency lookup in `frontend/src/domain/frequency.ts`
- [X] T026 [P] [US1] Implement bundled manifest/stops/line timetable loading in `frontend/src/infrastructure/schedule/schedule-repository.ts`
- [X] T027 [US1] Implement the line-frequency use case, including current-date re-evaluation through `ClockPort`, in `frontend/src/application/get-line-frequency.ts`
- [X] T028 [P] [US1] Implement line catalog browsing and keyboard/touch search in `frontend/src/ui/home/line-catalog.ts`
- [X] T029 [P] [US1] Implement the day-type selector, frequency table, no-service message, and dataset version/date display in `frontend/src/ui/line/frequency-view.ts`
- [X] T030 [US1] Wire the home and line views through the composition root in `frontend/src/main.ts`

**Checkpoint**: US1 is independently usable as the MVP with no network dependency.

## Phase 4: User Story 2 - See live arrival estimates at a stop (Priority: P2)

**Goal**: Show live arrivals through the OpenAPI Worker, refresh only while visible, and fall back to scheduled information when live data is unavailable.

**Independent Test**: Run the US2 gateway/use-case/Worker contract tests and `VS2` with local live, timeout, upstream, and network fixtures.

### Tests for User Story 2

- [X] T031 [P] [US2] Test the arrivals gateway response and OpenAPI error-code mappings in `frontend/tests/unit/arrivals-gateway.test.ts`
- [X] T032 [P] [US2] Test live-to-scheduled fallback, 30-second visible-only refresh, hidden pause, and foreground resume in `frontend/tests/unit/get-stop-arrivals.test.ts`
- [X] T033 [P] [US2] Test stop arrivals DOM rendering, live-region notices, and fallback state in `frontend/tests/dom/us2-stop-arrivals.test.ts`
- [X] T034 [P] [US2] Test Worker GET validation, 405 handling, CORS, cache age stamping, timeout, upstream failure, SOAP fault, and empty arrivals against the OpenAPI schema in `worker/test/contract.test.ts`
- [X] T035 [P] [US2] Test SOAP envelope escaping and single/multiple arrival XML parsing in `worker/test/soap-parse.test.ts`

### Implementation for User Story 2

- [X] T036 [US2] Implement the OpenAPI-compatible HTTP arrivals adapter in `frontend/src/infrastructure/arrivals/http-arrivals-gateway.ts`
- [X] T037 [US2] Implement scheduled fallback and visible-only refresh orchestration in `frontend/src/application/get-stop-arrivals.ts`
- [X] T038 [US2] Implement the Worker method gate, stop-id validation, CORS, deterministic 30-second cache, and error responses in `worker/src/index.ts`
- [X] T039 [P] [US2] Implement XML escaping and the legacy SOAP request envelope in `worker/src/soap.ts`
- [X] T040 [P] [US2] Implement fast-xml-parser mapping with the single-arrival cardinality guard in `worker/src/parse.ts`
- [X] T041 [US2] Implement the stop view with destination/minutes, scheduled fallback, notices, and accessible live-region updates in `frontend/src/ui/stop/stop-view.ts`
- [X] T042 [US2] Wire stop selection from line views and inject the Worker/fake arrivals gateway in `frontend/src/main.ts`

**Checkpoint**: US1 and US2 work independently; the local profile requires no external service.

## Phase 5: User Story 3 - Locate stops on an accessible map (Priority: P3)

**Goal**: Lazy-load MapLibre GL JS plus deck.gl, render line stops with CartoDB light/dark themes, and expose accessible stop details.

**Independent Test**: Run the US3 adapter/DOM tests with mocked map ports and `VS3`; no tile network is required for core assertions.

### Tests for User Story 3

- [X] T043 [P] [US3] Test map theme selection, stop selection, fit bounds, and unmount behavior through a fake `MapPort` in `frontend/tests/unit/map-view.test.ts`
- [X] T044 [P] [US3] Test lazy map entry, marker/popup content, keyboard access, and theme switching in `frontend/tests/dom/us3-map.test.ts`
- [X] T045 [P] [US3] Test MapLibre/deck.gl adapter wiring and CartoDB Positron/Dark Matter style selection with browser API mocks in `frontend/tests/dom/map-adapter.test.ts`

### Implementation for User Story 3

- [X] T046 [US3] First calibrate treeshaken MapLibre GL JS plus deck.gl against the 350 KB gzip target with a production build, then implement the lazy `MapPort` adapter with light/dark CartoDB styles in `frontend/src/infrastructure/map/map-port.ts`; document that CartoDB XYZ tiles are the constitutional Principle V exception recorded in `contracts/internal-ports.md`
- [X] T047 [US3] Implement the lazy map entry point and stable map container layout in `frontend/src/ui/map/map-view.ts`
- [X] T048 [US3] Implement stop markers, fit-to-line behavior, accessible popups, and line-serving details in `frontend/src/ui/map/stop-markers.ts`
- [X] T049 [US3] Wire map loading from line detail and theme preference changes in `frontend/src/main.ts`

## Phase 6: User Story 4 - Save favorite lines and stops (Priority: P4)

**Goal**: Persist line/stop favorites and preferences locally with migration, corruption recovery, and session-only quota fallback.

**Independent Test**: Run the US4 storage/use-case/DOM tests and `VS4` with an in-memory Storage fake and simulated quota failures.

### Tests for User Story 4

- [X] T050 [P] [US4] Test versioned envelopes, migrations, newer-version defaults, corruption backup/reset, quota fallback, and newest-first five-item recent-view retention in `frontend/tests/unit/storage-adapter.test.ts`
- [X] T051 [P] [US4] Test favorite ordering, add/remove behavior, and session-only persistence status in `frontend/tests/unit/toggle-favorite.test.ts`
- [X] T052 [P] [US4] Test favorites-first home rendering, deep links, persistence notice, and reload restoration in `frontend/tests/dom/us4-favorites.test.ts`

### Implementation for User Story 4

- [X] T053 [US4] Implement pure favorite validation, ordering, five-item recent-view retention, and default preferences in `frontend/src/domain/favorites.ts`
- [X] T054 [US4] Implement namespaced versioned localStorage envelopes, migration chain, corruption backup/reset, and quota-safe memory fallback in `frontend/src/infrastructure/storage/local-storage-adapter.ts`; watch: a future `v2` key bump must remove old `vbn:v1:*` keys only after migration completes
- [X] T055 [US4] Implement favorite toggle, recent-view recording, and preference use cases through `StoragePort` in `frontend/src/application/toggle-favorite.ts`
- [X] T056 [US4] Implement favorites section, recent-views section, favorite controls, deep links, and session-only notice in `frontend/src/ui/home/favorites.ts`
- [X] T057 [US4] Wire storage-backed favorites/preferences into the composition root in `frontend/src/main.ts`

## Phase 7: User Story 5 - Offline access and connection-aware usage (Priority: P5)

**Goal**: Precache the shell and schedule snapshot, serve repeat visits offline, and visibly communicate stale/offline data.

**Independent Test**: Run the US5 service-worker tests and the single Playwright offline smoke test described by `VS5`.

### Tests for User Story 5

- [X] T058 [P] [US5] Test pure Workbox precache/runtime-cache decisions, offline state, and stale-data notice rules in `frontend/tests/unit/offline.test.ts`
- [X] T059 [P] [US5] Test production build registration and offline shell/catalog/favorites behavior in `frontend/tests/e2e/offline.spec.ts`

### Implementation for User Story 5

- [X] T060 [US5] Configure Workbox generateSW precache, snapshot inclusion, runtime arrivals caching, and local-profile disablement in `frontend/src/sw/`
- [X] T061 [US5] Implement connection/offline state detection and accessible stale-data notices in `frontend/src/ui/offline-status.ts`
- [X] T062 [US5] Register the production Service Worker and preserve cached catalog/favorites startup in `frontend/src/main.ts`

## Phase 8: User Story 6 - Switch UI language (Priority: P6)

**Goal**: Ship complete Spanish, Galician, and English catalogs with immediate switching and persistent preference.

**Independent Test**: Run the US6 i18n tests and `VS6`; every catalog has identical keys and reload preserves the selected locale.

### Tests for User Story 6

- [X] T063 [P] [US6] Test typed catalog lookup, fallback interpolation, pluralization, locale detection, and document language updates in `frontend/tests/unit/i18n.test.ts`
- [X] T064 [P] [US6] Test locale key parity and non-empty messages in `frontend/tests/i18n/key-parity.test.ts`
- [X] T065 [P] [US6] Test immediate UI language switching and preference restoration in `frontend/tests/dom/us6-language.test.ts`

### Implementation for User Story 6

- [X] T066 [P] [US6] Implement the canonical Spanish typed message catalog in `frontend/src/i18n/es.ts`
- [X] T067 [P] [US6] Implement Galician and English catalogs satisfying the canonical message type in `frontend/src/i18n/gl.ts` and `frontend/src/i18n/en.ts`
- [X] T068 [US6] Implement typed lookup, fallback, interpolation, pluralization, and locale state in `frontend/src/i18n/index.ts`
- [X] T069 [US6] Localize all views and set `document.documentElement.lang` through `frontend/src/ui/i18n-renderer.ts`
- [X] T070 [US6] Implement settings language control and persistence through `StoragePort` in `frontend/src/ui/settings/language-settings.ts`

## Phase 9: Polish and Cross-Cutting Validation

**Purpose**: Close constitutional, performance, deployment, and documentation requirements across the feature.

- [X] T071 [P] Add WCAG 2.2 AA semantic landmarks, focus management, contrast tokens, keyboard navigation, and 44px touch targets in `frontend/src/ui/` and `frontend/src/ui/styles.css`
- [X] T072 [P] Add theme preference resolution and accessible light/dark design tokens in `frontend/src/ui/theme.ts` and `frontend/src/ui/styles.css`
- [X] T073 [P] Calibrate shell and lazy map gzip budgets, configure `size-limit`, enforce 150 KB shell / 350 KB map / 500 KB total gates, and add Lighthouse CI configuration for the <3s interactive target in `package.json`, `.size-limit.json`, and `lighthouserc.json`
- [X] T074 [P] Complete canonical snapshot generation, validation, hashes, validity dates, and update instructions in `scripts/snapshot/generate.ts` and `scripts/snapshot/README.md`
- [X] T075 [P] Add the Chrome Android/Safari iOS/Chrome desktop acceptance matrix, P1-P4 browser checks, WCAG checks, and static privacy audit to `docs/quality.md`
- [X] T076 [P] Run all quickstart scenarios and document exact local commands and expected outputs in `README.md`
- [X] T077 Run full CI-equivalent validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm run lint:openapi`, `npm run test:contract`, and `npm run size`
- [X] T078 [P] Add the Communicator G6 phase drafts for constitution, specification, plan, and tasks decisions in `docs/blog/01-constitution.md`, `docs/blog/02-specification.md`, `docs/blog/03-plan.md`, and `docs/blog/04-tasks.md`

## Dependencies & Execution Order

### Phase Dependencies

- Setup tasks T001-T007 have no implementation dependencies.
- Foundational tasks T008-T019 depend on setup and block all user stories.
- User stories depend on the foundational checkpoint, then can proceed in parallel.
- Polish tasks depend on the stories and their focused tests, except documentation and CI configuration tasks that can start earlier.

### User Story Dependencies

- US1 (P1) depends only on the foundational phase and is the MVP.
- US2 (P2) depends on the shared stop/timetable types from the foundation and integrates with US1 navigation, but its gateway and fallback tests are independent.
- US3 (P3) consumes line/stop data from US1 but is isolated behind `MapPort` and can be tested with fakes.
- US4 (P4) depends on shared entities and home navigation, but storage and favorite behavior are independently testable.
- US5 (P5) depends on the built shell and catalog/favorites from US1/US4.
- US6 (P6) depends on all user-facing strings but its catalogs and persistence tests are independently testable.

### Parallel Opportunities

- Setup configuration tasks marked `[P]` can run in parallel.
- Foundational fixtures, profiles, test harness, Worker setup, snapshot scaffold, and CI setup can run in parallel after the directory scaffold exists.
- Within each story, all tests marked `[P]` can be written first in parallel; independent adapters and UI modules can then proceed in parallel.
- After the foundational checkpoint, separate contributors can work on US1, US2, US3, and US4 concurrently.

### MVP Scope

Complete T001-T030, including all US1 tests. This delivers the line catalog, search, day-type-aware frequency tables, no-service handling, and dataset freshness from bundled data without requiring network access.

### Completion Criteria

- Every task has a checkbox, sequential ID, exact file path, and a valid story label where required.
- Every user story has independent tests and an explicit independent-test statement.
- Domain/application tests run without browser, network, or localStorage dependencies.
- OpenAPI validation and Worker contract tests pass before deployment work is considered complete.
- All six quickstart scenarios pass and the G4 task review is recorded before implementation begins.

## Phase 10: Convergence

- [X] T079 [US1] Select the local or production schedule repository from the configured profile and load the bundled lines, stops, timetables, and dataset metadata per FR-001 and FR-015 (partial)
- [X] T080 [US1] Add manual day-type switching and a nearest-served-day link to the frequency view per US1/AC2-3 and FR-002-4 (partial)
- [X] T081 [US4] Wire favorite selection to line and stop detail navigation, implement recent-view rendering, and expose persistence-disabled status per US4/AC1-3 and FR-008 (partial)
- [X] T082 [US6] Replace hardcoded user-facing strings with catalog lookups and rerender all views immediately after language changes per US6/AC1 and FR-014 (partial)
- [X] T083 [P] Implement canonical snapshot generation for manifest, stops, and line timetable files with schema validation, SHA-256 hashes, validity dates, and failure on invalid source data per FR-015 (partial)
- [X] T084 [US5] Bundle the complete production snapshot and expand the offline Playwright scenario to verify catalog, favorites, stale notice, and dataset metadata after connectivity is disabled per US5/AC1-2, FR-009/009a, and SC-005
- [X] T085 [P] Extend the GitHub Actions validation workflow to run lint, typecheck, unit/DOM tests, coverage, E2E, OpenAPI lint, Worker contract tests, size limits, and snapshot validation per FR-018 and plan: CI gates
- [X] T086 [US3] Complete the MapLibre/deck.gl adapter with CartoDB light/dark styles, marker rendering, stop selection, accessible popup details, and tile-unavailable fallback interaction per US3/AC1-4 and FR-005/006

## Phase 11: Convergence

- [X] T087 [CRITICAL] Configure the GitHub Pages deployment to select the production profile and resolve bundled snapshot, Service Worker, and navigation paths from the deployed base URL per FR-001/FR-009/FR-015 and plan: production profile (contradicts)
- [ ] T088 [US1] Populate and validate the complete Vigo urban production snapshot rather than the current two-line subset per FR-001 and FR-015 (missing)
- [X] T089 [US2] Wire visible-only 30-second stop-arrival refresh, foreground resume, and teardown into stop navigation using the existing visibility port per FR-017 and US2/AC1-3 (missing)
- [X] T090 [US3] Implement the actual deck.gl overlay and map marker rendering, fit the MapLibre viewport to selected stops, and propagate the resolved light/dark preference per FR-005/FR-006 and US3/AC1-3 (partial)
- [X] T091 [US6] Move remaining user-facing frequency, map, accessibility, and arrival fallback strings into the ES/GL/EN catalogs and extend parity coverage per FR-014/FR-014a and US6/AC1 (partial)
- [X] T092 [P] Add browser acceptance coverage for P1-P4 on Chromium and WebKit, configure the Playwright projects to use their declared engines, and install those engines in CI per SC-003 and plan: browser testing (partial)
- [X] T093 [US5] Configure and test the planned Workbox runtime cache policy for live arrival responses while preserving the snapshot precache per plan: Storage / Workbox runtime entry (missing)
