# Tasks: Direct Vigo Municipal Transit API

**Input**: Design documents from `specs/004-vigo-jsp-transit-api/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Required by Constitution Principle III. Write the focused tests before or alongside implementation and verify the expected red result before the implementation task.

## Phase 1: Setup

**Purpose**: Establish deterministic fixture organization and runnable validation entry points in the existing frontend project.

- [X] T001 [P] Create the sanitized municipal response fixture directory and README at `frontend/tests/fixtures/municipal/README.md`; verify its naming and fixture policy match the manifest from T002
- [X] T002 [P] Add fixture provenance manifest with action, capture evidence reference, encoding, and SHA-256 fields in `frontend/tests/fixtures/municipal/manifest.json`; validate its schema, fixture paths, and hashes in T011
- [X] T003 Add the feature 004 OpenAPI lint/schema-validation command to `package.json`; verify it passes against `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml` in T071
- [X] T004 [P] Create a reusable Playwright profile fixture that selects deterministic fixtures and blocks `datos.vigo.org` by default in `frontend/tests/e2e/helpers/municipal-profile.ts`; verify it in T025 and T053

## Phase 2: Foundational

**Purpose**: Build shared request, byte-decoding, validation, profile, and failure foundations required by every story.

- [X] T005 [P] Add request-builder tests for the eleven exact `tipo` actions and their action-specific required/allowed query keys in `frontend/tests/unit/municipal/request-builder.test.ts`
- [X] T006 [P] Add request validation tests for `OpaqueId` (`minLength: 1`, `maxLength: 128`, no control characters, interior spaces preserved) and `NumericId` (`^[0-9]{1,12}$`) in `frontend/tests/unit/municipal/request-validation.test.ts`
- [X] T007 [P] Add raw-byte decoder tests for declared ISO-8859-1, UTF-8 only when declared and valid, distinguishing bytes `0x80–0x9F`, unsupported charset, and contradictory headers in `frontend/tests/unit/municipal/response-decoder.test.ts`
- [X] T008 [P] Add streaming-limit tests for a 262144-byte maximum response, 10000 rows/positions, 128-character identifiers, 2048-character text, timeout, and cancellation in `frontend/tests/unit/municipal/bounded-response.test.ts`
- [X] T009 [P] Add Ajv 2020 normalized-schema tests for every `x-browser-ports` output, invalid/nullability cases, and semantic equality invariants in `frontend/tests/unit/municipal/normalized-contract.test.ts`
- [X] T010 [P] Add scheduler tests for maximum two concurrent requests, minimum 1000 ms between starts, duplicate coalescing, queued cancellation, and rejection propagation in `frontend/tests/unit/municipal/request-scheduler.test.ts`
- [X] T011 Add synthetic byte fixtures for all eleven action names, clearly labeled `synthetic` with no provider-observation claim, in `frontend/tests/fixtures/municipal/manifest.json`; validate manifest schema, paths, and hashes in `frontend/tests/unit/municipal/fixture-manifest.test.ts`
- [X] T012 Implement the closed action/parameter table and URLSearchParams request builder in `frontend/src/infrastructure/municipal/request-builder.ts`; verify all eleven actions and key constraints with T005
- [X] T013 Implement the bounded browser fetch adapter with GET, fixed host, `mode: 'cors'`, `credentials: 'omit'`, `redirect: 'error'`, `referrerPolicy: 'no-referrer'`, a 5000 ms total deadline, a 262144-byte streamed response cap, 10000 rows/positions, 128-character identifiers, 2048-character text, and excess-body cancellation in `frontend/src/infrastructure/municipal/http-client.ts`; verify limits, timeout, and cancellation with T008
- [X] T014 Implement byte-first response decoding using the declared supported charset policy in `frontend/src/infrastructure/municipal/response-decoder.ts`; verify declared charsets and invalid headers with T007
- [X] T015 Implement shared typed operation failures and update application port result types to preserve transport, timeout, rate-limited, HTTP, invalid, oversized, identity-unverified, mapping-unverified, and offline reasons in `frontend/src/domain/municipal-failures.ts` and `frontend/src/application/ports.ts`; verify result schemas with T009
- [X] T016 Implement fixture/local-live/production profile resolution with a fixed JSP host and production profile selection in `frontend/src/infrastructure/config.ts`; verify profile rules with T054
- [X] T017 Implement bounded source-action concurrency (maximum 2 in flight, minimum 1000 ms between starts) and duplicate request coalescing in `frontend/src/infrastructure/municipal/request-scheduler.ts`; verify concurrency, spacing, coalescing, cancellation, and rejection propagation with T010
- [X] T018 Add a shared fixture transport adapter that feeds explicitly synthetic byte fixtures through the same decoder, validators, and normalizers as live responses in `frontend/src/infrastructure/municipal/fixture-transport.ts`; verify default fixture flows with T025 and T040

**Checkpoint**: Shared request and decoding boundaries are testable offline; no user story may enable a provisional live action before its readiness evidence is accepted.

## Phase 3: User Story 1 — See current arrivals for a selected stop (Priority: P1)

**Goal**: Replace the legacy arrivals upstream behind the existing application port with a validated, bounded direct-browser source adapter.

**Independent Test**: Select a fixture-backed stop and verify arrival identity, ordered estimates, valid-empty, failure/stale/unavailable states, and no request when `vitrasaId` is absent. Verify local-live and production use the same validated GET and remain unavailable on invalid identity/payload.

### Tests for User Story 1

- [X] T019 [P] [US1] Add source-arrival fixture tests for `parada[].stop_vitrasa` identity echo, required `estimaciones`, valid-empty versus malformed envelope, and `linea`/`ruta`/`minutos` normalization in `frontend/tests/unit/municipal/arrivals-normalizer.test.ts`
- [X] T020 [P] [US1] Add ID-namespace tests proving arrivals use only a verified Vitrasa ID and never municipalCode, public code, or application stop ID in `frontend/tests/unit/municipal/arrivals-identity.test.ts`
- [X] T021 [P] [US1] Add arrival adapter tests for bounded HTTP errors, timeout, rate limit, HTML/JSON errors, oversized body, and no partial result in `frontend/tests/unit/municipal/arrivals-adapter.test.ts`
- [X] T022 [P] [US1] Add receipt/cache tests for exact 29999/30000/299999/300000 ms boundaries, stale only after failed refresh, successful empty aging, future timestamp rejection, original `fetchedAt`, LRU maximum 20 stops, 512 KiB serialized bytes, and 300 s expiry in `frontend/tests/unit/municipal/arrival-receipt.test.ts`
- [X] T023 [P] [US1] Add selection tests for no GET without `vitrasaId`, one request per stop, late-result rejection after stop change, visible-only 30-second refresh, and coalescing in `frontend/tests/unit/select-stop.test.ts`, `frontend/tests/unit/get-stop-arrivals.test.ts`, and `frontend/tests/unit/municipal/request-scheduler.test.ts`
- [X] T024 [P] [US1] Add localized stop-panel tests for loading, valid-empty, current-by-receipt, stale-after-failure, unavailable, offline, the same Retry node retaining focus and becoming aria-disabled while pending, keyboard retry, and one polite completion announcement in `frontend/tests/dom/stop-view.test.ts` and `frontend/tests/unit/get-stop-arrivals.test.ts`
- [X] T025 [P] [US1] Add a deterministic E2E fixture-flow test using `helpers/municipal-profile.ts`, proving zero municipal requests in the default profile and correct fixture-backed arrivals in `frontend/tests/e2e/municipal-arrivals.spec.ts`

### Implementation for User Story 1

- [X] T026 [US1] Implement complete action-specific arrival payload and identity validation in `frontend/src/infrastructure/municipal/arrivals-validator.ts`; verify identity and envelope rejection with T019 and T020
- [X] T027 [US1] Migrate `frontend/src/domain/types.ts` and `frontend/src/application/ports.ts` to v5 `NetworkStop`, `ArrivalReceipt`, and typed operation results; keep municipalCode, vitrasaId, and application stopId distinct, remove synthesized `eta`, and require `ArrivalReceipt.fetchedAt === provenance.fetchedAt`; verify contract and identity invariants with T009, T020, and T022
- [X] T028 [US1] Normalize `linea`, `ruta`, and nonnegative integer `minutos` to v5 arrival fields with stable ascending ordering and implement the LRU cache capped at 20 stops, 512 KiB serialized bytes, and strict 300 s expiry in `frontend/src/infrastructure/municipal/arrivals-normalizer.ts` and `frontend/src/infrastructure/municipal/arrival-cache.ts`; verify normalization and cache boundaries with T019 and T022
- [X] T029 [US1] Wire `MunicipalArrivalsAdapter` directly to the selected-stop flow using the fixed-host `MunicipalHttpClient`, preserve typed failures, and remove the Worker-based arrivals gateway from `frontend/src/main.ts`; verify HTTP and failure mapping with T021
- [X] T030 [US1] Connect validated receipt age, refresh lifecycle, and normalized arrival states to the existing selected-stop use case in `frontend/src/application/get-stop-arrivals.ts`; verify selection and refresh behavior with T023
- [X] T031 [US1] Render localized receipt-time freshness and safe loading/empty/stale/offline/unavailable states while retaining the same Retry DOM node, focus, and aria-disabled pending state in `frontend/src/ui/stop/stop-arrivals-view.ts`; verify states and accessibility behavior with T024
- [X] T032 [US1] Enable the arrivals GET for local-live and production through the shared action allowlist; validate returned stop identity and estimates and keep `ttl=5` separate from client-side freshness policy in `frontend/src/infrastructure/municipal/action-readiness.ts`; verify with T021, T052 and browser smoke

**Checkpoint**: US1 is independently testable with fixtures. No live arrival is enabled merely because its schema or HTTP status passes.

## Phase 4: User Story 2 — Browse current stops, lines, and line service (Priority: P1)

**Goal**: Source catalog and line/service/map data through action-specific normalizers while preserving stop identity namespaces and truthful route/timetable behavior.

**Independent Test**: Fixture responses render searchable lines/stops and serving-line badges; verified schedule/day/trip fixtures render published times and ordered stops; unresolved schedules/geometry remain unavailable and never produce invented routes.

### Tests for User Story 2

- [X] T033 [P] [US2] Add line catalog tests for ES/GA source actions, sparse optional fields, duplicate codes, color validation, and source order in `frontend/tests/unit/municipal/line-catalog.test.ts`
- [X] T034 [P] [US2] Add stop-detail/serving-lines tests for Vitrasa `id` versus municipal `stop_id`, zero/one/multiple records, atomic nullable coordinate pairs, and identity mismatch rejection in `frontend/tests/unit/municipal/stop-catalog.test.ts`
- [X] T035 [P] [US2] Add source-service tests proving service metadata is not inferred as a timetable, locale maps `gl→GA` and `es/en→ES`, and public-data cache respects 100 entries, 4 MiB, LRU, and strict 24-hour expiry in `frontend/tests/unit/municipal/service-catalog.test.ts` and `frontend/tests/unit/municipal/public-response-cache.test.ts`
- [X] T036 [P] [US2] Extend schedule tests for the explicit fixture-only `id=lineCode`, APK-derived `dia=1/6/0` mapping, exact leading trip-token filter, provisional provenance, mixed/unmatched-row rejection, live fail-closed behavior, and `00:00–23:59` validation in `frontend/tests/unit/municipal/line-schedule-adapter.test.ts`
- [X] T037 [P] [US2] Extend route-geometry tests for the outer `st_asgeojson` envelope, nested JSON string, full LineString/order validation, fixture-only OGC:CRS84 assumption and provisional provenance, malformed-tail rejection, and live fail-closed behavior in `frontend/tests/unit/municipal/route-geometry.test.ts`
- [X] T038 [P] [US2] Extend trip-stop tests for exact opaque trip IDs, full-array contiguous `orden`, exact municipal-code lookup, selected-line membership, provisional provenance, identity rejection, and live fail-closed behavior in `frontend/tests/unit/municipal/trip-stops.test.ts`
- [X] T039 [P] [US2] Extend line-stop detail tests for exact municipal `stop_id`/public line code, fixed fixture-only `min=0` minute-threshold assumption, exact leading trip-token/line-context rejection, typed output/provisional provenance, identity rejection, and live fail-closed behavior in `frontend/tests/unit/municipal/line-stop-detail.test.ts`
- [X] T040 [P] [US2] Add UI E2E tests for searchable source-backed catalog, localized error/freshness copy, keyboard-accessible map and equivalent ordered-text stop alternative, and no raw JSP fields/IDs in `frontend/tests/e2e/municipal-catalog.spec.ts`
- [X] T041 [P] [US2] Complete timetable E2E coverage for weekday/Saturday/Sunday-holiday selectors, published-time provenance, visibly attributed and dated exact-day snapshot fallback that is never labeled JSP/live, and unavailable when provenance is untrusted in `frontend/tests/e2e/municipal-line-service.spec.ts`

### Implementation for User Story 2

- [X] T042 [US2] Implement line catalog validation and normalization for `TRANSPORTE_LINEAS_ES` and `TRANSPORTE_LINEAS_GA` in `frontend/src/infrastructure/municipal/line-catalog-adapter.ts`; verify with T033
- [X] T043 [US2] Implement service metadata validation/normalization without treating it as timetable data, plus a shared LRU public-response cache capped at 100 entries, 4 MiB, and strict 24-hour expiry in `frontend/src/infrastructure/municipal/service-catalog-adapter.ts` and `frontend/src/infrastructure/municipal/public-response-cache.ts`; verify locale, metadata, and cache limits with T035
- [X] T044 [US2] Implement stop-detail normalization preserving `vitrasaId` and `municipalCode` as distinct canonical strings and atomic nullable `lat/lon` in `frontend/src/infrastructure/municipal/stop-detail-adapter.ts`; verify with T034
- [X] T045 [US2] Implement serving-line lookup using only the verified municipal stop ID in `frontend/src/infrastructure/municipal/serving-lines-adapter.ts`; verify identity and cardinality with T034
- [X] T046 [US2] Extend `ScheduleRepository` to expose v5 source-backed lines/stops and explicit discovery provenance without inventing exhaustive enumeration; preserve published departure strings and provenance independently from legacy frequency bands in `frontend/src/infrastructure/schedule/municipal-schedule-repository.ts`; verify repository and provenance behavior with T033, T034, and T036
- [X] T047 [US2] Implement schedule normalization using the explicit inferred mapping only in fixture mode; filter exact leading trip-code matches, mark results `provisional-fixture`, and preserve the live `mapping-unverified` gate in `frontend/src/infrastructure/municipal/line-schedule-adapter.ts`; verify with T036
- [X] T048 [US2] Implement complete route geometry decoding with fixture-only OGC:CRS84 assumption, `provisional-fixture` provenance, and the unchanged live readiness gate in `frontend/src/infrastructure/municipal/route-shape-adapter.ts`; verify with T037
- [X] T049 [US2] Implement trip-stop normalization with exact municipal-code lookup, contiguous sequence and line-membership checks, provisional fixture provenance, and unchanged live readiness in `frontend/src/infrastructure/municipal/trip-stop-adapter.ts`; verify with T038
- [X] T050 [US2] Implement typed line-stop fixture normalization using exact municipal/public identifiers and fixed `min=0` minute-threshold assumption; mark it provisional and retain the live `mapping-unverified` gate in `frontend/src/infrastructure/municipal/line-stop-adapter.ts`; verify with T039
- [X] T051 [US2] Connect normalized catalog and serving-line relationships to existing views; render published service times and day-specific provenance; integrate candidate geometry, trip-stop sequences, and line-stop detail in fixture evaluation with visible provisional warnings; T075 adds exact stakeholder-attested mappings to local-live; T080 separately enables those exact mappings in production by product-owner decision, in `frontend/src/main.ts`; verify candidate views with T040 and fixture E2E tests; exact-day snapshot fallback is covered by T041

**Checkpoint**: US2 works with deterministic action fixtures. The exact candidate mappings are now available in both live profiles by explicit product-owner scope amendment; all other candidate mappings remain disabled.

## Phase 5: User Story 3 — Use the same application contract locally and in production (Priority: P1)

**Goal**: Keep automated tests deterministic while local development and production call the fixed JSP directly for supported actions; keep unsupported operations fail-closed individually.

**Independent Test**: Fixture tests make no municipal requests; local-live and production use GET with omitted credentials for the same seven supported actions; schedule, geometry, trip, and line-stop-detail operations remain unavailable without their mappings.

### Tests for User Story 3

- [X] T052 [P] [US3] Add readiness tests proving seven general actions are enabled in local-live/production and exact candidate mappings are scoped by profile parameters in `frontend/tests/unit/municipal/action-readiness.test.ts`
- [X] T053 [P] [US3] Add E2E coverage proving saved-item migration and unsupported candidate operations make no municipal requests in `frontend/tests/e2e/municipal-profile-isolation.spec.ts`.
- [X] T054 [P] [US3] Add profile-selection tests distinct from action readiness, proving fixture fallback, local-live selection, supported production selection, and no caller-provided base URL in `frontend/tests/unit/municipal/profiles.test.ts`
- [X] T055 [P] [US3] Add regression coverage for v1 saved-item migration, v2 precedence, byte preservation, and deleted-item non-resurrection in `frontend/tests/unit/storage-adapter.test.ts`.
- [X] T056 [P] [US3] Add production-artifact guard tests for endpoint, credentials, legacy URLs, and action readiness in `frontend/tests/unit/municipal/production-artifact.test.ts`.

### Implementation for User Story 3

- [X] T057 [US3] Wire profile selection into application bootstrap and build configuration; run the local dev server with local-live and tests with explicit fixtures; verify direct browser use and profile rules with T054
- [X] T058 [US3] Migrate valid saved-item envelopes from v1 to v2 without mutating v1 bytes or restoring deleted items in `frontend/src/infrastructure/storage/local-storage-adapter.ts`.
- [X] T059 [US3] Implement shared seven-action local-live/production readiness plus exact-parameter local-live mappings for the four stakeholder-reported line-A candidate operations; verify with T052
- [X] T060 [US3] Run the production-artifact guard after the build in `.github/workflows/ci.yml` and expose it as `npm run validate:production-artifact`.

**Checkpoint**: Profiles share normalized v5 models; no profile selection bypasses action readiness or release gates.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close evidence, accessibility, performance, documentation, and release gates without turning observations into assumptions.

- [N/A] T061 [P] Product-owner decision (2026-10-28): capturing provider raw-byte fixtures and hashes for all eleven actions is not required for this feature's G5.
- [N/A] T062 [P] Product-owner decision (2026-10-28): recovering the APK call chain and independently verifying `ttl`/`min` behavior are not required for this feature's G5.
- [N/A] T063 [P] Product-owner decision (2026-10-28): defer independent schedule-ID/day mapping evidence to a future spec. This evidence remains deferred despite the separate exact-mapping production authorization in T080.
- [N/A] T064 [P] Product-owner decision (2026-10-28): defer independent geometry/CRS and trip-stop identity evidence to a future spec. This evidence remains deferred despite the separate exact-mapping production authorization in T080.
- [N/A] T065 [P] Product-owner decision (2026-10-28): defer source usage-policy, provider-limit, error-semantics, and healthy-source timing research; no provider guarantees are claimed.
- [N/A] T066 Product-owner decision (2026-10-28): defer the complete eleven-action browser evidence matrix; only the browser observations already listed in `source-evidence.md` are claimed.
- [N/A] T067 Product-owner decision (2026-10-28): defer the broader 20-stop/10-line identity and membership parity corpus; the bundled discovery catalog remains explicitly non-exhaustive.
- [N/A] T068 Product-owner decision (2026-10-28): defer all-line, three-day schedule parity; do not retire or relabel bundled snapshots as live data.
- [N/A] T069 [P] Product-owner decision (2026-10-28): defer the remaining automated and manual accessibility evidence to a future spec, including axe, keyboard, reflow, focus, contrast, target-size, map-text and screen-reader checks; no full WCAG conformance claim is made.
- [N/A] T070 [P] Product-owner decision (2026-10-28): defer the documented loading-feedback, operation-time and first-map bundle-size measurements; the build result alone is not claimed to satisfy these budgets.
- [X] T071 Run the bounded fixture/local-live contract and Chromium E2E scenarios from `specs/004-vigo-jsp-transit-api/quickstart.md`; record commands, environment/profile, pass/fail, and external-network limitations in `specs/004-vigo-jsp-transit-api/gate-g5-implementation-review.md`; never claim external tests were run without evidence
- [X] T072 [P] Add an opt-in bounded sequential browser smoke runner and document its safeguards; live execution remains unperformed and is not claimed as provider evidence.
- [X] T073 Record actual actor verdicts and the product-owner-approved limited G5 closure with explicit exceptions in `specs/004-vigo-jsp-transit-api/gate-g5-implementation-review.md`; do not represent waived evidence or deferred actor reviews as completed/approved.
- [N/A] T074 Product-owner decision (2026-10-28): defer removal of migration-era Worker tooling to a future cleanup spec; no Worker is deployed or used by the target frontend.
- [X] T075 Enable the four stakeholder-reported G5 mappings only for exact local-live identifiers; retain fixture-only synthetic tests and production fail-closed behavior; update Postman and the readiness contract; verify adapters, HTTP boundary, request IDs, and day mapping with focused tests
- [X] T076 Prevent late line/day results from replacing a newer selection or rendering after leaving the line view; add request-generation regression tests
- [X] T077 Render schedule receipt time in the user's local date/time with timezone, consistent with the approved UX baseline
- [X] T078 Reject non-numeric municipal stop IDs in the line-stop adapter before request construction; return identity-unverified and cover no-network behavior
- [X] T079 Record the current scoped local-live actor outcomes and Project Lead keep-open decision without changing the open independent-evidence tasks
- [X] T080 Enable the four exact line-A candidate mappings in production by explicit product-owner direction; retain pre-network denial for all other IDs, days, stops, lines, and parameters; update the production artifact guard and contract, and verify adapter/readiness/build behavior
- [X] T081 Add `TRANSPORTE_PARADAS` as the eighth general action and build the stop discovery catalog online (`frontend/src/infrastructure/municipal/online-stop-catalog.ts`, `line-id.ts`), falling back to the bundled catalog and its notice only when the online catalog fails
- [X] T082 Request `TRANSPORTE_LINEA_HORARIOS_EXTEND` by public line code for every line in live profiles, keep every row like the official app, parse `", "`-separated times and expose trips per direction in `frontend/src/infrastructure/municipal/line-schedule-adapter.ts` and `frontend/src/ui/line/frequency-view.ts`
- [X] T083 Build online route summaries and geometry from representative schedule-row `trip_id`/`shape_id` values in `frontend/src/infrastructure/schedule/municipal-schedule-repository.ts` and `frontend/src/main.ts`
- [X] T084 Update readiness policy, production artifact guard, feature contract validator, OpenAPI contract, action-readiness matrix, Postman collection and unit tests (`frontend/tests/unit/municipal/online-catalog.test.ts`) for the online catalog

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: No dependencies; establishes fixture and validation locations.
- **Foundational (Phase 2)**: Depends on Setup and blocks every user story.
- **US1 (Phase 3)**: Depends on Foundational; arrivals can be fixture-complete while live permission remains blocked on `ttl` evidence.
- **US2 (Phase 4)**: Depends on Foundational; catalog/stop/service operations can be fixture-complete while schedule/shape/trip/line-stop remain restricted to explicit mappings.
- **US3 (Phase 5)**: Depends on Foundational and the normalized contracts from US1/US2; seven general actions and four exact product-owner-approved candidate mappings are available, while all other candidate parameters remain denied.
- **Polish (Phase 6)**: Evidence tasks may run in parallel where their files and source requests are independent; release closure requires all preceding stories and G4/G5.
- **Provisional candidate evaluation**: Extended tests T036–T039 precede T047–T050; T051 follows those adapters. T075 and T080 record later exact live-scope decisions; fixture evaluation itself does not authorize network access.
- **T074 runtime retirement**: Deferred to a future cleanup spec by the product owner; the Cloudflare deploy job has been removed and no Worker is deployed or used by the target frontend.

### User story dependencies

- **US1 (P1)**: Starts after Foundational. Independently demonstrates arrivals against fixture data; live arrivals remain disabled until `ttl` semantics, identity and response evidence are approved.
- **US2 (P1)**: Starts after Foundational. Catalog and stop details are independently testable; route/timetable operations require verified source identity/CRS and remain unavailable otherwise.
- **US3 (P1)**: Starts after Foundational; final production implementation depends on US1 and US2 contracts and cannot close before their semantic evidence.

### Parallel opportunities

- T005–T010 are independent test-writing tasks; T011 can proceed alongside them because all default fixtures are synthetic and require no live captures.
- Within US1, T019–T025 are independent tests; T026–T028 can be split by module after test contracts settle.
- Within US2, T033–T041 are independent tests; T042–T045 adapters touch separate files and can proceed in parallel after shared foundations.
- US1 fixture arrivals and US2 fixture catalog can be developed by separate contributors after Phase 2, then integrated at T051.
- T061–T070 and live execution/evidence for T072 remain waived/deferred from the original G5 scope by the product owner. T063–T064 evidence remains deferred despite the separate exact-mapping production authorization in T080. The T072 smoke tool is implemented but has not been run against the provider. T074 is deferred to a future cleanup spec. The exact exclusions and unverified areas are recorded in the G5 review; none may be cited as evidence or actor approval.

## Parallel Example: Foundational Tests

```text
Task: T005 request-builder action/parameter tests
Task: T007 raw-byte and charset decoder tests
Task: T009 normalized OpenAPI schema tests
Task: T010 scheduler bounds/cancellation tests
```

## Implementation Strategy

### MVP

1. Complete Setup and Foundational phases.
2. Complete US1 using deterministic fixtures; enable the live arrivals action with stop-identity validation and client-owned freshness.
3. Validate US1 independently with unit, DOM, contract, and E2E tests.
4. Proceed to US2 catalog/stop details; keep candidate calls restricted to the exact approved mappings and deny every other parameter.

### Incremental delivery and release

1. Complete fixture-backed US1 and US2 without requiring municipal network access in CI; the four candidate actions may produce only visibly provisional fixture results.
2. Run local development and production through the same general allowlist plus exact candidate mappings; keep unit, contract, load, and E2E tests fixture-only.
3. Permit only the exact stakeholder-reported candidate mappings approved by the product owner in production; reject all other candidate parameters before network access.
4. Record live smoke results and remaining G5/actor reviews without representing them as complete; production support for the seven allowed actions does not imply all eleven source operations are ready.
5. Any failed supported operation becomes unavailable; never enable a Worker fallback or alternate upstream.

### Backend Developer Verdict — Unsupported action validator hardening — 2026-10-28
- Verdict: APPROVED
- Scope: fixture-only validator hardening at the time of review; this is not an approval of the later scoped local-live mappings or full G5 readiness.
- Findings:
  - Schedule normalization rejects mixed trip identities and duplicate trip/shape rows instead of flattening an ambiguous cross-line response into one public line's departures.
  - Route geometry requires the observed nested LineString shape and two-dimensional coordinate bounds; local coordinate ranges are not treated as CRS evidence.
  - Trip-stop normalization requires the observed row fields, valid coordinate pairs, unique identities, and exact 1-based contiguous response order.
  - At that review, line-stop detail remained unavailable and the conflicting `min=0`/`min=30` observations were not interpreted.
  - At that review, schedule, geometry, trip-stop, and line-stop-detail actions were disabled in local-live and production.
- Required actions at that review: Keep all four actions disabled until line/trip/shape associations, CRS, complete source row semantics, and line-stop `min` behavior have verified evidence and contract review. The later exact local-live exception is recorded in T075 and does not supersede production evidence requirements.
