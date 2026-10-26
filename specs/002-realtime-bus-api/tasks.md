---

description: "Task list for Vigo Bus Real-Time API implementation"
---

# Tasks: Vigo Bus Real-Time API

**Input**: Design documents from `specs/002-realtime-bus-api/`

**Prerequisites**: plan.md, spec.md (fresh source-change G2 approved, including SC-014–SC-016), research.md (D1–D12), data-model.md, contracts/realtime-arrivals.openapi.yaml (fresh source-change G3 approved)

**Tests**: Included — constitution Principle III (test-first) is non-negotiable; write tests first and watch them fail before each implementation task.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 real-time arrivals · US2 environments · US3 failure trust · US4 map correctness · US5 provenance

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project wiring required before any story work

- [X] T001 [P] Add `wrangler` and `@cloudflare/vitest-pool-workers` devDependencies to worker/package.json and update package-lock.json
- [X] T002 [P] Add root `dev:worker` script (`wrangler dev --local --cwd worker`) and repoint `lint:openapi` to specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml in package.json
- [X] T003 [P] Update wrangler.toml vars: replace SOAP_ENDPOINT/SOAP_ACTION with UPSTREAM_URL=https://datos.vigo.org/vci_api_app/api2.jsp and UPSTREAM_FIXTURES=false

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contract plumbing and cleanup that all stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Remove the v1 SOAP modules worker/src/soap.ts and worker/src/soap-parser.ts and their tests from worker/test/
- [X] T005 [P] Define the v2 wire types (Arrival, ArrivalsResponse, DataStatus, ErrorResponse codes incl. RATE_LIMITED/NOT_FOUND) in worker/src/types.ts per data-model.md
- [X] T006 [P] Extend the frontend ArrivalsGateway port in frontend/src/application/ports.ts: required `dataStatus` on the live variant and `unavailable.reason` union `stop-not-exist | upstream | unknown` per the data-model mapping table; update the fixture arrivals adapter in frontend/src/infrastructure/fixtures/ to default `dataStatus: "current"` so existing callers keep passing
- [X] T007 Implement fixture upstream mode in worker/src/fixtures.ts (UPSTREAM_FIXTURES=true): recorded valid, empty, stop-not-exist (null parada), timeout and 429 responses behind the same fetch seam as production
- [X] T008 Implement worker/src/cache.ts: fresh entry (max-age=30) + last-known entry (key suffix lk=1, max-age=300), x-edge-stored-at stamping, injected cache port for node unit tests (research D4)

**Checkpoint**: Foundation ready — story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Consult Real-Time Arrivals (Priority: P1) 🎯 MVP

**Goal**: Valid stop request returns normalized arrivals with line, destination, minutes, eta and freshness state

**Independent Test**: quickstart VS1 — fixture-mode Worker answers current/empty/not-found for known fixture stops

### Tests for User Story 1 ⚠️ (write first, must fail)

- [X] T009 [P] [US1] Unit tests for the normalization pipeline in worker/test/normalize.test.ts: `{linea, ruta, minutos}` → Arrival mapping, fixBus letter split, CHARS_FIXED mojibake repair, sort by minutes then destination, exact-duplicate removal, drop-rule for empty destination or out-of-range minutes (research D2)
- [X] T010 [P] [US1] Contract tests in worker/test/contract.test.ts (vitest-pool-workers): 200 current/empty schema-valid against contracts/realtime-arrivals.openapi.yaml; 400 invalid stop code; 404 STOP_NOT_EXIST on null parada; 405 non-GET; 404 NOT_FOUND unknown path; OPTIONS → 204; CORS `*` on every response incl. errors; /health → 200 schema-valid (FR-018)

### Implementation for User Story 1

