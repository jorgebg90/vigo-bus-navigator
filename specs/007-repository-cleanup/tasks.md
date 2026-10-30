# Tasks: Repository Cleanup and Normalization

**Input**: Design documents from `/specs/007-repository-cleanup/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: No new product behavior is specified. Existing automated checks and workflow validations are required before and after each cleanup batch; obsolete Worker-specific test suites may be retired only after confirming they test no supported production or contributor interface.

**Organization**: Tasks are grouped by user story so inventory, safe removal, and contributor normalization can be reviewed as separate outcomes.

## Phase 1: Setup

**Purpose**: Establish a reproducible repository baseline and an auditable decision log.

- [X] T001 Create the repository cleanup inventory and record the baseline branch, tracked-file count, top-level paths, and validation status in `specs/007-repository-cleanup/inventory.md`.
- [X] T002 Run the baseline commands listed in `specs/007-repository-cleanup/quickstart.md` and record command outcomes and existing failures in `specs/007-repository-cleanup/inventory.md`.

## Phase 2: Foundational

**Purpose**: Protect active workflows, constitutional constraints, and historical evidence before any removal.

- [X] T003 Classify every tracked path and each root/workspace dependency in `specs/007-repository-cleanup/inventory.md` as active, generated, historical, duplicate, obsolete, or unresolved, with purpose and references checked.
- [X] T004 Map every CI, deployment, package script, code import, generated-data destination, and contributor workflow to its consuming files in `specs/007-repository-cleanup/inventory.md`; mark feature specifications and gate decisions as protected historical evidence.
- [X] T005 Record the retained static production deploy, direct-browser transit contracts, fixture-based validation, snapshot retention constraints, and any unresolved candidates in `specs/007-repository-cleanup/inventory.md` before approving removal actions.

**Checkpoint**: The repository has an auditable baseline and removal candidates are evidence-classified; no unresolved candidate is deleted.

## Phase 3: User Story 1 - Understand the canonical repository (Priority: P1)

**Goal**: Give contributors an accurate inventory that identifies maintained, generated, historical, duplicate, obsolete, and unresolved material.

**Independent Test**: Review `inventory.md` against `git ls-files`, root/workspace package manifests, CI and deploy workflows, generator destinations, imports, and documented commands; verify every in-scope tracked artifact has a purpose and lifecycle classification.

### Implementation for User Story 1

- [X] T006 Complete the artifact-by-artifact purpose, lifecycle, evidence, and decision register for all tracked repository paths in `specs/007-repository-cleanup/inventory.md`.
- [X] T007 Trace cross-cutting generated and runtime inputs—including bundled catalog data, timetable snapshots, static frontend assets, and generated local output—and document retention or migration decisions in `specs/007-repository-cleanup/inventory.md`.
- [X] T008 Document each duplicate or conflicting current guidance item, its canonical source, any unique information to preserve, and all affected references in `specs/007-repository-cleanup/inventory.md`.

**Checkpoint**: A reviewer can identify each retained area's purpose and assess every proposed cleanup action from recorded evidence.

## Phase 4: User Story 2 - Remove proven clutter safely (Priority: P1)

**Goal**: Remove or consolidate verified legacy or redundant artifacts without changing application behavior, losing historical evidence, or weakening supported checks.

**Independent Test**: Inspect each non-retain decision in `inventory.md`, verify its recorded references and replacement, and run all affected unit, contract, build, and production-artifact checks; verify the app remains a static browser frontend and historical feature records remain available.

### Implementation for User Story 2

- [X] T009 [P] Move the bundled discovery catalog JSON out of the Worker workspace into `frontend/src/infrastructure/municipal/data/catalog-data.json`, update its import in `frontend/src/infrastructure/municipal/bundled-discovery-catalog.ts`, and update the output target in `scripts/catalog/generate.ts`.
- [X] T010 Update `frontend/tests/unit/municipal/bundled-discovery-catalog.test.ts`, `frontend/tests/unit/municipal/municipal-schedule-repository.test.ts`, `frontend/tests/unit/municipal/online-catalog.test.ts`, and `scripts/catalog/generate.test.ts` as needed to validate the catalog after relocating its source and generated output.
- [X] T011 [P] Relocate the generated schedule snapshot outputs from `worker/src/schedule-data/` to a maintained non-Worker location under `scripts/snapshot/generated/`, update output paths in `scripts/snapshot/generate.ts`, preserve all generated data and validation behavior, and ensure the coverage/parity retention condition remains explicit.
- [X] T012 Update `scripts/snapshot/README.md` and snapshot validation references in `.github/workflows/ci.yml` for the new generated-data location without presenting historical snapshot data as live municipal data.
- [X] T013 Remove Worker workspace membership and Worker-only development commands from root `package.json`, remove Worker-only development dependencies from the applicable package manifest, and regenerate `package-lock.json` after replacement paths and checks are ready.
- [X] T014 Replace the root `typecheck` Worker configuration reference in `package.json` and the Worker-specific provenance assumptions in `scripts/provenance.test.ts` with checks for the maintained frontend and scripts.
- [X] T015 Review `worker/test/`, `worker/unit/`, `worker/vitest.config.ts`, and `worker/vitest.load.config.ts`; retire only tests that exclusively cover the unsupported Worker API, and preserve equivalent supported municipal contract and frontend coverage in `scripts/validate-municipal-api-contract.ts`, `scripts/openapi-regression.test.ts`, `frontend/tests/`, and their existing commands.
- [X] T016 Update `.github/workflows/ci.yml` to remove retired Worker-only contract/load commands only after the replacement validation is wired, while retaining lint, typecheck, unit, coverage, browser, OpenAPI, build, payload, production-artifact, and snapshot checks.
- [X] T017 Remove `worker/src/`, Worker-specific tests/configuration, `worker/package.json`, and `worker/wrangler.toml` only after T009–T016 have removed all supported references; remove the proven-unused Worker-era frontend API repository/use case/interface and unreferenced test helper; record evidence in `specs/007-repository-cleanup/inventory.md`.
- [X] T018 Update `specs/007-repository-cleanup/research.md` and `specs/007-repository-cleanup/inventory.md` with final removal/consolidation decisions, checked references, replacements, and validation results.

**Checkpoint**: No supported application, generation, contributor, or CI workflow depends on removed Worker paths; historical specs, unique decisions, source attribution, and protected datasets remain intact.

## Phase 5: User Story 3 - Apply consistent repository conventions (Priority: P2)

**Goal**: Make current repository guidance, ignore rules, and internal references consistent and usable from a clean checkout.

**Independent Test**: Follow the canonical setup, development, verification, and build instructions from a clean checkout; confirm referenced paths and commands exist, historical documents are recognizable as historical, and no unintended internal links point to removed locations.

### Implementation for User Story 3

- [X] T019 [P] Update `README.md` to describe the current browser-only production architecture, maintained repository layout, canonical setup/development/verification commands, and the historical status of Worker-era material without deleting project history.
- [X] T020 Update `docs/quality.md`, `docs/harness-charter.md`, the relevant Harness agent instructions, and `scripts/snapshot/README.md` to remove obsolete current-workflow claims, align architecture/validation commands/artifact paths with the maintained toolchain, and preserve accurate historical context.
- [X] T021 [P] Normalize duplicate or stale generated-output and local-tool ignore entries in `.gitignore`, preserving required exceptions such as `frontend/.env.development` and every artifact's intended tracking policy.
- [X] T022 Audit internal relative links, path references, and current command references in `README.md`, `docs/`, `.github/`, `scripts/`, `postman/`, and current feature documentation; repair unintended broken references while leaving historical records traceable in `specs/`.
- [X] T023 Follow the canonical contributor instructions from a clean checkout and record any remaining unresolved documentation or artifact status in `specs/007-repository-cleanup/inventory.md`.

**Checkpoint**: Contributor guidance describes the current repository and supported workflows, and affected links resolve without erasing historical evidence.

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Verify the cleanup against all stories, protected behavior, and repository-wide quality gates.

- [X] T024 Run every applicable command in `specs/007-repository-cleanup/quickstart.md`, including `npm ci`, lint, typecheck, unit/coverage, E2E, OpenAPI, production build, production-artifact, size, and snapshot validation; record results in `specs/007-repository-cleanup/inventory.md`. E2E was attempted and its occupied-port blocker recorded.
- [X] T025 Verify `git ls-files`, package/workspace manifests, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, frontend imports, and generator targets contain no unintended reference to removed Worker paths; record findings in `specs/007-repository-cleanup/inventory.md`.
- [X] T026 Compare the final application artifact and supported user journeys with the baseline, verify production deployment remains static frontend-only, preserve all protected historical specs and attribution notices, and complete the final acceptance summary in `specs/007-repository-cleanup/inventory.md`.
- [X] T027 Remove the obsolete standalone municipal JSP POC after preserving its observations in feature 004 source evidence; remove verified empty frontend directories and local caches from the retired Worker workspace, retain tests consumed by the supported test suite, and record the disposition in `specs/007-repository-cleanup/inventory.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Establishes baseline outputs and the cleanup decision log.
- **Foundational (Phase 2)**: Depends on Setup; blocks all removal and normalization work until protected workflows and historical artifacts are mapped.
- **User Story 1 (Phase 3)**: Depends on Phase 2; completes the inventory and canonical-source evidence.
- **User Story 2 (Phase 4)**: Depends on User Story 1; removals require a completed classification and traceable decision evidence.
- **User Story 3 (Phase 5)**: Depends on User Story 1; documentation and ignore policy use the canonical inventory. It may proceed alongside independently scoped User Story 2 tasks if file ownership does not overlap.
- **Polish (Phase 6)**: Depends on all selected stories and runs the final full verification gate.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 and can be completed independently; produces the evidence and inventory needed by later work.
- **US2 (P1)**: Starts after US1; the catalog and snapshot moves precede root workspace/dependency removal, and CI/test updates precede deletion of Worker files.
- **US3 (P2)**: Starts after US1; may run in parallel with non-overlapping US2 implementation, but README, quality, and snapshot documentation edits must be coordinated with their corresponding artifact moves.

