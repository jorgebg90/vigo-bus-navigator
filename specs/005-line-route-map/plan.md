# Implementation Plan: Show Selected Line Route on the Map

**Branch**: `005-line-route-map` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-line-route-map/spec.md`

## Summary

When a user selects a bus line from line browsing, show the selected line's
available route geometry on the persistent map, distinguish available
directions, and adjust the map view to include the routes. Extend the existing
map port with a line-route overlay contract while keeping route acquisition in
the municipal schedule repository and keeping stop selection independent. Use
one representative published trip per direction, avoid duplicate geometry,
replace stale route overlays on line changes, and leave the existing stop
features and interactions intact.

## Technical Context

**Language/Version**: TypeScript, repository toolchain currently uses TypeScript 5.x

**Primary Dependencies**: Existing MapLibre GL JS map adapter and municipal JSP schedule/geometry adapters; no new dependencies

**Storage**: None; route display is transient UI state and is not persisted

**Testing**: Vitest unit and DOM tests; Playwright end-to-end tests with deterministic municipal fixtures; TypeScript typecheck and production build

**Target Platform**: Browser PWA on mobile and desktop, served from static HTTPS hosting

**Project Type**: Frontend-only web application

**Performance Goals**: Once route data is available, the route overlay and camera fit become visible within 3 seconds; selection of a newer line always wins over late results for an older line

**Constraints**: Direct browser requests remain governed by the fixed municipal source contract; no Worker/backend; preserve stop marker visibility and interaction, WCAG 2.2 AA semantics, reduced-motion behavior, and the existing zero-cost map stack

**Scale/Scope**: One selected line at a time; up to one representative path per available direction; no persistent route state, route editing, or arbitrary route browsing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Assessment |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Reuse the already-approved browser schedule and GeoJSON actions; no backend or new source action. |
| II. Modular Hexagonal Architecture | PASS | Fetch/normalize route data through existing repository/adapters; add the route display capability to the map port and implement it in the map adapter. |
| III. Test-First with Unit Coverage | PASS | Add deterministic unit, DOM, adapter and end-to-end coverage; no live source dependency in automated tests. |
| IV. Local Testability & Environment Profiles | PASS | Use existing fixture/local-live/production profiles; fixture route geometry supports repeatable coverage. |
| V. Contract-First APIs with OpenAPI | PASS | No new HTTP interface or source action. The existing GeoJSON source contract remains authoritative; document the normalized map-port contract separately. |
| VI. Zero-Cost Client-Only & Privacy | PASS | Route state is transient; requests contain only public line/trip/shape identifiers and no user profile information. |
| VII. Clean Code, Simplicity & English Documentation | PASS | Extend existing map and route abstractions without adding a mapping dependency or a second map. All development artifacts remain English. |

No constitutional violations or unresolved design choices block Phase 0.

## Research Summary

See [research.md](./research.md). Existing code supports rendering a GeoJSON
LineString in the line details panel, but the persistent map only accepts stop
features. The online repository currently selects a representative trip per
direction for stop summaries but fetches geometry for only the first
representative trip. The chosen design keeps repository-owned source access,
extends the map port with transient route display, and uses a separate map
source/layer that cannot capture stop clicks.

## Design and Contracts

- [data-model.md](./data-model.md) defines selected-line route overlay state and
  directional route geometry.
- [contracts/line-route-map.md](./contracts/line-route-map.md) defines the
  application/map-port behavior and stop interaction boundaries.
- [quickstart.md](./quickstart.md) defines repeatable validation scenarios.
- No OpenAPI schema change is planned because no new external interface or
  municipal action is introduced.

## Constitution Check — Post-Design

| Principle | Result | Design evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Uses the existing fixed municipal source actions and browser-only request path. |
| II. Modular Hexagonal Architecture | PASS | Map behavior remains behind `StopMapPort`; the repository remains responsible for municipal route data. |
| III. Test-First with Unit Coverage | PASS | Route selection, geometry replacement, bounds, stop hit-testing and stale responses have deterministic test scenarios. |
| IV. Local Testability & Environment Profiles | PASS | Fixture data covers both directions, unavailable paths, and line changes without network access. |
| V. Contract-First APIs with OpenAPI | PASS | Existing source schemas suffice; the new contract is an internal UI port contract, not a fictional HTTP API. |
| VI. Zero-Cost Client-Only & Privacy | PASS | No new service, storage, request data, or paid dependency. |
| VII. Clean Code, Simplicity & English Documentation | PASS | One transient map overlay and a small port extension are sufficient; no extra map or route state store. |

**Gate result**: PASS. Ready for task generation. The implementation must not
expand municipal action readiness or claim additional source verification.

## Project Structure

### Documentation (this feature)

```text
specs/005-line-route-map/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── line-route-map.md
└── tasks.md                # Created by /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── application/
│   └── ports.ts                         # Extend StopMapPort route overlay contract
├── domain/
│   └── types.ts                         # Reuse RouteShapeReceipt/RouteGeometry
├── infrastructure/
│   ├── map/
│   │   └── map-port.ts                  # GeoJSON route source/layer and camera fitting
│   └── schedule/
│       └── municipal-schedule-repository.ts # Geometry for each representative direction
├── main.ts                              # Line selection, stale-result guard, route clearing
└── ui/
    └── line/frequency-view.ts           # Direction labels/text equivalent and route status

frontend/tests/
├── unit/
│   ├── municipal/                       # Existing schedule/geometry adapter coverage
│   └── map-view.test.ts                 # Map route port behavior where testable
├── dom/
│   └── us1-line-frequency.test.ts       # Direction labels/status/accessibility
└── e2e/
    └── municipal-line-service.spec.ts   # Extend or add line-route map journeys
```

**Structure Decision**: Keep the existing single frontend application and
hexagonal boundaries. Municipal geometry stays in `MunicipalScheduleRepository`;
the `StopMapPort` contract carries normalized route overlays to
`BrowserMapPort`; `main.ts` coordinates selection and cancellation/versioning.
Automated tests continue using the fixture profile.

## Complexity Tracking

No constitution violations. No additional project, dependency, persistent
store, or backend is introduced.
