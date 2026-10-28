# Feature Specification: Mobile Location and Map Controls

**Feature Branch**: `006-mobile-location`

**Created**: 2026-10-28

**Status**: Implemented

**Input**: User description: "Remove the three-line button above the center control, near the zoom-in and zoom-out buttons. On mobile, ask for geolocation permission and take the user to that point so they can see nearby bus stops."

## Clarifications

### Session 2026-10-28

- Q: If the person is outside Vigo or no bus stops are nearby, what should the map do? → A: If outside service coverage, return to the Vigo map and explain the coverage limit.
- Q: What should count as having nearby bus service when deciding whether to keep the map at the user's location? → A: Any location inside Vigo coverage qualifies, regardless of the distance to the nearest stop.

## User Scenarios & Testing

### User Story 1 - Find nearby bus stops from a mobile device (Priority: P1)

As a person using the bus map on a mobile device, I want to allow the app to use my current location and see nearby bus stops, so I can quickly understand which stops are close to me.

**Why this priority**: Starting from the rider's present location is the primary new mobile benefit.

**Independent Test**: On a mobile viewport with location permission granted, open the map and verify it centers on the current location, shows a distinct location indicator, and makes nearby bus stops visible.

**Acceptance Scenarios**:

1. **Given** a person opens the map on a mobile device and has not yet granted or denied location permission, **When** the map is ready, **Then** the app requests permission and does not use the location before permission is granted.
2. **Given** the person grants location permission and a valid current location is available, **When** the location is received, **Then** the map centers and zooms to a useful nearby view and shows the person's location distinctly from bus stops.
3. **Given** the person declines permission or location is unavailable, **When** location access ends, **Then** the existing Vigo map remains usable, the app explains that location could not be used, and it does not repeatedly prompt during that visit.
4. **Given** the person is using a desktop device, **When** the map opens, **Then** the app does not request geolocation and retains its existing default map behavior.
5. **Given** the map has centered on the person's location, **When** the person pans or zooms the map, **Then** the map does not unexpectedly recenter on its own.
6. **Given** the authorized location is inside Vigo bus service coverage but no stops are nearby, **When** the location is evaluated, **Then** the map remains centered on the person and explains that no nearby stops are shown.
7. **Given** the authorized location is outside Vigo bus service coverage, **When** the location is evaluated, **Then** the map returns to the Vigo view and explains the coverage limit.

---

### User Story 2 - Use a simpler set of map controls (Priority: P2)

As a person using the map, I want the redundant control that opens a list of stops in view removed, so the map controls remain uncluttered while I can still zoom and return to the existing map view.

**Why this priority**: Removing the specified control simplifies the map without removing the existing zoom or recenter actions.

**Independent Test**: Open the map and verify the stop-list control is absent while recenter, zoom-in, and zoom-out controls remain available and operable.

**Acceptance Scenarios**:

1. **Given** the map is displayed, **When** the person views its controls, **Then** the control that opens the list of stops in view is not present.
2. **Given** the stop-list control has been removed, **When** the person uses recenter or zoom controls, **Then** those existing controls remain visible, accessible, and functional.

### User Story 3 - Keep the map visible while browsing mobile content (Priority: P1)

As a person using the app on a mobile screen, I want stop search results, a selected stop, or selected line details to share the screen with the map, so I can keep geographic context while browsing.

**Why this priority**: The map is central to finding stops and understanding a line route; content panels should not obscure it.

**Independent Test**: At a mobile viewport, open stop search, a stop detail, and a line detail in turn; verify the map and active content occupy separate screen regions and can each be used.

**Acceptance Scenarios**:

1. **Given** the person opens stop search on a mobile screen, **When** search results are displayed, **Then** the map remains visible in the upper region and the results occupy a scrollable lower panel.
2. **Given** the person selects a stop on a mobile screen, **When** its detail panel opens, **Then** the map remains visible above the lower detail panel, and the panel content can be scrolled.
3. **Given** the person expands a stop detail panel, **When** it grows, **Then** the map area resizes rather than being covered by the panel.
4. **Given** the person opens a line on a mobile screen, **When** line details are displayed, **Then** the map remains visible above a scrollable lower panel.
5. **Given** a search, stop-detail, or line-detail panel is closed or the person leaves that view, **When** the map returns to its normal view, **Then** it regains the available screen area.

