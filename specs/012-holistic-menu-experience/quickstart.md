# Quickstart: Holistic Menu Experience

## Prerequisites

- Node.js and npm versions supported by the repository.
- Repository dependencies installed with `npm ci`.
- No credentials, live service access, or deployment are needed for automated checks; tests use fixture data.

## Automated Validation

Run focused shell, search, planner, and localization tests:

```sh
npm test -- frontend/tests/dom/shell.test.ts frontend/tests/dom/stop-search.test.ts frontend/tests/dom/lines-list.test.ts frontend/tests/dom/journey-search-view.test.ts frontend/tests/unit/i18n.test.ts frontend/tests/i18n/key-parity.test.ts
```

Run type safety, then responsive and cross-destination browser coverage:

```sh
npm run typecheck
npm run test:e2e -- frontend/tests/e2e/responsive.spec.ts frontend/tests/e2e/search-lines.spec.ts frontend/tests/e2e/journey-search.spec.ts frontend/tests/e2e/a11y-states.spec.ts frontend/tests/e2e/reduced-motion.spec.ts
```

Add focused DOM and end-to-end cases for global search, stop/line/address handoffs, context return, and search/status states alongside the existing suites. The e2e harness builds with fixture transit data and runs Chromium desktop, Android Chrome, and iOS Safari projects.

Finish with production artifact and payload validation:

```sh
npm run build
npm run size
```

## Manual Acceptance Walkthrough

1. At 320x700, 390x844, 768x1024, 1024x768, and 1280x900, verify labels and current state for all five destinations; confirm there is no horizontal overflow and map controls remain reachable.
2. From the map, lines, saved items, and journey planner, open the same search surface. Search for a stop and a line; verify result identity, favorite state, and existing details/map view.
3. Use a stop with coordinates as journey origin and destination. Use an address result as a journey endpoint; verify the disclosure is visible, the endpoint is filled, and no route request starts until explicit submission.
4. Open a line result, inspect a route stop, and continue to journey planning through that stop. Return to the originating task and confirm relevant in-memory context remains available.
5. Exercise blank query, no matches, loading, unavailable source, offline, and stale-request conditions; verify clear feedback and valid retry behavior.
6. Complete navigation, search, panel open/close, and handoff tasks using keyboard only. Check focus return, Escape behavior, visible focus, touch targets, contrast, screen-reader names, all three locales, and reduced motion.
7. Run the existing axe-backed e2e checks and inspect browser screenshots at phone and desktop breakpoints before accepting visual changes.

## Expected Results

- Existing tests remain green; new tests cover primary flows and regressions.
- Search and handoffs use only fixture catalogs and existing ports/contracts.
- No query or address is persisted or placed in a URL, and no new source is introduced.
- The build passes existing JavaScript, CSS, and first-map payload budgets.

See [menu-and-search.md](contracts/menu-and-search.md) for the UI behavior contract and [data-model.md](data-model.md) for transient state rules.
