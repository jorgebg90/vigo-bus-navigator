# Feature Specification: Vigo Bus Frequency PWA

**Feature Branch**: `001-bus-frequency-pwa`

**Created**: 2026-10-25

**Status**: Draft

**Input**: Baseline product specification for the Vigo Bus Navigator: a pure-frontend PWA on GitHub Pages to check urban bus frequencies in Vigo, with user state persisted exclusively in the browser's `localStorage`, per constitution v1.2.1 and the reference architecture example.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check frequencies for a bus line (Priority: P1)

A commuter opens the app, finds their bus line (by browsing the line list or
searching), and immediately sees its service frequencies for the applicable day
type: weekday, Saturday, or Sunday/holiday — including first/last departure
times and interval in minutes per time band.

**Why this priority**: This is the core promise of the product — "when does my
bus come and how often does it run?". Without it there is no product.

**Independent Test**: Load the app with the line catalog, select any line, and
verify the frequency table for the auto-detected day type renders correctly.
Delivers full value on its own as an MVP.

**Acceptance Scenarios**:

1. **Given** the app is open and today is a weekday, **When** the user selects
   line "L4A", **Then** the weekday frequency table for L4A is displayed with
   first departure, last departure, and interval per time band.
2. **Given** the app is open on a Sunday, **When** the user selects any line,
   **Then** the Sunday/holiday schedule is shown by default and the user can
   switch to another day type.
3. **Given** a line with no service on the current day type, **When** the user
   selects it, **Then** a clear "no service on this day type" message is shown
   alongside a link to the nearest day type with service.
4. **Given** any line detail view, **When** the frequency table is displayed,
   **Then** the version/date of the underlying schedule dataset is visible
   next to it.

---

### User Story 2 - See live arrival estimates at a stop (Priority: P2)

A commuter standing at a stop (or walking toward one) opens the stop view and
sees the next arrivals per serving line — destination and minutes — refreshing
automatically while they look at it.

**Why this priority**: Real-time certainty ("my bus is 4 minutes away") is the
second most valuable outcome after knowing the scheduled frequency; it builds
on the stop data the app already has.

**Independent Test**: Open a stop with live service (fixtures in the local
profile), verify per-line arrivals render and auto-refresh, and verify graceful
degradation when live data is unavailable.

**Acceptance Scenarios**:

1. **Given** a stop with live service, **When** the stop view opens, **Then**
   the next arrivals per serving line show destination and minutes, refreshing
   automatically at a bounded interval while the view is visible.
2. **Given** the stop view is open, **When** the app is backgrounded, **Then**
   refreshing pauses; **When** it returns to the foreground, **Then** refreshing
   resumes.
3. **Given** live data is unavailable, **When** the stop view loads, **Then**
   scheduled times are shown with a visible "live data unavailable" notice.

---

### User Story 3 - Locate stops on an accessible map (Priority: P3)

A user sees the stops of the selected line on a map (high-contrast base tiles,
light and dark variants), taps a stop, and sees its name, code, and the lines
serving it — so they can orient themselves physically at the street.

**Why this priority**: Spatial context turns abstract schedules into actionable
information ("how far is my stop?"), but the app is already useful with P1 alone.

**Independent Test**: Select a line and verify its stops render on the map and
each stop popup shows name, code, and serving lines — fully testable without US1
frequency logic beyond line selection.

**Acceptance Scenarios**:

1. **Given** a line is selected, **When** the map view is shown, **Then** all
   stops of that line appear as markers within the viewport fitted to the line.
2. **Given** the map is visible, **When** the user taps a stop marker, **Then**
   a popup shows the stop name, stop code, and the list of lines serving it.
3. **Given** the user's system prefers dark mode, **When** the map renders,
   **Then** the dark high-contrast base layer is used by default (user can
   override).

---

### User Story 4 - Save favorite lines and stops (Priority: P4)

A regular commuter marks their daily lines and stops as favorites. On the next
visit, favorites appear first — one tap from opening the app to the information
they check every day.

**Why this priority**: Retention convenience for daily riders. Everything is
stored on the user's own device; the app works fully without ever using it.

**Independent Test**: Mark a line and a stop as favorite, close and reopen the
app, and verify favorites are listed first and deep-link to their detail views.

