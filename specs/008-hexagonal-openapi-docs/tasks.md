# Tasks: Hexagonal Architecture and OpenAPI Documentation

**Input**: Design documents from `specs/008-hexagonal-openapi-docs/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/openapi-docs-page.md`, `design-baseline.md`, and `quickstart.md`

**Tests**: Tests are required by the feature specification and the ratified
constitution. Write regression tests before or alongside implementation;
domain and application rules must remain testable without browser, network, or
browser persistence.

**Organization**: Tasks are grouped by approved user story. Every task has a
specific file path and is ordered by prerequisite.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: The task can be performed in parallel without editing the same files
  or depending on incomplete tasks.
- **[Story]**: User-story traceability label; setup, foundational, and polish
  tasks do not carry a story label.
- Every task uses the required checkbox, sequential ID, optional parallel
  marker, required story marker where applicable, and explicit file path.

## Path Conventions

This is a static web application. Runtime code lives in `frontend/src/`,
automated tests in `frontend/tests/`, build validation in `scripts/`, project
documentation in `docs/` and `README.md`, and feature artifacts in
`specs/008-hexagonal-openapi-docs/`.

## Phase 1: Setup

**Purpose**: Prepare generated documentation output and preserve the existing
dependency/tooling profile.

- [X] T001 Ignore the generated OpenAPI input `frontend/public/docs/openapi/index.html` in `.gitignore` without ignoring other files under `frontend/public/`; verify the exact generated path with `git check-ignore -v`.

## Phase 2: Foundational

**Purpose**: Establish one base-path source and keep Vite assets, PWA behavior,
and static documentation routing consistent before story-specific integration.

- [X] T002 Make Vite's `base` derive from the single `VITE_BASE_PATH` value (default `/`) in `frontend/vite.config.ts`, keeping production `/vigo-bus-navigator/` and root-host builds consistent; verify root and non-root production builds emit correctly based asset URLs.

**Checkpoint**: Root and `/vigo-bus-navigator/` base-path behavior is configured.
User-story work may proceed, respecting the dependencies below.

## Phase 3: User Story 1 - Maintain and test application capabilities independently (Priority: P1) 🎯 MVP

**Goal**: Inventory every maintained production runtime module, enforce
hexagonal dependency directions, and prove domain/use-case behavior can be
tested in isolation.

**Independent Test**: Run the architecture tests and all domain/application
unit tests in Node. Every discovered runtime module has one classification;
unknown/stale entries, unresolved code edges, prohibited dependencies, and
missing isolated test mappings fail with actionable file/edge diagnostics.

### Tests for User Story 1

- [X] T003 [US1] Add architecture-checker regression fixtures in `frontend/tests/unit/architecture.test.ts` for an unclassified source module, stale manifest entry, missing/invalid isolated-test mapping, alias/re-export/type-only/literal dynamic-import edges, unresolved code dependency, prohibited layer edge, and core browser/network/storage global use; verify each reports the source and dependency location.

### Implementation for User Story 1

- [X] T004 [US1] Create the exhaustive runtime-module classification and test-map manifest in `frontend/tests/architecture/modules.json`, listing every executable production module under `frontend/src` exactly once with its primary responsibility and required rationale/test mappings; validate JSON syntax and unique source paths with Node's JSON parser.
- [X] T005 [US1] Implement source discovery, manifest parity checks, TypeScript AST import extraction, TypeScript/Vite alias resolution, and actionable unresolved-edge diagnostics in `frontend/tests/unit/architecture.test.ts` and `frontend/tests/architecture/modules.json`; verify with `npm test -- frontend/tests/unit/architecture.test.ts`, including the discovery, alias, and unresolved-edge regressions from T003.
- [X] T006 [US1] Enforce inward dependency rules and domain purity in `frontend/tests/unit/architecture.test.ts`: domain may import only domain; application may import domain and application ports/use cases; adapters may depend inward and on adapter-local helpers; composition is limited to wiring; reject domain framework/DOM/browser/network/persistence dependencies; verify each prohibited edge/global fixture fails and an allowed direction passes with `npm test -- frontend/tests/unit/architecture.test.ts`.
- [X] T007 [US1] Map every domain rule and application use case in `frontend/tests/architecture/modules.json` to at least one isolated Node test, and add any missing scenarios in the corresponding `frontend/tests/unit/*.test.ts` files using injected ports without browser, network, or browser persistence; verify every map entry resolves to a test and `npm test -- frontend/tests/unit` passes.
- [X] T008 [US1] Refactor any violations reported by the complete architecture inventory, including direct application behavior in `frontend/src/main.ts`, settings persistence in `frontend/src/ui/settings/settings-menu.ts`, or platform-coupled port contracts in `frontend/src/application/ports.ts`, so UI entry points delegate through use cases and core modules remain pure; verify with architecture and isolated domain/application tests plus `npm run typecheck`.
- [X] T009 [US1] Document the runtime inventory, classification meanings, permitted dependency directions, composition-root limits, and local validation commands in `docs/architecture.md`, linking it to `frontend/tests/architecture/modules.json`; verify every documented rule and command against the manifest and `package.json`.

