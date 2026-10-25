# Tasks: Vigo Bus Frequency PWA

**Input**: Design documents from `specs/001-bus-frequency-pwa/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`

**Tests**: Required by the feature specification and Constitution Principle III. Test tasks are placed before the implementation tasks they validate.

## Phase 1: Setup

**Purpose**: Initialize the Vite/TypeScript frontend, Worker package, and repository tooling.

- [ ] T001 Create the `frontend/`, `worker/`, `scripts/snapshot/`, and test directories from `specs/001-bus-frequency-pwa/plan.md`
- [ ] T002 Initialize the root npm workspace with package scripts in `package.json`
- [ ] T003 [P] Configure strict TypeScript, ES2022 modules, and shared compiler settings in `tsconfig.json`, `frontend/tsconfig.json`, and `worker/tsconfig.json`
- [ ] T004 [P] Configure Vite, GitHub Pages base path, local/production profiles, manual map chunking, and PWA integration in `frontend/vite.config.ts`
- [ ] T005 [P] Configure Vitest node and happy-dom projects, v8 coverage, and test globs in `vitest.config.ts`
- [ ] T006 [P] Configure Playwright for the single offline smoke test in `playwright.config.ts`
- [ ] T007 [P] Add repository lint/typecheck/test ignore rules and developer environment defaults in `.gitignore` and `.env.example`

## Phase 2: Foundational

**Purpose**: Implement shared contracts and infrastructure that block all user stories.

**Checkpoint**: Foundation ready; user stories can be implemented and tested independently.

- [ ] T008 Define pure domain entities and validation types in `frontend/src/domain/types.ts`
- [ ] T009 Define `ScheduleRepository`, `ArrivalsGateway`, `StoragePort`, `ClockPort`, `VisibilityPort`, and `MapPort` in `frontend/src/application/ports.ts`
- [ ] T010 [P] Add shared test fixtures for lines, stops, timetables, arrivals, and local profile failures in `frontend/src/infrastructure/fixtures/`
- [ ] T011 [P] Create versioned schedule fixture files in `frontend/public/data/fixtures/` and production snapshot placeholders in `frontend/public/data/`
- [ ] T012 [P] Implement local and production profile resolution in `frontend/src/infrastructure/config.ts`
- [ ] T013 [P] Implement deterministic clock and visibility adapters in `frontend/src/infrastructure/system/`
- [ ] T014 [P] Add domain/application test helpers and in-memory port fakes in `frontend/tests/unit/helpers/`
- [ ] T015 [P] Add the Worker package manifest, Wrangler configuration, and typed environment bindings in `worker/package.json`, `worker/wrangler.toml`, and `worker/src/env.ts`
- [ ] T016 [P] Add the snapshot source format and regeneration command scaffold in `scripts/snapshot/source/`, `scripts/snapshot/generate.ts`, and `scripts/snapshot/README.md`
- [ ] T017 [P] Add OpenAPI Spectral configuration and schema validation scripts for `specs/001-bus-frequency-pwa/contracts/stop-arrivals.openapi.yaml`
- [ ] T018 [P] Add CI workflow for linting, typechecking, unit/DOM tests, contract tests, i18n parity, and size limits in `.github/workflows/ci.yml`
- [ ] T019 [P] Add the frontend/Worker deployment workflow with Pages and Cloudflare environment placeholders in `.github/workflows/deploy.yml`

## Phase 3: User Story 1 - Check frequencies for a bus line (Priority: P1) MVP

**Goal**: Browse/search Vigo lines and view the correct frequency table, day type, no-service state, and dataset freshness.

**Independent Test**: Run the US1 unit/DOM tests and `VS1` from `quickstart.md` using only bundled local fixtures.

### Tests for User Story 1

- [ ] T020 [P] [US1] Test day-type derivation for weekdays, Saturdays, Sundays, holidays, holiday precedence, and midnight rollover in `frontend/tests/unit/day-type.test.ts`
- [ ] T021 [P] [US1] Test time-band validation, frequency lookup, first/last departure, no-service, and nearest-served-day behavior in `frontend/tests/unit/frequency.test.ts`
- [ ] T022 [P] [US1] Test schedule repository manifest, stops, and lazy per-line timetable loading in `frontend/tests/unit/schedule-repository.test.ts`
- [ ] T023 [P] [US1] Test catalog search, selection, day-type switching, dataset metadata, and no-service rendering in `frontend/tests/dom/us1-line-frequency.test.ts`

### Implementation for User Story 1

- [ ] T024 [P] [US1] Implement date plus holiday-calendar day-type derivation in `frontend/src/domain/day-type.ts`
- [ ] T025 [P] [US1] Implement time-band validation and frequency lookup in `frontend/src/domain/frequency.ts`
- [ ] T026 [P] [US1] Implement bundled manifest/stops/line timetable loading in `frontend/src/infrastructure/schedule/schedule-repository.ts`
- [ ] T027 [US1] Implement the line-frequency use case, including current-date re-evaluation through `ClockPort`, in `frontend/src/application/get-line-frequency.ts`
- [ ] T028 [P] [US1] Implement line catalog browsing and keyboard/touch search in `frontend/src/ui/home/line-catalog.ts`
- [ ] T029 [P] [US1] Implement the day-type selector, frequency table, no-service message, and dataset version/date display in `frontend/src/ui/line/frequency-view.ts`
- [ ] T030 [US1] Wire the home and line views through the composition root in `frontend/src/main.ts`