- [X] T011 [US1] Port the normalization pipeline to worker/src/normalize.ts with the VigoBusAPI attribution header (based on the code of David-Lor/VigoBusAPI, Apache-2.0); depends on T009
- [X] T012 [US1] Implement worker/src/upstream.ts: GET `${UPSTREAM_URL}?id={stopId}&ttl=5&tipo=TRANSPORTE-ESTIMACION-PARADA` with 6 s timeout, non-200/unparseable → upstream failure (research D1); depends on T007
- [X] T013 [US1] Rewrite worker/src/index.ts handler: routing (/stops/{stopCode}/arrivals and /health), stop-code validation, fixture/live fetch seam, normalization, eta = generatedAt + minutes, current/empty dataStatus, error taxonomy per contract; depends on T005, T011, T012
- [X] T014 [US1] Update the frontend HTTP gateway in frontend/src/infrastructure/arrivals/http-arrivals-gateway.ts to parse dataStatus and map statuses per the data-model mapping table; depends on T006

**Checkpoint**: US1 independently functional — current/empty arrivals flow end-to-end in fixture mode

---

## Phase 4: User Story 2 - Use the API in Production and Development (Priority: P1)

**Goal**: Same contract served locally (wrangler dev --local, fixtures) and in production (Cloudflare Worker) with environment-specific wiring only

**Independent Test**: quickstart VS1/VS4 locally, VS6 smoke post-deploy

### Tests for User Story 2 ⚠️

- [X] T015 [P] [US2] CI contract-test job runs worker/test under vitest-pool-workers in .github/workflows/ci.yml with no network access (fixture mode)
- [X] T016 [P] [US2] Test that frontend config selects the local Worker URL in local profile and the production Worker URL in production profile in frontend/tests/unit/config.test.ts, and that an invalid or missing arrivals base URL produces an unambiguous configuration error without secrets (US2 scenario 3)

### Implementation for User Story 2

