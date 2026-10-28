# Feature Specification: Vigo Municipal Live Transit API

**Feature Branch**: `004-vigo-jsp-transit-api`

**Created**: 2026-10-27

**Status**: G2 approved for planning on 2026-10-27; constitution v2.1.0 ratified. G5 was closed on 2026-10-28 for the seven supported direct-JSP actions, with exceptions recorded in `gate-g5-implementation-review.md`. On 2026-10-28, the product owner separately authorized four exact line-A candidate mappings in production. This scoped change does not constitute broad source verification, complete feature readiness, or WCAG-conformance approval.

**Input**: Replace current Worker-backed transit requests and online static-catalog paths with direct browser GET requests to the fixed public Vigo municipal JSP API. Normalize source responses to the browser-facing OpenAPI data contract. Automated tests use deterministic fixtures; local development and production use direct JSP access for supported municipal operations. Unsupported actions remain individually fail-closed. No Worker fallback is permitted.

The backend-for-frontend is a logical boundary implemented by TypeScript modules
in the frontend: adapters, validation, caching, and repository orchestration run
in the user's browser. It is not a separately deployed Worker, Cloudflare
service, or other backend host.

## Product-owner scope amendment — 2026-10-28

The original G5 closure covered the seven previously supported production
actions. In a separate explicit decision on 2026-10-28, the product owner
authorized production calls for the exact line-A schedule (`id=A`, `dia=1/6/0`),
route (`Route_1005`), weekday trip (`A  02LP000_008002_4`), and line-stop
(`stop_id=2789`, `linea=A`, fixed `min=0`) mappings. All other parameters
remain blocked before network access. This decision relies on the APK's
schedule request mapping and stakeholder-reported Postman validation; it does
not convert the absence of attached response captures into independent source
evidence, close a new G5 gate, or imply actor approval. Remaining parity,
source-policy, accessibility, performance, and other waived evidence stays
deferred. No complete timetable, exhaustive catalog, or WCAG-conformance claim
is made.

**Implementation decision (2026-10-28)**: The development server and production
build use real browser GETs for the seven general catalog, stop-identity,
serving-line, and arrivals actions. Automated tests explicitly select fixtures.
The four candidate operations are additionally available in both live profiles
only for the exact product-owner-approved line-A mappings above and in the
readiness contract; every other candidate identifier fails closed. Production
still uses the bundled, explicitly non-exhaustive discovery index for global
stop search and bundled route-pattern discovery; the approved municipal
geometry/trip endpoints provide data only for their exact mapped journey.

## Context and Initial Source Findings

A static review of `APK/base` identified the municipal service URL `https://datos.vigo.org/vci_api_app/api2.jsp`. The decompiled app constructs GET requests with URL-encoded query parameters and uses these action values:

- `TRANSPORTE_LINEAS_ES` / `TRANSPORTE_LINEAS_GA` for line catalogs. The proposed production mapping uses `GA` for Galego UI and `ES` for Castellano and English UI; the source action makes the selected catalog locale observable to the provider.
- `TRANSPORTE_LINEAS_SERVICIOS_ES` / `TRANSPORTE_LINEAS_SERVICIOS_GA` for line service data, using the same UI-locale mapping as the line catalog.
- `TRANSPORTE_LINEA_HORARIOS_EXTEND&id={lineId}&dia={dayCode}` for a selected line/day service; the APK reads `shape_id` and `trip_id` from its `info_linea` result.
- `TRANSPORTE_LINEA_GEOJSON&id={shapeId}` for the route geometry and `TRANSPORTE_PARADAS_TRIP&id={tripId}` for the ordered stops used in the line map.
- `TRANSPORTE_LINEA_INFO_PARADA&stop_id={id}&linea={lineCode}&min={minutes}` for stop details in a selected line context.
- `TRANSPORTE_PARADA_ID&id={id}` for a stop record.
- `TRANSPORTE_LINEAS_PARADA&id={stop_id}` for lines serving a stop.
- `TRANSPORTE-ESTIMACION-PARADA&id={id}&ttl=5` for estimated arrivals.

The app reads the first stop record from the stop-detail response, reads arrival rows from `estimaciones`, and uses fields including `linea`, `ruta`, and `minutos`; it may display `otrosf` for a later arrival on the same line. The source offers language-specific catalog actions; feature 004 maps Galego UI to `GA` and Castellano/English UI to `ES`, without sending a separate locale or profile field. The selected catalog locale is nevertheless observable from the requested action. The meaning and server-side behavior of the `ttl` query value, response schemas, limits, and error semantics still require verification. These findings are discovery evidence, not a guarantee that the provider contract is stable.

### Browser POC Findings (2026-10-27)

The local Vite page successfully called `https://datos.vigo.org/vci_api_app/api2.jsp` from `http://localhost:5173` with browser credentials omitted. GET requests for stop detail, lines-per-stop, Spanish line catalog, Spanish line-service catalog, and estimates returned HTTP 200 and JSON; exploratory POST `FormData` requests for stop detail and estimates also returned HTTP 200. Production implementation is restricted to GET. Responses included `Access-Control-Allow-Origin: *`. This confirms direct browser access for these actions from the tested local origin only, not from GitHub Pages or every origin. The provided failing curl sent `TRANSPORTE_PARADA_ID=` as an empty parameter instead of `tipo=TRANSPORTE_PARADA_ID`; both the correctly parameterized GET and a properly encoded POST work from the POC.

