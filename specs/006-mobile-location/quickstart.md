# Quickstart: Mobile Location and Map Controls

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Supported Node.js and npm versions.
- Dependencies installed from the repository lockfile.
- No municipal credentials or live location access are required for automated
  checks.

## Automated Validation

Run from the repository root:

```bash
npm test
npm run test:e2e
npm run typecheck
npm run build
```

Expected outcomes:

- Unit and DOM tests pass with injected browser location results.
- Playwright journeys cover one-shot mobile permission, desktop no-prompt,
  denial, outside-coverage fallback, location privacy, and the removed toolbar
  action, mobile map/content layout, selected-line stop filtering, and the
  schedule disclosure.
- TypeScript and production static build complete without a new dependency or
  server-side transit service.

## Required Scenarios

1. **Mobile permission granted**: emulate a mobile viewport and a permitted
   position inside Vigo coverage; verify one location request, a distinct
   marker, and a camera centered on the supplied point.
2. **Mobile denied or unsupported**: verify the Vigo map and map controls stay
   usable, an accessible localized status appears, and navigation/remount does
   not request location again.
3. **Invalid or timed-out result**: verify no marker is drawn and the default
   Vigo view remains usable with an explanatory status.
4. **Inside coverage without a close stop**: verify the map still centers at
   the authorized point; no nearest-stop distance threshold is applied and an
   accessible note appears if no valid stop marker is within the visible map.
5. **Outside coverage**: verify no user marker is drawn, the camera remains at
   the Vigo overview, and the coverage status is announced.
6. **Desktop**: verify no location request occurs.
7. **Late result after movement/navigation**: verify an asynchronous result
   does not override user camera movement or recenter after leaving the map.
8. **Toolbar**: verify the stops-in-view button is absent and recenter,
   zoom-in, zoom-out, and cluster stop chooser still work.
9. **Privacy**: verify coordinates are absent from localStorage and all transit
   requests.
10. **Reduced motion**: emulate reduced motion and verify location centering
    does not animate.
11. **Mobile search results**: open stop search at a mobile viewport and verify
    results scroll in the lower panel while the map remains visible above.
12. **Mobile stop details**: select and expand a stop; verify the details
    scroll and the map area shrinks instead of being covered.
13. **Mobile line details**: open a line and verify its details scroll in the
    lower panel without obscuring the route map.
14. **Selected-line stops**: select a line and verify its map markers and
    cluster counts include only stops served by that line, including shared
    stops; leave the line and verify all stops return.
15. **Schedule disclosure**: open a line with schedule data and verify it is
    collapsed under the localized “Departures and arrivals” heading; activate
    the heading to reveal and hide the schedule without changing its label.
16. **Route direction presentation**: verify no redundant direction-message
    list accompanies a displayed route.

See the [internal contract](./contracts/mobile-location-map.md) and
[data model](./data-model.md) for precise behavior.

## Manual Browser Smoke Test

Serve the app over HTTPS, or use localhost, and open it at a mobile viewport.
Grant location only if desired. Confirm the location marker and map position
are useful, then pan manually and verify the camera stays where moved. Repeat
with permission denied and outside Vigo coverage; map navigation must remain
usable in each case.
