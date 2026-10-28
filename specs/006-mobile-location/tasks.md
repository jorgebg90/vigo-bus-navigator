# Tasks: Mobile Location and Map Controls

**Input**: Design documents from `/specs/006-mobile-location/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/mobile-location-map.md`, `quickstart.md`

**Organization**: Tasks are grouped by user story so each story can be independently implemented and tested.

## Phase 1: Setup

**Purpose**: No project initialization is needed; the existing browser application, MapLibre adapter, test tooling, and localization framework are reused.

No setup tasks.

## Phase 2: Foundational

**Purpose**: Define the typed transient location value and map/geolocation boundaries used by the location experience.

- [X] T001 Define the transient `CurrentLocation` and `LocationRequestState` types in `frontend/src/domain/types.ts`; coordinates require finite latitude from -90 through 90, finite longitude from -180 through 180, and finite non-negative `accuracyMeters`.
- [X] T002 Add the one-shot `GeolocationPort` and location display operation to `frontend/src/application/ports.ts`, then update `StopMapPort` test doubles in `frontend/tests/unit/map-view.test.ts`.

**Checkpoint**: Shared location and map-port contracts are available; user-story work can begin.

## Phase 3: User Story 1 - Find Nearby Bus Stops from a Mobile Device (Priority: P1) 🎯 MVP

**Goal**: On first mobile map mount, request one authorized position, center the map within Vigo coverage, and display a distinct marker and accessible outcome while preserving privacy and user map movement.

**Independent Test**: With deterministic mobile geolocation, verify one request centers the map and adds a location marker; denial, invalid or outside-coverage positions leave the usable Vigo overview and announce the appropriate status; desktop makes no request and location data is not persisted or sent.

### Tests for User Story 1

- [X] T003 [P] [US1] Test the Vigo coverage envelope and location-coordinate validation, including latitude 42.1–42.32 and longitude -8.85–-8.6 inclusive, in `frontend/tests/unit/map-stops.test.ts`
- [X] T004 [P] [US1] Test one-shot geolocation success, denial, unsupported access, and timeout mapping in `frontend/tests/unit/browser-geolocation.test.ts`
- [X] T005 [P] [US1] Test location marker rendering, outside-coverage clearing, pending location before map load, camera fit, reduced motion, and not overriding manual movement in `frontend/tests/unit/map-view.test.ts`
- [X] T006 [P] [US1] Test localized accessible location outcome messages for success-without-visible-stops, unavailable, and outside-coverage states in `frontend/tests/dom/location-status.test.ts`
- [X] T007 [P] [US1] Add deterministic Playwright journeys for mobile permission grant/denial, desktop no-prompt, outside coverage, and location privacy in `frontend/tests/e2e/mobile-location.spec.ts`

### Implementation for User Story 1

- [X] T008 [US1] Implement finite-coordinate and existing Vigo-envelope validation in `frontend/src/domain/map-stops.ts`, retaining the inclusive latitude range 42.1–42.32 and longitude range -8.85–-8.6
- [X] T009 [US1] Implement the typed one-shot browser Geolocation API adapter in `frontend/src/infrastructure/system/browser-geolocation.ts`; map unsupported, denied, timeout, and invalid results to explicit outcomes without retry or persistence
- [X] T010 [US1] Add the separate non-interactive user-location GeoJSON source, marker layer, location camera fit, reduced-motion behavior, pending-before-load support, and map-movement guard in `frontend/src/infrastructure/map/map-port.ts`
- [X] T011 [US1] Add localized accessible location status rendering in `frontend/src/ui/map/location-status.ts` and messages in `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts`, and `frontend/src/i18n/en.ts`
- [X] T012 [US1] Request geolocation once on initial mobile map mount only, validate coverage, retain location and request state in memory, handle late results/navigation, and report visible-stop status in `frontend/src/main.ts`

**Checkpoint**: Mobile users can orient to an authorized in-coverage position; failures and outside-coverage positions fall back safely, and no location is stored or sent.

## Phase 4: User Story 2 - Use a Simpler Set of Map Controls (Priority: P2)

**Goal**: Remove only the stops-in-view list action while preserving zoom, recenter, and cluster/collocated-stop selection.

**Independent Test**: Open the map and verify the stops-in-view action is absent; recenter, zoom-in, zoom-out, and the map's cluster chooser remain accessible and functional.

### Tests for User Story 2

- [X] T013 [P] [US2] Test that the map toolbar omits stops-in-view while retaining accessible recenter and zoom controls in `frontend/tests/dom/map-toolbar.test.ts`
- [X] T014 [P] [US2] Extend responsive and keyboard map journeys to verify removed list control and retained zoom/recenter/cluster selection in `frontend/tests/e2e/responsive.spec.ts` and `frontend/tests/e2e/keyboard-map.spec.ts`

### Implementation for User Story 2