**Checkpoint**: US1 is independently usable as the MVP with no network dependency.

## Phase 4: User Story 2 - See live arrival estimates at a stop (Priority: P2)

**Goal**: Show live arrivals through the OpenAPI Worker, refresh only while visible, and fall back to scheduled information when live data is unavailable.

**Independent Test**: Run the US2 gateway/use-case/Worker contract tests and `VS2` with local live, timeout, upstream, and network fixtures.

### Tests for User Story 2

- [ ] T031 [P] [US2] Test the arrivals gateway response and OpenAPI error-code mappings in `frontend/tests/unit/arrivals-gateway.test.ts`
- [ ] T032 [P] [US2] Test live-to-scheduled fallback, 30-second visible-only refresh, hidden pause, and foreground resume in `frontend/tests/unit/get-stop-arrivals.test.ts`
- [ ] T033 [P] [US2] Test stop arrivals DOM rendering, live-region notices, and fallback state in `frontend/tests/dom/us2-stop-arrivals.test.ts`
- [ ] T034 [P] [US2] Test Worker GET validation, 405 handling, CORS, cache age stamping, timeout, upstream failure, SOAP fault, and empty arrivals against the OpenAPI schema in `worker/test/contract.test.ts`
- [ ] T035 [P] [US2] Test SOAP envelope escaping and single/multiple arrival XML parsing in `worker/test/soap-parse.test.ts`

### Implementation for User Story 2

- [ ] T036 [US2] Implement the OpenAPI-compatible HTTP arrivals adapter in `frontend/src/infrastructure/arrivals/http-arrivals-gateway.ts`
- [ ] T037 [US2] Implement scheduled fallback and visible-only refresh orchestration in `frontend/src/application/get-stop-arrivals.ts`
- [ ] T038 [US2] Implement the Worker method gate, stop-id validation, CORS, deterministic 30-second cache, and error responses in `worker/src/index.ts`
- [ ] T039 [P] [US2] Implement XML escaping and the legacy SOAP request envelope in `worker/src/soap.ts`
- [ ] T040 [P] [US2] Implement fast-xml-parser mapping with the single-arrival cardinality guard in `worker/src/parse.ts`
- [ ] T041 [US2] Implement the stop view with destination/minutes, scheduled fallback, notices, and accessible live-region updates in `frontend/src/ui/stop/stop-view.ts`
- [ ] T042 [US2] Wire stop selection from line views and inject the Worker/fake arrivals gateway in `frontend/src/main.ts`

**Checkpoint**: US1 and US2 work independently; the local profile requires no external service.

## Phase 5: User Story 3 - Locate stops on an accessible map (Priority: P3)

**Goal**: Lazy-load MapLibre GL JS plus deck.gl, render line stops with CartoDB light/dark themes, and expose accessible stop details.

**Independent Test**: Run the US3 adapter/DOM tests with mocked map ports and `VS3`; no tile network is required for core assertions.

### Tests for User Story 3

- [ ] T043 [P] [US3] Test map theme selection, stop selection, fit bounds, and unmount behavior through a fake `MapPort` in `frontend/tests/unit/map-view.test.ts`
- [ ] T044 [P] [US3] Test lazy map entry, marker/popup content, keyboard access, and theme switching in `frontend/tests/dom/us3-map.test.ts`
- [ ] T045 [P] [US3] Test MapLibre/deck.gl adapter wiring and CartoDB Positron/Dark Matter style selection with browser API mocks in `frontend/tests/dom/map-adapter.test.ts`

### Implementation for User Story 3

- [ ] T046 [US3] Implement the lazy MapLibre GL JS and deck.gl `MapPort` adapter with light/dark CartoDB styles in `frontend/src/infrastructure/map/map-port.ts`
- [ ] T047 [US3] Implement the lazy map entry point and stable map container layout in `frontend/src/ui/map/map-view.ts`
- [ ] T048 [US3] Implement stop markers, fit-to-line behavior, accessible popups, and line-serving details in `frontend/src/ui/map/stop-markers.ts`
- [ ] T049 [US3] Wire map loading from line detail and theme preference changes in `frontend/src/main.ts`

## Phase 6: User Story 4 - Save favorite lines and stops (Priority: P4)

**Goal**: Persist line/stop favorites and preferences locally with migration, corruption recovery, and session-only quota fallback.

**Independent Test**: Run the US4 storage/use-case/DOM tests and `VS4` with an in-memory Storage fake and simulated quota failures.

### Tests for User Story 4

