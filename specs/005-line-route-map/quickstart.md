# Quickstart: Show Selected Line Route on the Map

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js and npm versions supported by the repository.
- Dependencies installed from the repository lockfile.
- No municipal credentials or live API access are required for automated
  validation.

## Automated Validation

Run commands from the repository root.

```bash
npm test
npm run typecheck
npm run build
```

Expected outcomes:

- Unit and DOM tests pass with deterministic route fixtures.
- TypeScript checks pass for the frontend and Worker projects.
- The production static bundle builds without adding a server-side transit
  dependency.

## Required Route Scenarios

1. **Select a line**: open line browsing, select a line with fixture geometry,
   and confirm the map displays the selected line route while its details are
   open.
2. **Two directions**: use a fixture with two unique directional shapes;
   confirm direction 0 is solid, direction 1 is dashed, both text labels are
   available, and the map fits both paths around the visible line panel.
3. **Shared shape**: use two directions referencing one shape ID; confirm the
   geometry is drawn once and both direction names remain accessible.
4. **Replace line**: select line B after line A; confirm A's overlay disappears
   and only B's route remains.
5. **Stop remains selectable**: select a stop marker while a route is visible;
   confirm the normal stop details open and no line selection is emitted by
   route interaction.
6. **Unavailable route**: use missing, invalid, and one-direction-only
   fixtures; confirm there is no invented geometry, available directions
   still display, and line details/stop interactions remain usable.
7. **Stale result**: delay line A's route response, select line B, then release
   A's response; confirm B remains displayed.
8. **Reduced motion**: emulate `prefers-reduced-motion: reduce`; confirm
   selecting a line changes the visible bounds with a zero-duration camera fit.

The map-port unit tests verify atomic route replacement/clearing, shared-shape
deduplication, stop hit-target-only click queries, viewport padding for desktop
and narrow layouts, and the reduced-motion camera duration. Repository and DOM
tests cover representative-shape loading, partial geometry, invalid data, and
localized unavailable status.

Playwright's fixture build also supports `?routeFixture=missing` and
`?routeFixture=invalid` to exercise unavailable and malformed GeoJSON without
contacting the municipal source. This override is enabled only in the test
build and fixture profile.

## Browser Smoke Test

For an explicitly requested local-live smoke test, run `npm run dev`, select a
line in the browser, and verify that the map displays its current route while
line browsing is open. This test contacts the public municipal source and is
not part of normal CI. Check the browser network panel only for public line,
trip, and shape identifiers; no user preferences or profile data may be sent.

See [the normalized route display contract](./contracts/line-route-map.md) and
[the route data model](./data-model.md) for expected behavior and entities.
