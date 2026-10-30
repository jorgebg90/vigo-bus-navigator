# Tasks: Improve Mobile Map Usability

**Input**: Design documents from `/specs/010-mobile-map-usability/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/mobile-map-usability.md`, `quickstart.md`

**Tests**: Included before implementation to satisfy the project's test-first constitution and verify each user story independently.

**Organization**: Tasks are grouped by user story. US1 precedes US2 because both change the line-detail view and line-selection lifecycle; US3 remains independent.

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

The existing TypeScript, Vitest, and Playwright projects and scripts already
provide the required setup. No dependency or project configuration changes are
needed for this feature.

## Phase 2: Foundational

**Purpose**: Shared prerequisites that block the user stories

No new shared infrastructure is required. Each story can use the existing
shell, responsive map, localization, fixture profile, request-version guard,
and test harness.

---

## Phase 3: User Story 1 - Close line details and return to the full map (Priority: P1) 🎯 MVP

**Goal**: Give mobile line details a reliable close action that restores the complete map without a reload or extra gesture.

**Independent Test**: Open a line at a mobile viewport, expand and collapse its details, activate the close control in each state, and verify that the details close and the map fills the available viewport.

### Tests for User Story 1

> Write these tests first and confirm they fail before implementation.

- [X] T001 [P] [US1] Add DOM tests for the localized, keyboard-operable line-detail close control and its callback in `frontend/tests/dom/us1-line-frequency.test.ts`
- [X] T002 [P] [US1] Add mobile browser tests that close line details in expanded and collapsed states and assert that the map returns to full height in `frontend/tests/e2e/municipal-line-service.spec.ts`

### Implementation for User Story 1

- [X] T003 [US1] Add an accessible close control and `onClose` callback to the selected-line view in `frontend/src/ui/line/frequency-view.ts`, reusing the existing localized `close` label
- [X] T004 [US1] Wire the selected-line close callback to return to the map destination in `frontend/src/main.ts`, relying on the existing destination-change lifecycle to clear the route and invalidate pending results
- [X] T005 [US1] Style the selected-line close control for mobile touch size and visible keyboard focus in `frontend/src/ui/styles.css`

**Checkpoint**: A selected line can be closed from expanded or collapsed mobile details and the persistent map resumes its full viewport.

---

## Phase 4: User Story 2 - Understand that a selected line is loading (Priority: P1)

**Goal**: Show immediate, accessible feedback from line selection through route display or a clear unavailable outcome.

**Independent Test**: Delay fixture-backed line and route responses, select a line, and verify immediate pending feedback, a usable interface, and a terminal success or failure state; repeat with reduced motion enabled.

### Tests for User Story 2

> Write these tests first and confirm they fail before implementation.

- [X] T006 [P] [US2] Add DOM tests for the localized loading presentation, status semantics, and non-blocking controls in `frontend/tests/dom/line-loading-view.test.ts`
- [X] T007 [P] [US2] Add deterministic browser tests for delayed line data, delayed route data, route failure, selection replacement, and closing while pending in `frontend/tests/e2e/municipal-line-service.spec.ts`
- [X] T008 [P] [US2] Add a reduced-motion browser test proving loading and route outcomes remain perceivable without non-essential animation in `frontend/tests/e2e/reduced-motion.spec.ts`

### Implementation for User Story 2

- [X] T009 [US2] Create the accessible full-screen loading overlay with a translucent backdrop and visible indicator in `frontend/src/ui/line/line-loading-view.ts`, and add its loading text to `frontend/src/i18n/en.ts`, `frontend/src/i18n/es.ts`, and `frontend/src/i18n/gl.ts`
- [X] T010 [US2] Render the pending state immediately before awaiting line data in `showLine` and preserve request-version checks in `frontend/src/main.ts`
- [X] T011 [US2] Expose route-pending full-screen loading feedback and terminal route outcomes in `frontend/src/ui/line/frequency-view.ts`
- [X] T012 [US2] Keep a close action available during line loading and route pending states, wire it to the existing map return lifecycle, and use the existing reduced-motion styles in `frontend/src/main.ts`, `frontend/src/ui/line/line-loading-view.ts`, and `frontend/src/ui/styles.css`