Observed GET requests and response fields:

- `?tipo=TRANSPORTE_PARADA_ID&id=90`: one stop record with `id`, `stop_id`, `nombre`, `lat`, and `lon`; the tested record was Aeroporto de Peinador, source `id` 90 and municipal `stop_id` 2789. These field meanings and coordinate names must be fixed in captured fixtures before they become schema assumptions; `latitud`/`longitud` and `stop_vitrasa` were not observed in this response.
- `?tipo=TRANSPORTE_LINEAS_PARADA&id=2789`: list entries with `linea`, `descripcion`, `imagen`, `orden`, and `color`.
- `?tipo=TRANSPORTE_LINEAS_ES`: line entries with `linea`, `descripcion`, `color`, `color_texto`, `imagen`, and `orden`.
- `?tipo=TRANSPORTE_LINEAS_SERVICIOS_ES`: service entries with `linea`, `descripcion`, `tipo`, `subtipo`, `color`, and `imagen`.
- `?tipo=TRANSPORTE-ESTIMACION-PARADA&ttl=5&id=90`: a `parada` array and `estimaciones` array. The tested estimates contained `linea`, `ruta`, `minutos`, and `metros`. The APK groups later estimates for the same line into a derived `otrosf` display value; `otrosf` is not present in the raw response. GET and POST multipart both returned arrivals in the browser POC.

The successful browser response included both `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Credentials: true`; the POC deliberately omitted credentials. A subsequent browser check from `http://localhost:5173` successfully fetched the `ES`/`GA` catalogs and services, stop detail, lines-per-stop, arrivals, three schedule day codes, line-stop details, route GeoJSON, and trip stops with credentials omitted. A separate response-header check sent `Origin: https://cors-check.example`; all 13 action/parameter cases returned HTTP 200, JSON, and `Access-Control-Allow-Origin: *`. This demonstrates that the tested actions do not require GitHub Pages as the request origin. It does not prove that untested actions or response semantics are correct, nor does it validate schedule identity: the exploratory schedule request with `id=A` returned a first route for line C3. Schedule ID mapping, response limits/error behavior, and field semantics remain to be verified. Observed wait values and row counts are snapshots, not contract guarantees.

Static APK call-chain findings, not yet exercised as an end-to-end mapping: the selected line/day schedule response supplies `shape_id` and `trip_id`; the map view requests route GeoJSON and ordered trip stops using those values. The source also exposes `TRANSPORTE_LINEA_INFO_PARADA` with `stop_id`, `linea`, and `min` parameters. Browser CORS fetches for these actions succeeded locally, and wildcard response headers were observed for their test cases. The line/day identifier mapping remains unresolved: the exploratory request with `id=A` returned a first trip for C3. Payload schemas, weekday/Saturday/Sunday-holiday coverage, and coordinate reference system still need semantic verification; these are not GitHub Pages-specific CORS blockers.

The normalized contract currently described by feature 003 is `info.version: 4.0.0` in OpenAPI 3.1.0 and represents Worker REST endpoints, edge freshness headers, and Worker-generated catalog metadata. Feature 004 proposes a breaking browser/source-boundary change; its canonical normalized contract version is **5.0.0** (still OpenAPI 3.1.0). Version 5.0.0 is a schema/compatibility version, not a new HTTP server endpoint. Keep the v4 artifact and its closed gate records as historical evidence; do not edit them retroactively. The feature 004 contract MUST preserve compatible domain models where possible and explicitly document any changed fields and freshness metadata.

## Clarifications

### Session 2026-10-27

- Q: May G1 ratify the direct-access architecture conditionally, with CORS and response validation as mandatory production-release gates? → A: Yes. Production remains blocked until every required action passes browser fetch and response validation. CORS is origin-independent when each action returns `Access-Control-Allow-Origin: *`; otherwise test the configured production origin. Any failed check blocks release, returns architecture to G1, and never enables a Worker fallback.
- Q: If the JSP provides no verified data-generation timestamp, what should the app communicate about the freshness of a newly received response? → A: Use age since client receipt with the existing thresholds, and describe it as time since receipt; do not imply that the provider generated the data at that time.
- Q: May catalog and service actions follow the UI locale when the source provides only `ES` and `GA`? → A: Yes. Use `GA` for Galego UI and `ES` for Castellano and English UI. The requested action makes the source locale observable, but no separate locale or other profile data is sent. The proposed constitutional text has been updated to permit this mapping.
- Q: Should the normalized OpenAPI contract for direct integration use version `5.0.0`, without creating an `/api/v5` server endpoint? → A: Yes. Keep OpenAPI format version 3.1.0, set the contract's `info.version` to 5.0.0, and retain v4.0.0 as historical evidence.
- Q: If the JSP lacks a line/day timetable, what should the app show during migration? → A: Use the existing snapshot only for that combination, with its source and trustworthy date/provenance clearly identified; if that metadata is unavailable, show the timetable as unavailable. Never label snapshot data as JSP or live data.
- Q: Must production CORS verification use GitHub Pages as the request origin? → A: No. The user requested that production not depend on GitHub Pages. Wildcard `Access-Control-Allow-Origin: *` for every required action with credentials omitted makes CORS independent of the static HTTPS host; if an action restricts origins, verify the configured production host for that action.