**Checkpoint**: `npm test` and `npm run typecheck` pass; architecture inventory
and dependency rules cover all discovered runtime modules; every domain rule
and application use case has an isolated test.

## Phase 4: User Story 2 - Read the OpenAPI contract as a web page (Priority: P2)

**Goal**: Generate a complete, accessible, directly addressable static HTML
page from the canonical municipal OpenAPI contract without adding a runtime
renderer, transit backend, or external network dependency.

**Independent Test**: Run `npm run build` with `VITE_BASE_PATH=/` and
`VITE_BASE_PATH=/vigo-bus-navigator/`. Verify direct access to
`/docs/openapi/` and `/vigo-bus-navigator/docs/openapi/`, including while the
active service worker controls the page. Compare visible rendered source
pointers with the canonical YAML and run automated accessibility checks.

### Tests for User Story 2

- [X] T010 [P] [US2] Add template and generator tests in `scripts/openapi-docs-template.test.ts` and `scripts/generate-openapi-docs.test.ts` for semantic output, byte-for-byte deterministic generation, visible coverage of all operations/parameters/request bodies/responses/components/references/extensions, no extra operations or schemas, HTML escaping, and missing/unreadable/invalid/unresolved/render-error failures.
- [X] T011 [P] [US2] Add failure-oracle tests in `scripts/generate-openapi-docs-failures.test.ts` that seed stale `frontend/public/docs/openapi/index.html` and `dist/docs/openapi/index.html`, invoke the generator/build for each required failure class, and assert nonzero exit, canonical source path/category/corrective guidance in diagnostics, removal of both stale files, and that `.github/workflows/deploy.yml` cannot upload a failed build.
- [X] T012 [P] [US2] Add static-route and service-worker tests in `frontend/tests/e2e/openapi-docs-routing.spec.ts` for direct trailing-slash navigation at root and `/vigo-bus-navigator/`, asserting the response is the generated documentation rather than the SPA shell before and while controlled by the active worker, including direct offline navigation after the page is precached.
- [X] T013 [P] [US2] Add accessibility and responsive tests in `frontend/tests/e2e/openapi-docs-accessibility.spec.ts` for semantic landmarks/headings, a first-focusable skip link, keyboard traversal/activation and destinations for index links, named controls and state, native disclosure keyboard/state behavior if present, visible focus, Axe checks on the ready and applicable empty-section states, 320 CSS-pixel reflow, and a reproducible 200%-text-size override with Playwright `page.addStyleTag({ content: 'html { font-size: 200% !important; }' })`; in both responsive states assert no page-level overflow or loss of operation/schema access.

### Implementation for User Story 2

