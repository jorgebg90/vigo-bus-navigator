# Feature Specification: Bus Itinerary Search

**Feature Branch**: `011-bus-itinerary-search`
**Created**: 2026-11-13
**Status**: Implemented and accepted by the product owner on 2026-11-14
**Consolidated**: 2026-11-14, including all post-specification refinements

## Approved Scope and Decision

The point-to-point bus search uses the public municipal OpenTripPlanner (OTP)
service directly from the browser. The product owner explicitly requested this
integration after supplying a working request and its response in
[example.json](../example.json). This supersedes the earlier local-only routing
and prohibition on transmitting journey coordinates. No application server,
proxy, Worker, account, credential, or infrastructure is introduced.

A browser fetch from the local application returned HTTP 200 and four
itineraries, including walking, buses, stop names, intermediate stops, timestamps,
and encoded geometry. CORS did not block that request. This is evidence of
browser compatibility, not a claim that CORS does not exist or that the provider
guarantees availability or schedule accuracy. Failures must remain visible.

The accepted scope also includes the subsequent municipal autocomplete change,
directions-first responsive UX, readable walking instructions and the complete
self-hosted Swagger UI portal. These are part of feature 011, not deferred work
or an implicit scope for the next specification. Implementation acceptance does
not imply deployment or verification of the production origin.

## User Scenarios & Testing

### User Story 1 - Search by address (P1)

Use paired origin/destination address fields with predictive suggestions,
optional current location, swapping and clearing. Map taps never edit endpoints.
Departure date/time is interpreted in Europe/Madrid.

Suggestions use the same municipal Pelias service as the public route planner:
`https://planificador-rutas-api.vigo.org/v1/autocomplete`, with `text` and fixed
`layers=venue,street&lang=es`. This replaces Photon. Show up to five distinct
valid results in provider order, preserving its labels and namespaced `gid`;
validate coordinates against Vigo coverage in the client. Keep existing
debouncing, keyboard selection, cancellation and explicit error/retry states.

1. Selecting two distinct valid Vigo points enables search.
2. Searching sends only their coordinates, requested date/time and fixed routing
   parameters to the allowlisted municipal planner.
3. Missing points, invalid dates, DST gaps and ambiguous local times are rejected
   before transit network access.
4. An address or endpoint edit cancels/invalidate previous routing work and
   removes stale results and geometry.
5. The compact directions form shows neither a suggestion count, a 500 m
   disclaimer nor explanatory address prose. Nearby catalog candidates and
   privacy information are available through collapsed disclosures.

### User Story 2 - Compare and follow itineraries (P1)

Show actual planner alternatives rather than an incomplete-data placeholder.
Each alternative shows departure/arrival, total duration, walking and transfers,
plus ordered walking/bus segments. Select an alternative to display its detailed
directions and actual route geometry.

1. The supplied response produces alternatives containing WALK and BUS legs.
2. Bus details include line, direction where supplied, boarding/alighting stop
   buttons, departure/arrival and expandable intermediate stops.
3. Walking details use the returned distance, duration and street instructions;
   they are estimates, not accessibility guarantees.
   Translate generic provider labels such as sidewalk/path into readable actions
   in the UI language and combine adjacent identical instructions by summing
   their distances before rounding. Preserve street names and never invent turns.
4. Bus legs are solid and walking legs dashed on the map, using decoded OTP
   geometry rather than straight lines invented between stops.
5. Any displayed itinerary stop can be selected to focus its coordinates on the
   map, even if its OTP identifier does not match the discovery catalog.
6. The first valid alternative is selected automatically. Choosing another
   updates its pressed state, details and map. Sort by arrival, transfers or
   walking; initially show three alternatives and allow showing the remainder.
7. Desktop presents a directions panel beside the map. Mobile presents the map
   above a scrollable directions sheet, without horizontal page overflow.
   Selecting a stop, recentering, resizing and changing theme preserve a usable
   view of the selected itinerary.
8. For the reported example, `sidewalk` 110 m, `path` 93 m, `path` 4 m and
   Avenida da Gran Vía 33 m become three readable instructions: walk along the
   sidewalk 110 m, follow the footpath 97 m, walk along Avenida da Gran Vía
   33 m. Action and distance are on separate lines, translated into es/gl/en.

