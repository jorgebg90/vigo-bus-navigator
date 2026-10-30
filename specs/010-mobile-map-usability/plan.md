# Implementation Plan: Improve Mobile Map Usability

**Branch**: `010-mobile-map-usability` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-mobile-map-usability/spec.md`

## Summary

Improve the map and line-browsing experience by suppressing unusable-location
notices on mobile, providing immediate route-loading feedback, and restoring
the complete map when line details close. Follow-on refinements add navigation
from catalog-backed stop and route line icons, full-width line details in
portrait mobile layouts, compact route headings, and only Castellano/Galego as
user-selectable languages. Reuse the browser-only application, presentation
components, responsive layout, request-version guard, localization, existing
preferences adapter, and reduced-motion behavior. No new transit interface,
storage mechanism, dependency, or domain model is required.

## Technical Context

**Language/Version**: TypeScript, repository toolchain currently uses TypeScript 5.x

**Primary Dependencies**: Existing MapLibre GL JS map adapter and browser APIs; Vite 7 and existing UI modules; no new runtime dependencies

**Storage**: Existing preferences only; selected-line and loading states remain transient, while legacy English preferences are normalized to Castellano

**Testing**: Vitest unit/DOM tests; Playwright end-to-end tests with deterministic fixture and geolocation profiles; TypeScript typecheck and production build

**Target Platform**: Browser PWA on mobile and desktop, served from static HTTPS hosting

**Project Type**: Frontend-only web application

**Performance Goals**: Show selection feedback within 0.5 seconds; resolve the loading presentation to route details or a clear unavailable outcome; close details and restore the map without reload or an additional gesture

**Constraints**: Preserve hexagonal boundaries, existing municipal contracts and request-version behavior, Spanish/Galician localization, localized accessible status announcements, WCAG 2.2 AA interactions, reduced-motion support, deterministic local testing, and intended desktop behavior

**Scale/Scope**: One active line view and one location outcome at a time; no route persistence, new transit actions, tracking, broader redesign, or changes to desktop location messaging

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Assessment |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | All changes are browser-side presentation and use existing municipal data; no backend, proxy, or new source action. |
| II. Modular Hexagonal Architecture | PASS | UI owns rendering and responsive behavior; application coordination continues through existing use cases and ports; no direct map-engine access is introduced in UI. |
| III. Test-First with Unit Coverage | PASS | Add focused component/DOM and deterministic browser tests for location outcomes, loading states, route-icon navigation, responsive line details, language choices, close behavior, and races before or alongside implementation. |
| IV. Local Testability & Environment Profiles | PASS | Tests use fixture data and geolocation overrides; no deployment, live municipal calls, or permission prompt is needed for automated validation. |
| V. Contract-First APIs with OpenAPI | PASS | No HTTP interface or source action changes; document the user-visible and internal UI behavior in a feature contract instead of inventing an API. |
| VI. Zero-Cost Client-Only & Privacy | PASS | No external service, cost, activity logging, or transmission of location/profile data is added; the only persisted adjustment normalizes an existing language preference. |
| VII. Clean Code, Simplicity & English Documentation | PASS | Reuse current view, shell, translations, stylesheet, and test harness; all development artifacts are in English. |

No constitutional violations or unresolved decisions block Phase 0.

## Research Summary

See [research.md](./research.md). The existing UI already has a localized
location-status renderer, an asynchronous line-selection flow with a
request-version guard, a responsive map/destination layout, and reduced-motion
support. The line view currently waits for its initial data before replacing
the line list with details, which accounts for the perceived pause. The design
will render an immediate pending state and then transition to line details or
an explicit outcome. On mobile, only statuses that mean location cannot be
used (unavailable and outside coverage) are suppressed; the no-nearby-stops
message remains because it follows a usable location. Catalog-backed line
badges in arrival rows and route-stop lists use the existing selected-line
flow. Portrait layouts use the bottom-panel treatment through 1023 px, route
headings retain a compact style at desktop widths, and the settings menu offers
Castellano and Galego while normalizing legacy English preferences.

## Design and Contracts

- [data-model.md](./data-model.md) defines the transient line-selection,
  route-loading, map-presentation, and location-message states.
- [contracts/mobile-map-usability.md](./contracts/mobile-map-usability.md)
  defines close, loading, location-message, navigation, language,
  accessibility, and responsive behavior.
- [quickstart.md](./quickstart.md) defines deterministic validation scenarios.
- No OpenAPI schema change is planned because no HTTP endpoint or municipal
  action is introduced.

## Constitution Check — Post-Design

| Principle | Result | Design evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | UI state is rendered in the browser; existing municipal requests remain unchanged. |
| II. Modular Hexagonal Architecture | PASS | `main.ts` coordinates view state, UI modules render it, and all map operations remain behind the existing map port. |
| III. Test-First with Unit Coverage | PASS | DOM tests verify each state and close action; Playwright tests verify mobile layout, denied/out-of-coverage behavior, successful location feedback, route completion, and reduced motion. |
| IV. Local Testability & Environment Profiles | PASS | Fixture data and Playwright permission overrides provide repeatable local tests with no production service dependency. |
| V. Contract-First APIs with OpenAPI | PASS | No external contract changes; the internal UI interaction contract is explicit and testable. |
| VI. Zero-Cost Client-Only & Privacy | PASS | No persistent location or user data, new network behavior, analytics, dependency, or hosted service is introduced. |
| VII. Clean Code, Simplicity & English Documentation | PASS | Changes reuse the existing line view, location status, responsive shell, localization, and motion policy. |

**Gate result**: PASS. Ready for task generation. Implementation must preserve
the existing rule that only a usable location with no nearby stops may retain
its current informative status on mobile.

## Project Structure

### Documentation (this feature)

```text
specs/010-mobile-map-usability/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-map-usability.md
└── tasks.md                         # Created by /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── main.ts                          # Immediate line-selection feedback and view lifecycle
├── i18n/
│   ├── en.ts                         # Localized loading and close labels
│   ├── es.ts
│   └── gl.ts
└── ui/
    ├── line/frequency-view.ts        # Selected-line detail, route outcomes, and close control
    ├── line/line-loading-view.ts     # Immediate line-selection feedback
    ├── map/location-status.ts        # Location-message presentation policy
    └── styles.css                    # Responsive loading and reduced-motion presentation

frontend/tests/
├── dom/
│   ├── line-loading-view.test.ts     # Pending line-selection semantics
│   ├── location-status.test.ts       # Location message policy
│   ├── us1-line-frequency.test.ts    # Line detail loading/close semantics
│   └── shell.test.ts                 # Map restoration where shell behavior changes
└── e2e/
    ├── mobile-location.spec.ts       # No failure notices on mobile; usable-location status retained
    ├── municipal-line-service.spec.ts # Delayed line/route result and mobile close flow
    └── reduced-motion.spec.ts        # No essential information depends on animation
```

**Structure Decision**: Keep the existing single frontend application and
hexagonal boundaries. `main.ts` owns asynchronous line selection and its
existing stale-result guard; line UI owns its loading/detail/close presentation;
the location-status UI decides which message is appropriate for the current
viewport. The persistent map stays mounted in the shell, so returning to the
map is a destination/layout change rather than a map reconstruction.

## Complexity Tracking

No constitution violations. No additional project, runtime dependency,
external interface, persistent state, or backend is introduced.