- [ ] T050 [P] [US4] Test versioned envelopes, migrations, newer-version defaults, corruption backup/reset, and quota fallback in `frontend/tests/unit/storage-adapter.test.ts`
- [ ] T051 [P] [US4] Test favorite ordering, add/remove behavior, and session-only persistence status in `frontend/tests/unit/toggle-favorite.test.ts`
- [ ] T052 [P] [US4] Test favorites-first home rendering, deep links, persistence notice, and reload restoration in `frontend/tests/dom/us4-favorites.test.ts`

### Implementation for User Story 4

- [ ] T053 [US4] Implement pure favorite validation, ordering, and default preferences in `frontend/src/domain/favorites.ts`
- [ ] T054 [US4] Implement namespaced versioned localStorage envelopes, migration chain, corruption backup/reset, and quota-safe memory fallback in `frontend/src/infrastructure/storage/local-storage-adapter.ts`
- [ ] T055 [US4] Implement favorite toggle and preference use cases through `StoragePort` in `frontend/src/application/toggle-favorite.ts`
- [ ] T056 [US4] Implement favorites section, favorite controls, deep links, and session-only notice in `frontend/src/ui/home/favorites.ts`
- [ ] T057 [US4] Wire storage-backed favorites/preferences into the composition root in `frontend/src/main.ts`

## Phase 7: User Story 5 - Offline access and connection-aware usage (Priority: P5)

**Goal**: Precache the shell and schedule snapshot, serve repeat visits offline, and visibly communicate stale/offline data.

**Independent Test**: Run the US5 service-worker tests and the single Playwright offline smoke test described by `VS5`.

### Tests for User Story 5

- [ ] T058 [P] [US5] Test pure Workbox precache/runtime-cache decisions, offline state, and stale-data notice rules in `frontend/tests/unit/offline.test.ts`
- [ ] T059 [P] [US5] Test production build registration and offline shell/catalog/favorites behavior in `frontend/tests/e2e/offline.spec.ts`

### Implementation for User Story 5

- [ ] T060 [US5] Configure Workbox generateSW precache, snapshot inclusion, runtime arrivals caching, and local-profile disablement in `frontend/src/sw/`
- [ ] T061 [US5] Implement connection/offline state detection and accessible stale-data notices in `frontend/src/ui/offline-status.ts`
- [ ] T062 [US5] Register the production Service Worker and preserve cached catalog/favorites startup in `frontend/src/main.ts`

## Phase 8: User Story 6 - Switch UI language (Priority: P6)

**Goal**: Ship complete Spanish, Galician, and English catalogs with immediate switching and persistent preference.

**Independent Test**: Run the US6 i18n tests and `VS6`; every catalog has identical keys and reload preserves the selected locale.

### Tests for User Story 6

- [ ] T063 [P] [US6] Test typed catalog lookup, fallback interpolation, pluralization, locale detection, and document language updates in `frontend/tests/unit/i18n.test.ts`
- [ ] T064 [P] [US6] Test locale key parity and non-empty messages in `frontend/tests/i18n/key-parity.test.ts`
- [ ] T065 [P] [US6] Test immediate UI language switching and preference restoration in `frontend/tests/dom/us6-language.test.ts`

### Implementation for User Story 6

- [ ] T066 [P] [US6] Implement the canonical Spanish typed message catalog in `frontend/src/i18n/es.ts`
- [ ] T067 [P] [US6] Implement Galician and English catalogs satisfying the canonical message type in `frontend/src/i18n/gl.ts` and `frontend/src/i18n/en.ts`
- [ ] T068 [US6] Implement typed lookup, fallback, interpolation, pluralization, and locale state in `frontend/src/i18n/index.ts`
- [ ] T069 [US6] Localize all views and set `document.documentElement.lang` through `frontend/src/ui/i18n-renderer.ts`
- [ ] T070 [US6] Implement settings language control and persistence through `StoragePort` in `frontend/src/ui/settings/language-settings.ts`

## Phase 9: Polish and Cross-Cutting Validation

**Purpose**: Close constitutional, performance, deployment, and documentation requirements across the feature.

- [ ] T071 [P] Add WCAG 2.2 AA semantic landmarks, focus management, contrast tokens, keyboard navigation, and 44px touch targets in `frontend/src/ui/` and `frontend/src/ui/styles.css`
- [ ] T072 [P] Add theme preference resolution and accessible light/dark design tokens in `frontend/src/ui/theme.ts` and `frontend/src/ui/styles.css`
- [ ] T073 [P] Calibrate shell and lazy map gzip budgets, configure `size-limit`, and enforce 150 KB shell / 350 KB map / 500 KB total gates in `package.json` and `.size-limit.json`
- [ ] T074 [P] Complete canonical snapshot generation, validation, hashes, validity dates, and update instructions in `scripts/snapshot/generate.ts` and `scripts/snapshot/README.md`
- [ ] T075 [P] Add browser support matrix and accessibility/performance checks to `docs/quality.md`
- [ ] T076 [P] Run all quickstart scenarios and document exact local commands and expected outputs in `README.md`
- [ ] T077 Run full CI-equivalent validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run test:e2e`, `npm run lint:openapi`, `npm run test:contract`, and `npm run size`

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
