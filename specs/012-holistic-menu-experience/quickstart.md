# Quickstart: Holistic Menu Experience

## Prerequisites

- Node.js and npm versions supported by the repository.
- Repository dependencies installed with `npm ci`.
- No credentials, live service access, or deployment are needed for automated checks; tests use fixture data.

## Automated Validation

Run focused shell, search, planner, and localization tests:

```sh
npm test -- frontend/tests/dom/shell.test.ts frontend/tests/dom/unified-search.test.ts frontend/tests/dom/handoff.test.ts frontend/tests/dom/lines-list.test.ts frontend/tests/dom/journey-search-view.test.ts frontend/tests/unit/i18n.test.ts frontend/tests/i18n/key-parity.test.ts
```

Run type safety, then responsive and cross-destination browser coverage:

```sh
npm run typecheck
npm run test:e2e -- frontend/tests/e2e/responsive.spec.ts frontend/tests/e2e/search-lines.spec.ts frontend/tests/e2e/journey-search.spec.ts frontend/tests/e2e/a11y-states.spec.ts frontend/tests/e2e/reduced-motion.spec.ts
```

Add focused DOM and end-to-end cases for global search, stop/line/address handoffs, context return, and search/status states alongside the existing suites. The e2e harness builds with fixture transit data and runs Chromium desktop, Android Chrome, and iOS Safari projects.

The current language menu exposes Spanish and Galician. Browser locale-switch
checks use those choices; the retained English catalog and English shell labels
are checked by the DOM and translation-parity suites rather than attempting to
select a nonexistent English menu item.

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

## Implementation Regression Checks

The browser suite also verifies measured bottom-navigation space (including
wrapped labels and enlarged text), keyboard focus after composed destination
rendering, search endpoint handoffs without implicit planning, and address
error/retry/offline/empty states. Line-view tests explicitly select their starting
day type instead of assuming the system clock falls on a weekday.

ADB device screenshots remain separate from Playwright Android emulation.
If ADB or an attached device/emulator is unavailable, do not mark the device
validation task complete or describe browser screenshots as ADB captures.

### Lines and Saved presentation refinement

On phones, Saved opens as a bottom sheet above the measured navigation bar;
the map remains above it and the sheet scrolls internally. Its entry animation
respects reduced motion. Desktop retains the side-panel layout. Lines uses a
full-width rounded search field with a decorative search icon, spaced rounded
line cards and the same accent selected-tab treatment as Saved. Filtering,
line selection and favorite/recent behavior are unchanged.
The unified Search destination reuses the same rounded field and icon styles
as Lines, including its focus treatment, without changing search behavior.

Validation: focused list/favorites/shell DOM tests and typecheck pass.
The affected browser suite passes 28 cases across Chromium desktop, Android
Chrome and iOS Safari, with two existing desktop-only camera skips. New checks
cover mobile bottom-sheet alignment, actual dynamic viewport height, rounded
controls, filtering and axe accessibility. Mobile and desktop screenshots were
inspected in the shared browser; ADB validation remains pending as agreed.

### Final closure validation (2026-11-14)

After the unified Search field was aligned with Lines, the full Vitest suite
passes 467 tests across 93 files. Typecheck, production build, production-artifact
guard, payload budgets and whitespace checks pass. Final gzip totals are
388.2 KiB JavaScript, 15.9 KiB CSS and 401.3 KiB first-map-ready.

```sh
npm run typecheck
npm test -- --maxWorkers=2
npm run build
npm run validate:production-artifact
npm run size
git diff --check
npm run test:e2e -- frontend/tests/e2e/responsive.spec.ts frontend/tests/e2e/favorites.spec.ts frontend/tests/e2e/search-lines.spec.ts frontend/tests/e2e/reduced-motion.spec.ts --workers=2
```

The final affected browser run passes 28 cases with two existing camera skips
on non-desktop projects, including Search field roundness, height, decorative
icon and overflow checks. The earlier full browser run passed 164 cases with
seven existing skips; it predates the final visual refinements.

The product owner accepted closure of the current delivery with remaining work
kept as follow-up in [tasks.md](tasks.md). Unchecked tasks, ADB validation, complete
state/accessibility review and participant usability measurement are not claimed
as completed. Commit/push publishes the branch; it does not itself verify a
production deployment.