- [X] T017 [US2] Wire VITE_ARRIVALS_BASE_URL per profile in frontend/src/infrastructure/config.ts (local → http://localhost:8787; production → configured Worker URL)
- [X] T018 [US2] Add the Worker deploy job to .github/workflows/deploy.yml (wrangler deploy) and document secrets-free vars in wrangler.toml
- [X] T019 [US2] Document local start commands, env vars, fixture mode and troubleshooting in README.md per quickstart VS1–VS4 (FR-015)

**Checkpoint**: US1 and US2 both independently functional in both environments

---

## Phase 5: User Story 3 - Maintain Availability and Trust During Failures (Priority: P2)

**Goal**: Upstream failures serve in-bound stale results labeled stale, never current; otherwise explicit unavailable/429/503/504

**Independent Test**: quickstart VS3 — fault injection serves stale beyond the 30 s TTL and 503/504 without last-known

### Tests for User Story 3 ⚠️ (write first, must fail)

- [X] T020 [P] [US3] Contract tests in worker/test/stale.test.ts: upstream failure with in-bound last-known → 200 dataStatus stale, original generatedAt, Cache-Control no-store, Age < 300; last-known older than 300 s bound or absent → 503 STALE_UNAVAILABLE on network-level failure; upstream non-200 or unparseable body without in-bound last-known → 502 UPSTREAM_ERROR; upstream 429 without last-known → 429 RATE_LIMITED; timeout → 504 (FR-014)
- [X] T021 [P] [US3] DOM tests for the five freshness states in frontend/tests/unit/stop-view.test.ts: loading, current, stale, empty, unavailable each render a distinct localized status and a retry action; stale shows original update time (SC-003)

### Implementation for User Story 3

- [X] T022 [US3] Wire the stale-on-failure path into worker/src/index.ts using cache.ts (T008): store fresh + last-known on success, serve stale with no-store/Age on failure, and map failure classes per the contract — network-level failure → 503 STALE_UNAVAILABLE, upstream non-200/unparseable → 502 UPSTREAM_ERROR, rate limit → 429 RATE_LIMITED, timeout → 504 — each only when no in-bound last-known result exists; depends on T020
- [X] T023 [US3] Implement the freshness status view in frontend/src/ui/stop/stop-arrivals-view.ts with aria-live announcements and retry (FR-012, WCAG 2.2 AA); depends on T006, T014, T021
- [X] T024 [US3] [P] Add ES/GL/EN status strings with parity tests in frontend/src/i18n/ (es.ts, gl.ts, en.ts)
- [X] T025 [US3] Playwright scenario in frontend/tests/e2e/ covering current → stale → unavailable transitions against the fixture Worker

**Checkpoint**: US3 independently functional; outage behavior provable in CI without network

---

## Phase 6: User Story 4 - Stops and Lines Correctly Positioned on the Map (Priority: P2)

**Goal**: Stop markers at catalog coordinates inside Vigo; lines rendered along catalog stop order; anomalies surfaced, never silently misplaced

**Independent Test**: quickstart VS5 — fixture catalog renders reference stops within tolerance; snapshot build fails on out-of-box coordinates

### Tests for User Story 4 ⚠️ (write first, must fail)

- [X] T026 [P] [US4] Snapshot-generator tests in scripts/snapshot/test asserting the Vigo bounding-box validation (lat 42.19–42.31, lon −8.79…−8.67) fails the build on out-of-box or missing coordinates (FR-019), and that 2–3 pinned reference stops (e.g. known Príncipe/Porta do Sol stops) match their ground-truth catalog coordinates (FR-021)
- [X] T027 [P] [US4] E2E map assertions in frontend/tests/e2e/map-position.spec.ts: marker positions match catalog coordinates (projected pixels within tolerance, SC-008 50 m) and the line polyline follows catalog stop order (FR-020)

### Implementation for User Story 4

- [X] T028 [US4] Add bounding-box coordinate validation to the snapshot generator in scripts/snapshot/generate.ts with clear failure output (FR-019/FR-021); depends on T026
- [X] T029 [US4] Render the line stop-order polyline on the map adapter in frontend/src/infrastructure/map/map-port.ts and surface a visible anomaly state when geographic data is missing or out of bounds (FR-020); depends on T027
- [X] T030 [US4] [P] Add ES/GL/EN anomaly-state strings with parity tests in frontend/src/i18n/

**Checkpoint**: US4 independently functional on the fixture catalog

---

## Phase 7: User Story 5 - Acknowledge Code and Data Provenance (Priority: P2)

**Goal**: Distributed artifacts visibly state the project is based on the code of VigoBusAPI, with Apache-2.0 retention and non-affiliation disclaimer

**Independent Test**: quickstart VS7 — attribution audit in under two minutes (SC-006)

### Tests for User Story 5 ⚠️

- [X] T031 [P] [US5] Repository test (Vitest node) asserting NOTICE exists, mentions David-Lor/VigoBusAPI + Apache-2.0, and ported worker files carry the attribution header (FR-016)

### Implementation for User Story 5

- [X] T032 [US5] Create NOTICE at repo root: "based on the code of VigoBusAPI (https://github.com/David-Lor/VigoBusAPI), Copyright 2019-2022 David Lorenzo, Apache License 2.0", listing the ported functions (research D8); verify exact copyright years against upstream LICENSE.md before shipping
- [X] T033 [US5] Update LICENSE to include the Apache-2.0 text with the retained VigoBusAPI copyright notice
- [X] T034 [US5] [P] Add the provenance section and non-affiliation disclaimer (FR-017) to README.md
- [X] T035 [US5] [P] Add attribution header comments to worker/src/normalize.ts and any other ported file

**Checkpoint**: US5 independently verifiable; distribution-ready

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Governance and cross-story validation

- [X] T036 [P] Update the constitution's Principle I and stack wording from "REST↔SOAP translation" to scoped upstream adaptation; this was folded into the ratified v1.3.0 MINOR amendment recorded at G1
- [X] T037 [P] Update docs/quality.md and root scripts so lint:openapi validates the v3 contract and CI runs the full gate set
- [X] T038 Run the full quickstart.md validation (VS1–VS7) and record results in specs/002-realtime-bus-api/gate-g5-implementation-review.md
- [X] T039 Record harness verdicts: G4 (QA tasks gate) and G6 (Communicator blog draft) artifacts under specs/002-realtime-bus-api/
- [X] T040 [P] SC-005 resilience loop test in worker/test/load.test.ts: 100 consecutive valid fixture-mode requests produce schema-valid responses with no secret leakage and bounded error payloads

---

## Phase 9: Canonical API and Official Catalog (US6)

**Purpose**: Expose the official generated network catalog and resource-oriented arrivals URL as the canonical API contract.

- [X] T041 [P] [US6] Add contract tests for official `GET /lines`, `GET /lines/{lineCode}` GTFS patterns, `GET /stops` identifier separation, unknown line handling, and `GET /stops/{stopCode}/arrivals` in worker/test/contract.test.ts
- [X] T042 [US6] Implement canonical Worker catalog routes from the generated official snapshot; remove demo catalog and legacy query routes
- [X] T043 [US6] Document the v3 official catalog and arrivals contract, stop ID namespaces, and local live-vs-fixture behavior in OpenAPI and README
- [X] T044 [US6] Align the Postman collection with canonical catalog and arrivals routes, including a live smoke test that permits an empty arrivals list

---

## Phase 10: Vitrasa WebForms Arrivals Bridge (US1)

**Purpose**: Replace only the live arrivals source adapter with the owner-selected Vitrasa page while preserving the v3.0.0 browser-facing contract. G1–G4 reviews are approved; proceed with the enumerated tests-first order.

**Independent Test**: Replay the recorded 5/5/2 HTML pages for stop 2790 and receive all 12 normalized arrivals in ascending wait order; verify missing stop, valid empty, malformed HTML, page-budget overflow, redirects, aggregate timeout, and later-page failure map to the documented outcomes without caching partial results or exposing WebForms state.

### Tests for User Story 1 (write first)

Run tests T046–T055 before implementing T056–T064 and confirm failures for the
missing behaviors; after each implementation task, rerun its listed test
command and reach green before moving to the next dependent task.

- [X] T045 Configure worker/vitest.config.ts for `@cloudflare/vitest-pool-workers`; explicitly include worker/unit/**/*.test.ts in root Node Vitest while excluding worker/test from root test/coverage; point `test:contract` to the Workers config, and update CI to run `npm test` and `npm run test:contract` independently; verify `npm test` discovers T047 and `npm run test:contract` selects only the Workers runtime
- [X] T046 [P] [US1] Depends on T045. Add Workers-runtime HTML extraction tests in worker/test/arrivals-source.test.ts for exact stop identity, one `GridView1`, headers, entities, route cells, pager exclusion, valid empty, invalid present rows, `Parada Inexistente`, and malformed/ambiguous markup; verify with `npm run test:contract`
- [X] T047 [P] [US1] Depends on T045. Add Node-runtime normalization tests in worker/unit/normalize.test.ts for row validation, decoded text, stable ordering, exact deduplication, timestamp conversion, and failure on unusable rows; verify with `npm test`
- [X] T048 [P] [US1] Depends on T045. Add sanitized 5/5/2 fixtures and protocol tests in worker/test/upstream.test.ts for initial GET, URL-encoded POST, latest unique form state, cookie updates/continuity, pager sequence, exact SC-010 12-tuple output, and fixed URL; prove an uncatalogued valid numeric ID is forwarded unchanged, HTTP/HTML errors fail closed, source form actions are ignored, and caller headers are not forwarded; verify with `npm run test:contract`
- [X] T049 [US1] Depends on T048. Add profile, resource, and cache-boundary tests in worker/test/upstream.test.ts and worker/test/stale.test.ts for redirects, invalid IDs with zero calls, stop mismatch, malformed/skipped paging, page/body/row/field limits, aggregate deadline, fixture-first defaults, explicit live override using only the fixed URL, preview/production fixture behavior, no configurable source URL, and exact 29/30 and 299/300 second boundaries; verify with `npm run test:contract`
- [X] T050 [US1] Depends on T049. Add integration/privacy tests in worker/test/contract.test.ts and worker/test/stale.test.ts proving later-page failure returns stale/unavailable and writes no partial cache; assert WebForms fields/cookies are absent from responses, cache, logs, and persistent storage after success and failure; verify with `npm run test:contract`
- [X] T051 [US1] Depends on T045. Add frontend tests in frontend/tests/unit/get-stop-arrivals.test.ts and frontend/tests/dom/stop-view.test.ts proving null `vitrasaId` sends zero calls and only the selected public ID reaches the gateway; assert full privacy copy in Spanish/Galician/English and visibility-aware polling; verify with `npm test`
- [X] T052 [US1] Depends on T045. Add `@axe-core/playwright` as a devDependency and write frontend accessibility tests for keyboard operation, visible focus, live-region announcements for loading/current/stale/empty/unavailable, axe WCAG 2.2 AA checks, and measured 44x44 CSS-pixel targets; verify with `npm test` and `npm run test:e2e`
- [X] T053 [US1] Depends on T045. Add `npm run test:load` and CI invocation for a fixture-only Workers-pool test in worker/test/load.test.ts: 600 requests at 10 requests/second for 60 seconds, report p95 ≤3 seconds, block/instrument outbound source access and assert zero Vitrasa calls; verify with `npm run test:load`
- [X] T054 [US1] Test first: add scripts/check-payload-budget.test.ts for gzip aggregate boundaries (JS 850 KiB, CSS 150 KiB) and per-file caps; test over-budget failure and in-budget success under root Node Vitest with `npm test`
- [X] T055 [US1] Test first: add scripts/openapi-regression.test.ts for API `info.version: 3.0.0` vs `openapi: 3.1.0`, all public operations, stopCode pattern, and SC-013 schema requirements/bounds; verify with `npm test`

### Implementation for User Story 1

- [X] T056 [US1] Depends on T046. Implement bounded Worker-only HTML extraction in worker/src/source-html.ts using HTMLRewriter, exact #lblParada match, expected headers/route cells, empty/missing-stop outcomes, and fail-closed malformed markup/rows; pass with `npm run test:contract`
- [X] T057 [US1] Depends on T047. Keep worker/src/normalize.ts pure and Node-testable; map validated rows with ordering, deduplication, ETA, and no HTMLRewriter/I/O; pass with `npm test`
- [X] T058 [US1] Depends on T048–T049. Replace JSON request in worker/src/upstream.ts with fixed-URL HTTPS WebForms pagination, exact form1 state/pager protocol, lookup-scoped cookies, redirect rejection, response/page/row/field limits, and aggregate 8-second deadline; pass with `npm run test:contract`
- [X] T059 [US1] Depends on T046, T048, and T058. Replace JSON fixtures with deterministic HTML/WebForms success, empty, missing-stop, malformed, later-page, redirect, and limit fixtures in worker/src/fixtures.ts; pass with `npm run test:contract`
- [X] T060 [US1] Depends on T050 and T058. Ensure worker/src/index.ts writes fresh/last-known entries only after complete parsing and maps documented errors; pass with `npm run test:contract`
- [X] T061 [US1] Depends on T049. Remove UPSTREAM_URL from worker/src/env.ts and worker/wrangler.toml; configure fixture-first development and live preview/production; reject fixtures outside development; deploy production with `--env production`; pass with `npm run test:contract` and Wrangler config validation
- [X] T062 [US1] Depends on T051. Update frontend to use nullable Stop.vitrasaId only, make no request when absent, and render localized privacy/unavailable states; pass with `npm test` and `npm run test:e2e`
- [X] T063 [US1] Depends on T054. Implement scripts/check-payload-budget.ts using gzip for aggregate generated JS/CSS, preserve per-file caps, and update `npm run size`; CI and local instructions must run `npm run build` before `npm run size` (static build, no network); pass T054 and `npm run build && npm run size`
- [X] T064 [US1] Depends on T055. Keep the Vitrasa source description in specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml; preserve API v3.0.0 and all request/response schemas; pass OpenAPI regression tests and `npm run lint:openapi`
- [ ] T065 [US1] Depends on T061. Add explicit preview frontend profile and named preview Worker deploy; build/smoke-test with preview Worker URL without changing production config; verify frontend config/build locally and run low-volume remote preview smoke with deployment credentials
- [ ] T066 [US1] Depends on T058 and T060. Add opt-in `npm run test:edge-cache:smoke` using temporary `wrangler dev --remote`, production cache module, and deterministic injected fetcher; verify fresh/stale TTL and retention; require CLOUDFLARE_API_TOKEN, never CI/preview/production/Vitrasa; append command, date, environment, result, and caveat to gate-g5-implementation-review.md
- [ ] T067 [US1] Depends on T061–T066. Update README.md and quickstart for local/preview/live override, EdgeCache prerequisites, request budget/degradation, accessibility, payload limits, and low-volume smoke; verify every command against package/CI scripts and execute fixture steps with network disabled

**Checkpoint**: all source pages are parsed atomically, and the existing `/stops/{stopCode}/arrivals` contract behaves identically to clients.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on T001–T003 — BLOCKS all user stories
- **User Stories (Phases 3–7)**: all depend on Foundational; US1 before US3/US4 integrations that reuse its handler; US5 independent after T011
- **Polish (Phase 8)**: depends on all desired stories complete
- **Phase 10 source migration**: G1–G4 approvals are prerequisites. T045 configures test runtimes; T046–T055 author tests before implementation; T056–T064 implement the adapters, cache, profiles, frontend, payload gate, and contract description while passing those tests; T065 adds preview; T066 is the credentialed post-implementation EdgeCache smoke and records G5 evidence; T067 updates and verifies documentation.

### User Story Dependencies

- **US1 (P1)**: after Foundational — no other-story dependencies
- **US2 (P1)**: after Foundational — wires environments around the US1 handler
- **US3 (P2)**: extends the US1 handler with the cache path — start after T013
- **US4 (P2)**: after Foundational — snapshot + map adapter only
- **US5 (P2)**: after Foundational — docs/legal only

### Parallel Opportunities

- T001, T002, T003 in parallel (different files)
- T005, T006, T007, T008 in parallel within Foundational
- T009 + T010 test authoring in parallel; T026 + T027 likewise
- T046–T048, T051–T052, T054–T055 can be authored in parallel after T045 establishes the runtimes. T049 follows T048; T050 follows T049; T053 can be authored after T045. No implementation task starts until all tests T046–T055 are authored and G4 is closed.
- US5 (docs/legal) can run entirely in parallel with US3/US4 once T011 exists

---

## Parallel Example: Foundational

```bash
# After Phase 1 completes:
Task: "Define the v3 wire types in worker/src/types.ts"
Task: "Extend the ArrivalsGateway port in frontend/src/application/ports.ts"
Task: "Implement fixture upstream mode in worker/src/fixtures.ts"
Task: "Implement worker/src/cache.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — fixture-mode current/empty/not-found
4. **STOP and VALIDATE**: quickstart VS1–VS2
5. Demo locally; deploy only after US2 wiring exists

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate VS1–VS2 → MVP
3. US2 → validate VS4/VS6 → deployable
4. US3 → validate VS3 → trustworthy under outages
5. US4 → validate VS5 → map correctness guaranteed
6. US5 → validate VS7 → distribution-ready
7. Phase 10 → only after its G1–G4 gates close, replace the live source adapter while keeping API v3.0.0 unchanged

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to its spec user story for traceability
- Write tests first; verify they fail before implementing (Principle III)
- The v1 contract specs/001-bus-frequency-pwa/contracts/stop-arrivals.openapi.yaml stays as historical record; API v3.0.0 remains current (research D5)
- Contract-test runtime is @cloudflare/vitest-pool-workers; pure modules (normalize.ts) also get plain-node unit tests