### Session 2026-10-28

- Q: Should the four candidate source operations use inferred mappings for a labeled provisional evaluation while remaining disabled in live profiles until G5 is reopened? → A: Yes. Use explicit extrapolated assumptions only in fixture-based provisional evaluation, label every resulting model and UI state as provisional/unverified, and do not enable local-live or production access until a new G5 review approves the evidence and implementation.

## User Scenarios & Testing

### User Story 1 - See current arrivals for a selected stop (Priority: P1)

A rider opens a stop and receives the latest estimated bus arrivals from the Vigo municipal transport service, rather than relying on the current InfoBus page parser that frequently fails.

**Why this priority**: Reliable arrival times are the main user benefit and the reason for replacing the current upstream integration.

**Independent Test**: Select a known stop against recorded municipal-service fixtures and verify line, route/destination, estimated minutes, ordering, and the correct empty or unavailable state. A separate opt-in live smoke test may verify the public service without making ordinary tests network-dependent.

**Acceptance Scenarios**:

1. **Given** a stop with a valid Vitrasa identifier and a successful response, **When** the rider opens its arrivals, **Then** the app shows the returned line, route/destination, and estimated minutes in ascending wait order.
2. **Given** a successful response with no upcoming estimates, **When** the rider opens the stop, **Then** the app shows an explicit empty state, not an upstream error.
3. **Given** the source cannot be reached or returns invalid data, **When** the rider opens the stop, **Then** the app shows a clear unavailable/stale state and never presents partial data as current.
4. **Given** the selected stop has no Vitrasa identifier, **When** arrivals are requested, **Then** no municipal arrivals call is made with an internal or municipal ID as a substitute.

### User Story 2 - Browse current stops, lines, and line service (Priority: P1)

A rider searches the current stop and line catalog, opens line details, and sees the stops and service information supplied by the municipal API instead of relying on an outdated bundled catalog as the primary source.

**Why this priority**: Stop identity and line membership are necessary to select the correct public arrival identifier and to make live arrivals discoverable.

**Independent Test**: Use recorded responses for line catalog, stop detail, lines-per-stop, and line service; verify the UI receives a consistent catalog and that municipal IDs and Vitrasa IDs are not confused.

**Acceptance Scenarios**:

1. **Given** the municipal service returns lines in Castellano or Galego, **When** the app loads the catalog, **Then** it displays the corresponding lines with the stable public line code and available metadata.
2. **Given** the app resolves a stop, **When** it requests stop details and serving lines, **Then** the stop name and identifiers remain associated with the correct stop and every serving line is shown.
3. **Given** the API provides published service data for a line, **When** the rider opens line details, **Then** the app presents the service by weekday, Saturday, and Sunday/holiday where available and does not invent missing times.
4. **Given** a line service includes a route shape and a trip, **When** the rider opens the line map, **Then** the application draws the returned route geometry and shows stops in the returned trip order; it does not invent a straight line between stop coordinates.
5. **Given** a route shape, trip, or line-stop detail is unavailable or malformed, **When** the rider opens line details, **Then** the application shows available stop/service information without inventing route geometry or exposing raw JSP payloads.
6. **Given** one source response is missing optional fields, **When** the app renders the result, **Then** it remains usable without displaying raw JSP payloads or internal identifiers as the stop name.

### User Story 3 - Use the same application contract locally and in production (Priority: P1)

A contributor can run the app against the public municipal source; automated tests explicitly use deterministic fixtures. Local and production traffic share the direct browser path and versioned normalized data contract, with no transit Worker fallback.

**Why this priority**: Reproducible tests and deployment behavior are required to safely replace a live data source without coupling UI code to JSP response details.

**Independent Test**: Run contract tests against fixture responses; run opt-in direct local-live tests against the public service; verify normalized outputs match the v5.0.0 OpenAPI schemas. Before release, verify browser fetch and CORS headers for every required action; wildcard CORS makes the check independent of the configured static HTTPS host. Semantic source-to-model and line/day mapping checks remain required.

**Acceptance Scenarios**:

1. **Given** the fixture profile, **When** automated tests or a developer explicitly selects fixtures, **Then** deterministic fixture data is used and no external network request is required.
2. **Given** a contributor explicitly selects local-live, **When** the app loads municipal data, **Then** the browser attempts the public `datos.vigo.org` JSP directly from localhost without credentials and maps results to the same application-facing models if the browser permits the cross-origin response.
3. **Given** direct local-live access is blocked by CORS, **When** a contributor selects local-live, **Then** the app reports a clear unavailable/developer diagnostic and does not switch to a Worker or another source; fixtures remain available by selecting the fixture profile.
4. **Given** the production profile is selected, **When** the app requests a supported transit operation, **Then** the browser calls only the fixed municipal JSP host using the supported GET action/parameter allowlist and normalizes responses to v5.0.0.
5. **Given** a supported operation fails its CORS, transport, or payload checks, **When** the app handles the response, **Then** it shows an unavailable state without switching to a Worker or alternate upstream. Operations that still lack verified identity or semantic mappings remain unavailable individually and do not disable supported production operations.
6. **Given** source actions return stop, line, service, geometry, trip, or estimate fields, **When** responses are normalized, **Then** the v5.0.0 OpenAPI document identifies source-provided, renamed, optional, nullable, and derived values, while fixture and live profiles produce the same normalized models.

### Edge Cases

- The municipal endpoint blocks browser CORS, changes CORS behavior, or responds differently to localhost and the production origin.
- The service returns HTML, malformed JSON, unexpected content types, an error envelope, or an HTTP-success response containing an application error.
- A stop has both a municipal identifier and a Vitrasa identifier; the wrong identifier must never be sent to the arrivals action.
- The stop-detail action returns no records, multiple records, or a record without the expected `id`/`stop_id` fields.
- A line has service metadata but no `shape_id`, the referenced GeoJSON shape is empty, the `trip_id` returns no ordered stops, or shape and trip belong to different line directions.
- An arrivals response has an empty `estimaciones` list, duplicate lines, malformed minute values, a missing `ruta`, or `otrosf` without an arrival row.
- A line catalog or service action is unavailable in one language or for one day type.
- The source supports no English catalog action; English UI uses `ES`, Galego UI uses `GA`, and Castellano UI uses `ES`. The selected action reveals the catalog locale to the provider, but no separate locale field or other UI profile data is sent.
- The endpoint is unavailable offline; only explicitly identified local cache or bundled schedule/catalog snapshots may be used, subject to freshness limits and without presenting them as live.
- The provider rate-limits or temporarily fails, or the response latency is high.
- The provider changes a `tipo` action, field name, query parameter, or payload shape.
- Cached data is available during an outage; the app must preserve its freshness and avoid labeling old results as current.
- A configuration value accidentally enables live calls in deterministic CI or exposes a private value in a URL, log, or response.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST obtain live arrivals for a selected stop from the municipal Vigo transport data service identified in the APK analysis, using its public arrivals action and the stop's Vitrasa identifier.
- **FR-002**: The application MUST obtain current stop and line information from the municipal service, including line catalogs, stop details, lines serving a stop, and published line service when the corresponding source actions are available.
- **FR-003**: The source adapter MUST keep municipal stop identifiers and Vitrasa stop identifiers distinct and MUST map the correct Vitrasa identifier to the existing arrivals request.
- **FR-004**: The application MUST normalize source responses into the current frontend/domain models; UI components MUST NOT depend on raw JSP action names, source-specific field names, or response envelopes.
- **FR-005**: The normalized browser data contract MUST be specified in OpenAPI 3.1.0 as version 5.0.0. This is a MAJOR contract version because it replaces the v4 Worker REST boundary and its server-generated freshness/catalog metadata with direct source access and client normalization. V4 remains unchanged as historical evidence; v5.0.0 does not imply a deployed `/api/v5` server.
- **FR-006**: The v5.0.0 OpenAPI document MUST describe the fixed municipal JSP host, the allowlisted source GET actions and parameters, captured source schemas, normalized application models, and source-to-model provenance. UI components MUST consume normalized models, not raw JSP envelopes.
- **FR-007**: Automated tests MUST use the deterministic fixture profile. The development server MUST use direct browser GET requests from localhost to the fixed municipal JSP for supported actions. Development and production MUST omit credentials and use only the fixed action/parameter allowlist. CORS and payload failures MUST be shown without an alternate network path.
- **FR-008**: Production MUST use direct browser requests to the fixed JSP host for supported actions only. The production transit flow MUST NOT use or fall back to the Cloudflare Worker or another server-side adapter. An unsupported or unverified operation MUST remain individually unavailable; it MUST NOT disable unrelated supported operations.
- **FR-009**: Production access MUST be enabled for the supported action set: line catalogs (`TRANSPORTE_LINEAS_ES`, `TRANSPORTE_LINEAS_GA`), service catalogs (`TRANSPORTE_LINEAS_SERVICIOS_ES`, `TRANSPORTE_LINEAS_SERVICIOS_GA`), stop identity (`TRANSPORTE_PARADA_ID`), serving lines (`TRANSPORTE_LINEAS_PARADA`), and arrivals (`TRANSPORTE-ESTIMACION-PARADA`). Each call MUST use the browser fetch path with `credentials: 'omit'`, bounded response checks, schema/identity validation, and no alternate network path. The exact candidate mappings explicitly authorized by the product owner in FR-030 are also enabled in production. This scoped decision does not claim that deferred source evidence or actor reviews passed; all other candidate parameters remain blocked.
- **FR-010**: The production client MUST target only `https://datos.vigo.org/vci_api_app/api2.jsp`, issue GET requests, and use the exact action/parameter allowlist in the source contract. It MUST reject malformed identifiers and unsupported values before network access; it MUST NOT accept a caller-controlled host or action.
- **FR-011**: Feature 004 MUST comply with ratified constitution v2.1.0. The v4 Worker integration may remain as migration-era source only; it MUST NOT be deployed or used by the frontend. A failed operation MUST render unavailable without restoring the Worker path.
- **FR-012**: The source adapter MUST validate required identifiers and action values before sending requests, and MUST reject malformed or unsupported values without contacting the source.
- **FR-013**: Source errors, timeouts, rate limits, invalid payloads, and empty results MUST map to distinct normalized application states. An incomplete source response MUST NOT be returned as current or empty.
- **FR-014**: Arrival retrieval freshness MUST preserve the current contract's thresholds using the client receipt time of a fully validated response: current for age under 30 seconds; stale only after refresh failure for age from 30 seconds to under 300 seconds; unavailable at 300 seconds or older. “Current” means recently received by this client, not recently generated by the provider. Rider-facing status MUST describe time since receipt and MUST NOT imply a provider generation time or freshness guarantee. Empty results use the same receipt-time basis and MUST NOT be relabeled current after cache reuse. Since no provider-generated timestamp has been verified, the contract MUST name this value `fetchedAt` (or equivalent) and MUST NOT describe it as source generation time.
- **FR-015**: The client MUST use the same normalized contract in fixture, local-live, and production profiles. Profiles MUST be selected through configuration and MUST NOT require source URLs to be entered by the user.
- **FR-016**: Direct calls MUST be excluded from unit, contract, load, and E2E test runs by default; those tests MUST select fixtures explicitly. The development server's local-live profile is separate from tests and calls only the supported action set.
- **FR-017**: The browser client MUST omit credentials and MUST NOT include profile data, account identifiers, or precise location in data-source requests. The line catalog and line-service action MAY be selected from the UI locale using only the fixed `GA` or `ES` action mapping; the selected locale is observable to the provider from that action. No separate locale or other UI profile data may be sent. The client MUST NOT log or expose credentials, cookies, session state, or unrelated provider data. The project MUST NOT claim to control or eliminate ordinary network metadata processed by the browser, network, or provider.
- **FR-018**: Contract tests MUST cover every allowlisted source action and normalized operation, including identifier and coordinate mappings, both `ES` and `GA` catalog/service actions and their UI-locale mapping, service-day coverage, route geometry, trip order, arrival ordering, empty data, malformed/oversized data, timeouts, CORS failures, and source errors.
- **FR-019**: A live smoke test MUST be opt-in, read-only, rate-limited, and use only a public stop identifier; it MUST NOT be a prerequisite for the default test suite.
- **FR-020**: The source adapter MUST verify the actual meaning and effect of `ttl=5` before relying on it as a source-side cache directive. The application MUST retain its own explicit freshness policy regardless of the source parameter.
- **FR-021**: Once the live integration is accepted, the municipal source MUST be primary for online stop/line data. A bundled catalog or schedule snapshot MAY remain for offline use and during migration, but MUST be explicitly identified as bundled/cached data with its own provenance and freshness; it MUST NOT silently replace a failed online source while being labeled live. For a line/day timetable missing from the JSP during migration, the existing snapshot MAY be shown only when its source and trustworthy date/provenance are available; otherwise show unavailable. Retain the existing schedule snapshot until source coverage and parity are verified.

