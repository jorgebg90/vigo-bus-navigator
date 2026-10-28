# Implementation Plan: Repository Cleanup and Normalization

**Branch**: `007-repository-cleanup` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-repository-cleanup/spec.md`

## Summary

Inventory the repository by purpose, lifecycle, and supported-workflow usage;
then remove or consolidate only verified clutter. Preserve application behavior,
the current browser-only architecture, valuable specification and decision
history, licensing, deterministic checks, and deployability. Normalize
contributor guidance to establish canonical setup, development, verification,
and build instructions. Resolve documentation and tooling that still describe
the migration-era Worker before considering their removal; the current CI and
catalog generator still use parts of that workspace.

## Technical Context

**Language/Version**: TypeScript 5.8.3 and JavaScript; Node.js 22 in CI

**Primary Dependencies**: Existing npm workspaces (`frontend`, `worker`) and
root-level development, test, build, and validation tools; no dependencies are
planned for addition

**Storage**: Git-tracked repository artifacts and generated local output;
application persistence and data formats are unchanged

**Testing**: Existing npm scripts and GitHub Actions CI; fixture-based unit,
contract, load, browser, OpenAPI, build, production-artifact, payload-budget,
and generated-snapshot checks

**Target Platform**: Contributor workstations and GitHub Actions; production
remains the existing static HTTPS frontend deployment

**Project Type**: Static frontend PWA with repository-level scripts,
specification/governance documentation, and migration-era Worker test/tooling
workspace

**Performance Goals**: No application performance changes; cleanup must retain
the existing build-size and payload-budget gates

**Constraints**: Keep the application browser-first and static-hosted; preserve
the active production deploy workflow and required local/CI checks; do not
remove files with unresolved use or historical value; preserve English
development artifacts and license/attribution obligations; avoid user-visible
behavior changes

**Scale/Scope**: Full repository inventory (currently 368 tracked files across
root, `.github/`, `.specify/`, `docs/`, `frontend/`, `scripts/`, `specs/`, and
`worker/`); cleanup candidates are evidence-based and may remain if active or
unresolved

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Assessment |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | The cleanup preserves direct browser transit access and static hosting; it does not add a transit backend. Migration-era Worker code is assessed separately from current production behavior and may not be retained as a runtime fallback. |
| II. Modular Hexagonal Architecture | PASS | No application architecture changes are in scope. Existing frontend/domain boundaries and tests are retained. |
| III. Test-First with Unit Coverage | PASS | Existing required checks are treated as protected interfaces; removal or relocation requires equivalent coverage and passing checks. |
| IV. Local Testability & Environment Profiles | PASS | The cleanup retains deterministic local fixtures and documented development profiles; no external credentials or services are introduced. |
| V. Contract-First APIs with OpenAPI | PASS | Existing HTTP contract files and lint/contract gates remain unless a documented, validated replacement preserves the contract and evidence. No new HTTP interface is planned. |
| VI. Zero-Cost Client-Only & Privacy by Design | PASS | Existing static hosting, public-source boundaries, and privacy guarantees remain unchanged; no server or paid service is added. |
| VII. Clean Code, Simplicity & English Documentation | PASS | Consolidation is evidence-based, minimizes duplicate current guidance, preserves historical evidence, and keeps development artifacts in English. |

**Pre-research gate result**: PASS. No architecture, product, or data-source
change is authorized by this cleanup.

## Research Summary

See [research.md](./research.md). The repository inventory confirms that the
Worker is not part of the current production deployment, but it is not wholly
unused: CI runs Worker contract/load suites, the root typecheck covers its
workspace, and `scripts/catalog/generate.ts` writes generated catalog data into
`worker/src/`. Those active links must be migrated or explicitly retained before
the Worker workspace can be removed. Historical feature 002/004 specifications
and decisions remain protected by the approved clarification.

## Design and Contracts

- [data-model.md](./data-model.md) defines artifact classifications, usage
  evidence, cleanup decisions, and history-retention rules.
- No new public or internal application interface is introduced; no contract
  directory is needed for this repository-maintenance feature. Existing
  application contracts remain protected inputs to the inventory.
- [quickstart.md](./quickstart.md) captures baseline and post-cleanup validation.
- This feature adds no product runtime structure. The cleanup inventory must
  trace files and workflows across `.github/`, `.specify/`, `docs/`, `frontend/`,
  `scripts/`, `specs/`, and `worker/`.

## Constitution Check — Post-Design

| Principle | Result | Design evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | No production backend is introduced; Worker removal is gated on migrating currently active tests and generated-data destinations. |
| II. Modular Hexagonal Architecture | PASS | Cleanup changes organization only where usage and reference checks prove safety; application boundaries are unchanged. |
| III. Test-First with Unit Coverage | PASS | Baseline CI commands are documented before cleanup; required checks must still pass after every removal batch. |
| IV. Local Testability & Environment Profiles | PASS | Fixture-first verification remains locally runnable without deployment or live municipal access. |
| V. Contract-First APIs with OpenAPI | PASS | Contract artifacts and validation commands are preserved; there is no new HTTP contract. |
| VI. Zero-Cost Client-Only & Privacy by Design | PASS | The static production target and privacy behavior remain unchanged. |
| VII. Clean Code, Simplicity & English Documentation | PASS | A canonical contributor path and evidence-based artifact lifecycle rules prevent speculative deletion and duplicate current instructions. |

**Post-design gate result**: PASS. Ready for task generation; implementation
must stop and request an explicit decision if a candidate's removal would
require an architecture, behavior, licensing, or historical-record tradeoff
outside the clarified scope.

## Project Structure

### Documentation (this feature)

```text
specs/007-repository-cleanup/
├── plan.md              # This plan
├── research.md          # Repository findings and decisions
├── data-model.md        # Inventory classifications and lifecycle rules
├── quickstart.md        # Baseline and final validation guide
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
.github/                 # Harness agents, skills, workflows, repository config
.specify/                # Spec Kit scripts, templates, and current constitution
docs/                    # Contributor quality guidance and blog/reference docs
frontend/                # Static PWA source, public assets, and tests
scripts/                 # Catalog/snapshot generation and validation tools
specs/                   # Current and historical feature/decision artifacts
worker/                  # Migration-era source/test workspace; active links need
                         # migration or explicit retention before removal
package.json             # Root scripts, dependencies, and workspace declarations
```

**Structure Decision**: Preserve the existing repository organization unless
the inventory identifies a concrete, low-risk consolidation. Do not restructure
the frontend or change runtime architecture as a proxy for cleanup. A Worker
workspace removal is conditional on replacing its active CI, typecheck,
generator, and test responsibilities with equivalent supported checks; if that
cannot be done within the clarified scope without losing required evidence,
retain the necessary tooling and record the remaining legacy status.

## Complexity Tracking

No constitution violations. No new dependency, service, persistent store, or
application subsystem is introduced.
