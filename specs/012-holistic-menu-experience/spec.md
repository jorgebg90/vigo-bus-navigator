# Feature Specification: Holistic Menu Experience

**Feature Branch**: `012-holistic-menu-experience`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Improve the UX of the app menus and create a more holistic experience, using the route planner as the best visual reference."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate a consistent app (Priority: P1)

A rider moves between the main app sections, including the map, search, journey planning, lines, and saved items. The navigation makes the current section easy to identify, works across screen sizes, and presents the same visual language throughout the app. The route planner remains the visual quality reference; its existing experience is not degraded.

**Why this priority**: Consistent, predictable navigation is the foundation for making every menu feel like part of one product.

**Independent Test**: Visit each primary section on a narrow phone viewport and a wide viewport; verify the active destination is clear, the section content is reachable, and controls remain usable.

**Acceptance Scenarios**:

1. **Given** a rider is in any primary section, **When** they select another destination, **Then** the app opens that destination and clearly indicates which section is active.
2. **Given** the app is viewed on a phone, tablet, or desktop, **When** the viewport changes, **Then** navigation adapts without obscuring content or making destinations unreachable.
3. **Given** the route planner is open, **When** the shared visual language is applied elsewhere, **Then** the route planner's current visual hierarchy and task flow remain intact.

### User Story 2 - Find and continue a transit journey (Priority: P1)

A rider can begin a search for a stop, line, or destination from any primary section. From a stop or line, the rider can continue to related tasks such as planning a journey to or from that place, viewing it on the map, or saving it as a favorite. Moving between these tasks should feel connected rather than like starting over.

**Why this priority**: Connecting discovery and trip planning turns separate menus into a useful end-to-end transit experience.

**Independent Test**: Start in a non-planner section, find a stop or line, and follow a relevant action into the map or journey planner; verify the selected place is carried into the next task where applicable.

**Acceptance Scenarios**:

1. **Given** a rider is in any primary section, **When** they open search and enter a query, **Then** they can discover matching stops, lines, and destinations in a consistent search experience.
2. **Given** a rider is viewing a stop or line, **When** they choose a relevant follow-up action, **Then** the app opens the corresponding map or journey-planning task with applicable context preserved.
3. **Given** a rider navigates between primary sections during a task, **When** they return to the original section, **Then** the app preserves the meaningful in-progress context unless the rider explicitly resets it.

### User Story 3 - Understand every interface state (Priority: P2)

A rider receives clear feedback while content is loading, when there is no content, when a request fails, or when the app is offline. Recovery actions are apparent, and status messages are presented consistently across menus and panels.

**Why this priority**: Clear states prevent dead ends and make the app feel reliable even when data is unavailable.

**Independent Test**: Exercise loading, empty, error, and offline conditions in the primary sections; verify each state explains what happened and provides an appropriate next action.

**Acceptance Scenarios**:

1. **Given** content is loading, **When** a rider opens a section, **Then** a consistent loading indication appears without presenting incomplete content as final.
2. **Given** a section has no matching or saved content, **When** it is displayed, **Then** the empty state explains the situation and offers a relevant next action when one exists.
3. **Given** data cannot be loaded or the app is offline, **When** a rider opens or refreshes a section, **Then** the interface explains the issue and offers an appropriate retry or offline action.

### User Story 4 - Use menus accessibly (Priority: P2)

A rider can operate the menus, search, panels, and navigation with touch, keyboard, and assistive technology. The experience remains understandable with reduced motion and in each supported app language.

**Why this priority**: A coherent experience must be usable by riders with different devices, abilities, and language preferences.

**Independent Test**: Complete primary navigation and search tasks using keyboard-only input and screen-reader semantics, and inspect touch targets, contrast, language, and reduced-motion behavior.

**Acceptance Scenarios**:

1. **Given** a rider uses a keyboard, **When** they navigate the menus and open or close a panel, **Then** focus order is logical, focus remains visible, and every action is operable.
2. **Given** a rider uses touch, **When** they activate navigation or common actions, **Then** interactive targets meet the minimum size and are not obscured by other interface elements.
3. **Given** a rider has enabled reduced motion or selected a supported language, **When** they use the app, **Then** non-essential motion is reduced and all added interface text is localized consistently.

