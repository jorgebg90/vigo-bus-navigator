# Feature Specification: Improve Frontend Design

**Feature Branch**: `003-improve-frontend-design`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "Create a frontend design validated by the UX Designer that resembles Moovit (for example https://moovitapp.com/tripplan/salamanca-3863/lines/es?ref=16&customerId=4908) but is based on the colors of the Vigo flag (white and soft red). It must be responsive, accessible, and friendly. It will have no ads, since it is a personal project that will be open source for the community. The map will show stops positioned by the coordinates returned by the API calls. Selecting a stop returns the time remaining for each bus at that stop. Each stop has a favorites icon to save it. Regarding the disclaimer from a previous arrivals project that was not adopted, remove those references from current materials."

## Clarifications

### Session 2026-10-26

- Q: ¿Quieres eliminar las menciones al proyecto anterior también de las specs y los posts históricos de la feature 002, o conservarlas como registro de decisiones anteriores y limitar la limpieza al código, los avisos legales y la documentación vigente? → A: Conservar los artefactos históricos de la feature 002 con una nota correctiva; eliminar las referencias del código, avisos legales y documentación vigente.

### Session 2026-10-27

- The rider-facing theme is fixed to Claro; there is no dark/system theme choice. Existing saved dark/system preferences are migrated to Claro.
- The header language control uses a globe icon and offers Castellano (`es`), Galego (`gl`), and English (`en`). A cleared profile defaults to Castellano.
- Favorites are stop-only. Lines may remain in Recent, but a line is not a favorite target.
- Do not show an in-app privacy disclosure, privacy page, or privacy links. Keep only the map-provider attribution required by the tile providers; data-minimization constraints remain technical requirements and are not user-facing copy.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find a stop on the map and see upcoming buses (Priority: P1)

A rider opens the app and sees a map of Vigo with the bus stops placed at the positions provided by the service. The rider selects a nearby stop and immediately sees, for each upcoming bus, its line, destination, and the minutes remaining until it arrives at that stop.

**Why this priority**: Knowing how long until the next bus at a specific stop is the main reason riders open a transit app; the map makes the stop easy to locate visually.

**Independent Test**: Load the app with the service catalog, select any stop on the map, and verify that the stop details show the upcoming buses with line, destination, and minutes, or a clear state when no data is available.

**Acceptance Scenarios**:

1. **Given** the service returns stops with coordinates, **When** the rider opens the map, **Then** every stop with valid coordinates is shown at its reported position and no stop is shown at an invented position.
2. **Given** the map is visible, **When** the rider selects a stop, **Then** the stop details show the stop name and number and a list of upcoming buses, each with line, destination, and minutes remaining, ordered from soonest to latest.
3. **Given** the stop details are open and the app is in the foreground, **When** the 30-second refresh interval elapses, **Then** the list requests updated arrival information and indicates its freshness without moving focus or making disruptive repeated announcements.
4. **Given** the selected stop has no upcoming buses, or arrival information is temporarily unavailable, **When** the details open, **Then** the rider sees a clear, friendly message explaining the situation and, where applicable, a way to try again.
5. **Given** many stops are visible at a city-wide view, **When** the rider looks at the map, **Then** the stops remain distinguishable and selectable, and zooming in reveals individual stops.
6. **Given** stops overlap or are too close to have separate 44 by 44 CSS pixel targets at the current zoom, **When** the rider selects their grouped map marker, **Then** the map expands the group or presents a chooser with a separate 44 by 44 CSS pixel target for every stop, and selecting one opens the shared stop-arrivals details.

---

### User Story 2 - Save and reopen favorite stops (Priority: P2)

A rider marks a stop as a favorite using its favorite control, and later reopens it directly from Saved without searching the map again. Lines are not favorite targets; a line opened by the rider may appear in Recent.

**Why this priority**: Most riders use a small set of stops repeatedly; favorites make daily use fast.

**Independent Test**: Mark a stop as a favorite, reload the app, open it from Saved, and verify the map focuses that stop and opens its arrivals; remove the favorite and verify it disappears.

**Acceptance Scenarios**:

1. **Given** a stop's details are open, **When** the rider activates the favorites icon, **Then** the stop is saved as a favorite and the icon visibly and programmatically changes to its saved state.
2. **Given** a stop is a favorite, **When** the rider activates the favorites icon again, **Then** the stop is removed from favorites and the icon returns to its unsaved state.
3. **Given** the rider has favorite stops, **When** the rider reopens the app on the same device and browser, **Then** the favorites are still present and each one opens that stop's upcoming buses.
4. **Given** a stop appears in a list (search results or favorites), **When** the rider views that entry, **Then** its favorite state is visible and can be changed from that entry.
5. **Given** the rider has recent views and has selected a language, **When** the app is reloaded on the same device and browser, **Then** recent views and language are restored from local storage and remain unavailable to network requests, and the app remains in Claro.

---

### User Story 3 - Browse lines and find stops without the map (Priority: P3)

A rider browses the list of bus lines, each shown with its line badge and route name, and searches stops by name or number. This gives a complete alternative to the map for riders who cannot or prefer not to use it.

**Why this priority**: Moovit-style line browsing helps riders who know their line, and a non-map path is required so the core task is accessible to keyboard and screen-reader users.

**Independent Test**: Without interacting with the map, search for a stop by name or number, open its upcoming buses, then browse the line list and open a line's details.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the rider opens the lines list, **Then** every line returned by the service is shown with a visible line badge, code, and name, and can be filtered by typing.
2. **Given** the rider types a stop name or number, **When** results appear, **Then** selecting a result opens the same stop details as selecting the stop on the map.
3. **Given** the rider selects a line, **When** its details open, **Then** the rider sees the existing frequency information when it is published, or a clear message when it is not, and can locate that line's stops.
4. **Given** a line has published frequency information, **When** the rider opens its details, **Then** the rider can choose weekday, Saturday, or Sunday/holiday and sees the first and last departure and time bands for the chosen day type.
5. **Given** a line has no published frequency information for the chosen day type, **When** that day type is selected, **Then** the rider sees a clear no-service or unavailable message and is not shown invented frequencies.

---

### User Story 4 - Use a friendly, accessible app on any device (Priority: P4)

A rider uses the app on a phone, tablet, or desktop, with touch, mouse, keyboard, or assistive technology, in a clean interface based on white and soft red tones, with no advertising.

**Why this priority**: The visual and responsive redesign is the purpose of this feature; it must not exclude anyone.

**Independent Test**: Complete Stories 1–3 at phone, tablet, and desktop widths, using touch, keyboard only, and a screen reader, and review the screens for color, contrast, and absence of advertising.

**Acceptance Scenarios**:

1. **Given** a phone-sized screen, **When** the rider uses the app, **Then** the map uses most of the screen and stop details, lists, and favorites are reachable without horizontal scrolling or overlapping content.
2. **Given** a desktop-sized screen, **When** the rider uses the app, **Then** lists and stop details are shown in a side panel beside the map.
3. **Given** a keyboard-only rider, **When** they navigate the app, **Then** all functionality is reachable in a logical order with a clearly visible focus indicator, and opening or closing panels moves focus predictably.
4. **Given** a screen-reader rider, **When** they open a stop, **Then** the stop name, upcoming buses, update status, and favorite state are announced with meaningful names.
5. **Given** any screen, **When** it is reviewed, **Then** the interface uses the white and soft red palette, all text and essential graphics meet the required contrast, and there are no advertisements, sponsored content, or app-install promotions.
6. **Given** the app is opened without a saved language, **When** the rider uses the interface, **Then** Castellano is selected by default and Castellano, Galego, and English are available from the globe control with complete visible and assistive text.
7. **Given** the rider has enabled reduced motion in the device settings, **When** the rider uses or changes views in the app, **Then** non-essential transitions and animations are reduced or removed without loss of information or functionality.
8. **Given** the rider uses a tablet in portrait or landscape orientation, **When** they find a stop and open its arrivals, **Then** the design keeps the map and stop details usable without overlapping or clipped content and preserves access to line browsing, favorites, and keyboard/touch controls.

---

### User Story 5 - Accurate project attribution (Priority: P5)

As the project owner, I want the distributed project to contain only accurate provenance notices, so that it does not reference projects whose code it does not use.

**Why this priority**: Accurate notices matter for an open-source release, but they do not change the rider experience.

**Independent Test**: Search current product code, legal notices, current documentation, and app screens for the retired source name, and run the existing arrivals text-cleanup cases against the independent replacement. Confirm that historical feature-002 artifacts carry a superseding correction and are not represented as current policy.

**Acceptance Scenarios**:

