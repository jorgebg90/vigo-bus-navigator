# Research: Repository Cleanup and Normalization

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Repository Baseline

- The active branch is `007-repository-cleanup`, based on `origin/develop`.
- The working tree includes the new feature specification and checklist.
- The repository currently has 368 tracked files across root, `.github/`,
  `.specify/`, `docs/`, `frontend/`, `postman/`, `scripts/`, `specs/`, and
  `worker/`.
- CI uses Node.js 22 and runs install, lint, typecheck, unit, Worker contract,
  Worker load, coverage, Playwright, OpenAPI lint, production build,
  production-artifact validation, size checks, and snapshot generation.
- Production deployment builds and publishes the static frontend only.
- Current governance requires browser-originated municipal requests, static
  hosting, deterministic local verification, OpenAPI contracts, and no
  production transit Worker.

## Decisions

### Decision: Classify before deleting

**Decision**: Inventory maintained artifacts and supported workflows first;
classify each candidate as active, generated, historical, duplicate, obsolete,
or unresolved before applying changes.

**Rationale**: Files may be referenced dynamically, by CI, by generation
scripts, or as historical evidence. A plain import search is not sufficient
proof that a file is unused.

**Alternatives considered**:

- Delete files that appear unreferenced in application imports: rejected because
  it misses workflow, test, deployment, documentation, and generation usage.
- Remove entire directories based on top-level names: rejected as unsafe and
  inconsistent with the evidence-based spec.

### Decision: Preserve completed specifications and unique decisions

**Decision**: Retain completed numbered specifications, accepted decisions, and
material gate evidence. Consolidate only when unique information and provenance
remain accessible.

**Rationale**: These artifacts form the project's SDD governance and explain
architecture changes, including the migration away from Worker-based transit.
The user explicitly selected history preservation.

**Alternatives considered**:

- Delete old specs once implementation is complete: rejected because it
  destroys decision traceability.
- Move all history to an archive: unnecessary unless a specific navigation
  problem is evidenced; it would add moves and reference risk.

### Decision: Treat Worker removal as conditional, not as immediate deletion

**Decision**: Remove Worker runtime/source only after active responsibilities
are migrated or retired with equivalent verification. At this baseline, the
workspace is not wholly unused.

**Evidence**:

- The production deploy workflow publishes `dist` from the frontend and has no
  Worker deploy step.
- Root `package.json` still declares `frontend` and `worker` npm workspaces.
- `npm run typecheck` includes `worker/tsconfig.json`.
- CI invokes `npm run test:contract` and `npm run test:load`, which select
  Worker-specific Vitest configurations.
- The root test suite includes Worker unit files.
- `scripts/catalog/generate.ts` writes catalog output under `worker/src/`.
- Current README and `docs/quality.md` contain migration-era Worker references.
- Feature 002 specifications, quickstart, and gate evidence describe the
  historical Worker API and its tests; these documents are explicitly retained.

**Rationale**: The accepted constitution prohibits a transit Worker in
production, but current CI and data-generation workflows still consume this
workspace. The user's clarification permits removal only when the files are
verified unused and incompatible with accepted architecture. Removing it now
without migrating these uses would violate that condition and weaken
reproducibility.

**Alternatives considered**:

- Delete `worker/` and its dependencies immediately: rejected because CI,
  typecheck, tests, and generation are active consumers.
- Keep all Worker material permanently: rejected as a default because it may
  leave migration-era runtime artifacts after their active responsibilities are
  safely replaced.
- Migrate all checks and generated outputs first, then remove runtime-only
  leftovers: preferred if feasible and within scope; otherwise keep necessary
  tooling and document the residual.

### Decision: No new contract artifact

**Decision**: Do not create a new application API or contract for repository
cleanup. Preserve and validate existing OpenAPI and internal contracts.

**Rationale**: This feature changes repository maintenance, not an interface
between the application and users or external systems.

**Alternatives considered**:

- Define an inventory file format as a public contract: rejected because the
  inventory is a one-time implementation/audit artifact, not a product API.

## Resolved Technical Context

- Supported validation is rooted in npm scripts and GitHub Actions CI.
- Deterministic fixtures are the default for automated checks.
- Production deploy is frontend-only static Pages artifact publishing.
- No application runtime, data contract, or persistence behavior should change.
- Git history and retained specs provide historical traceability; moved or
  consolidated documents still need correct current links.

## Open Research During Implementation

The plan does not assume which individual files will be removed. During task
generation and implementation, each proposed move, consolidation, dependency
removal, or deletion must include evidence of all supported-workflow references
and a verification result. If a candidate cannot be classified safely, retain
it and record the unresolved status rather than expanding into a speculative
rewrite.

## Final Implementation Outcome

- The catalog source and timetable snapshots were moved to maintained frontend
  and script-owned paths; generation and validation pass from those paths.
- Worker-only runtime, workspace, deployment configuration, and tests were
  removed after root scripts and CI were updated to use the maintained browser
  contract, OpenAPI, and frontend validation.
- The unused Worker-era API schedule repository, application use case, port,
  legacy domain types, and unreferenced test helper were removed after searches
  confirmed there were no production or test consumers.
- The Postman collection was retained for manual municipal-source requests,
  renamed to remove the obsolete Worker name, and documented as not validating
  browser CORS.
- Historical specs, gate decisions, snapshot provenance, and the legal notice
  remain preserved.
