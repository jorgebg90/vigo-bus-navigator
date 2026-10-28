# Selected Line Route Map Contract

**Date**: 2026-10-28
**Feature**: [../spec.md](../spec.md)

This is an internal application-to-map contract. It does not expose a hosted
HTTP API and does not change the municipal OpenAPI source contract.

## Route Display Input

The map receives either a complete selected-line route display or `null`:

- A complete display contains the selected line identity and zero or more
  validated directional LineStrings.
- A displayed direction has a stable direction number and a non-empty
  human-readable headsign.
- Duplicate geometries by `shapeId` are drawn once.
- An empty display clears any previous line route.
- Geometry is all-or-nothing: only fully validated LineStrings are supplied.

The existing domain `RouteShapeReceipt` remains the source of validated
geometry. The application assembles one representative trip/shape per
available direction and does not make the map adapter responsible for source
requests or schedule policy.

## Selection Lifecycle

1. Selecting a line from line browsing begins a new selection version and
   clears any route belonging to the previous selection.
2. The line's schedule and representative directional geometries are loaded
   through existing repositories/adapters.
3. Results are applied only if their selection version is still current.
4. The map replaces its complete route overlay and adjusts its camera bounds
   to show all available directions, accounting for the visible line panel.
5. Selecting another line replaces the old overlay. Leaving line browsing
   clears the overlay.
6. If geometry is unavailable, the route layer remains empty and the line
   details show a localized unavailable state.

## Stop Interaction and Accessibility

- Route geometry is rendered in a separate, non-interactive map source/layer.
- Direction `0` is drawn as a solid line and direction `1` as a dashed line;
  both use the same route color so direction is not communicated by color alone.
- The route source contains one feature per unique shape ID, even when both
  directions share that shape.
- Existing stop points, clusters, selection ring and transparent hit targets
  remain independently rendered and actionable.
- Route layers do not register click or pointer handlers for line selection.
- Route layers are inserted below the stop layers, and map clicks continue to
  query only cluster and stop hit-target layers.
- Direction is identified with a non-color-only visual distinction and a
  localized, accessible text equivalent in the line details.
- Camera bounds include every coordinate in each unique displayed shape. The
  line panel's actual viewport overlap is accounted for using responsive map
  padding, capped to preserve a usable map area.
- Camera changes use an immediate `fitBounds` update with duration `0` when
  reduced motion is requested, and a 300 ms fit otherwise.

## Failure Behavior

- No route is fabricated when a schedule, representative trip, or valid shape
  is unavailable.
- A failure to load one direction does not prevent display of another valid
  direction.
- Invalid geometry is discarded as a whole; partial coordinates are never
  drawn.
- Failure to load route data does not disable line timetable details or stop
  interactions.