- [X] T014 [US2] Render operation/schema navigation, empty-section explanations, semantic native controls where needed, wrapped contract content, and the approved hierarchy/tokens in `scripts/openapi-docs-template.ts` according to `specs/008-hexagonal-openapi-docs/design-baseline.md`; meet 44 CSS-pixel page-control targets, visible/unobscured focus, and no-motion requirements; pass `npm test -- scripts/openapi-docs-template.test.ts` from T010.
- [X] T015 [US2] Implement deterministic contract parsing, required OpenAPI validation, local-reference resolution, visible source-pointer generation, safe HTML escaping, and actionable failure diagnostics in `scripts/generate-openapi-docs.ts`; call the renderer contract `renderOpenApiDocument(document)` from `scripts/openapi-docs-template.ts`, pass generator tests in T010, and verify the integrated rendered output against the canonical contract.
- [X] T016 [US2] Make `npm run build` in `package.json` run `scripts/generate-openapi-docs.ts` before Vite; remove stale pages from both `frontend/public/docs/openapi/index.html` and `dist/docs/openapi/index.html` before validation; write the new intermediate only after validation succeeds and ensure a failed generation exits before deployment upload; verify with `npm run build` and the build/failure-oracle tests in T011.
- [X] T017 [US2] Update `frontend/vite.config.ts` to copy the generated public page into `dist/docs/openapi/index.html` before Workbox precache generation, include the `index.html` response in the precache, and make both `/docs/openapi/` and `/vigo-bus-navigator/docs/openapi/` resolve to that cached response while offline; keep the configured base consistent and exclude the docs route from the SPA navigation fallback; pass T012 at both bases.

**Checkpoint**: The standard production build produces a non-empty
`dist/docs/openapi/index.html` included in precache; root/non-root direct routes
serve that page under service-worker control; invalid input fails closed; all
contract fields are visibly represented and automated accessibility checks
pass.

## Phase 5: User Story 3 - Understand and navigate the project README (Priority: P3)

**Goal**: Reorganize the README for quick discovery while retaining accurate
product, operational, privacy, security, source, and harness information.

**Independent Test**: Verify that the README exposes purpose, architecture,
setup, validation, and OpenAPI documentation in scannable sections, matches or
links to the authoritative Harness Charter, preserves current caveats, and
passes the specified README-only findability task.

### Tests and Implementation for User Story 3

- [X] T018 [P] [US3] Reorganize `README.md` into concise purpose, architecture, OpenAPI documentation, setup, validation, data/privacy/service limitations, repository workflow, status, and license sections; retain accurate current hosting, data-flow, municipal source, profile, localStorage, privacy/security, availability, and license statements; verify the sections against current project files and preserve every existing accurate caveat.
- [X] T019 [US3] Replace the incomplete actor/gate summary in `README.md` with an accurate summary of `docs/harness-charter.md` or a clear link naming it as authoritative; add descriptive OpenAPI link text to `https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/` and local preview route `/docs/openapi/`, and link to `docs/architecture.md`; verify each link target and confirm setup/validation instructions require no backend or credentials.
- [ ] T020 [US3] Run the README-only findability check described in `specs/008-hexagonal-openapi-docs/quickstart.md` with five people unfamiliar with the repository and uninvolved in the feature; without repository search, have each find project purpose, local setup, validation commands, architecture overview, and the OpenAPI page link; record aggregate results in `specs/008-hexagonal-openapi-docs/gate-g5-implementation-review.md` and confirm at least four people find all five within 60 seconds.

**Checkpoint**: README content remains accurate, its documentation and
architecture links resolve for their intended local/deployed contexts, the
harness description is consistent with the charter, and the findability target
is met and recorded.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the integrated deliverable, capture manual evidence, and
close the implementation gate without confusing planning approval with
implementation acceptance.

- [X] T021 Run `npm run typecheck`, `npm test`, `npm run test:coverage`, `npm run lint:openapi`, `npm run validate:feature004-contract`, `VITE_BASE_PATH=/ npm run build`, `VITE_BASE_PATH=/vigo-bus-navigator/ npm run build`, direct-route/service-worker tests, and `npm run test:e2e`; resolve failures in the relevant files and ensure all quickstart scenarios in `specs/008-hexagonal-openapi-docs/quickstart.md` pass.
- [ ] T022 Perform the manual WCAG 2.2 AA review for the generated page, README structure/content, and README link, covering actual contrast, keyboard order, visible/unobscured focus, 320 CSS-pixel/200% text zoom, user text-spacing overrides, page-control target size, native Markdown-link focus, whether the README inline link qualifies for the WCAG 2.2 SC 2.5.8 text-link exception, empty sections, offline-available behavior, and reduced motion. For screen-reader review, verify page title/landmarks, heading outline, link purpose, disclosure names/state if present, operation/parameter/response relationships, schema nesting/references, and empty-section behavior using at least one desktop combination such as NVDA with Firefox on Windows or VoiceOver with Safari on macOS; record the exact browser/screen-reader combination, URLs, states, viewports, tools, criteria, results, and limitations in `specs/008-hexagonal-openapi-docs/gate-g5-implementation-review.md`.
- [ ] T023 Record the required G5 verdicts from QA Tester, Stakeholder, UX Designer, Frontend Developer, and Software Architect, resolve and re-review any requested changes, and close `specs/008-hexagonal-openapi-docs/gate-g5-implementation-review.md` only after all required verdicts approve.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependency; adds the exact generated intermediate
  path to `.gitignore`.
