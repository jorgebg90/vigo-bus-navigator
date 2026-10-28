# Feature Specification: Mobile Location and Map Controls

**Feature Branch**: `006-mobile-location`

**Created**: 2026-10-28

**Status**: Draft

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

### Edge Cases

- The device or browser does not support location access.
- The person denies permission, permission is already blocked, or the location request times out.
- The location result is invalid or outside the displayed service area.
- No bus stops are close to the current location.
- Location arrives after the person has already moved the map manually.
- The viewport changes between mobile and desktop sizes while the app is open.
- The person leaves the map and returns during the same visit.

## Requirements

### Functional Requirements

- **FR-001**: The map MUST no longer offer the control that opens a list of stops currently in view.
- **FR-002**: Removing that control MUST NOT remove or disable the existing recenter, zoom-in, or zoom-out controls.
- **FR-003**: On mobile, when the map is first shown during a visit and location permission has not been decided, the app MUST request permission before accessing the person's location.
- **FR-004**: The app MUST NOT access or use a person's location unless permission is granted.
- **FR-005**: When permission is granted and a valid location within Vigo bus service coverage is received, the map MUST center on that location at a useful scale for seeing nearby bus stops and MUST show a distinct location indicator.
- **FR-006**: The app MUST NOT continuously track or automatically recenter on the person after the initial location is obtained.
- **FR-007**: When permission is denied, location access fails, or the result is unusable, the map MUST remain usable at its existing Vigo view and MUST provide a concise, accessible explanation.
- **FR-011**: A valid authorized location within Vigo bus service coverage MUST be used even if no bus stops are nearby; the map MUST remain centered on that location and explain when no nearby stops are shown.
- **FR-012**: A valid authorized location outside Vigo bus service coverage MUST not be used to center the map; the app MUST show the existing Vigo view and explain the coverage limit.
- **FR-008**: The app MUST NOT repeatedly request location after a denial or failure during the same visit.
- **FR-009**: The app MUST NOT request geolocation on desktop.
- **FR-010**: The app MUST NOT persist the person's location or include it in transit-data requests.

### Key Entities

- **Current Location**: A one-time, permission-authorized location used transiently to orient the map; it is not retained as user profile data.
- **Location Permission**: The person's browser-controlled decision governing whether the app may obtain the current location.
- **Map Controls**: The set of map actions available to the person, including recenter and zoom, but excluding the removed stops-in-view list action.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In all tested mobile scenarios where permission is granted and a valid location within Vigo bus service coverage is returned, the map centers on that location and the distinct location indicator appears within 3 seconds of receiving the location.
- **SC-002**: In all tested desktop scenarios, opening the map produces no geolocation permission request.
- **SC-003**: In all tested denial, unsupported, timeout, and invalid-location scenarios, the map remains usable and provides an accessible explanation without repeated prompts during the visit.
- **SC-006**: In all tested locations inside Vigo coverage, the map remains centered on the authorized location even if no stop is nearby; outside-coverage locations return to the Vigo overview with an accessible explanation.
- **SC-004**: In all tested map views, the stops-in-view control is absent while recenter, zoom-in, and zoom-out remain usable.
- **SC-005**: In all tested scenarios, current location is neither persisted nor sent with transit-data requests.

## Assumptions

- A "visit" means the current open app session; permission choices remain governed by the browser.
- Mobile use is determined by the app's mobile experience, not by a specific device brand.
- Location is requested once when the mobile map is first shown; it is not a continuous tracking feature.
- If permission is declined, location cannot be obtained, or the location is outside Vigo bus service coverage, the existing Vigo-centered map is the fallback. No minimum proximity to a stop is required for an in-coverage location.
- "The three-line button" refers to the current map control labeled "Stops in view"; "center" refers to the existing recenter control, which remains.
- Nearby bus stops are communicated by the existing stop markers visible around the user's location; no new stop-list or route-planning feature is included.