1. **Given** the remaining copied text-cleanup logic has been independently replaced, **When** current product code, legal notices, and current documentation are reviewed, **Then** they contain no retired source name or copied code.
2. **Given** source text with broken accented characters, quotes, or asterisks, **When** arrivals are shown, **Then** line and destination text is displayed as cleanly as before the replacement.
3. **Given** historical feature-002 specifications or posts mention the previous project, **When** they are reviewed, **Then** a superseding correction states that the project uses alternative sources and that the planned dependency was not adopted, without rewriting the historical record.
4. **Given** the project documentation and legal notices are distributed, **When** their identity and provenance are reviewed, **Then** they accurately identify the community project and do not imply that it is an official service of the public transport operator.
5. **Given** the map is open, **When** the rider views its attribution strip, **Then** the required linked OpenStreetMap and CARTO credits are visible without a privacy link.

### Edge Cases

- A stop returned by the service has missing or invalid coordinates: it is not placed on the map, but remains findable through search.
- Multiple stops share or nearly share the same position: each remains individually selectable.
- Stops are too dense to expose individual 44 by 44 CSS pixel targets at the current zoom: the approved design groups them and lets the rider expand or choose each stop without losing its exact location.
- The rider selects another stop while arrivals for the previous stop are loading: only the latest selected stop's information is shown.
- The rider marks a favorite while offline: the favorite is saved; arrival information shows its offline or unavailable state.
- A favorite stop no longer appears in the service catalog: the favorite remains visible as unavailable and can be removed.
- Map tiles fail to load or the device cannot display the map: the rider is informed and can still find stops and arrivals through search and lists.
- Browser storage is unavailable or full: the rider is informed that favorites cannot be saved on this device.
- Very long stop names, destinations, or line names: text wraps without hiding times or controls.
- Text enlarged to 200% or a 320 CSS pixel-wide viewport: content reflows without loss of information or functionality.
- The rider prefers reduced motion: transitions are minimized without removing information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The UX Designer MUST provide a design baseline for this feature, covering phone, tablet portrait and landscape, and desktop layouts; the white and soft red palette; named light-theme color tokens and their foreground/background pairings; components; primary navigation among map, lines, stop search, favorites, and recent views; a globe language control; panel opening/closing and focus-return behavior; dense-stop map interactions; and loading, empty, error, offline, and focus states. The baseline MUST demonstrate WCAG 2.2 AA contrast thresholds and minimum 44 by 44 CSS pixel interactive targets, including map controls. The design MUST be approved by the UX Designer and agreed by the Frontend Developer before implementation starts.
- **FR-002**: The interface MUST follow a Moovit-like structure—a prominent map with an adjacent or overlaid panel for lines, stops, and stop details—while using original visuals, names, and assets of this project.
- **FR-003**: The visual identity MUST be based on white and soft red tones inspired by the Vigo flag, with neutral supporting tones; deeper variants of the red MUST be used wherever needed to meet contrast requirements.
- **FR-004**: The map MUST show every stop returned by the service that has valid coordinates, positioned exactly at those coordinates, and MUST NOT show stops from any other source.
- **FR-005**: Selecting a stop from the map, search results, line details, or favorites MUST open the same stop details.
- **FR-006**: Stop details MUST show the stop name, stop number, and each upcoming bus with its line, destination, and minutes remaining until arrival at that stop, ordered from soonest to latest.
- **FR-007**: Stop details MUST show how recent the arrival information is and distinguish current (stored less than 30 seconds ago), stale (at least 30 but less than 300 seconds old, served only when an upstream refresh fails), empty, unavailable, and offline states with clear text, not color alone. The UI MUST display source-provided arrival estimates without describing them as schedule delays unless a scheduled-versus-observed comparison is available.
- **FR-008**: Arrival information MUST refresh every 30 seconds only while the stop details are visible and the app is in the foreground, without moving focus or causing repeated, disruptive announcements. If there is no upstream response and the last-known result is at least 300 seconds old, the UI MUST show unavailable rather than stale data.
- **FR-009**: Every stop shown in stop details, search results, and favorites MUST include a favorites icon that toggles that stop's favorite state, with an accessible name identifying the stop and an exposed pressed or selected state.
- **FR-010**: Stop favorites, recent views, and language MUST be stored only in the rider's browser `localStorage` on the current device. Saved MUST list favorite stops, each of which can be opened or removed. Lines are not favorite targets. The app MUST use the fixed light appearance and MUST migrate previously stored non-light theme values to light.
- **FR-011**: Existing recent views MUST remain available in the new design. For lines with published data, riders MUST be able to view weekday, Saturday, and Sunday/holiday service independently, including first and last departures and frequency time bands; missing service MUST be identified without inventing data. Existing language selection and offline behavior MUST remain available.
- **FR-012**: The app MUST provide a lines list showing every line returned by the service with a line badge, code, and name, filterable by text.
- **FR-013**: The app MUST allow searching stops by name or stop number as a complete alternative to selecting stops on the map.
- **FR-014**: The layout MUST adapt to phone, tablet, and desktop screens, MUST be usable at 320 CSS pixels wide and at 200% text size without horizontal scrolling or loss of content, and MUST support touch, mouse, and keyboard.
- **FR-015**: The interface MUST conform to WCAG 2.2 Level AA in the light theme, including keyboard operability, visible focus, logical focus order, semantic structure, accessible names, status announcements, and respect for reduced-motion preferences. Normal text MUST have a contrast ratio of at least 4.5:1; large text and essential non-text UI/map graphics MUST have at least 3:1 contrast against adjacent colors; focus indicators MUST have at least 3:1 contrast against adjacent colors; and interactive targets MUST be at least 44 by 44 CSS pixels.
- **FR-016**: The app MUST contain no advertisements, sponsored content, ad networks, advertising trackers, or app-install promotions.
- **FR-017**: All interface text MUST remain available in Castellano (`es`), Galego (`gl`), and English (`en`), with Castellano as the default and a globe icon opening the language selector.
- **FR-018**: The app UI MUST NOT include a privacy disclosure/page, privacy link, or implementation/network explanation. Required provider attribution MUST remain visible. Project identity and provenance information belongs in repository documentation, not the rider-facing interface.
- **FR-019**: The current product code, legal notices, app screens, and current documentation MUST NOT reference the retired source name. Because arrival data comes from alternative sources but the arrivals text cleanup still contains copied logic (the character-repair table and quote/asterisk cleanup), that cleanup MUST first be replaced independently while preserving rider-visible results for the same source text. Historical feature-002 specifications and posts MUST remain intact as records of prior decisions and MUST receive a superseding correction explaining that the planned dependency was not adopted and alternative sources are used. Historical references MUST NOT be presented as current project policy.
- **FR-020**: The UX Designer MUST validate the implemented interface against the approved design and WCAG 2.2 AA using both automated and manual checks before the feature is accepted.
- **FR-021**: Browser requests MUST NOT include favorite stops, recent views, language preferences, account identifiers, or precise device location. An arrival request from the browser MAY disclose only the selected public stop identifier to the project Worker. The Worker MAY forward that identifier and source-required transient form state, generated for the single lookup, to the fixed public arrivals source; it MUST NOT forward browser favorites, preferences, account identifiers, or precise device location. Map tile requests MAY disclose the visible map tile coordinates and ordinary network metadata to the tile provider. The app MUST NOT request device geolocation or claim that third-party network metadata is anonymous or controlled by the project.
- **FR-022**: The app MUST NOT expose a user-facing privacy disclosure or link. Technical network constraints in FR-021 remain enforced and tested without explanatory copy in the app.