- **Foundational (Phase 2)**: Depends on Setup; establishes Vite's shared base
  value, which the later static-docs and Workbox integration consumes.
- **User Stories (Phases 3–5)**: Depend on Setup and Foundational completion.
- **Polish (Phase 6)**: Depends on all three user stories.

### User Story Dependencies

- **User Story 1 (P1)**: May proceed after Foundational. It establishes the
  architecture inventory and test map used in `docs/architecture.md`.
- **User Story 2 (P2)**: May proceed after Foundational. It uses the canonical
  contract and static build; it has no dependency on US1 implementation.
- **User Story 3 (P3)**: README structure and content can be drafted after
  Foundational, but its final links and claim that the architecture inventory
  exists integrate US1's `docs/architecture.md` and US2's `/docs/openapi/`.
  Complete US1 and US2 before final US3 acceptance.

### Within Each User Story

- US1 regression tests precede the TypeScript AST checker and architecture
  refactors; the complete discovered inventory precedes final validation.
- US2 generator/failure and browser/accessibility tests precede implementation;
  the template interface (T014) precedes its generator caller (T015), followed
  by build-chain integration (T016), Vite/Workbox route and cache integration
  (T017), and route/accessibility verification.
- US3 README reorganization precedes the timed reader check; usability findings
  must be addressed before the story checkpoint.

### Parallel Opportunities

- After Setup and Foundational tasks, US1 and US2 can be implemented in parallel
  because architecture-checker files and OpenAPI generator/build files are
  separate.
- US2's generator tests, route tests, and accessibility tests (T010–T013) can
  be prepared in parallel; the route and accessibility suites should use
  separate files.
- US3 task T018 can draft the README while US1/US2 work proceeds; T019's final
  links and T020's findability acceptance wait for their documented destinations.
- In Polish, complete automated validation (T021) before the final manual
  accessibility review (T022), then gather G5 verdicts (T023).

## Parallel Examples

### User Story 1

```text
T003 Add architecture-checker regression cases in frontend/tests/unit/architecture.test.ts
T004 Create the exhaustive runtime module map in frontend/tests/architecture/modules.json
```

T005/T006 start after the regression cases and manifest shape are agreed.
T018 can independently reorganize README.md while US1 and US2 are implemented.

### User Story 2

```text
T010 Add template/generator tests in scripts/openapi-docs-template.test.ts and scripts/generate-openapi-docs.test.ts
T011 Add stale-output/failure tests in scripts/generate-openapi-docs-failures.test.ts
T012 Add direct-route/service-worker tests in frontend/tests/e2e/openapi-docs-routing.spec.ts
T013 Add accessibility/reflow tests in frontend/tests/e2e/openapi-docs-accessibility.spec.ts
```

After the tests, implement the template contract `renderOpenApiDocument(document)`
in T014, call it from the generator in T015, then integrate the build and
base-aware Workbox route in T016/T017.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational tasks.
2. Complete User Story 1 and run its independent architecture/unit validation.
3. Confirm complete runtime inventory, inward dependency enforcement, and
   isolated tests before proceeding.

### Incremental Delivery

1. Deliver US1 as the architecture/testing MVP.
2. Add US2 as a separately verifiable contract documentation page.
3. Add US3 to improve project discovery and README accuracy.
4. Complete cross-story builds, route/accessibility evidence, and G5 approvals.

### Final Phase

All tasks use the required format `- [ ] Tnnn [P?] [USn?] Description with
file path`. Task IDs are sequential; user-story tasks carry their `[US1]`,
`[US2]`, or `[US3]` label; parallel markers are used only where files and
prerequisites permit concurrent work.
