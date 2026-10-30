# Feature Specification: Improve Mobile Map Usability

**Feature Branch**: `010-mobile-map-usability`

**Created**: 2026-10-29

**Status**: Implemented

**Input**: User description: "Vamos a hacer una nueva spec para mejorar el frontend de la aplicación. Si no se puede usar la ubicación no tiene que mostrar ningún mensaje ya que ocupa mucho en la pantalla en el movil. Cuando se carga una linea hasta que se situa en el mapa el recorrido de paradas, debería haber una transición amigable porque parece que se ha quedado rota la interfaz. Cuando se abre una linea, se amplia y luego se contrae. el botón X no cierra el detalle y no vuelve al mapa completo en movil. Luego iremos viendo que mas podemos ir arreglando."

## User Scenarios & Testing

### User Story 1 - Close line details and return to the full map (Priority: P1)

As a person browsing bus lines on a mobile device, I want the close button to dismiss the selected line and restore the map to its full view, so I can continue exploring without getting trapped in a partially expanded layout.

**Why this priority**: The close control currently fails to return to the expected map view, blocking a basic navigation flow on mobile.

**Independent Test**: Open a line's details on a mobile viewport, activate the close button, and verify that the details are dismissed and the map returns to its full available view.

**Acceptance Scenarios**:

1. **Given** a line's details are open on a mobile device, **When** the user activates the close button, **Then** the details close and the map returns to its full view.
2. **Given** a line's details are expanded or collapsed, **When** the user closes them, **Then** the same close behavior restores the map without requiring an extra gesture or reload.
3. **Given** line details are closing while a route is visible, **When** the close action completes, **Then** the map remains usable and does not retain a stale line-detail overlay.

### User Story 2 - Understand that a selected line is loading (Priority: P1)

As a person selecting a bus line, I want clear, calm visual feedback while its route is being prepared for the map, so I know the app is responding and do not mistake the temporary transition for a broken interface.

**Why this priority**: Route loading is part of the central line-browsing flow; without feedback, users may think the application has stopped working.

**Independent Test**: Delay route availability in a deterministic test, select a line, and verify that a stable loading transition is shown until the route appears or an outcome is reported.

**Acceptance Scenarios**:

1. **Given** a user selects a line whose route is not yet ready, **When** the map is preparing to display it, **Then** the interface provides immediate visual feedback and remains responsive.
2. **Given** the selected line's route becomes available, **When** it is placed on the map, **Then** the loading feedback gives way to the route in a coherent transition without a blank or apparently broken interface.
3. **Given** route loading takes longer than expected or fails, **When** the loading outcome becomes known, **Then** the interface communicates that outcome clearly and does not remain in a loading state indefinitely.
4. **Given** the user prefers reduced motion, **When** the line selection or route display changes, **Then** the transition avoids non-essential animation.

### User Story 3 - Browse the map without a location warning taking space (Priority: P2)

As a person using the app on a mobile device, I want to keep using the map when my location is unavailable without a large location-related message taking up screen space, so more of the map remains visible.

**Why this priority**: Location is optional for browsing transit, and a persistent warning consumes valuable space on a small screen.

**Independent Test**: On a mobile viewport, deny location permission or simulate unavailable location and verify that no location-unavailable message occupies the map while line and map browsing remain available.

**Acceptance Scenarios**:

1. **Given** location permission is denied, location is unavailable, or the position is outside the supported map area on a mobile device, **When** the map is displayed, **Then** no location-unavailable message is shown and the user can still browse lines and the map.
2. **Given** location is unavailable, **When** the user interacts with other map or line controls, **Then** those controls remain visible and usable.
3. **Given** location becomes available after initially being unavailable, **When** the user requests or enables location again, **Then** the map can use the location without requiring a page reload.

### User Story 4 - Open a route from a stop's line icon (Priority: P1)

As a person viewing a stop's arrivals, I want to open a line's route by activating its line icon, so the arrival I am checking takes me directly to that line.