### Key Entities *(include if feature involves data)*

- **Stop**: A public bus stop with a number, name, and optional coordinates provided by the service; it can be selected and saved as a favorite.
- **Upcoming Bus**: An expected arrival at a stop, with line, destination, minutes remaining, and the time the information was produced.
- **Line**: A bus line with code, name, badge color, its stops, and optional published frequency information.
- **Favorite**: A stop saved by the rider on the current device and browser, in a user-defined order.
- **Design Baseline**: The UX Designer-approved layouts, palette, components, interactions, and states that implementation must follow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In moderated usability testing with at least 10 riders, at least 90% (at least 9 of 10) of first attempts to find a named stop and read its next bus succeed within 30 seconds of opening the app.
- **SC-002**: 100% of stops with valid service coordinates appear at their reported positions in a review of at least 30 reference stops, and 0 stops appear at positions not provided by the service.
- **SC-003**: Under a reproducible simulated mobile network profile of 10 Mbps download, 2 Mbps upload, 100 ms round-trip latency, and no packet loss, at least 95% of 20 stop selections show a loading state within 1 second and either arrivals or a clear terminal status within 10 seconds.
- **SC-004**: A rider can save or remove a favorite stop in one action from stop details, and 100% of saved favorites remain after reloading the app on the same device and browser.
- **SC-005**: Automated accessibility checks report 0 WCAG 2.2 AA violations on the map, lines, stop search, stop details, and Saved, and the UX Designer's manual keyboard, screen-reader, reduced-motion, light-theme contrast, reflow, and target-size review records 0 unresolved failures.
- **SC-006**: All primary flows can be completed without horizontal scrolling at 320 CSS pixels, tablet viewports of 768 by 1024 and 1024 by 768 CSS pixels, and 1280 CSS pixels, and at 200% text size.
- **SC-007**: A review of all screens and network activity finds 0 advertisements, sponsored items, app-install promotions, or advertising or analytics trackers.
- **SC-008**: Before implementation, the UX Designer records design approval and the Frontend Developer records agreement with that design baseline; before acceptance, the UX Designer records an approved design-fidelity and accessibility verdict.
- **SC-009**: The redesigned app stays within the project's existing download-size budgets for low-end devices and metered connections.
- **SC-010**: A review of current product code, legal notices, app screens, and current documentation finds 0 references to the retired source and 0 code copied from it; historical feature-002 artifacts contain a superseding correction; arrivals show the same line and destination text as before for every existing source-text test case.
- **SC-011**: A browser network inspection of catalog browsing, map use, stop selection, and favorites finds no favorite, recent-view, preference, account, or device-location data in requests; browser-to-Worker arrival requests contain only the selected public stop identifier; Worker-to-source requests contain that identifier and only source-required transient form state; and map tile requests disclose visible tile coordinates and ordinary network metadata to the map tile provider.
- **SC-012**: With controlled arrival responses, the UI labels results stored under 30 seconds as current, labels last-known results older than 30 and younger than 300 seconds as stale only after an upstream failure, and labels results unavailable when no current or last-known response younger than 300 seconds exists.
- **SC-013**: A new profile starts in the light appearance; a legacy dark/system preference is migrated to light; the header globe opens exactly three language choices: Castellano, Galego, and English; no theme or privacy controls are present in the UI.
- **SC-014**: All active interface and assistive text in the map, lines, search, arrivals, favorites, and recents is present in Castellano, Galego, and English; a new or cleared profile selects Castellano by default.
- **SC-015**: With reduced motion enabled at the operating-system level, all non-essential transitions and animations are reduced or removed in the primary user flows.