- **FR-022**: The v5.0.0 contract MUST map captured stop fields into `NetworkStop`: observed `stop_id` to `municipalCode`, observed `id` to `vitrasaId` only after fixtures confirm its meaning, `nombre` to `name`, and observed `lat`/`lon` to coordinates. It MUST NOT assume `stop_vitrasa` or `latitud`/`longitud` without captured evidence. It MUST map line `linea`/`descripcion`/`color` to `code`/`name`/`color`, and MAY add optional `textColor`, `displayOrder`, `serviceType`, `serviceSubtype`, or `image` when verified and needed. It MUST map estimate `linea`/`ruta`/`minutos` to `lineCode`/`destination`/`minutes` and MAY add optional `distanceMeters` for `metros` after its units/meaning are verified. Grouped later estimates MUST use a typed derived `followingMinutes` array if retained.
- **FR-023**: OpenAPI MUST state required/optional/nullability rules, units, ordering, freshness semantics, and source-versus-derived provenance. The v5.0.0 contract MUST preserve compatible domain models where possible, and regression tests MUST validate source fixtures and normalized outputs. Any subsequent breaking contract change MUST increment its MAJOR version.
- **FR-024**: The normalized line-detail contract MUST represent service metadata needed to resolve a route geometry and trip sequence, including optional source `shape_id` and `trip_id` and the selected service day. It MUST NOT expose raw JSP envelopes as the browser-facing schema.
- **FR-025**: The normalized API MUST represent route geometry and ordered trip stops from `TRANSPORTE_LINEA_GEOJSON` and `TRANSPORTE_PARADAS_TRIP`. The explicitly authorized mapping is restricted to line A and `Route_1005`, with OGC:CRS84 and the exact trip/stop association recorded in the readiness contract. This attestation is not independent provider evidence; production access is limited to the exact authorized IDs. Fixture evaluation MUST remain synthetic and visibly provisional. The application MUST NOT imply that an independently sourced trip sequence is equivalent to geometry unless their relationship is verified. Without a verified linked stop sequence, geometry MUST be decorative and accompanied by visible text stating that no verified stop-by-stop description is available. The application MUST NOT synthesize a route by drawing straight segments between stop coordinates when source geometry is missing.
- **FR-026**: `TRANSPORTE_LINEA_INFO_PARADA` MUST keep municipal `stop_id`, public line code, trip ID, shape ID, and Vitrasa IDs distinct. The stakeholder reports that `min` is measured in minutes; the application sends only fixed `min=0` and does not expose a configurable threshold. Production and local-live allow only municipal stop `2789` and public line `A`, with `min=0` fixed, and MUST reject rows with a conflicting leading trip token. Preserve `shape_id` as an opaque source identity unless its association is verified. The reported unit and mapping do not constitute independent provider evidence or actor approval.
- **FR-027**: Before retiring the existing schedule snapshot as a migration source, the JSP MUST demonstrate coverage and parity for weekday, Saturday, and Sunday/holiday service across supported lines. During migration, a missing JSP line/day timetable MAY use that exact combination from the bundled snapshot only when its source and trustworthy date/provenance are recorded and shown; it MUST NOT be presented as JSP or live data. If snapshot provenance/date is not trustworthy, show unavailable rather than infer a timetable. Keep the bundled snapshot as an explicitly labeled offline source after parity is demonstrated if needed.
- **FR-028**: Catalog and service requests MUST use only the fixed source actions `TRANSPORTE_LINEAS_ES`, `TRANSPORTE_LINEAS_GA`, `TRANSPORTE_LINEAS_SERVICIOS_ES`, and `TRANSPORTE_LINEAS_SERVICIOS_GA`. Use `GA` when the UI locale is Galego (`gl`) and `ES` for Castellano (`es`) or English (`en`). Do not send a separate locale parameter or any other UI profile data. The proposed constitution's Principle I and Principle VI MUST permit this mapping.
- **FR-029**: Client caches MUST be bounded and preserve the freshness rules in FR-014. A client receipt timestamp MUST describe only when the browser received and validated the response; absent a verified provider timestamp, no source-generation time may be claimed. Offline catalog/schedule snapshots and stale arrival data MUST have distinct provenance and UI states.
- **FR-030**: The seven supported production actions and the four exact candidate mappings MUST use the actual browser fetch path with credentials omitted and validate HTTP status, CORS permission, JSON content type, bounded payload, schema, and stop identity. The product owner explicitly authorizes only these candidate parameters in production and local-live: schedule `id=A` with `dia=1/6/0`; geometry `id=Route_1005`; trip stops `id=A  02LP000_008002_4`; line-stop detail `stop_id=2789`, `linea=A`, fixed `min=0`. All other candidate parameters MUST fail before network access. This decision changes runtime scope only; deferred evidence and outstanding actor reviews remain deferred/unapproved and are not represented as passed.
- **FR-031**: For the exact schedule mapping only, the source `id` is `A` and APK selector values map as `dia=1` weekday, `dia=6` Saturday, and `dia=0` Sunday/holiday. Because observed schedule responses contain mixed trip prefixes, retain only rows whose exact leading trip-code token matches the requested catalog line code; exclude other well-formed line tokens, reject malformed target-line rows, and treat an empty matched set as unavailable. This is not a general rule for other lines or independent provider evidence. Fixture results remain visibly provisional.
- **FR-032**: For the exact weekday trip mapping only, `id` is exactly `A  02LP000_008002_4`; source `orden` is treated as one-based contiguous sequence, and `stop_id` resolves only by exact equality to a known municipal stop code. Reject the complete sequence if any identity is unknown, duplicated inconsistently, or contradicts line A membership. Do not reuse the mapping for Saturday/Sunday-holiday or other trips. Fixture results remain visibly provisional.