### User Story 4 - Focus the map on a selected line (Priority: P1)

As a person viewing a bus line, I want the map to show only stops served by that line, so unrelated nearby stops do not distract from its route.

**Why this priority**: The selected route and its stops should be understandable as one network subset rather than mixed with every stop in the area.

**Independent Test**: Select a line and verify that the map shows only its served stops; leave the line view and verify that all stops return.

**Acceptance Scenarios**:

1. **Given** a line is selected, **When** its route is shown on the map, **Then** map markers and cluster counts include only stops served by that line.
2. **Given** a stop is served by the selected line and one or more other lines, **When** the line filter is active, **Then** that shared stop remains visible.
3. **Given** the person leaves the selected line view, **When** the general map is shown, **Then** the complete stop set is restored.
4. **Given** the selected line has no eligible mapped stops, **When** its route is shown, **Then** unrelated stops are not presented as stops for that line.

### User Story 5 - Reveal line schedules only on request (Priority: P2)

As a person viewing a line and its route, I want its departures and frequencies initially collapsed under a compact “Departures and arrivals” heading, so the route remains the focus until I choose to inspect schedules.

**Why this priority**: Schedules are useful but secondary to the route and should not dominate the initial line view.

**Independent Test**: Open a line with schedule data; verify the schedule content is initially hidden, then activate its heading and verify the schedule appears while the heading remains unchanged.

**Acceptance Scenarios**:

1. **Given** a line has published or bundled schedule data, **When** the line view first opens, **Then** the schedule content is collapsed and the compact localized “Departures and arrivals” heading is available.
2. **Given** schedule content is collapsed, **When** the person activates the heading, **Then** departures or frequency details are revealed and the heading text remains unchanged.
3. **Given** schedule content is expanded, **When** the person activates the heading again, **Then** the schedule content is hidden.
4. **Given** a line has no schedule data for the selected day, **When** its line view opens, **Then** the existing no-service or unavailable explanation remains available without fabricated schedule content.

### Edge Cases

- The device or browser does not support location access.
- The person denies permission, permission is already blocked, or the location request times out.
- The location result is invalid or outside the displayed service area.
- No bus stops are close to the current location.
- Location arrives after the person has already moved the map manually.
- The viewport changes between mobile and desktop sizes while the app is open.
- The person leaves the map and returns during the same visit.
- A selected line shares stops with other lines or has no eligible mapped stops.
- A mobile content panel is expanded while the person needs to retain map context.
- Schedule data is absent for the selected day type.

## Requirements

### Functional Requirements