### Edge Cases

- A search has no matches, has not yet been entered, or is cleared while results are visible.
- The rider switches destination while a search or data load is in progress.
- A stop or line is unavailable, has no associated follow-up action, or disappears before an action is completed.
- The browser goes offline during navigation or a data request, then reconnects.
- A viewport is resized or its orientation changes while a menu, search result, or panel is open.
- A rider uses keyboard navigation, a screen reader, reduced motion, or a language with longer translated labels.
- There are no favorites or recent items, or local saved data is unavailable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a consistent visual language across its primary navigation and existing sections, using the route planner as the quality reference without reducing its current usability.
- **FR-002**: The app MUST present a clear active state for the current primary destination and keep each primary destination reachable at phone, tablet, and desktop viewport sizes.
- **FR-003**: The app MUST use consistent visual and interaction patterns for reusable content groups, section headings, selectable filters, list items, empty states, and expandable panels.
- **FR-004**: The app MUST provide a consistent search entry point from every primary section and allow riders to search existing stop, line, and destination data.
- **FR-005**: The app MUST provide relevant actions from stop and line details to journey planning, map viewing, and favorites, where the destination and current data support those actions.
- **FR-006**: When a rider follows a cross-section action, the app MUST carry forward relevant selected stop, line, or journey context and MUST provide a predictable way to return.
- **FR-007**: The app MUST provide consistent loading, empty, error, and offline states in the sections and panels that display transit or saved content.
- **FR-008**: Error and offline states MUST explain the condition in user-facing language and provide retry or another relevant next action when possible.
- **FR-009**: The app MUST meet WCAG 2.2 AA requirements for the covered experience, including keyboard operability, visible focus, semantic labels, sufficient contrast, and touch targets of at least 44 CSS pixels.
- **FR-010**: The app MUST respect reduced-motion preferences and localize all new or changed user-facing text in Galician, Spanish, and English.
- **FR-011**: Menu and search changes MUST preserve existing favorites, settings, privacy behavior, and offline indicators; they MUST NOT introduce user accounts or new activity tracking.
- **FR-012**: The app MUST keep primary navigation, search results, and panel content usable when labels are longer due to localization or when content is absent or unavailable.

## Assumptions

- The existing primary destinations are map, search, journey planning, lines, and saved items. Settings/language remains a header utility, and privacy information remains accessible from its existing entry point rather than becoming a new primary destination.
- The route planner's current visual experience is the reference to extend, not a feature to redesign.
- “Unified search” means one consistent search experience over data the app already exposes; it does not add a new transit-data provider or expand source permissions.
- Existing local preferences and favorites remain stored and handled according to the project's privacy principles; this feature adds no user identity or activity-retention mechanism.
- Supported product languages are Galician, Spanish, and English.
- Accessibility is validated against WCAG 2.2 AA, including the project's 44 CSS pixel minimum for touch targets.
- Implementation details, component boundaries, and delivery sequencing are determined during planning.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Riders can reach every primary destination from every primary section in no more than one navigation action, on phone, tablet, and desktop layouts.
- **SC-002**: In usability validation, at least 90% of participants can locate a stop or line and initiate a relevant follow-up action without assistance.
- **SC-003**: All primary sections have reviewed loading, empty, error, and offline states; no tested state leaves the rider without an explanation or an available next step where one is possible.
- **SC-004**: All covered navigation, search, and panel tasks can be completed using keyboard-only operation, with visible focus and no keyboard traps.
- **SC-005**: All interactive targets in the covered experience meet or exceed 44 CSS pixels, and all reviewed text and controls meet WCAG 2.2 AA contrast requirements.
- **SC-006**: New and changed user-facing text is available in all three supported languages, and reduced-motion preferences are respected in all covered interactions.
- **SC-007**: Riders can complete a journey from search or a stop/line detail into a relevant map or trip-planning action without re-entering context that the app already knows.