### Key Entities

- **Municipal Stop**: A public stop record from the Vigo data service, including its municipal/public identifier, name, optional address, and served-line relationships.
- **Vitrasa Stop ID**: The identifier expected by the municipal arrivals action; it is not interchangeable with internal or municipal stop IDs.
- **Line**: A service identified by public code, localized metadata, route/stop patterns, and optionally published service information.
- **Arrival Estimate**: A source estimate associated with a Vitrasa stop ID, line code, route/destination, wait minutes, and optional additional-wait data.
- **Normalized API Response**: The stable OpenAPI-defined representation consumed by the application, independent of the source action and JSP payload.
- **Route Shape**: The source-provided route geometry selected by `shape_id`, with an explicit coordinate reference system.
- **Trip Stop Sequence**: The ordered stop records for the selected `trip_id`, distinct from the route geometry.
- **Data Profile**: The selected fixture, local-live, or production source path and its permitted network behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: In a live smoke run against a healthy municipal service, at least 19 of 20 valid stop lookups return complete, normalized arrivals or an explicit valid empty result within 5 seconds; no partial response is labeled current.
- **SC-002**: For a corpus of at least 20 known stops and 10 lines, the normalized stop IDs, line codes, stop-line membership, and arrival fields match the recorded source responses with zero identifier substitutions.
- **SC-003**: Fixture, local-live, and production direct-source profiles produce normalized responses that pass the same v5.0.0 OpenAPI schema; v4.0.0 remains unchanged, and the v5.0.0 change is explicitly recorded as a breaking contract migration.
- **SC-004**: A reproducible architecture record contains browser CORS and response-validation results for the supported production actions, including the returned `Access-Control-Allow-Origin` value. Wildcard CORS requires no specific hosting origin. The four candidate operations use only the exact product-owner-authorized mappings in FR-030 in production and local-live; the scope decision does not imply that deferred evidence passed and does not block unrelated supported production operations.
- **SC-005**: Default CI and E2E runs make zero requests to `datos.vigo.org`; a separate opt-in local-live check can be run without credentials.
- **SC-006**: For simulated source failures, 100% of tested cases terminate within the approved timeout and show empty, stale, or unavailable correctly; none are shown as current without validated source data.
- **SC-007**: The local app uses live municipal data without deployment; the explicit fixture profile remains deterministic, isolated from the network, and usable offline.
- **SC-008**: No municipal request contains user identity, favorites, recent history, theme preferences, or location. Catalog and service requests use `GA` for Galego UI and `ES` for Castellano/English UI, so the provider can infer the catalog locale from the action but receives no separate locale or other UI profile field. Source payloads and internal source errors are not displayed to riders.
- **SC-009**: The OpenAPI contract and its regression fixtures cover every retained source field, including canonical stop identifier/coordinate mappings, line catalog metadata, `distanceMeters` when verified, and typed `followingMinutes` if retained; every field documents units, optionality, ordering, and source-versus-derived provenance.
- **SC-010**: Direct browser CORS and payload/schema behavior are measured for the supported production actions using the repeatable protocol in FR-009 and FR-030. The four candidate source operations are enabled only for the exact product-owner-authorized mappings in FR-030; all other values remain blocked. Deferred candidate evidence, browser CORS observations, and actor reviews remain explicitly unverified.
- **SC-011**: Contract fixtures validate the inferred line/day-to-`shape_id`/`trip_id` relationship, assumed geometry coordinate system, and ordered stop sequence while preserving provisional provenance. Fixture coverage and stakeholder-reported Postman validation are not independent provider evidence. Any live line map uses only the exact local-live mapping and never substitutes a fabricated straight-line route.
- **SC-012**: Arrival retrieval freshness uses client receipt age with the existing 30-second current, 30-to-under-300-second stale-after-failure, and 300-second unavailable thresholds; rider-facing copy describes time since receipt, and no timestamp or status is described as source-generated or provider freshness unless verified by the provider contract.
- **SC-013**: For every supported line, recorded evidence compares JSP schedule coverage with the existing snapshot across weekday, Saturday, and Sunday/holiday. During migration, uncovered JSP combinations use only a snapshot with visible, trustworthy provenance/date; otherwise they show unavailable. No snapshot is retired before parity is demonstrated, and no snapshot timetable is labeled as JSP/live data.

