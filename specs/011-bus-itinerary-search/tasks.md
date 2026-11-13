# Tasks: Municipal OTP Journey Planning

This task list covers the product-owner-requested OTP integration revision.
Earlier address-search and nearby-stop work remains the existing baseline.

- [X] T001 Revise specification, plan and OpenAPI for approved direct municipal OTP planning and coordinate/time disclosure.
- [X] T002 Add deterministic adapter tests for the supplied response, request encoding, invalid data, service errors, timeout and cancellation.
- [X] T003 Add normalized journey models, route-planning port and bounded fixed-host OTP adapter with geometry decoding.
- [X] T004 Integrate asynchronous search, eligibility filtering and stale-request cancellation.
- [X] T005 Render selectable alternatives, sorting, walking/bus steps, intermediate stops and localized privacy/states.
- [X] T006 Render selected journey geometry and selectable itinerary stops on the persistent map.
- [X] T007 Validate unit/DOM/E2E behavior, typecheck, OpenAPI lint and build.
- [X] T008 Verify real-data search and layouts in the agent browser; record results.

Dependencies: T003 follows T002; T004 follows T003; T005/T006 follow T004;
T007 and T008 follow T005/T006. No application infrastructure is added.

## Validation Evidence (2026-11-13)

- 54 targeted unit/DOM/architecture/contract tests passed; the final adapter and
  map-camera changes were additionally checked with 16 targeted tests.
- TypeScript passed. OpenAPI lint had zero errors (nine existing unused-schema
  warnings in the JSP contract).
- All 12 journey E2E cases passed across Chromium desktop, Android Chrome and
  iOS Safari, including late-response invalidation, alternative/stop selection,
  theme remount preservation, memory-only searches and result accessibility.
- The six existing general accessibility cases passed; Android's multi-viewport
  scan timed out under concurrent load and passed when rerun alone.
- Playwright's production build passed, as did the production-artifact guard
  and payload budget: first-map-ready gzip graph 397.8 KiB / 500 KiB.
- Agent browser: real Photon address selection for Urzaiz to Avenida de
  Castelao, followed by direct OTP planning for 2026-11-13 15:53 Madrid time,
  produced alternatives including 17 + 5B, C1 + 13, and direct 4C.
- Selected C1 + 13 and its boarding stop; verified route/source change and
  coordinate focus. Inspected desktop and 390 x 844 screenshots. Mobile shows
  the map above the scrollable directions sheet with no horizontal overflow;
  recenter fits the selected route after resizing.
- No implementation extension hooks were registered.

## Municipal Autocomplete Revision (2026-11-13)

- [X] T009 Replace Photon with the municipal planner's fixed Pelias autocomplete; update OpenAPI, source approval, privacy translations and attribution.
- [X] T010 Validate request parameters, decoding/filtering, cancellation, timeout, errors and no caching; verify real suggestions and selection in the agent browser.

T010 follows T009. Validation: 24 unit/DOM/architecture tests and all 12
journey E2E cases passed across desktop Chromium, Android Chrome and iOS Safari.
Typecheck, production build and artifact guard passed. OpenAPI lint returned
zero errors and nine existing JSP-contract warnings. A direct browser fetch from
localhost returned HTTP 200; the live UI displayed municipal Urzaiz suggestions
and selected Estacion de Urzaiz and Avenida de Castelao, including keyboard
selection, enabling journey search. No Photon fallback remains.

## Application API Documentation Revision (2026-11-13)

- [X] T011 Publish all four current OpenAPI contracts in a linked static portal; document ports/adapters, normalized models, source boundaries, current features and privacy across architecture, quality guidance and es/gl/en READMEs.
- [X] T012 Validate normalized schema compatibility, portal generation, deployment-base routing, offline access and accessibility without adding an application backend.

T012 follows T011. Final validation: 43 targeted contract/model/architecture
tests passed, as did typecheck, municipal contract validation and the production
artifact guard. OpenAPI lint has zero errors and 11 unused-component warnings
(in-process/retained JSP schemas). The portal passed 12 E2E cases at the root
base path and another 12 using `/vigo-bus-navigator/`, across desktop Chromium,
Android Chrome and iOS Safari. Each run builds the production artifact; navigation
between contracts and direct offline access to all four pages passed. The portal
was also opened and visually inspected in the agent browser.

## Swagger UI Viewer Revision

- [X] T013 Replace the bespoke OpenAPI rendering with self-hosted Swagger UI for all four contracts, retaining read-only YAML and architectural/source-policy metadata.
- [X] T014 Validate expandable operations and models, keyboard navigation, responsive reflow, accessibility, offline local assets and absence of external documentation requests.

T014 follows T013. Swagger UI uses local npm-distribution JS/CSS with license
notices; no CDN, remote validator, editing or “Try it out” calls are enabled.
The final generator suite passed 17 tests and typecheck. All 12 portal E2E
cases passed across desktop Chromium, Android Chrome and iOS Safari using the
deployment base path, including expanded schemas and operations, axe checks,
320px/200%-text reflow and offline rendering. Production builds and the artifact
guard passed; application first-map gzip graph remains 397.7 KiB / 500 KiB.
Desktop/mobile browser screenshots were inspected.

## Readable Walking Instructions

- [X] T015 Translate generic walking labels into readable localized actions,
  preserve street names and merge adjacent identical instructions by summing
  distances before rounding. Display action and distance on separate lines.

Verified with the reported 110 m sidewalk / 93 m path / 4 m path / 33 m street
example in es/gl/en: the two consecutive path fragments display as 97 m.
All seven journey DOM tests and all 12 journey E2E cases passed; typecheck
and production build passed. No provider contract or domain model change.

## Feature Closure (2026-11-14)

- [X] T016 Consolidate all accepted post-specification UX, municipal services,
  hexagonal/OpenAPI and Swagger UI revisions into the existing spec and plan;
  review the requirements checklist and run final regression gates.

T016 follows T008, T010, T012, T014 and T015. Product-owner acceptance was
received on 2026-11-14; no implementation work is deferred to the next feature.

Final validation:

- All 455 tests across 92 unit/DOM/architecture/contract/generator files pass.
  The full suite exposed a shell CSS assertion that inspected unrelated journey
  styles; it now verifies navigation rules only, preserving its original intent.
- All 24 journey/Swagger E2E cases pass across desktop Chromium, Android Chrome
  and iOS Safari, including production build, offline viewer and accessibility.
- Typecheck and municipal contract validation pass (46 compiled schemas).
  OpenAPI lint reports zero errors and 11 unused-component warnings.
- Production-artifact guard and all size budgets pass; first-map-ready gzip
  graph is 398.2 KiB / 500 KiB.
- The Spec Kit prerequisite command resolves this feature directory correctly.
  No extension hooks are registered. Production-origin verification remains
  a release check; localhost/browser tests do not establish provider guarantees.