### User Story 3 - Honest states and privacy (P1)

Loading, no matching itinerary, unavailable and invalid states are distinct.
The app must not confuse network, parser, service or coverage failures with
no bus service. Selected points and time remain in memory for retry.

1. Network/HTTP/timeout, invalid payloads and OTP error envelopes show an explicit
   unavailable state, never a successful empty result.
2. A valid plan with no eligible alternatives says the planner returned no
   matching option for the request, not that no service exists network-wide.
3. No query coordinates, address text or route history enter application
   persistence, service-worker caches, analytics or logs.
4. The collapsed privacy section states that address text goes to municipal autocomplete and
   selected coordinates and departure time go to the municipal route planner.

### User Story 4 - Understand the application's API contracts (P1)

Users and contributors can inspect all current external integrations in one
interactive documentation portal without editing contracts or making provider
requests from the documentation.

1. The portal links the municipal transit, address autocomplete, itinerary
   planning and external basemap-resource contracts. Every contract retains
   its source identity and distinguishes provider payloads from application models.
2. Operations, parameters, responses and schemas can be expanded/collapsed.
   Original YAML and architecture/source policies remain available read-only.
3. Swagger UI and its assets are hosted with the static application; no external
   editor, CDN or validator receives contracts. Editing and "Try it out" are
   disabled; normal application requests continue through ports and adapters.
4. All four pages render directly under the deployment base path and offline
   after service-worker installation, including interactive viewer assets.
   Keyboard operation, mobile reflow and enlarged text remain usable.

## Functional Requirements

- **FR-001**: Search endpoints use predictive address fields restricted to Vigo.
  Keep swap, clear and current-location controls; no map-point picking. Use only
  the fixed municipal autocomplete GET endpoint above, omit credentials and
  referrers, reject redirects, disable response caching, bound payloads to
  256 KiB and time out after five seconds. Spanish is fixed as in the planner.
- **FR-002**: Call only
  `https://planificador-rutas.vigo.org/otp/routers/default/plan` for planning,
  directly via browser GET with credentials omitted, no referrer and no redirects.
- **FR-003**: Honor the existing 500 m straight-line endpoint-stop radius.
  Validate the first bus boarding and last bus alighting against the requested
  endpoints in the client. The requested OTP walking limit alone is insufficient:
  the observed service can return longer pedestrian paths.
- **FR-004**: Retain selectable nearby-stop candidates from the discovery catalog.
  Selecting one updates that endpoint; candidates are not a precondition for OTP.
- **FR-005**: Use returned walking geometry, distance and duration for itineraries;
  straight-line estimates at 1 m/s apply only to nearby-stop candidate labels.
- **FR-006**: Allow only WALK/BUS itineraries containing at least one bus, at most
  two transfers, and different-stop transfer connectors of at most 300 m straight
  line. Do not equate public stop IDs across catalogs.
- **FR-007**: Use OTP timestamps, stop sequence and `realTime` flags. A scheduled
  leg (`realTime: false`) must not be described as a live countdown. Do not infer
  vehicle identity from municipal stop-arrival countdowns.
- **FR-008**: Validate response shape, finite/bounded coordinates, chronological
  legs, geometry and numeric values before displaying the result.
- **FR-009**: Bound response size and request time, cancel superseded requests,
  and ignore late responses after edits, navigation or a newer search.
- **FR-010**: Serialize validated Europe/Madrid departure input as M/D/YYYY and
  h:mm AM/PM, independent of the browser's system time zone.
- **FR-011**: Request four alternatives and show up to three initially; expose
  further returned alternatives. Sort by earliest arrival, then transfers,
  then walking by default, with selectable transfer/walking sorting.
- **FR-012**: Render complete steps and selectable stops, with geometry for the
  selected alternative on the persistent map. Clear obsolete route layers.
- **FR-013**: Use accessible buttons, status announcements, keyboard controls,
  responsive layouts and existing es/gl/en localization.
- **FR-014**: Show explicit retryable failure and scoped empty states. Results
  are provider estimates, not independently verified network-wide coverage.
- **FR-015**: Transmit only the selected points and departure time needed for
  planning, plus fixed allowlisted parameters. Disclose this in the existing
  collapsed privacy section. Never persist or log journey searches.
