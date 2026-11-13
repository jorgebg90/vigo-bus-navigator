# Implementation Plan: Bus Itinerary Search

**Branch**: `011-bus-itinerary-search` | **Consolidated**: 2026-11-14
**Spec**: [spec.md](./spec.md)

## Summary

Use public Vigo OTP directly from the browser to calculate routes. Keep paired
predictive address inputs, nearby-stop selection and the persistent MapLibre map.
Replace the unconditional incomplete-data outcome with validated asynchronous
planning, real itinerary alternatives and step details.

The product owner's explicit approval of OTP supersedes the previous local-only
data-readiness blocker and no-coordinate-transmission requirement. Queries stay
memory-only; the existing collapsed privacy disclosure describes both services.

## Architecture

- Domain: stable transit journey/place/leg types; no network or DOM.
- Application: validate input, delegate through a route-planning port and enforce
  endpoint/transfer eligibility. Retain the candidate-only helper for stop choice.
- Infrastructure: fixed OTP GET adapter; bounded response, timeout, cancellation,
  strict decoding and polyline decoding with coordinate checks. A separate
  municipal Pelias adapter implements the existing address-geocoding port.
- UI: alternatives, sorting, expandable ordered steps and intermediate stops;
  stop buttons focus coordinates independently of discovery catalog identity.
- Composition: invalidate stale requests on edits/navigation; retain query for
  retry; select first result and synchronize route map.
- Map port: separate itinerary line source (solid BUS/dashed WALK) and place
  markers, fitted with responsive panel-aware padding; no fabricated geometry.

## Request Contract

Address suggestions use
[address-geocoding.openapi.yaml](./contracts/address-geocoding.openapi.yaml):
fixed `https://planificador-rutas-api.vigo.org/v1/autocomplete` GET with `text`,
`layers=venue,street` and `lang=es`. This replaces Photon with no fallback host.
Use provider `gid` and `label` (or `name`), filter venue/street results by Vigo
coverage, deduplicate and keep the first five valid suggestions. Retain the
existing debounce and cancellation. Timeout is 5 seconds and size limit 256 KiB;
omit credentials/referrers, reject redirects and use `cache: no-store`.

See [route-planning.openapi.yaml](./contracts/route-planning.openapi.yaml).
Use fromPlace/toPlace, validated local date/time, fixed es/TRANSIT,
showIntermediateStops=true, numItineraries=4, maxTransfers=2, walkSpeed=1.4,
maxWalkTime=10, wheelchair=false, maxWalkDistance=500, itineraryId=fast,
optimize=QUICK and walkReluctance=10. All requests omit credentials and referrers,
reject redirects, time out after 15 seconds and accept at most 2 MiB.

Walking limits are advisory in the provider request: observed responses exceed
them. Enforce the specified straight-line 500 m endpoint and 300 m connector
rules client-side. Keep provider walking paths and durations, not straight-line
walking substitutes. Present scheduled versus realtime according to each leg.

## Constitution Check

| Principle | Resolution |
|---|---|
| Browser-first / zero infra | Direct public municipal GET; no proxy/backend |
| Fixed transit sources | Explicit feature-011 exception adds fixed OTP and autocomplete paths |
| Privacy | Approved address text and coordinate/time disclosure; no persistence |
| Hexagonal | Port, adapter, pure models, rendering and composition separated |
| Contract-first | Existing OTP OpenAPI revised before runtime integration |
| Testing | Fixture unit/DOM/E2E plus real browser fetch and visual inspection |

Local browser OTP fetch returned 200 and four alternatives on 2026-11-13.
There was no CORS blocker. Production-origin verification remains a release
check, not a reason to block local implementation.

## Validation

Run targeted unit/DOM/architecture tests, typecheck, OpenAPI lint, production
build, and journey Playwright tests for desktop/mobile projects. Use the agent
browser on the live local application to search, select an alternative and stop,
and inspect screenshots at desktop/mobile viewport sizes.

## Application Contract Documentation (2026-11-13)

The generated OpenAPI portal now publishes JSP, autocomplete, OTP and external
CARTO resource contracts together. `x-hexagonal` maps them to application ports
and adapters; normalized address, journey and current schedule/shape/sequence
schemas are distinct from source payloads. These are in-process contracts, not
new hosted API routes. See the current
[architecture](../../docs/architecture.md) for all integration boundaries,
profiles, privacy, availability and contract-maintenance rules.

## Final Accepted UX and Viewer

- Compact address form with swap/clear/location controls; no map-tap endpoint
  selection, suggestion counter, radius disclaimer or explanatory address prose.
- Desktop side panel; mobile map above a scrollable 55dvh directions sheet.
  Keep selected geometry after theme remount; focus stops by coordinates and
  offset the camera without persisting desktop padding on mobile.
- Walking presentation translates generic surface names, merges only adjacent
  identical displayed actions within a leg and sums distances before rounding.
  Preserve proper street names and provider order; render action/distance on
  separate lines. No invented turn instructions or wire/domain model change.
- All four documentation pages use self-hosted Swagger UI from the npm lockfile,
  with local JS/CSS/license assets, read-only YAML and architecture metadata.
  Disable editing, external validation and request execution. Build-time
  generation validates contracts; the PWA precaches viewer assets for offline use.
- Domain/output schema tests verify the adapters' normalized address and journey
  results. JSP schedule/shape/sequence schemas reflect runtime models rather
  than the earlier design-only variants.

## Closure

Product-owner acceptance was received on 2026-11-14. Post-specification changes
are consolidated into User Stories 1–4, FR-017–FR-020 and SC-007–SC-009.
There is no backend, remote editor or extra infrastructure to deploy.
Production-origin compatibility and upstream availability remain release risks,
not claims established by the localhost checks.