## Assumptions

- The APK analysis is from the VigoPlus municipal app, package `org.vigo.apps.vigoplus`; the identified JSP actions are current evidence to verify against live responses, not a permanent public guarantee.
- The public base is `https://datos.vigo.org/vci_api_app/api2.jsp`; observed `tipo` values include the actions listed in Context. The proposed integration maps catalog/service actions to `GA` for Galego and `ES` for Castellano/English; the arrivals action uses `id` and the APK supplies `ttl=5`.
- The observed arrivals response has an `estimaciones` collection with `linea`, `ruta`, `minutos`, and `metros`. The APK derives `otrosf` by grouping later estimates from the same line. Planning must document verified semantics separately from unresolved source behavior and define fail-closed validation; unverified distance fields must be omitted. Source coverage, nullability, bounds, error semantics, and usage limits remain release checks, not permission to assume a stable provider contract.
- Feature 003's OpenAPI 3.1.0 contract version 4.0.0 is the legacy Worker REST contract. Feature 004 proposes OpenAPI 3.1.0 contract version 5.0.0 for the changed direct-source boundary and normalized models; this is a contract version, not a deployed API endpoint.
- Static schedule snapshots are not discarded until municipal line-service actions are verified for coverage and freshness against weekday, Saturday, and Sunday/holiday service; offline use may continue to use an explicitly identified bundled snapshot.
- No credentials are required by the observed public endpoint. If that changes, no secret may be placed in frontend assets or public query parameters; the architecture decision must be reopened.
- Direct browser access from localhost and wildcard CORS response headers for 13 action/parameter cases were observed with credentials omitted. The schedule request's public-line identifier mapping and schedule parity remain unverified by independent evidence. The stakeholder reported validating the exact mappings listed in the readiness contract; the product owner separately authorized only these mappings for production. Neither report is independent provider evidence or proof that deferred reviews/evidence passed.
- Constitution v2.1.0 was ratified at G1 on 2026-10-27. Static HTTPS hosting does not depend on GitHub Pages, and wildcard CORS was confirmed for the 13 tested action/parameter cases. The unexpected mixed-line schedule response (`id=A` returned C3), unresolved day semantics, unconfirmed geometry CRS, trip-stop correlation, `min` behavior, and full schedule parity remain blockers to live implementation acceptance and production release.