- **FR-016**: Preserve zero-infrastructure architecture and existing municipal
  catalog, arrivals and line views. OTP is an additional fixed public source,
  not an arbitrary endpoint or application-owned hosted API.
- **FR-017**: Every external HTTP integration must be behind an application-owned
  port and outbound adapter. Document allowed source calls and normalized models
  in OpenAPI with explicit use-case/port/adapter traceability. Include map resources
  without representing tiles or HTTP envelopes as domain objects. No UI, domain
  or use-case module may bypass the integration boundary.
- **FR-018**: Publish all four current contracts through the self-hosted Swagger
  UI portal described in User Story 4. Validate contracts before generation;
  include local viewer assets and license notices, retaining read-only YAML and
  policy metadata, with no external validator or request execution.
- **FR-019**: Preserve the approved compact directions UX: no endpoint selection
  by map tap, no suggestion count or radius disclaimer, collapsed privacy and
  nearby-stop details, responsive map/panel layout and selected-route restoration
  after theme changes. Recenter must fit the itinerary after focusing a stop.
- **FR-020**: Present generic walking labels as localized actions. Combine only
  adjacent identical displayed instructions within the same walking leg, sum
  distances before rounding, preserve proper street names and step order, and
  do not invent turn directions. Empty street text means continue walking,
  not an inferred street or type of path.

## Key Entities

- **Journey point**: Latitude/longitude selected from an address, stop or location.
- **Transit journey**: Provider duration/timestamps, walking, transfers and legs.
- **Transit leg**: WALK/BUS segment, stops, times, geometry and optional street steps.
- **Journey place**: Name, coordinates and optional provider-namespaced stop ID.
- **Address suggestion**: Provider-namespaced identity, readable label and validated point.
- **API contract**: Upstream request/response definitions and, where applicable,
  separate normalized models, port/adapter mapping and privacy/source policies.

## Success Criteria

- **SC-001**: Supplied four-alternative fixture decodes into complete itineraries,
  with bus lines, walking steps, intermediate stops and decoded geometry.
- **SC-002**: Tests enforce 500 m endpoint radius, two transfers and 300 m connectors.
- **SC-003**: Invalid/network/OTP errors never appear as no-service success.
- **SC-004**: Browser verification from the local app demonstrates a direct
  municipal fetch and a selectable, mapped itinerary using real response data.
- **SC-005**: Deterministic unit, DOM and browser tests cover alternatives, steps,
  selection, cancellation, privacy and map layer updates.
- **SC-006**: Queries remain memory-only and no backend/proxy is introduced.
- **SC-007**: All four current contracts are reachable through the portal;
  operations/models expand, YAML is readable and no automatic external request
  occurs when viewing documentation.
- **SC-008**: Journey and documentation flows work across desktop, Android Chrome
  and iOS Safari; the documentation reflows at 320 CSS pixels and 200% text size.
- **SC-009**: The reported four-fragment walking example becomes three ordered
  instructions with distances 110/97/33 m in each supported language.

## Assumptions and Limits

Municipal autocomplete and OTP are public external services with no application availability SLA.
Requests expose ordinary network metadata to providers. Testing localhost does
not prove every deployment origin works; record a browser check from the actual
production origin before release. Local fixtures remain deterministic and do
not silently replace unavailable live planning. Provider schedule/realtime
accuracy is not guaranteed by having a syntactically valid response.

The municipal `fixture` configuration applies to JSP only; it does not switch
off autocomplete, OTP or basemap traffic. Deterministic journey tests explicitly
inject provider responses. Offline availability of the interface/documentation
does not imply offline address search or route calculation. Map resource requests
expose viewport-related coordinates and ordinary connection metadata.

## Closure and Traceability

The product owner accepted the result and requested commit/push of this feature
on 2026-11-14. No implementation tasks are intentionally deferred to the next spec.
See [tasks.md](./tasks.md) for completed work and verification evidence,
[plan.md](./plan.md) for the final technical decisions and
[architecture.md](../../docs/architecture.md) for the current integration model.
The [source contracts](./contracts/) and fixture [example.json](../example.json)
are part of this delivery. Production-origin verification remains a release
check rather than an unimplemented feature requirement.
