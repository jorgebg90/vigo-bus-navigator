# Tasks: Show Selected Line Route on the Map

**Input**: Design documents from `/specs/005-line-route-map/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/line-route-map.md`, `quickstart.md`

**Organization**: Tasks are grouped by user story so each story can be independently implemented and tested.

## Format

Every task follows `- [ ] T### [P?] [Story?] Description with exact file path(s)`.
`[P]` marks work that can proceed in parallel without editing the same files or
depending on unfinished tasks. Story labels are required for story-phase tasks.

## Phase 1: Setup

**Purpose**: No project initialization is needed; the existing frontend, map
adapter, source adapters, fixture profile, and test tooling are reused.

No setup tasks.

## Phase 2: Foundational

**Purpose**: Define the shared transient route display contract before either
user story implements route behavior.

- [X] T001 Define `DirectionalRoute` and `SelectedLineRouteDisplay` from `data-model.md` in `frontend/src/domain/types.ts`
- [X] T002 Extend `StopMapPort` with complete route-overlay replacement/clear behavior in `frontend/src/application/ports.ts` and update all map-port test doubles in `frontend/tests/`

**Checkpoint**: Shared route model and map port are available; user-story
implementation can begin.

## Phase 3: User Story 1 - View a Selected Line's Route on the Map (Priority: P1) 🎯 MVP

**Goal**: Selecting a line from line browsing displays its available directional
routes on the persistent map, replaces a previous selected route, and preserves
independent stop interactions.

**Independent Test**: With deterministic fixture routes, select line A and
confirm its available path(s) appear and fit in the map; select line B and
confirm A is replaced; select a stop marker while a route is visible and
confirm the stop details still open.

### Tests for User Story 1

- [X] T003 [P] [US1] Test route-overlay replacement, clearing, and camera bounds in `frontend/tests/unit/map-view.test.ts`
- [X] T004 [P] [US1] Test loading one representative shape per available direction and deduplicating shared shape IDs in `frontend/tests/unit/municipal/municipal-schedule-repository.test.ts`
- [X] T005 [P] [US1] Test accessible direction labels and route description in `frontend/tests/dom/us1-line-frequency.test.ts`
- [X] T006 [P] [US1] Add fixture-backed line-selection, route replacement, and stop-marker interaction scenarios in `frontend/tests/e2e/municipal-line-service.spec.ts`

### Implementation for User Story 1

- [X] T007 [US1] Load validated geometry for each representative direction, retaining the representative trip and headsign association in `frontend/src/infrastructure/schedule/municipal-schedule-repository.ts`
- [X] T008 [US1] Render route features in a separate non-interactive GeoJSON source/layer below stop hit targets, replace/clear overlays atomically, and fit their combined bounds with the visible line panel accounted for in `frontend/src/infrastructure/map/map-port.ts`
- [X] T009 [US1] Apply route overlays only for the current line request and clear them when line browsing is left in `frontend/src/main.ts`
- [X] T010 [US1] Render a localized accessible direction equivalent and map-route status hooks without relying on color alone in `frontend/src/ui/line/frequency-view.ts` and `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts`, `frontend/src/i18n/en.ts`

**Checkpoint**: Selecting a line shows its valid directions on the persistent
map; choosing another line replaces the old overlay; stop selection is
unaffected.

## Phase 4: User Story 2 - Understand When a Route Cannot Be Shown (Priority: P2)

**Goal**: Missing or invalid geometry is never fabricated; usable directions
remain visible when another direction fails, and users receive a localized
unavailable status while line details and stop interactions remain usable.

**Independent Test**: Select fixture lines with no geometry, invalid geometry,
and only one valid direction. Confirm there is no invented/partial path, the
valid direction remains visible when present, an unavailable status is shown
when no valid path remains, and stop markers remain selectable.

### Tests for User Story 2

- [X] T011 [P] [US2] Test missing and invalid direction geometry, partial-direction success, and no fabricated paths in `frontend/tests/unit/municipal/municipal-schedule-repository.test.ts`
- [X] T012 [P] [US2] Test localized route-unavailable status while retaining timetable and stop details in `frontend/tests/dom/us1-line-frequency.test.ts`
- [X] T013 [P] [US2] Add fixture-backed missing/invalid route and one-direction-only map scenarios in `frontend/tests/e2e/municipal-line-service.spec.ts`

