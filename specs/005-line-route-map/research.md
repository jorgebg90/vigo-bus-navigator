# Research: Show Selected Line Route on the Map

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Existing Map and Route Boundaries

**Decision**: Keep municipal route acquisition in the schedule repository and
render normalized geometries through the existing `StopMapPort`.

**Rationale**: `ScheduleRepositoryV5` already exposes published line schedules,
and `MunicipalScheduleRepository.getOnlineLineRoute` already derives a
representative trip per direction. `RouteShapeReceipt` carries validated
GeoJSON LineString coordinates. In contrast, `StopMapPort` currently exposes
only stop operations, and `BrowserMapPort` owns the persistent MapLibre map.
The map is already mounted independently of the active destination, so route
selection can update the existing map without creating another map instance.

**Alternatives considered**:

- Render only in the line details panel: already exists, but does not satisfy
  the request to show the route on the map.
- Create a separate map for line details: rejected because the application
  already has a persistent map and this would duplicate map state and work.
- Let UI code call MapLibre directly: rejected because it breaks the existing
  port/adaptor boundary.

## Directional Geometry Selection

**Decision**: For each available direction, select one representative trip
(active first, then most departures, as the existing repository does) and
obtain its associated shape. Deduplicate geometries with the same shape ID
before drawing; preserve direction labels for accessible identification.

**Rationale**: Source schedules can contain multiple trips or internal block
codes. Displaying every trip would duplicate paths and complicate the map.
Representative trips are consistent with current route-stop summaries. Loading
the shape per directional representative corrects the current limitation where
online route display requests geometry only for the first direction.

**Alternatives considered**:

- Draw every trip's shape: rejected because repeated trips often share
  geometry, leading to duplicate, cluttered paths and unnecessary requests.
- Draw only the first schedule row's shape: rejected because it may represent
  only one direction.
- Infer a reverse path from one direction's coordinates: rejected because
  geometry may differ by direction and no reliable reversal rule is established.

## Overlay and Stop Interaction

**Decision**: Use a dedicated route GeoJSON source and line layer, separate
from the stop source and layers. Keep route layers below stop hit targets and
make them non-interactive.

**Rationale**: The map currently uses a clustered stop source, a visible stop
layer, a selection ring, and a transparent hit-target layer. A separate route
layer avoids changing stop source semantics and prevents a line overlay from
capturing stop interactions. The route overlay can be replaced atomically when
selection changes and cleared when leaving line browsing.

**Alternatives considered**:

- Add route geometry as features to the clustered stop source: rejected because
  the source and cluster logic expect point features.
- Add click handling to the route layer: rejected because the feature has no
  line-selection behavior and line selection must originate from the line list.
- Keep multiple line overlays: rejected; the spec says changing selected line
  replaces the previous route, and one selected line is sufficient.

## Camera and Reduced Motion

**Decision**: Fit bounds to all displayed direction geometries with padding
that accounts for the visible line details panel. Use the existing
`prefers-reduced-motion` policy: immediate camera update when reduced motion
is requested and a short eased update otherwise.

**Rationale**: The map panel is partially obscured by the application's
destination panel. Fitting to the full map viewport without inset would leave
parts of a route hidden behind that panel. The existing map adapter already
uses `fitBounds`, `jumpTo`, and `easeTo` according to reduced-motion settings.

**Alternatives considered**:

- Center on geometry centroid: rejected because long or irregular routes may
  still be clipped.
- Fit bounds without panel-aware padding: rejected because the visual panel can
  cover the route.
- Always animate: rejected because the application already respects reduced
  motion for camera changes.

## Loading, Empty Data, and Selection Races

**Decision**: Clear the previous route as soon as a new line is selected,
version each line request, and apply route data only when it belongs to the
current selection. On absent or invalid geometry, leave route layers empty,
retain line details and stop interactions, and show localized unavailable
status.

**Rationale**: Existing `main.ts` already versions asynchronous line views
using `lineViewRequests`. Reusing that mechanism prevents late results from
overwriting a newer selection. Existing municipal adapters fail closed and
return typed unavailable results rather than partial geometry.

**Alternatives considered**:

- Leave the old line visible while the next selection loads: rejected because
  the map would misrepresent which line is selected.
- Draw geometry incrementally before full validation: rejected because partial
  paths can be misleading and conflict with FR-007.
- Persist the selected route: rejected because the selected line view is
  transient UI state, not user preference or profile data.

## External Contract and Dependencies

**Decision**: Do not add a municipal action, OpenAPI version, runtime
dependency, backend, or storage. Document the normalized internal map-port
contract in `contracts/line-route-map.md`.

**Rationale**: Existing `TRANSPORTE_LINEA_HORARIOS_EXTEND` rows provide
`trip_id` and `shape_id`; the existing GeoJSON action provides the geometry.
The feature changes how validated data is presented, not the source boundary.

**Alternatives considered**:

- Add a new API or route service: rejected because the municipal source already
  provides the required data and the constitution forbids a server-side transit
  adapter.
- Store geometry or selected route in localStorage: rejected because route
  selection is temporary and should not persist across user sessions.
