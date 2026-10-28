# Implementation Plan: Mobile Location and Map Controls

**Branch**: `006-mobile-location` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-mobile-location/spec.md`

## Summary

Remove the map's stops-in-view toolbar action while preserving zoom and recenter.
On the mobile map, request one current position through a browser permission
prompt, use it only in memory to center the map and draw a location marker, and
leave the Vigo overview as the fallback for denied, failed, invalid, or
out-of-coverage positions. Reuse the existing stop coverage bounds and map
adapter; do not persist or transmit the location.

## Technical Context

**Language/Version**: TypeScript, repository toolchain currently uses TypeScript 5.x

**Primary Dependencies**: Existing MapLibre GL JS map adapter and browser Geolocation API; no new dependencies

**Storage**: None; current location and permission-attempt state are transient in-memory state

**Testing**: Vitest unit and DOM tests; Playwright end-to-end tests with deterministic geolocation overrides; TypeScript typecheck and production build

**Target Platform**: Secure-context browser PWA on mobile and desktop, served from static HTTPS hosting

**Project Type**: Frontend-only web application

**Performance Goals**: Center and show the location indicator within 3 seconds after a valid position is received; request geolocation at most once per app visit

**Constraints**: Request location only for the existing mobile viewport experience; require explicit browser permission; use one-shot acquisition only; retain map usability on errors; do not store or transmit location; preserve reduced-motion and WCAG 2.2 AA behavior

**Scale/Scope**: One transient user location and one location marker; no continuous tracking, route planning, user-location history, or proximity-based data requests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Assessment |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Uses the browser's one-shot location capability and existing public transit data; no backend or new transit action. |
| II. Modular Hexagonal Architecture | PASS | Keep permission acquisition behind an application port and browser adapter; map rendering remains behind `StopMapPort`. |
| III. Test-First with Unit Coverage | PASS | Add deterministic permission, validation, map-marker, toolbar, and browser-journey tests before implementation. |
| IV. Local Testability & Environment Profiles | PASS | Inject geolocation outcomes in tests; no live permission, network, or external service is required. |
| V. Contract-First APIs with OpenAPI | PASS | No HTTP interface is added. Internal geolocation and map-port contracts are documented separately. |
| VI. Zero-Cost Client-Only & Privacy by Design | PASS | Location remains in memory, is not persisted or sent to transit providers, and adds no service or dependency. |
| VII. Clean Code, Simplicity & English Documentation | PASS | Reuse the existing map adapter and responsive breakpoint; no new map, tracking loop, or state store. |

No constitutional violations or unresolved decisions block Phase 0.

## Research Summary

See [research.md](./research.md). The design requests one position only when
the map is first mounted in the app's existing mobile viewport (`max-width:
599px`). A responsive viewport change after map mount does not trigger a late
permission prompt. The source stop map's existing geographic eligibility bounds
define the supported Vigo area; any valid point inside those bounds is used
regardless of nearest-stop distance. A point outside them returns to the
existing Vigo map. A location request is not retried during the same app visit.

## Design and Contracts

- [data-model.md](./data-model.md) defines current location, request state and
  geographic coverage validation.
- [contracts/mobile-location-map.md](./contracts/mobile-location-map.md)
  documents the internal geolocation, toolbar and map-port behavior.
- [quickstart.md](./quickstart.md) defines deterministic validation scenarios.
- No OpenAPI schema change is planned because no HTTP endpoint or municipal
  action is introduced.

## Constitution Check — Post-Design

| Principle | Result | Design evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Location access and map behavior execute entirely in the browser; transit requests stay unchanged. |
| II. Modular Hexagonal Architecture | PASS | A narrow location port isolates browser APIs; `BrowserMapPort` owns location marker rendering. |
| III. Test-First with Unit Coverage | PASS | Unit, DOM, and deterministic Playwright cases cover success, denial, errors, bounds, no prompt on desktop, and control removal. |
| IV. Local Testability & Environment Profiles | PASS | Tests inject permission and position results; fixture profile makes no geolocation calls by default. |
| V. Contract-First APIs with OpenAPI | PASS | There is no new HTTP contract; internal browser and map contracts are documented. |
| VI. Zero-Cost Client-Only & Privacy by Design | PASS | No location persistence, transit request parameter, analytics, or external dependency is added. |
| VII. Clean Code, Simplicity & English Documentation | PASS | One-shot acquisition and one transient marker reuse existing layers and interfaces. |

**Gate result**: PASS. Ready for task generation.

## Project Structure

### Documentation (this feature)

```text
specs/006-mobile-location/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-location-map.md
└── tasks.md                         # Created by /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── application/
│   └── ports.ts                     # Geolocation port and map location operations
├── domain/
│   └── map-stops.ts                 # Reuse current service-area coordinate bounds
├── infrastructure/
│   ├── map/
│   │   └── map-port.ts              # Location marker and camera behavior
│   └── system/
│       └── browser-geolocation.ts   # One-shot browser location adapter
├── i18n/                            # Localized location status messages
├── main.ts                          # Mobile-only request and transient lifecycle
└── ui/
    └── map/map-toolbar.ts           # Remove stops-in-view control

frontend/tests/
├── unit/                            # Geolocation validation and map port tests
├── dom/                             # Toolbar and accessible status tests
└── e2e/                             # Mobile permission, desktop, privacy journeys
```

**Structure Decision**: Keep the existing single frontend application and
hexagonal boundaries. The application requests a location through a typed
browser-geolocation port; the map port accepts a validated transient position
and renders it. `main.ts` owns the one-request-per-visit policy. Stop controls
and stop chooser behavior remain independent; cluster overlap selection uses
the retained recenter control as its focus-return opener.

## Complexity Tracking

No constitution violations. No new dependency, service, persistent store, or
backend is introduced.
