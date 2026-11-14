# Research: Holistic Menu Experience

**Date**: 2026-11-14

## Decisions

### Extend the journey planner's visual language

- **Decision**: Reuse the current design tokens, typography, spacing, controls, selected states, result rows, privacy/status treatments, and responsive sheet patterns. Make patterns consistent across existing sections without redesigning the planner's core route-entry and results flow.
- **Rationale**: The app already has shared CSS variables and the route planner has a clear hierarchy for origin/destination, search results, selection, and status. Reusing these patterns is lower-risk and preserves the strongest existing screen.
- **Alternatives considered**: Add a component framework or a separate design-system package. Both increase dependencies and payload and are unnecessary for this static frontend.
- **Evidence**: `frontend/src/ui/styles.css`; `frontend/src/ui/search/journey-search-view.ts`; `frontend/src/ui/search/journey-results-view.ts`; `frontend/src/ui/panel/sheet.ts`.

### Keep the five existing destinations one action away

- **Decision**: Retain the shell destinations `map`, `search`, `journeys`, `lines`, and `saved`. Use a labeled bottom bar on phone-sized viewports and a labeled persistent rail on tablet/desktop. Keep the active destination visible and leave the language/settings utility separate.
- **Rationale**: The current shell has five destinations but icon-only vertical buttons at every viewport. Visible labels improve discoverability; the bottom bar suits phone reach, while a rail uses larger screens. Settings/language is a header utility, not a primary destination; privacy remains available from its current entry point.
- **Alternatives considered**: Preserve icon-only navigation or add a drawer for all viewports. Icon-only controls remain difficult to discover, while a drawer hides primary sections behind an extra step.
- **Evidence**: `frontend/src/ui/shell.ts`; `frontend/src/ui/settings/settings-menu.ts`; `frontend/src/ui/styles.css`; `frontend/tests/e2e/responsive.spec.ts`; `frontend/tests/dom/shell.test.ts`.

### Unify search presentation, not data ownership

- **Decision**: Provide one search entry point from every destination. Search already-loaded stop and line catalogs locally and offer address suggestions only through the existing `AddressGeocodingPort` and fixed documented source. Keep result types distinguishable and show the address-search privacy disclosure in that experience.
- **Rationale**: Stop search, line search, and journey address autocomplete already exist separately. Composing those capabilities gives riders a single place to start without introducing an endpoint or transit provider.
- **Alternatives considered**: Add a search API or combine unrelated provider data behind a new service. Both violate current source boundaries and are unnecessary.
- **Evidence**: `frontend/src/ui/search/stop-search.ts`; `frontend/src/ui/line/lines-list.ts`; `frontend/src/ui/search/journey-search-view.ts`; `frontend/src/application/ports.ts`; `specs/011-bus-itinerary-search/contracts/address-geocoding.openapi.yaml`.

### Carry task intent in transient state

- **Decision**: Keep selected search results, return destination, and journey endpoint handoff in memory. A stop with valid coordinates can become an origin or destination. Selecting an address fills a journey endpoint and opens the planner; a line opens its details and the rider continues through a selected route stop. Do not write searches, addresses, or activity to localStorage, URLs, logs, or new caches.
- **Rationale**: The composition root already owns journey endpoints and navigation state. Favorites and preferences use an explicit storage port, while search and address inputs have stricter privacy requirements.
- **Alternatives considered**: Encode queries or journey addresses in URLs or persist recent searches. These retain activity and are not needed to complete the flow.
- **Evidence**: `frontend/src/main.ts`; `frontend/src/ui/shell.ts`; `frontend/src/application/update-user-preferences.ts`; `.specify/memory/constitution.md` Principles I, V, and VI.

### Preserve accessibility, localization, and UI states

- **Decision**: Reuse semantic landmarks, focus handling, keyboard operation, reduced-motion behavior, translated message catalogs, and status patterns. Apply the 44 CSS pixel target minimum consistently, including any compact planner controls adopted by the new menus.
- **Rationale**: Existing tests already check WCAG 2.2 AA, responsive layouts, keyboard flows, reduced motion, and translation-key parity. Some planner controls are currently 40px, so they are not a target-size precedent.
- **Alternatives considered**: Add a UI-state library or use screenshots as the only verification. Neither is needed; explicit outcomes and direct DOM tests already exist.
- **Evidence**: `frontend/src/ui/offline-status.ts`; `frontend/src/ui/panel/sheet.ts`; `frontend/tests/e2e/a11y-states.spec.ts`; `frontend/tests/e2e/reduced-motion.spec.ts`; `frontend/tests/i18n/key-parity.test.ts`.

### Reuse existing validation and performance budgets

- **Decision**: Use Vitest for unit/DOM checks, Playwright for responsive and end-to-end flows, axe-core for WCAG checks, and existing typecheck/build/payload-budget commands. Do not add a package.
- **Rationale**: The repository has deterministic fixtures, viewport suites, accessibility checks, and a size guard.
- **Alternatives considered**: Add a visual-testing or component-testing dependency. Defer unless implementation demonstrates a concrete gap.
- **Evidence**: `package.json`; `vitest.config.ts`; `playwright.config.ts`; `frontend/tests/e2e/`; `scripts/check-payload-budget.ts`.

## Resolved Technical Context

- The five primary shell destinations are map, search, journey planning, lines, and saved items. Settings/language is a utility; privacy is not a primary destination.
- Stop and line catalogs are composed in `frontend/src/main.ts`; current stop and line search renderers are separate.
- Journey address autocomplete already has an application port, fixed outbound adapter, cancellation support, and OpenAPI contract.
- Journey endpoints are held in memory at the composition root. Favorites and preferences use the existing storage port.
- Current responsive breakpoints are 600px and 1024px/portrait; detail panels already use responsive sheets.
- Message catalogs exist for `es`, `gl`, and `en`. The shell should refresh its translated labels, heading, and document title when the language changes.
- Existing gzip budgets are 850 KiB aggregate JavaScript, 150 KiB CSS, and 500 KiB for the first-map-ready graph. Keep navigation/search changes from eagerly loading map-only code.
- No unresolved technical unknowns or need for another data provider were found.

## Planning Risks

- Address suggestions are not part of the local stop/line catalog. Their UI must clearly distinguish them from local results, retain the approved privacy disclosure, and use only the existing fixed geocoder contract.
- Cross-navigation from a line needs an explicitly selected route stop before it can set a journey endpoint.
- Preserve the existing history and focus-return behavior while adding contextual handoffs.
