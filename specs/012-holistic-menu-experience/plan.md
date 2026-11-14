# Implementation Plan: Holistic Menu Experience

**Branch**: `012-holistic-menu-experience` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-holistic-menu-experience/spec.md`

## Summary

Make the five primary destinations (map, search, journeys, lines, saved) feel like one product by extending the journey planner's visual language, replacing the icon-only rail with a labeled bottom bar (phone) / persistent rail (tablet+desktop), and composing existing stop, line and address-suggestion capabilities into a single search surface reachable from every section. Cross-section handoffs (stop/address to journey endpoint, line to route stop to planner) carry context in memory only. Loading, empty, error and offline states are unified. No new dependency, data source, endpoint or persisted data (see [research.md](research.md)).

## Delivery Consolidation (2026-11-14)

- `shell.ts` measures phone navigation with `ResizeObserver` and a resize listener,
  writes the actual `--nav-h`, and cleans both up on destroy. Destination listeners
  render content before focus is moved to the final heading/search input.
- Search and Lines share `.search-field`, the existing decorative search icon,
  a 48px input, rounded border, token colors, and focus-within treatment.
  Lines keeps its existing filtering and adds a section heading and rounded cards.
- Saved on phones is a 45dvh bottom sheet above the measured navigation height;
  the map reserves that space. Its entry animation respects reduced motion.
  Larger layouts keep their existing side panel. Saved and line-detail tabs share
  rounded selection styling; saved rows use spaced rounded cards.
- DOM and browser regressions cover navigation sizing/focus, endpoint handoffs,
  query privacy, search recovery, es/gl enlarged text, search field geometry,
  Saved positioning, keyboard use, reduced motion, and axe checks.

The product owner accepted closure of the current delivery with the unchecked
tasks retained as follow-up. Full state/accessibility review and usability/device
evidence are not implied by successful automated tests. See [spec.md](spec.md)
for the accepted scope and [tasks.md](tasks.md) for outstanding work.

## Technical Context

**Language/Version**: TypeScript (strict), ES modules, Node.js per repository `package.json`

**Primary Dependencies**: Existing only: Vite, MapLibre GL JS, fast-xml-parser. No new packages.

**Storage**: Existing `localStorage` port for favorites/preferences only. Search sessions and navigation handoffs are in-memory; nothing new is persisted, cached, logged or placed in URLs.

**Testing**: Vitest + happy-dom (unit/DOM), Playwright (Chromium, Android Chrome, iOS Safari projects), axe-core, size-limit and `scripts/check-payload-budget.ts`

**Target Platform**: Static HTTPS PWA; phone, tablet and desktop browsers (320 CSS px minimum width)

**Project Type**: Browser-only web application (hexagonal: domain / application / infrastructure / ui)

**Performance Goals**: Keep gzip budgets: 850 KiB aggregate JS, 150 KiB CSS, 500 KiB first-map-ready graph; navigation/search must not eagerly load map-only code

**Constraints**: WCAG 2.2 AA, 44 CSS px targets, reduced motion, es/gl/en parity, offline-capable, address suggestions only via existing `AddressGeocodingPort` and fixed documented endpoint, no accounts or activity tracking

**Scale/Scope**: 5 destinations, 3 locales, reuse of existing catalogs; UI/CSS/i18n changes in `frontend/src/ui`, `frontend/src/main.ts`, `frontend/src/i18n`

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1.*

| Principle | Status | Notes |
|---|---|---|
| I. Browser-First | Pass | Client-only; no new host, action or Worker. |
| II. Hexagonal | Pass | Search composition and handoff logic stay in application/UI over existing ports; domain untouched. |
| III. Test-First | Pass | DOM and e2e cases written alongside each story; typecheck, tests and budgets are gates. |
| IV. Local Testability | Pass | Fixture catalogs; no credentials or live access needed. |
| V. Contract-First | Pass | No new HTTP interface; feature-011 geocoding contract reused. In-app UI contract in [contracts/menu-and-search.md](contracts/menu-and-search.md). |
| VI. Zero-Cost & Privacy | Pass | Queries/addresses never persisted, cached, logged or in URLs; disclosure kept visible in search. |
| VII. Simplicity & English | Pass | No framework or design-system package; artifacts in English. |

No violations; Complexity Tracking not required. Separate G3/G4 harness verdicts
remain follow-up under T034; product-owner delivery acceptance is not a substitute
for those verdicts.

## Project Structure

### Documentation (this feature)

```text
specs/012-holistic-menu-experience/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── menu-and-search.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── main.ts                      # composition root: handoff state, endpoint wiring
│   ├── application/                 # existing ports reused (AddressGeocodingPort)
│   ├── i18n/                        # es/gl/en messages for new/changed copy
│   └── ui/
│       ├── shell.ts                 # labeled bottom bar / rail, active state, heading, title
│       ├── styles.css               # shared tokens and patterns, 44px targets
│       ├── search/                  # unified search surface over stop-search + address suggestions
│       ├── line/ stop/ home/        # detail actions, consistent states
│       ├── panel/sheet.ts           # shared panel patterns
│       └── offline-status.ts        # shared status patterns
└── tests/
    ├── dom/                         # shell, search, lines, journey-search views
    ├── i18n/                        # key parity
    └── e2e/                         # responsive, search-lines, journey-search, a11y-states, reduced-motion
```

**Structure Decision**: Single existing `frontend/` application; changes are confined to the UI layer, composition root and message catalogs.

## Phase Outputs

- Phase 0: [research.md](research.md), no open clarifications.
- Phase 1: [data-model.md](data-model.md) (transient search session and navigation handoff), [contracts/menu-and-search.md](contracts/menu-and-search.md), [quickstart.md](quickstart.md).

## Complexity Tracking

No constitutional violations.