**Checkpoint**: A line selection immediately shows feedback, transitions to details or a clear outcome, ignores stale responses, and does not depend on animation.

---

## Phase 5: User Story 3 - Browse the map without a location warning taking space (Priority: P2)

**Goal**: Suppress mobile notices for unusable location while retaining the informative status for a successfully applied location with no nearby stops.

**Independent Test**: Simulate denied, unavailable, and outside-coverage location at a mobile viewport and verify no failure notice appears and map/line controls remain usable; verify no-nearby and non-mobile messaging retain existing behavior.

### Tests for User Story 3

> Write these tests first and confirm they fail before implementation.

- [X] T013 [P] [US3] Add DOM tests for mobile suppression of unavailable/out-of-coverage messages, retention of no-nearby status, and unchanged non-mobile messages in `frontend/tests/dom/location-status.test.ts`
- [X] T014 [P] [US3] Add browser tests for denied, unavailable, and outside-coverage mobile outcomes, continued map browsing, and retained no-nearby status in `frontend/tests/e2e/mobile-location.spec.ts`

### Implementation for User Story 3

- [X] T015 [US3] Suppress rendering of `unavailable` and `outside-coverage` location messages on mobile while retaining `no-nearby-stops` and current non-mobile behavior in `frontend/src/ui/map/location-status.ts`

**Checkpoint**: Mobile users can browse the map and lines without an unusable-location notice; useful successful-location feedback remains available.

---

## Phase 6: User Story 4 - Open a line route from a selected stop (Priority: P1)

**Goal**: Make catalog-backed line icons beside stop arrivals and badges beside route stops open the existing route flow, without changing informational icons elsewhere.

**Independent Test**: Open a stop with an arrival for a catalog-backed line, activate its line icon by pointer and keyboard, and verify that the selected line route is displayed.

### Tests for User Story 4

> Write these tests first and confirm they fail before implementation.

- [X] T016 [P] [US4] Add DOM coverage for localized, keyboard-operable arrival line icons in `frontend/tests/dom/stop-view.test.ts`
- [X] T017 [P] [US4] Add DOM coverage for localized, keyboard-operable route-stop line badges in `frontend/tests/dom/us1-line-frequency.test.ts`
- [X] T018 [P] [US4] Add browser coverage for line-icon activation and navigation to the matching route in `frontend/tests/e2e/municipal-catalog.spec.ts` and `frontend/tests/e2e/search-lines.spec.ts`

### Implementation for User Story 4

- [X] T019 [US4] Render catalog-backed arrival icons, stop-summary badges, and route-stop line badges as accessible route buttons and wire them to the existing `showLine` flow in `frontend/src/ui/stop/stop-arrivals-view.ts`, `frontend/src/ui/line-badge.ts`, `frontend/src/ui/line/frequency-view.ts`, and `frontend/src/main.ts`; localize and style the controls in the existing i18n and CSS files

**Checkpoint**: An arrival line icon opens the matching route; icons without a catalog line remain informational, and icons in other views are unchanged.

---

## Phase 7: User Story 5 - Use the full screen for line details on portrait mobile layouts (Priority: P1)

**Goal**: Keep selected-line details readable across viewports: full-width on phones and portrait tablets, with compact route headings on desktop.

**Independent Test**: Open a line at 390 × 844 and 768 × 1024 portrait viewports and verify that the detail panel fills the viewport width and the route stops remain within it.

- [X] T020 [P] [US5] Add responsive browser coverage at 390 px and 768 px portrait widths in `frontend/tests/e2e/municipal-line-service.spec.ts`
- [X] T021 [US5] Apply the full-width bottom-panel layout throughout the portrait-mobile breakpoint and compact route-heading styles at all widths in `frontend/src/ui/styles.css`

**Checkpoint**: Line details fill the viewport width in supported portrait mobile layouts without horizontal overflow.

---

## Phase 8: User Story 6 - Choose a supported interface language (Priority: P2)

**Goal**: Offer only Castellano and Galego and migrate an existing English preference to Castellano.

**Independent Test**: Open language settings, verify both supported choices, and load a preference saved as English to verify migration to Castellano.

