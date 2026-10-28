# Research: Mobile Location and Map Controls

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Browser Location Permission and Acquisition

**Decision**: Request one current position using the browser's standard
one-shot geolocation capability, through a narrow application port and a
browser adapter. Trigger it only when the map is first mounted at the existing
mobile breakpoint (`max-width: 599px`). Do not watch location continuously or
request it from desktop.

**Rationale**: Browser-managed permission is explicit, consistent with the
feature request, and keeps location access client-side. One-shot acquisition
is sufficient to orient the map and avoids unnecessary battery use and
background tracking. The existing stylesheet already defines the mobile
breakpoint.

**Alternatives considered**:

- Continuous location watching: rejected because the spec requires only an
  initial orientation and forbids automatic recentering after user movement.
- A new in-app location button: rejected because the requested behavior is to
  ask on mobile map entry; existing recenter remains a stop-map control.
- Requesting location on all screen sizes: rejected because the user explicitly
  limited the prompt to mobile.

## Location Bounds and Nearby Stops

**Decision**: Treat the current `toMapStops` geographic eligibility envelope
as Vigo map coverage. A valid location inside the envelope is used even if no
stop is near it; a location outside the envelope leaves the map at its normal
Vigo overview and displays an explanatory status. Do not query or infer nearest
stop distances. For user feedback, "nearby stops shown" means at least one
valid stop marker is present inside the resulting map view; if none are visible,
explain that no stops are shown nearby but keep the authorized location
centered.

**Rationale**: The user selected "any location inside Vigo coverage, regardless
of the distance to the nearest stop." Reusing the existing bounds avoids
introducing a new proximity threshold or municipal request and keeps the
feature's result deterministic with the current stop catalog.

**Alternatives considered**:

- Define a 500 m, 1 km, or 2 km nearest-stop radius: rejected by the user's
  clarification.
- Add an authoritative service-area polygon: rejected because no such
  polygon is currently part of the application data contract.
- Send coordinates to a transit service to find nearby stops: rejected because
  it would disclose precise user location and is unnecessary with local stop
  data.
- Return to the Vigo overview when no stop is in the local viewport: rejected
  because the user's clarification says an in-coverage position is accepted
  regardless of nearest-stop distance.

## Permission Errors and Attempt Lifecycle

**Decision**: Make at most one location request per open app visit. Handle
unsupported access, permission denial, timeout, invalid coordinates, and
outside-coverage coordinates as explicit states; keep the map operable and
show a localized accessible status. Do not retry on navigation, theme remount,
or viewport resize.

**Rationale**: Repeated browser prompts are disruptive, while a consistent
fallback protects users who deny access or encounter browser/device errors.
Keeping the attempt flag in memory avoids persisting permission or location
state.

**Alternatives considered**:

- Persist a denial marker across visits: rejected because browser permissions
  own the durable decision and the feature must not persist user location
  behavior.
- Retry automatically after an error: rejected because it can repeatedly
  prompt and violates the one-request visit rule.
- Surface raw browser error messages: rejected because they are inconsistent
  and may expose technical detail; use localized user-facing messages.

## Map Marker and Camera

**Decision**: Add a dedicated, non-interactive user-location GeoJSON source
and a visually distinct marker, separate from bus-stop features. Add the source
and marker during map load and retain a pending in-memory coordinate if the
position arrives before map initialization. Center once at a useful zoom using
the existing reduced-motion preference.

**Rationale**: Keeping location separate avoids clustering it with bus stops
and ensures route/stop interactions are unchanged. Existing map initialization
is asynchronous, so a pending position prevents a permission result from being
lost during startup.

**Alternatives considered**:

- Put the location in the clustered stop source: rejected because the current
  source expects municipal stop identities and would make the user's position
  selectable as a bus stop.
- Use a second map or a mapping plugin: rejected because the app already owns
  a persistent MapLibre map and no new dependency is needed.
- Continuously fit the camera to location updates: rejected because no
  continuous updates are requested.

## User Movement and Late Results

**Decision**: If the user manually moves the map before a pending position
arrives, do not automatically move the camera when that result arrives. A
valid in-coverage position can still be shown as a marker. If the user leaves
the map before the result arrives, do not steal focus or change the camera on
another screen.

**Rationale**: Late permission results must not override deliberate user
navigation. This protects interaction intent while still allowing the map to
show the authorized position when appropriate.

**Alternatives considered**:

- Always recenter when a position eventually arrives: rejected because it can
  undo user movement or navigation.
- Cancel the browser permission prompt: rejected because the one-shot browser
  operation is not reliably cancellable; ignore results that are no longer
  relevant instead.

## Toolbar and Cluster Chooser

**Decision**: Remove only the stops-in-view button and its direct toolbar
callback. Preserve zoom and recenter. Keep the stop chooser for coincident
markers/clusters, and use the recenter control as its focus-return opener.

**Rationale**: The removed control is redundant with map marker interactions,
but the cluster chooser still solves a distinct stop-selection problem. The
remaining controls preserve accessibility and map navigation.

**Alternatives considered**:

- Remove the stop chooser along with its opener: rejected because coincident
  stops and maximum-zoom clusters still require an accessible selection path.
- Remove all toolbar controls: rejected because the user specified one action
  and requested zoom/recenter remain.
