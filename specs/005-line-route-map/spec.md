# Feature Specification: Show Selected Line Route on the Map

**Feature Branch**: `005-line-route-map`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "When a line (not a stop) is selected, show that line's route on the map using its geolocated route data. This specification should focus on that behavior."

## User Scenarios & Testing

### User Story 1 - View a selected line's route on the map (Priority: P1)

As a person exploring Vigo's bus services, I want to select a bus line and see its route on the map, so I can understand where it travels without mistaking a stop selection for a line selection.

**Why this priority**: Seeing the selected line geographically is the central value of this feature and makes line selection distinct from the existing stop-focused map interaction.

**Independent Test**: Select a line from the line-browsing interface with valid route data available. Confirm that the map displays the line's route and that selecting a stop remains a stop-only action.

**Acceptance Scenarios**:

1. **Given** the user is browsing bus lines and route data is available, **When** the user selects a line, **Then** the map displays that line's available route paths and identifies the selected line in the line details.
2. **Given** a line has routes in both directions, **When** its route is displayed, **Then** each available direction can be distinguished on the map and in an accessible text equivalent.
3. **Given** a route is displayed, **When** the user selects a different line, **Then** the map replaces the previous line's route with the newly selected line's available routes.
4. **Given** the user selects a stop on the map, **When** the stop is opened, **Then** the application performs the existing stop-selection behavior and does not treat the stop as a line selection.
5. **Given** the user interacts with a stop marker while a line route is displayed, **When** the marker is selected, **Then** the stop remains selectable and the route line does not intercept the stop interaction.

### User Story 2 - Understand when a route cannot be shown (Priority: P2)

As a person viewing a line, I want a clear explanation when route data is missing or unavailable, so I can still use the line information without mistaking an absent map path for a valid route.

**Why this priority**: Route data may be absent, unavailable, or unusable; a clear fallback preserves trust and keeps the rest of the line view useful.

**Independent Test**: Select lines with missing, unavailable, or invalid route data and confirm the map shows no fabricated route, the line details remain usable, and a concise localized status explains the outcome.

**Acceptance Scenarios**:

1. **Given** a selected line has no available route geometry, **When** its details are shown, **Then** no route is drawn and the user receives a concise explanation while the rest of the line view remains usable.
2. **Given** route geometry cannot be loaded or validated, **When** the route display finishes, **Then** the application reports the route as unavailable, does not display partial or misleading geometry, and leaves stop selection available.
3. **Given** only one direction has usable route data, **When** the line is displayed, **Then** the available direction is shown and the missing direction is not fabricated.

### Edge Cases

- The selected line has route data for only one direction.
- A line has multiple route variants or repeated trips that share the same path.
- Route geometry is empty, malformed, or contains coordinates that cannot be displayed.
- Route loading finishes after the user has selected another line.
- The map is still initializing when the user selects a line.
- A route crosses or passes near stop markers; both route visibility and stop selection must remain clear.
- The user has reduced-motion preferences enabled when the map adjusts to the selected route.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST display the selected line's available geolocated route paths on the map when the user selects a line from the line-browsing interface.
- **FR-002**: Selecting a line MUST remain a distinct action from selecting a stop; selecting a stop MUST NOT select or open a line as a side effect.
- **FR-003**: When route data is available for both directions, the application MUST make the directions distinguishable on the map and provide an accessible non-visual equivalent.
- **FR-004**: When the user selects another line, the map MUST replace the previously selected line's route with the newly selected line's route.
- **FR-005**: The route display MUST NOT prevent existing stop markers from being selected.
- **FR-006**: The map MUST adjust its visible area so the selected line's available route paths can be seen without requiring the user to search for them manually.
- **FR-007**: If route data is absent, unavailable, or invalid, the application MUST NOT draw invented or partial route geometry and MUST provide a concise localized status while preserving the remaining line details and stop interactions.
- **FR-008**: Route display MUST respect the user's reduced-motion preference when changing the map's visible area.
- **FR-009**: Route data shown on the map MUST correspond to the currently selected line; late results for a previously selected line MUST NOT replace the current route.

### Key Entities

- **Selected Line**: The bus line chosen from line browsing; it is distinct from a selected stop.
- **Directional Route**: A geolocated path associated with a selected line and one direction of travel.
- **Route Display**: The currently visible map representation of the selected line's available directional routes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In all tested cases with valid route data, selecting a line results in its route being visible on the map within 3 seconds after the route data is available.
- **SC-002**: In test scenarios covering at least 10 lines with route data, 100% of displayed paths correspond to the selected line, and selecting a different line removes the previous line's paths.
- **SC-003**: In 100% of interaction tests, selecting a stop does not trigger line-route selection, and selecting a stop marker remains possible while a route is displayed.
- **SC-004**: In all tested missing, unavailable, or invalid route-data cases, no route is fabricated or partially shown, and the line details and stop interactions remain usable.
- **SC-005**: Users can distinguish the available travel directions from both the map and an accessible text equivalent.

## Assumptions

- Selecting a line means choosing it from the line-browsing interface; selecting a stop on the map or in stop search is not a line selection.
- When a line has usable route data in both directions, both directions should be displayed together. If there are multiple trip variants for a direction, the displayed route should represent the available direction without duplicating visually identical paths.
- Existing municipal line schedules identify the route geometry associated with a line; this feature does not introduce a new transit-data source.
- The line's route remains displayed while its line details are open and is replaced when another line is selected.
- The existing stop markers remain visible and interactive when route paths are displayed.