## Assumptions

- "Resembles Moovit" refers to information structure and interaction patterns, not copying Moovit's branding, icons, text, or assets.
- "Vigo flag colors" are interpreted as described by the owner: white with soft red accents; exact tones are defined in the design baseline and adjusted to meet contrast requirements.
- Stop coordinates come only from the project's existing service. Upcoming bus times come from the existing arrivals capability; the service does not provide live vehicle positions, so moving buses are out of scope.
- Favorite stops extend the existing device-local favorites; there are no accounts, synchronization, or cross-device favorites.
- The app has a fixed light appearance; legacy system/dark preferences are migrated to light and no theme selector is shown.
- Lines without published frequency data continue to state honestly that such data is unavailable; this feature does not add new schedule data.
- Provider data-minimization boundaries remain technical requirements, but the app does not explain internal request paths or show privacy copy or links. Required map-provider attribution remains visible.
- Network behavior follows the constitution: public catalog requests contain no user profile data; an arrival request discloses only the selected public stop identifier to the Worker, which can forward it with transient source form state to Vitrasa; map tile providers receive visible tile coordinates and ordinary network metadata. No precise device geolocation or favorite data is sent.
- Arrival freshness follows the existing API contract: Worker data is current for less than 30 seconds, a last-known response may be labeled stale only after upstream failure and only while younger than 300 seconds, and no distinct schedule-delay state is claimed from arrival estimates alone.
- Owner clarification (2026-10-26): the project ended up using alternative data sources rather than the previously planned project. A provenance check found that the arrivals text cleanup still contains a copied character-repair table, so independent replacement precedes current-product reference removal.
- Closed historical feature-002 gate records, specifications, research, plans, and blog posts remain historical evidence. Add a superseding correction explaining the source decision; do not rewrite past approvals or present the abandoned dependency as current policy.
- Trip planning, route directions, ticketing, accounts, live vehicle tracking, and native mobile apps are out of scope.