**Acceptance Scenarios**:

1. **Given** a line detail view, **When** the user taps "add to favorites",
   **Then** the line appears in the favorites section on the home screen.
2. **Given** existing favorites, **When** the app is reopened days later,
   **Then** all favorites are restored exactly as left (lines and stops).
3. **Given** a favorite, **When** the user removes it, **Then** it disappears
   from the favorites section and does not reappear on next launch.

---

### User Story 5 - Offline access and connection-aware usage (Priority: P5)

A commuter underground or in a coverage gap opens the app and still sees the
line catalog and their favorites from the last visit, with a clear indication
that data may not be current.

**Why this priority**: Real street conditions in Vigo (tunnels, underground
stops) make offline tolerance a trust feature, but it builds on P1–P4 data.

**Independent Test**: Load the app once online, go offline, reload, and verify
the shell, catalog, and favorites still render with a staleness notice.

**Acceptance Scenarios**:

1. **Given** the app was used online before, **When** it is reopened without
   connectivity, **Then** the app shell, line catalog, and favorites render
   from local caches.
2. **Given** offline mode, **When** data is shown, **Then** a visible notice
   indicates the information may not be up to date.

---

### User Story 6 - Switch UI language (Priority: P6)

A user chooses their preferred interface language among Spanish (default),
Galician, and English. The choice persists across sessions.

**Why this priority**: Language inclusivity matters for Vigo's bilingual riders
and for visitors, but the app delivers core value in any single language.
Launch ships all three languages; switching builds on any of them.

**Independent Test**: Switch language in settings and verify all UI labels
change and the choice persists across sessions.

**Acceptance Scenarios**:

1. **Given** the settings screen, **When** the user picks another available
   language, **Then** all UI labels update immediately.
2. **Given** a language was chosen, **When** the app is reopened, **Then** the
   chosen language is restored.

---

### Edge Cases

- **First visit with empty `localStorage`**: the app initializes defaults
  (no favorites, default day type by current date) without errors.
- **Corrupted or schema-mismatched stored data**: the app detects it, recovers
  gracefully (reset affected keys to defaults), and never crashes on launch.
- **`localStorage` full or unavailable** (private browsing, quota exceeded):
  the app works in a session-only mode and tells the user favorites won't
  persist.
- **Stale schedule data after a timetable change**: the app shows the data
  version/date so users can judge freshness.
- **App open across midnight**: when the device date changes while the app is
  open, the day type is re-evaluated and the displayed schedule updates (or the
  user is prompted to refresh) instead of silently showing yesterday's day type.
- **Holiday coinciding with a Saturday or Sunday**: the holiday calendar takes
  precedence over the weekday — a holiday falling on a Saturday or Sunday uses
  the Sunday/holiday schedule.
- **Night lines or special-event services**: lines without a regular weekday/
  Saturday/Sunday pattern display their specific calendar notes instead of a
  frequency table.
- **Very long line lists on small screens**: search/filter keeps interaction
  usable with keyboard and touch.
- **Live arrival data unavailable** (edge proxy down, legacy endpoint timeout,
  or network loss): the stop arrivals view degrades to scheduled times with a
  clear "live data unavailable" notice; the rest of the app is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST present a browsable, searchable catalog of all urban
  bus lines in Vigo.
- **FR-002**: For any selected line, the app MUST display its service
  frequencies segmented by day type: weekday, Saturday, and Sunday/holiday.
- **FR-003**: The app MUST auto-detect the applicable day type from the
  device's current date (including a holiday calendar) and preselect it, while
  letting the user switch day type manually.
- **FR-004**: Frequency views MUST show first departure, last departure, and
  interval in minutes for each time band of the selected day type.
- **FR-005**: The app MUST render the stops of a selected line on an
  interactive map with high-contrast light and dark base layers.
- **FR-006**: Each stop on the map MUST expose its name, stop code, and the
  lines serving it.
- **FR-007**: Users MUST be able to mark and unmark lines and stops as
  favorites.
- **FR-008**: Favorites, UI preferences (theme, language), and recent views
  MUST persist exclusively in the user's browser storage — no account, no
  server-side user state.