**Independent Test**: Open a stop with an arrival for a line present in the loaded catalog, activate the line icon beside the arrival, and verify that the selected line route is displayed.

**Acceptance Scenarios**:

1. **Given** a stop arrival's line is present in the loaded line catalog, **When** the user activates its line icon, **Then** the application opens that line's route.
2. **Given** an arrival line icon has keyboard focus, **When** the user activates it with the keyboard, **Then** the same route opens and the icon has a localized accessible name.
3. **Given** line details are unavailable in the catalog, **When** arrivals are displayed, **Then** their line icons remain informational and do not imply an unavailable action.
4. **Given** a stop summary shows a catalog-backed line badge, **When** the user activates it, **Then** the same line route opens.
5. **Given** a route stop lists a catalog-backed line badge, **When** the user activates it, **Then** the view switches to that line's route.
6. **Given** a route-stop badge has keyboard focus, **When** the user activates it, **Then** the same route opens with a localized accessible name.

### User Story 5 - Use the full screen for line details on portrait mobile layouts (Priority: P1)

As a person browsing a line on a phone or portrait tablet, I want the line details and stop list to span the available screen width, so they do not appear in a narrow panel offset to the side.

**Independent Test**: Open a line at 390 × 844 and 768 × 1024 portrait viewports and verify that the line panel spans the viewport and its stop list remains within the panel.

**Acceptance Scenarios**:

1. **Given** a line is open at a viewport up to 599 px wide, **When** its route and stops are displayed, **Then** the line panel spans the full viewport width.
2. **Given** a line is open in portrait orientation up to 1023 px wide, **When** its route and stops are displayed, **Then** the line panel spans the full viewport width and the map remains usable above it.
3. **Given** route stops are displayed in either layout, **When** the user scrolls the line details, **Then** the stop list remains within the panel without horizontal overflow.
4. **Given** a line is open on desktop, **When** a route direction is displayed, **Then** its heading uses the compact line-view heading style instead of oversized browser defaults.

### User Story 6 - Choose a supported interface language (Priority: P2)

As a person using the application, I want the language selector to offer only Castellano and Galego, so I am not offered an English interface that the product does not support.

**Independent Test**: Open language settings and verify that only Castellano and Galego are offered; load a saved English preference and verify that the application uses and saves Castellano instead.

**Acceptance Scenarios**:

1. **Given** the user opens language settings, **When** the language choices are displayed, **Then** only Castellano and Galego are offered.
2. **Given** a saved preference from an older version specifies English, **When** preferences are loaded, **Then** the application migrates that preference to Castellano.

### Edge Cases

- The user closes line details while route data is still loading.
- The user selects a different line before the previous line's route transition completes.
- Route data is delayed, unavailable, or fails after loading feedback begins.
- The line details are at different expansion states when the user closes them.
- Location is denied, unsupported, unavailable temporarily, outside the supported map area, or later becomes available.
- The viewport is narrow or the device uses text zoom, increasing the space occupied by controls.
- The user has enabled reduced motion.
- A stop lists a line whose route details are unavailable in the loaded catalog.
- The viewport is portrait and wider than 599 px but no wider than 1023 px.
- A previously saved preference specifies the removed English locale.

## Requirements

### Functional Requirements