## Out of Scope

- Reconstructing unrelated VigoPlus modules or integrating non-transit services from the municipal app.
- Sending authenticated user or device data to the municipal service.
- Changing user-facing map, favorite, theme, or privacy behavior from feature 003 except where required to consume normalized live catalog/arrival data.
- Any Worker fallback, new backend service, or alternate transit upstream in the feature 004 production flow.

## Planning Clarifications and UX Acceptance Baseline — 2026-10-27

These clarify testability without changing the direct-browser architecture or claiming
source verification. G2 review records are maintained separately in
`gate-g2-spec-review.md`; Draft status alone is not a gate verdict.

- Transport identifiers remain opaque source values in live profiles until
  their action-specific meaning is verified. Public line codes MUST NOT be
  substituted for schedule IDs in live data. Fixture-only provisional
  evaluation MAY use the explicit line/day assumptions in FR-031 and MUST label
  every dependent result unverified.
  The existing catalog remains a labeled discovery/offline seed where the approved
  actions do not provide full stop enumeration; no unapproved enumeration action
  or bulk identifier probing is authorized.
- Every source operation has a 5-second total deadline, including body reading and
  validation. Invalid, partial, excessive, or mismatched data is unavailable, not
  empty. Numeric resource/cache budgets are set in the plan as client limits, not
  claimed municipal limits.
- Preserve feature 003 navigation, favorites, theme, and locale behavior. Source
  replacement adds explicit loading, valid-empty, unavailable, stale-after-failure,
  cached/offline, and timetable-provenance states, without automatic source switching.
- Verify those states at 320, 768, and 1280 CSS-pixel widths and at 200% zoom;
  no page-level horizontal overflow, clipped status text, or inaccessible controls.
  All actions are keyboard-operable with visible, unobscured focus; refresh keeps
  focus on its trigger. Status changes use a polite live region without announcing
  each countdown tick; errors are textual, not color-only. Targets are at least
  44×44 CSS pixels; contrast is at least 4.5:1 for normal text, 3:1 for large text
  and UI boundaries. Respect reduced motion.
- Map geometry is supplementary: the same ordered stops and service information
  must be available as a semantic list, with no keyboard trap. Missing geometry
  never removes otherwise valid textual information or creates an invented route.
- Automated accessibility/state checks plus manual keyboard, reflow, focus, and
  contrast evidence are specified as design acceptance criteria. The product
  owner deferred all outstanding validation listed in T069 to a future spec
  (2026-10-28); the limited G5 closure does not claim these checks passed or
  establish delivered WCAG conformance. G2/G3 approve criteria and design only.
- Existing favorite stops and lines MUST survive migration in browser
  `localStorage` without deletion or identifier substitution. Test opening each
  saved item against mapped municipal fixtures: verified identities remain
  usable; unresolved items remain saved and show unavailable rather than opening
  a different stop/line. Favorites never enter municipal requests.
- Preserve visible-page automatic refresh every 30 seconds; pause when hidden.
  Do not add a separate manual Refresh control. Retry is available for failed
  stale/unavailable states when online. One request per stop may be pending;
  repeated activation is coalesced, the trigger remains focused with
  `aria-disabled="true"` while pending, and completion is announced once politely.
  Offline recovery uses the same refresh path once connectivity returns.
- Internal failure reasons (transport/CORS, timeout, rate limit, HTTP error,
  invalid/mismatched payload, oversized payload) remain distinct for tests and
  sanitized developer diagnostics. Riders see safe localized unavailable/retry
  copy, a dedicated offline notice, or stale-after-failure copy; no raw source
  errors or payloads. A successful empty collection is not a failure.

| Arrival evidence and age | Rider state and precedence |
| --- | --- |
| No validated response, request pending | Loading; no invented estimates |
| Validated nonempty or empty response, age <30 s | Recently received results or explicit empty; if offline, add offline/cached provenance, never claim live |
| Age >=30 s and <300 s, refresh pending or not yet attempted | Updating/refresh due; do not call current or stale-after-failure |
| Age >=30 s and <300 s, refresh failed (including offline) | Stale results or stale-empty with receipt age and failure/offline notice |
| Age >=300 s, any transport/connectivity state | Unavailable estimates; cache/provenance may be mentioned but old estimates are not presented as usable |
| No validated response and failed/offline | Unavailable or offline-unavailable; Retry only online |

Age is always measured from the original validated client receipt, including
cache reuse; successful refresh alone advances that timestamp. Tests cover
29,999 ms, 30,000 ms, 299,999 ms, and 300,000 ms, empty and nonempty responses,
and offline transitions. Connectivity/provenance never bypasses age limits.