- **FR-001**: The map MUST no longer offer the control that opens a list of stops currently in view.
- **FR-002**: Removing that control MUST NOT remove or disable the existing recenter, zoom-in, or zoom-out controls.
- **FR-003**: On mobile, when the map is first shown during a visit and location permission has not been decided, the app MUST request permission before accessing the person's location.
- **FR-004**: The app MUST NOT access or use a person's location unless permission is granted.
- **FR-005**: When permission is granted and a valid location within Vigo bus service coverage is received, the map MUST center on that location at a useful scale for seeing nearby bus stops and MUST show a distinct location indicator.
- **FR-006**: The app MUST NOT continuously track or automatically recenter on the person after the initial location is obtained.
- **FR-007**: When permission is denied, location access fails, or the result is unusable, the map MUST remain usable at its existing Vigo view and MUST provide a concise, accessible explanation.
- **FR-008**: The app MUST NOT repeatedly request location after a denial or failure during the same visit.
- **FR-009**: The app MUST NOT request geolocation on desktop.
- **FR-010**: The app MUST NOT persist the person's location or include it in transit-data requests.
- **FR-011**: A valid authorized location within Vigo bus service coverage MUST be used even if no bus stops are nearby; the map MUST remain centered on that location and explain when no nearby stops are shown.
- **FR-012**: A valid authorized location outside Vigo bus service coverage MUST not be used to center the map; the app MUST show the existing Vigo view and explain the coverage limit.
- **FR-013**: On mobile, stop search results, selected-stop details, and selected-line details MUST share the screen with a visible map area instead of covering it.
- **FR-014**: Mobile search results and line details MUST appear in a scrollable lower panel while the map remains visible above them.
- **FR-015**: A mobile selected-stop detail panel MUST leave the map visible above it; expanding the panel MUST resize the map area rather than cover it.
- **FR-016**: While a line is selected, the map MUST show only eligible stops served by that line, including shared stops, and MUST restore the full stop set when the person leaves the line view.
- **FR-017**: Published and bundled line schedule content MUST be collapsed by default behind a compact, localized “Departures and arrivals” heading; activating the heading MUST reveal or hide the content without changing the heading text.
- **FR-018**: When a verified route is shown, the line view MUST NOT add a redundant textual list of route directions alongside it.

### Key Entities

- **Current Location**: A one-time, permission-authorized location used transiently to orient the map; it is not retained as user profile data.
- **Location Permission**: The person's browser-controlled decision governing whether the app may obtain the current location.
- **Map Controls**: The set of map actions available to the person, including recenter and zoom, but excluding the removed stops-in-view list action.
- **Selected Line**: The line whose route is being viewed; only stops served by it are included in the map's stop set until the person leaves that view.
- **Line Schedule**: Published or bundled departure and frequency information for a line, initially hidden until the person opens its disclosure.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In all tested mobile scenarios where permission is granted and a valid location within Vigo bus service coverage is returned, the map centers on that location and the distinct location indicator appears within 3 seconds of receiving the location.
- **SC-002**: In all tested desktop scenarios, opening the map produces no geolocation permission request.
- **SC-003**: In all tested denial, unsupported, timeout, and invalid-location scenarios, the map remains usable and provides an accessible explanation without repeated prompts during the visit.
- **SC-004**: In all tested map views, the stops-in-view control is absent while recenter, zoom-in, and zoom-out remain usable.
- **SC-005**: In all tested scenarios, current location is neither persisted nor sent with transit-data requests.
- **SC-006**: In all tested locations inside Vigo coverage, the map remains centered on the authorized location even if no stop is nearby; outside-coverage locations return to the Vigo overview with an accessible explanation.
- **SC-007**: On supported mobile viewport sizes, stop search, stop details, and line details can be viewed while a non-zero map area remains visible; expanding stop details reduces the map area instead of covering it.
- **SC-008**: For every selected line with eligible stop data, the map contains no marker or cluster count for a stop not served by that line; leaving the line view restores the full stop set.
- **SC-009**: Line schedule content is hidden on first display and becomes visible only after the person activates the schedule heading; the heading remains stable across both states.
- **SC-010**: When a route is displayed, no separate redundant direction-message list is shown in the line details.

## Assumptions

- A "visit" means the current open app session; permission choices remain governed by the browser.
- Mobile use is determined by the app's mobile experience, not by a specific device brand.
- Location is requested once when the mobile map is first shown; it is not a continuous tracking feature.
- If permission is declined, location cannot be obtained, or the location is outside Vigo bus service coverage, the existing Vigo-centered map is the fallback. No minimum proximity to a stop is required for an in-coverage location.
- Mobile search and line-detail panels use a lower-screen layout that preserves a visible map area; selected-stop details can expand while continuing to reserve screen space for the map.
- A selected line filters map stops by line service membership; line detail schedule data starts collapsed and the displayed route is the primary route-direction presentation.
- "The three-line button" refers to the current map control labeled "Stops in view"; "center" refers to the existing recenter control, which remains.
- Nearby bus stops are communicated by the existing stop markers visible around the user's location; no new stop-list or route-planning feature is included.