- **FR-001**: On mobile viewports, the application MUST close selected-line details when the user activates their close button.
- **FR-002**: After selected-line details close on mobile, the application MUST restore the map to its full available view without requiring a page reload or additional gesture.
- **FR-003**: The close action MUST behave consistently whether the line details are expanded or collapsed.
- **FR-004**: When a user selects a line whose route is not yet visible, the application MUST provide immediate visual feedback in a full-screen, translucent overlay with a visible loading indicator.
- **FR-005**: The line-loading transition MUST keep the interface responsive and transition coherently to the route when it becomes available, without presenting a blank or apparently broken state.
- **FR-006**: If route loading fails or cannot complete, the application MUST end the loading feedback and communicate the outcome while keeping map and line browsing usable.
- **FR-007**: Line selection and route transitions MUST avoid non-essential animation when the user has requested reduced motion.
- **FR-008**: On mobile viewports, the application MUST NOT display a location-unavailable, permission-denied, or outside-coverage message when location cannot be used.
- **FR-009**: The absence of a location-unavailable message MUST NOT prevent the user from browsing the map, lines, or other available transit information.
- **FR-010**: Location-related messaging on non-mobile viewports MUST retain its existing behavior unless changed by a separately approved requirement.
- **FR-011**: A line icon beside an arrival MUST open that line's route when the line is present in the loaded catalog; the control MUST be keyboard-operable and have a localized accessible name. Catalog-backed line badges in the stop summary MUST provide the same navigation.
- **FR-012**: A line badge beside a stop in a selected line's route MUST open the matching line route when that line is present in the loaded catalog; the badge MUST be keyboard-operable and have a localized accessible name.
- **FR-013**: In the mobile responsive layout, including portrait viewports up to 1023 px wide, selected-line details MUST use the full available viewport width and keep the stop list within the panel without horizontal overflow.
- **FR-014**: The language selector MUST offer only Castellano and Galego. A saved English language preference MUST be migrated to Castellano when user preferences are loaded.
- **FR-015**: Route-direction headings MUST use the compact line-view heading style at all viewport sizes and MUST NOT retain oversized browser-default margins.

### Key Entities

- **Line Detail View**: The selected line's information panel, which may be expanded or collapsed and can be dismissed.
- **Line Route Loading State**: The user-visible state between selecting a line and displaying its route or reporting an outcome.
- **Location Availability**: Whether the application can currently use the device's location, independently of the user's ability to browse transit information.
- **Map View**: The visible and interactive map area, including its full mobile view when no line detail panel is open.
- **Stop Line Route Link**: An accessible action on an arrival's line icon, a selected stop's line badge, or a route stop's line badge that opens the corresponding catalog line route.
- **Supported Interface Language**: Castellano or Galego, the two language choices exposed by the application.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In all tested mobile line-detail states, activating the close control dismisses the details and restores the full map without reload or an extra gesture.
- **SC-002**: In all tested delayed-route scenarios, users receive visible feedback within 0.5 seconds of selecting a line, and the interface does not appear unresponsive while the route is prepared.
- **SC-003**: In all tested route success and failure scenarios, loading feedback reaches a clear terminal state; no scenario leaves an indefinite loading presentation.
- **SC-004**: In 100% of tested mobile cases where location is denied, unavailable, or outside the supported map area, no location-unavailable message occupies the map view, and line and map browsing remain usable.
- **SC-005**: In all tested reduced-motion scenarios, essential state changes remain perceivable without non-essential motion.
- **SC-006**: In all tested stop arrivals with catalog-backed lines, activating the line icon opens the matching route; catalog-missing icons remain non-interactive.
- **SC-007**: In all tested route stops with catalog-backed line badges, activating the badge opens the matching route; catalog-missing badges remain informational.
- **SC-008**: At tested 390 px and 768 px portrait viewports, selected-line details span the viewport width and the stop list stays within the panel.
- **SC-009**: The language menu exposes exactly Castellano and Galego, and a legacy English preference is migrated to Castellano.
- **SC-010**: Route-direction headings use the defined 18 px line-view style with zero default margins on desktop and mobile.

## Assumptions

- Mobile behavior is determined by the application's responsive mobile layout, not by a specific device model.
- The location messages in scope are those shown when location cannot be used, including denied permission, unavailable position, or a position outside the supported map area; this change does not remove location controls or prevent a later location request.
- A message that reports no nearby stops after a usable location has been applied is not an unavailable-location message and remains in scope only for its existing behavior.
- The route transition should communicate progress without blocking map or line interactions.
- Existing non-mobile location messaging remains unchanged to limit the scope to the mobile space constraint described by the user.
- This feature includes the three original mobile usability issues, direct stop-to-line route navigation, responsive line-panel sizing, and the two supported interface languages; unrelated frontend improvements will be specified separately.