- [X] T022 [P] [US6] Add coverage for the supported language choices and English-preference migration in `frontend/tests/dom/settings-menu.test.ts`
- [X] T023 [US6] Limit language choices to Castellano and Galego and normalize saved English preferences to Castellano in `frontend/src/ui/settings/settings-menu.ts` and `frontend/src/application/update-user-preferences.ts`

**Checkpoint**: The settings menu exposes only supported languages and no saved preference leaves the interface in English.

---

## Phase 9: Polish & Cross-Cutting Validation

**Purpose**: Verify the integrated stories and preserve existing behavior.

- [X] T024 Run the focused DOM and Playwright scenarios, TypeScript typecheck, and validation steps in `specs/010-mobile-map-usability/quickstart.md`; fix only regressions introduced by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; existing project and test setup is sufficient.
- **Foundational (Phase 2)**: No tasks; the existing architecture and harness provide all shared prerequisites.
- **US1 (Phase 3)**: Starts independently; it is the recommended MVP.
- **US2 (Phase 4)**: Follows US1 because both change the selected-line view, its close lifecycle, and `municipal-line-service.spec.ts`.
- **US3 (Phase 5)**: Independent of US1 and US2; can be implemented in parallel after the existing project context is understood.
- **US4 (Phase 6)**: Follows initial integration because it changes stop-arrival and route-stop presentation, main navigation flow, and related tests.
- **US5 (Phase 7)**: Follows the line-view integration and checks both phone and portrait-tablet widths.
- **US6 (Phase 8)**: Independent of the map and line-view stories.
- **Polish (Phase 9)**: Depends on all selected stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on another feature story.
- **US2 (P1)**: Depends on US1 implementation to avoid conflicting edits to the selected-line view, main flow, and line-service browser tests.
- **US3 (P2)**: No dependency on US1 or US2; can proceed in parallel with either story.
- **US4 (P1)**: Depends on the existing selected-line route flow from US2.
- **US5 (P1)**: Depends on the selected-line view from US1 and US2.
- **US6 (P2)**: No dependency on another feature story.

### Within Each User Story

- Write and run the focused tests before implementation.
- UI rendering remains in UI modules; request sequencing and destination transitions remain in `frontend/src/main.ts`.
- Do not add a new transit action, map adapter, persistent state, or location retry.
- Run the story's independent test criteria at its checkpoint.

### Parallel Opportunities

- **US1**: T001 and T002 edit different test files and can be prepared in parallel.
- **US2**: T006, T007, and T008 edit different test files and can be prepared in parallel after US1's test changes are integrated.
- **US3**: T013 and T014 edit different test files and can be prepared in parallel; the whole US3 implementation can run alongside US1/US2 because it changes location-status files only.
- **US4**: T016, T017, and T018 edit different test files and can be prepared in parallel; T019 follows all three.
- **US5**: T020 precedes T021.
- **US6**: T022 precedes T023.
- Do not parallelize US1 and US2 implementation because their source and end-to-end test tasks share files.

## Parallel Example: User Story 3

```text
Task: Add DOM location-message policy tests in frontend/tests/dom/location-status.test.ts
Task: Add mobile location outcome browser tests in frontend/tests/e2e/mobile-location.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Implement T001-T005.
2. Verify close behavior at a mobile viewport in expanded and collapsed states.
3. Stop and validate the map restoration before proceeding.

### Incremental Delivery

1. Complete US1 and validate the close-to-map flow.
2. Complete US2 and validate line loading, route outcomes, stale selections, and reduced motion.
3. Complete US3 independently and validate location-message behavior across mobile and non-mobile viewports.
4. Complete US4 and verify navigation from arrival and route-stop line icons.
5. Complete US5 and verify full-width line details on portrait mobile viewports.
6. Complete US6 and verify the supported language choices and preference migration.
7. Run T024 for the selected stories and review the quickstart criteria.

## Notes

- `[P]` marks tasks that edit separate files and have no prerequisite on an incomplete task.
- `[US1]` through `[US6]` map to the corresponding stories in `spec.md`.
- No tasks are included for project scaffolding, new dependencies, or a public API because the existing application already supplies these capabilities.