### Within Each User Story

- Inventory and preservation decisions precede any deletion or consolidation.
- A replacement generated-data path and its tests must work before the Worker workspace is removed.
- Supported verification must replace any retired Worker-specific CI gate before its command, config, or source is deleted.
- Documentation paths are updated after the final artifact destinations are known.
- Run the affected tests/checks after each cleanup batch; defer the full suite to Phase 6.

### Parallel Opportunities

- After the baseline, separate inventory areas (`.github/`, `.specify/`, `docs/`, `frontend/`, `scripts/`, `specs/`, and `worker/`) may be audited in parallel, then reconciled in `inventory.md`.
- After the inventory is approved, T009 catalog relocation and T011 snapshot relocation can proceed in parallel because they use distinct source/generator/test paths.
- T019 README update and T021 `.gitignore` normalization can proceed in parallel after the final artifact decisions are settled.
- T022 reference audit should follow all moves/removals to avoid duplicate work.

## Parallel Examples

### User Story 1 inventory

```text
Task: Classify tracked files, dependencies, and links in .github/ and .specify/ in specs/007-repository-cleanup/inventory.md
Task: Classify frontend/ and scripts/ source, tests, generators, and outputs in specs/007-repository-cleanup/inventory.md
Task: Classify docs/, specs/, and worker/ current versus historical responsibilities in specs/007-repository-cleanup/inventory.md
```

### User Story 2 data migrations

```text
Task: Relocate bundled catalog input and generation output to frontend-owned paths in frontend/src/infrastructure/municipal/data/catalog-data.json and scripts/catalog/generate.ts
Task: Relocate retained schedule snapshots and preserve their validation in scripts/snapshot/generated/ and scripts/snapshot/generate.ts
```

### User Story 3 normalization

```text
Task: Update canonical contributor and architecture guidance in README.md
Task: Normalize local/generated artifact tracking rules in .gitignore
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Capture the full baseline and create `inventory.md`.
2. Classify repository artifacts and trace supported workflows and historical evidence.
3. Identify canonical current guidance and list unresolved candidates without deleting them.
4. Review the inventory with the project stakeholders before cleanup actions.

### Incremental Delivery

1. Complete baseline and protected workflow mapping.
2. Deliver an evidence-backed inventory (US1).
3. Relocate catalog and snapshot generation responsibilities away from the Worker workspace; update tests and CI replacements (US2).
4. Remove only Worker runtime and tooling files proven unused after migrations; preserve history and required datasets.
5. Normalize contributor guidance and ignore rules (US3).
6. Run every required quickstart validation, audit references, compare the frontend artifact, and document the final disposition of unresolved items.