- **FR-009**: The app MUST work on repeat visits with zero connectivity after
  a first successful load (app shell, catalog, and favorites readable offline).
- **FR-010**: The app MUST pause any background data refreshing while the page
  is not visible, and resume when it becomes visible again.
- **FR-011**: The app MUST display the version/date of the schedule data it is
  presenting.
- **FR-012**: The app MUST recover gracefully from corrupted or outdated stored
  state (schema-versioned storage with migration or safe reset).
- **FR-013**: The app MUST provide at least a `local` run profile where all
  transport data comes from bundled fixtures, requiring no credentials or
  external services for local development and testing.
- **FR-014**: All UI text MUST be localizable; the app MUST ship at launch
  with Spanish (default), Galician, and English, and let the user switch
  between them at any time.
- **FR-015**: Schedule data for the catalog and frequencies MUST ship as a
  versioned, bundled snapshot inside the app (no network call required to
  browse lines, stops, and frequencies); a documented update pipeline MUST
  exist to refresh the snapshot when official timetables change.
- **FR-016**: For any selected stop, the app MUST display live arrival
  estimates per serving line (destination and minutes/arrival time) retrieved
  through the edge proxy endpoint.
- **FR-017**: Live arrival estimates MUST auto-refresh at a bounded interval
  while the view is visible, MUST pause when the page is hidden, and MUST
  degrade to scheduled times with a visible notice when live data is
  unavailable.
- **FR-018**: Every HTTP interface used by the app — starting with the stop
  arrivals endpoint — MUST conform to a versioned OpenAPI contract declared
  before implementation.

### Key Entities *(include if feature involves data)*

- **Line**: a bus route — identifier, public code (e.g. "L4A"), name, color,
  service notes. Has many stops; has one timetable.
- **Stop**: a physical boarding point — code, name, geographic position,
  list of serving lines.
- **Timetable**: the schedule of a line per day type — list of time bands.
- **Day type**: weekday, Saturday, or Sunday/holiday; derived from date +
  holiday calendar.
- **Time band**: a contiguous period within a day type with a headway — start
  time, end time, interval in minutes, first/last departure.
- **Favorite**: a user-marked reference to a line or a stop — type, target id,
  creation order. Stored only on the device.
- **User preferences**: theme (light/dark/system), UI language, last-viewed
  line. Stored only on the device.
- **Schedule dataset**: versioned snapshot of lines, stops, and timetables —
  version/date label, payload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from opening the app to seeing the frequency of
  their line in at most 3 interactions (open → search/select → view).
- **SC-002**: On a mid-range phone over a 4G connection, the app becomes
  interactive in under 3 seconds on a cold visit, within the payload budget
  set at the plan gate.
- **SC-003**: 100% of the P1–P4 acceptance scenarios pass on the current
  stable versions of the two major mobile browser engines and one desktop
  browser.
- **SC-004**: The app remains fully usable via keyboard only and with a screen
  reader for all P1 flows (WCAG 2.2 AA per the constitution).
- **SC-005**: After a first online visit, 100% of catalog and favorites data
  is readable with connectivity disabled.
- **SC-006**: Users with favorites reach their daily information in 1
  interaction from the home screen.
- **SC-007**: Zero user data leaves the device: no account flows, no
  identifying analytics; all persistence verifiably local.
- **SC-008**: While a stop view is visible with connectivity, its live arrival
  estimates are never older than 60 seconds.

## Assumptions

- The target operator is Vigo's urban bus network (Vitrasa); line codes, stop
  codes, and day-type segmentation (weekday / Saturday / Sunday-holiday)
  follow its published timetable structure.
- A machine-readable snapshot of the network's lines, stops, and timetables
  can be produced and redistributed bundled with the app (FR-015); its update
  cadence follows official timetable changes.
- Live estimated-arrival data is in scope for v1: a legacy SOAP endpoint is
  exposed to the app through an edge proxy conforming to an OpenAPI contract
  (see the reference architecture example); the local profile mocks it with
  fixtures.
- Users accept that favorites and settings live only on the current device and
  browser; there is no synchronization across devices by design.
- The holiday calendar for day-type detection is maintained as part of the
  schedule dataset and versioned with it.
- Baseline (v1) targets modern evergreen browsers; legacy browser support is
  out of scope.
