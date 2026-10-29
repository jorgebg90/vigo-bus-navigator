# Implementation Plan: Improve Frontend Design

**Branch**: `003-improve-frontend-design` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-improve-frontend-design/spec.md`

## Summary

Make the existing transit PWA map-first while preserving accessible map-free search, line browsing, favorites, and recent views. Use MapLibre-native stop clustering and one application-owned stop-selection/arrivals flow across every entry point. Keep the Cloudflare Worker as the only server-side boundary and add no endpoint. To satisfy the spec's requirement that stops with missing or invalid coordinates remain searchable, propose API v4 with an atomic nullable latitude/longitude pair on every public stop object (`/stops` and stops embedded in `/lines/{lineCode}`); other behavior remains unchanged. G3 approval from Software Architect and Backend Developer is required before implementation.

## Technical Context

**Language/Version**: TypeScript 5.8, browser JavaScript, Node.js/npm for tooling (see root package manifest)

**Primary Dependencies**: Vite 7, MapLibre GL JS 5, deck.gl 9, Cloudflare Workers/Wrangler 4, vite-plugin-pwa; no new runtime dependency planned

**Storage**: Existing browser `localStorage` for stop favorites, recent views, and language; appearance is fixed to light and old non-light values are migrated; existing Worker-bundled catalog/schedule data and bounded normalized-arrivals cache; no database or server-side profile storage

**Testing**: Vitest unit/DOM/Worker contract tests, Playwright E2E with local fixture Worker, axe checks, TypeScript checks, Spectral OpenAPI lint, production Vite build, and `npm run size`; manual UX/assistive-technology evidence remains required

**Target Platform**: Responsive browser PWA on static GitHub Pages; Cloudflare Worker remains the sole sanctioned edge adapter; local fixture profile requires no credentials or deployment

**Project Type**: Existing TypeScript web application plus Cloudflare Worker API

**Performance Goals**: Meet spec SC-003 (loading state within 1s and arrivals or terminal status within 10s for at least 95% of 20 selections on the specified mobile profile); keep the first-map-ready dependency graph at or below 500 KiB gzip using the extended `npm run size` manifest check, and preserve existing per-chunk and aggregate limits; refresh arrivals every 30 seconds only while visible and foregrounded

**Constraints**: WCAG 2.2 AA; 44×44 CSS-pixel interactive targets; 4.5:1 normal-text, 3:1 large-text/non-text/focus contrast; keyboard and screen-reader operation; reduced motion; 320 CSS-pixel reflow and 200% text; local-only rider data; no ads, analytics, accounts, or geolocation; Carto tiles disclose visible tile coordinates and ordinary network metadata; no invented stop positions or route geometry; keep profile state out of requests

**Scale/Scope**: One map-first app shell with Map, Search, Lines, and Saved destinations; shared stop selection; map clusters/chooser; arrivals status; line frequencies; stop-only favorites and line/stop recents; 3 locales and a fixed light appearance; current catalog size and Worker API, with no new backend service or rider-facing privacy page/link

## Constitution Check

*GATE: Checked before Phase 0 research and re-checked after Phase 1 design.*

### Before Phase 0

| Principle / gate | Check | Result |
| --- | --- | --- |
| I. Browser-first | PWA remains on GitHub Pages; Cloudflare Worker is the only server-side component and only the existing fixed Vitrasa adapter is used. | PASS |
| II. Hexagonal architecture | Map, storage, catalog, and arrivals remain infrastructure adapters behind application/domain boundaries; selection and freshness rules belong in application/domain. | PASS |
| III. Test-first | New selection, coordinate validation, freshness, and favorite behavior will have unit/DOM/contract tests before or alongside implementation. | PASS |
| IV. Local testability | Vite and Wrangler local fixture workflows require no credentials or deployment. | PASS |
| V. Contract-first | v3 currently requires numeric coordinates; the spec's searchable-unlocated-stop requirement conflicts with that contract. A versioned v4 proposal was required and approved at G3. | PASS |
| VI. Privacy and zero cost | Keep all rider profile data in localStorage; arrival requests use the selected public stop ID only; tile provider disclosure is explicit; no new paid service, tracking, or account. | PASS |
| VII. Simplicity and English artifacts | Reuse existing adapters and testing tools; no additional runtime dependency; feature artifacts remain in English. | PASS |
| Accessibility and payload | Keep WCAG 2.2 AA and existing size gates; add a manifest-backed 500 KiB gzip first-map-ready graph check as defined in research D9. | PASS |
| Harness gates | G2 is closed. G3 requires Software Architect, Backend Developer, UX Designer, and Frontend Developer. G6 requires an accurate Communicator planning draft. | G3 closed; G6 PENDING |

### After Phase 1 Design

| Principle / gate | Re-check | Result |
| --- | --- | --- |
| I / IV. Runtime boundary and local testability | No new server or credentials; local Worker fixture continues to serve the UI workflow. | PASS |
| II / III. Boundaries and testability | Shared selection is application-owned; map and API remain adapters; the data model has explicit coordinate and arrival-state invariants. | PASS |
| V. Contract-first | `contracts/realtime-api-v4.openapi.yaml` is the complete standalone v4 contract (v3 operations carried over; only the coordinate pair is nullable, including stops embedded in `/lines/{lineCode}`). Worker/frontend implementation is blocked until Architect and Backend record review of this artifact and the OpenAPI lint/regression scripts cover it; rejection requires reopening the spec/G2. Architect and Backend APPROVED at G3 ([gate-g3-plan-review.md](gate-g3-plan-review.md)). | PASS |
| VI. Privacy | Network boundaries remain enforced without exposing request-routing details in the UI; map-provider attribution remains visible. | PASS |
| Accessibility / performance | UI contract includes responsive layouts, 44px targets, focus return, status announcements, reduced motion, measured theme tokens, and actual-tile contrast review. Extend `check-payload-budget.ts` and Vite manifest generation to gate the first-map-ready JS+CSS graph at 500 KiB gzip; deck.gl is removed from the first-map path (research D9). | PASS (UX and Frontend APPROVED at G3) |
| Scope and complexity | No new service, dependency, data store, or endpoint. Breaking coordinate semantics are versioned rather than hidden. | PASS |
| Harness gates | All four G3 verdicts recorded in [gate-g3-plan-review.md](gate-g3-plan-review.md); Communicator G6 planning draft remains outstanding. | G3 PASS; G6 PENDING |

## Frontend Architecture Decisions (G3)

- **`selectStop(stopId)`**: application use case in `frontend/src/application/select-stop.ts`. It owns the active-stop state and a request token; it fetches arrivals through the existing arrivals port and publishes a view model to subscribers (`subscribe(listener)`). Stale results for a previous stop are dropped. Tests: stale-result drop, no focus movement during refresh, every entry point (map, chooser, search, favorites, recents) calls it. `main.ts` only wires adapters and renders the view model.
- **`MapPort`** (in `application/ports.ts`): `setStops(stops: MapStop[])`, `setSelectedStop(stopId | null)`, `onStopSelected(cb: (stopId) => void)`, `onChooserRequested(cb: (stopIds) => void)`, `fitToStops()`. `showStopDetails` and the per-stop button strip are removed; the map emits only `stopId`.
- **Map adapter rewrite**: `infrastructure/map/map-port.ts` is rewritten (native clustering, hit-target query, selection ring) rather than extended; deck.gl and the synthetic `PathLayer` are deleted.
- **Null coordinates**: `Stop.lat/lon` become `number | null` in `domain/types.ts`; one domain mapper `toMapStops` filters unlocated stops and converts to `[lon, lat]`; the hard-coded bounds in `ui/map/map-view.ts` are removed; the tile-fallback list never prints coordinates; unlocated stops show the "No map position" text (UI contract section 7) and are not counted as an anomaly.
- **Chooser, 44 px targets, keyboard access**: as specified in the UI contract section 6, verified by Playwright measurements of hit boxes and chooser rows.
- **Boundary enforcement**: an architecture unit test (`frontend/tests/unit/architecture.test.ts`) fails if `application/` or `domain/` import `infrastructure`, `ui`, `maplibre-gl`, or DOM-only modules.
- **Modules replaced by the map-first shell**: `frontend/src/main.ts` composition, the landing/line-catalog shell and sidebar in `frontend/src/ui/`, `frontend/src/ui/map/map-view.ts`, `frontend/src/infrastructure/map/map-port.ts`, and `frontend/src/ui/styles.css` (token rewrite, `.map-stop-marker` retired). `tasks.md` lists the exact files.
- **First tasks (tasks.md order)**: (1) baseline measurement of the first-map graph through the Vite manifest and extension of `check-payload-budget.ts`; (2) failing tests, then generator fix and catalog regeneration; (3) Worker tests for an unlocated stop in `/stops` and `/lines/{lineCode}`; (4) extend `lint:openapi` and `openapi-regression.test.ts` to v4 (mixed-pair rejection, unchanged v3 operations); (5) D10 characterization tests and provenance record; (6) 29/30/299/300 s freshness tests.

## Post-Implementation Product Decisions (2026-10-27)

These owner decisions supersede the corresponding G2/G3 product requirements for the current implementation; the gate review files remain unchanged as historical approval records.

- Appearance is fixed to Claro. No system/dark selector is exposed, and saved legacy values migrate to light.
- The header globe opens only Castellano (`es`), Galego (`gl`), and English (`en`). A cleared profile defaults to Castellano.
- Favorites target stops only. Lines may remain in Recent but are not favorite targets.
- The app has no privacy page, privacy links, or explanatory copy about internal request routing. Technical data-minimization constraints and required linked basemap credits remain.

## Project Structure

### Documentation (this feature)

```text
specs/003-improve-frontend-design/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── realtime-api-v4.openapi.yaml
│   └── ui-design-contract.md
├── gate-g2-spec-review.md
├── gate-g3-plan-review.md       # after G3 actor review
└── tasks.md                     # next Spec Kit phase
```

### Source Code (repository root)
```text
frontend/
├── src/
│   ├── application/        # shared stop selection, arrivals, favorites use cases
│   ├── domain/              # coordinate invariants and existing frequency rules
│   ├── infrastructure/      # API, storage, map, and service-worker adapters
│   ├── i18n/                # es/gl/en interface strings
│   └── ui/                  # app shell, map, search, lines, saved, stop details
└── tests/                   # existing frontend test modules

worker/
├── src/                     # API, catalog, normalization, and cache (catalog-data.json regenerated)
└── test/                    # API, catalog, arrivals, and provenance tests

tests/
├── dom/
├── e2e/
├── i18n/
└── unit/

scripts/
├── catalog/generate.ts      # retain unlocated stops; null/NaN handling; Vigo bounds
├── check-payload-budget.ts
├── check-payload-budget.test.ts
└── openapi-regression.test.ts

specs/003-improve-frontend-design/
├── contracts/
│   ├── realtime-api-v4.openapi.yaml
│   └── ui-design-contract.md
└── feature artifacts, gate records, and tasks
```

**Structure Decision**: Extend the existing `frontend/`, `worker/`, and shared root test layout; do not create a second application or service. Keep map-event handling in the map adapter, all cross-entry stop selection in the application layer, and API coordinate normalization in the Worker contract/catalog adapter. Keep v3 as historical and define the proposed v4 contract under feature 003 until approved.

## Complexity Tracking

No constitutional violations or additional projects are proposed. The versioned API change is a compatibility requirement, not an added service or abstraction.