### Implementation for User Story 2

- [X] T014 [US2] Keep each direction's geometry result independent so one unavailable shape does not discard another valid direction in `frontend/src/infrastructure/schedule/municipal-schedule-repository.ts`
- [X] T015 [US2] Show route-unavailable status only when no usable route remains, preserving line details and stop interactions in `frontend/src/ui/line/frequency-view.ts` and `frontend/src/i18n/es.ts`, `frontend/src/i18n/gl.ts`, `frontend/src/i18n/en.ts`

**Checkpoint**: Missing, invalid, and partial route responses are handled
truthfully and independently from the line timetable and stop map.

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify shared behavior, documentation scenarios, accessibility,
motion preference, and production integrity.

- [X] T016 Verify and document reduced-motion route camera behavior and map-panel-aware bounds in `specs/005-line-route-map/contracts/line-route-map.md` and `specs/005-line-route-map/quickstart.md`
- [X] T017 Run the full automated suite, typecheck, production build, and `git diff --check` as documented in `specs/005-line-route-map/quickstart.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No work required; project infrastructure already exists.
- **Foundational (Phase 2)**: T001 → T002; blocks both user stories.
- **User Stories (Phase 3+)**: US1 is the MVP. US2 builds on the route result
  and display behavior from US1, so it follows US1.
- **Polish (Phase 5)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; delivers the primary route-on-map flow.
- **US2 (P2)**: Starts after US1; adds failures/partial-route handling using
  the route overlay and selected-line view introduced by US1.

### Within Each User Story

- Write and run the story tests before its implementation tasks.
- T003–T006 are parallelizable because they edit distinct test files.
- Implement repository geometry selection (T007) before map rendering (T008)
  and line-selection orchestration (T009).
- T010 depends on route direction data from T007 and is integrated with T009.
- T011–T013 are parallelizable because they edit distinct test files.
- T014 updates the repository behavior; T015 updates the UI and localization.
- Do not mark an implementation task complete until the related tests pass.

### Parallel Opportunities

- After T002, T003, T004, T005, and T006 can be implemented in parallel.
- After US1 is complete, T011, T012, and T013 can be implemented in parallel.
- T016 is documentation-only and can be prepared independently of code polish,
  but T017 runs after implementation is integrated.

## Parallel Examples

### User Story 1 tests

```text
Task T003: map route-overlay behavior tests in frontend/tests/unit/map-view.test.ts
Task T004: per-direction geometry tests in frontend/tests/unit/municipal/municipal-schedule-repository.test.ts
Task T005: direction accessibility tests in frontend/tests/dom/us1-line-frequency.test.ts
Task T006: line selection and stop interaction tests in frontend/tests/e2e/municipal-line-service.spec.ts
```

### User Story 2 tests

```text
Task T011: partial geometry repository tests in frontend/tests/unit/municipal/municipal-schedule-repository.test.ts
Task T012: unavailable state DOM tests in frontend/tests/dom/us1-line-frequency.test.ts
Task T013: missing/invalid geometry end-to-end tests in frontend/tests/e2e/municipal-line-service.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete the shared route model and map port (Phase 2).
2. Write and pass the US1 tests.
3. Implement geometry selection, map overlay, line-selection orchestration,
   direction identification, and stop interaction preservation.
4. Validate US1 independently using fixture-backed tests and the quickstart.
5. Stop for stakeholder review before beginning the P2 failure-state work.

### Incremental Delivery

1. Deliver US1 with valid route geometry and line replacement.
2. Add US2 without changing or weakening US1 behavior.
3. Run all validation commands in the quickstart before the final gate.

## Notes

- No new dependency, HTTP action, persistent state, backend, or project setup is
  required.
- `[P]` tasks edit distinct files and have no dependency on unfinished work.
- Every task uses the required checkbox, sequential ID, optional `[P]`, story
  label for story phases, and exact file path(s).