- [X] T015 [US2] Remove the stops-in-view control, list callback, and unused options from `frontend/src/ui/map/map-toolbar.ts`
- [X] T016 [US2] Remove the list chooser wiring and use the retained recenter button as the chooser focus-return opener in `frontend/src/main.ts`

**Checkpoint**: The specified map control is removed without losing the remaining map controls or accessible cluster selection.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify implementation against all stories, privacy requirements, and the design quickstart.

- [X] T017 Update the location and map-control contract and quickstart with any verified behavior changes in `specs/006-mobile-location/contracts/mobile-location-map.md` and `specs/006-mobile-location/quickstart.md`
- [X] T018 Run all quickstart scenarios, the full test suite, typecheck, production build, and `git diff --check` from the `package.json` project root
- [X] T019 [P] Add acceptance coverage for mobile search, stop-detail, and line-detail layouts that preserve a visible map area in `frontend/tests/e2e/responsive.spec.ts`
- [X] T020 [P] Add map-port and end-to-end coverage for selected-line stop filtering, shared stops, and restoring all stops after leaving the line view in `frontend/tests/unit/map-view.test.ts` and `frontend/tests/e2e/responsive.spec.ts`
- [X] T021 [P] Add DOM coverage for the initially collapsed, localized line schedule disclosure and stable heading in `frontend/tests/dom/us1-line-frequency.test.ts`
- [X] T022 Implement the mobile map/content split, expandable stop panel, line stop filtering, and compact schedule disclosure in `frontend/src/ui/styles.css`, `frontend/src/ui/panel/sheet.ts`, `frontend/src/infrastructure/map/map-port.ts`, and `frontend/src/ui/line/frequency-view.ts`
- [X] T023 Update the feature specification, design contract, and quickstart with the verified mobile layout, line-filtering, and schedule behavior in `specs/006-mobile-location/spec.md`, `specs/006-mobile-location/plan.md`, `specs/006-mobile-location/contracts/mobile-location-map.md`, and `specs/006-mobile-location/quickstart.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required.
- **Foundational (Phase 2)**: Establishes transient location types and ports; blocks both user stories.
- **User Stories (Phase 3+)**: US1 is the P1 user benefit and can be implemented/tested independently after Phase 2. US2 is an independent P2 toolbar simplification. The delivered mobile layout, line filtering, and schedule disclosure refinements are recorded in completed tasks T019–T023.
- **Polish (Phase 5)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; delivers mobile location discovery and safe fallback.
- **US2 (P2)**: Starts after Phase 2; does not depend on US1 and can be implemented independently.
- **Mobile layout, selected-line stop filtering, and schedule disclosure (T019–T023)**: Delivered as follow-up refinements; their test and implementation dependencies are recorded in the task descriptions.

### Within Each User Story

- Write and run the story tests before corresponding implementation tasks.
- T008 validates coordinate eligibility before the browser location result is applied.
- T009 provides the browser port implementation before T012 integrates the request lifecycle.
- T010 requires the map location operation from T002; T012 connects the use case to map display.
- T013 and T014 can proceed in parallel; T015 precedes T016 because the app owns the toolbar chooser opener wiring.

### Parallel Opportunities

- After Phase 2, US1 tests T003–T007 can be prepared in parallel because they edit distinct test files.
- After Phase 2, US2 tests T013–T014 can be prepared in parallel with the US1 test work.
- US1 and US2 implementation can be worked independently except their shared `frontend/src/main.ts` integration, which must be handled sequentially.

## Parallel Examples

### User Story 1 tests

```text
Task T003: coverage and coordinate validation in frontend/tests/unit/map-stops.test.ts
Task T004: browser geolocation adapter outcomes in frontend/tests/unit/browser-geolocation.test.ts
Task T005: map location overlay behavior in frontend/tests/unit/map-view.test.ts
Task T006: accessible location statuses in frontend/tests/dom/location-status.test.ts
Task T007: mobile and desktop location journeys in frontend/tests/e2e/mobile-location.spec.ts
```

### User Story 2 tests

```text
Task T013: toolbar control DOM behavior in frontend/tests/dom/map-toolbar.test.ts
Task T014: responsive and keyboard map journeys in frontend/tests/e2e/responsive.spec.ts and frontend/tests/e2e/keyboard-map.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 shared location contracts.
2. Write and run the US1 tests.
3. Implement one-shot mobile location, in-memory map marker, coverage validation, and accessible failure states.
4. Validate US1 independently, including desktop no-prompt and privacy checks.
5. Proceed to US2 to remove the stops-in-view control.

### Incremental Delivery

1. Complete shared contracts.
2. Deliver mobile location (US1) with deterministic permission and coverage outcomes.
3. Remove the stops-in-view control while retaining map navigation and cluster selection (US2).
4. Run all validation commands in the quickstart before final review.
