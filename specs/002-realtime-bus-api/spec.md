# Feature Specification: Vigo Bus Real-Time API

**Feature Branch**: `002-realtime-bus-api`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Create a new specification for real-time data. Base the implementation on a Cloudflare Worker connected to the API and on https://github.com/David-Lor/VigoBusAPI. Run the Worker in the cloud and from the project during local development. State in the license that this work is based on its code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consult Real-Time Arrivals (Priority: P1)

As a person waiting at a Vigo bus stop, I want to see upcoming buses and their estimated times so I can decide whether to wait, change lines, or find another option.

**Why this priority**: This is the primary value of the feature and provides dynamic information that the static snapshot cannot provide.

**Independent Test**: With a valid stop and an available data service, an application request returns normalized arrivals identified by line and remaining time, and the screen shows the result with its freshness state.

**Acceptance Scenarios**:

1. **Given** a valid stop and an available transport-source response, **When** the person requests arrivals, **Then** upcoming buses are shown with line, destination when available, remaining time, and query time.
2. **Given** a valid response with no upcoming arrivals, **When** the person requests the stop, **Then** a clear empty state is shown and is not treated as a system error.
3. **Given** a source response with missing optional fields or a different field order, **When** the service processes it, **Then** the application receives the normalized contract without being exposed to the source format.
4. **Given** a stop has arrivals on multiple source pages, **When** the person requests arrivals, **Then** the result includes arrivals from every page, ordered by wait time, without exposing pagination to the application.
5. **Given** a later source page cannot be retrieved or parsed, **When** the person requests arrivals, **Then** the service returns a stale result when available or an unavailable error, never a partial list marked current or empty.
6. **Given** the arrivals view initiates a live lookup, **When** the person sees the view, **Then** a concise localized notice discloses that the selected public stop ID is sent to Cloudflare and Vitrasa and those providers may process connection metadata; it makes no anonymity claim and states that no account/profile data is sent.
7. **Given** a selected catalog stop has no Vitrasa identifier, **When** the person opens its arrivals view, **Then** no arrivals request is made and a localized unavailable state is shown without substituting the internal or municipal identifier.
8. **Given** the arrivals view is open, **When** the browser document becomes hidden and later visible, **Then** periodic arrivals polling pauses while hidden and resumes while visible without a page reload.

### User Story 2 - Use the API in Production and Development (Priority: P1)

As a developer or deployment owner, I want the same arrivals API to work locally, in a development preview, and in the published application so environments are reproducible and do not require manual changes.

**Why this priority**: Without a consistent execution path, the feature cannot be tested or published reliably.

**Independent Test**: Start the local Worker without network access using fixture mode; verify development/live override and preview/production bindings select the documented behavior while the public API contract remains identical.

**Acceptance Scenarios**:

1. **Given** the local or development fixture profile, **When** the project starts, **Then** the proxy service is available from the project and serves deterministic fixtures without external network access.
2. **Given** the local/development live override or preview/production profile, **When** the Worker requests arrivals, **Then** it uses the fixed Vitrasa URL; the frontend sends requests to the Worker configured for that profile.
3. **Given** an unknown profile or missing frontend Worker URL, **When** the application starts or requests arrivals, **Then** it reports a clear configuration error without exposing secrets or accepting a caller-supplied source URL.
4. **Given** any browser origin, **When** the application calls the Worker, **Then** every response, including error responses, carries `Access-Control-Allow-Origin: *` so the call is never blocked by CORS policy.

### User Story 3 - Maintain Availability and Trust During Failures (Priority: P2)

As a user, I want to know when data is current, stale, or unavailable so I do not interpret missing information as meaning that no buses are running.

**Why this priority**: Real-time data depends on external services and must communicate its level of confidence explicitly.

**Independent Test**: Simulate slow responses, errors, old data, and usage limits, then verify that the application receives distinct states and retains the last valid result when appropriate.

**Acceptance Scenarios**:

1. **Given** the external source takes longer than the configured limit, **When** a stop is requested, **Then** the service responds within the operational limit with an unavailable or stale data state.
2. **Given** a last valid result is temporarily stored, **When** the source fails, **Then** the service returns it marked as stale with its update time.
3. **Given** the source returns an error or invalid format, **When** the response is processed, **Then** the service returns a normalized error without credentials, internal traces, or sensitive content.

### User Story 4 - See Stops and Lines Correctly Positioned on the Map (Priority: P2)

As a user, I want bus stops to appear at their correct geographic locations and lines to be drawn along their correct routes on the map, so I can trust the map to decide where to go.

**Why this priority**: A map with misplaced stops or lines actively misleads the user; correctness of geographic data is as important as its availability.

**Independent Test**: Open the map for a line and verify that every stop marker sits at its catalog coordinates in Vigo and that the line rendering connects or groups the stops along the real route.

**Acceptance Scenarios**:

1. **Given** a line with stops that have valid coordinates, **When** the map is displayed, **Then** every stop marker is rendered exactly at its catalog longitude/latitude in Vigo.
2. **Given** a line with multiple stops, **When** the map fits the viewport, **Then** all stops of the line are visible and the line representation follows the correct route or stop order.
3. **Given** a stop whose coordinates are missing or outside the Vigo area, **When** the map is displayed, **Then** the stop is not silently placed at a wrong location and the anomaly is surfaced in the data status.

---

### User Story 5 - Acknowledge Code and Data Provenance (Priority: P2)

As the project owner, I want the integration to correctly acknowledge VigoBusAPI and its license conditions so the Worker and application can be distributed transparently.

**Why this priority**: The integration is based on the code of an external repository and must preserve its attribution obligations.

**Independent Test**: Review the distributed project and verify that it contains the VigoBusAPI repository reference, the applicable Apache-2.0 license, original copyright notices where required, and a description of the modifications made.

**Acceptance Scenarios**:

1. **Given** code or documentation derived from VigoBusAPI, **When** the distributed repository is reviewed, **Then** it contains visible attribution to `David-Lor/VigoBusAPI` and a link to the original repository.
2. **Given** a distribution of the Worker or application, **When** its legal notices are reviewed, **Then** it includes the Apache-2.0 license text and states that the integration is based on the code of VigoBusAPI.

---

### User Story 6 - Browse Lines and Stops Through the API (Priority: P1)

As a frontend or API consumer, I want to list bus lines and retrieve each line's ordered stops from a stable REST API, so I can build route and stop views without duplicating static catalog data.

**Why this priority**: The official Vigo catalog is versioned as a reproducible snapshot; exposing it makes the API useful without an additional upstream dependency.

**Independent Test**: Request `GET /lines`, retrieve `GET /lines/{lineCode}`, and verify its GTFS route patterns and ordered stops match the generated official catalog; request `GET /stops` and verify municipal and Vitrasa identifiers remain distinct.

**Acceptance Scenarios**:

1. **Given** the official snapshot is bundled with the Worker, **When** a consumer requests `/lines`, **Then** the response lists versioned line metadata from Vigo open data.
2. **Given** a valid line code, **When** a consumer requests `/lines/{lineCode}`, **Then** the response contains ordered GTFS route patterns and their stops.
3. **Given** the official snapshot is bundled with the Worker, **When** a consumer requests `/stops`, **Then** each stop preserves its municipal identifier separately from its Vitrasa identifier.
4. **Given** a valid Vitrasa stop ID, **When** a consumer requests `/stops/{stopCode}/arrivals`, **Then** the Worker returns normalized real-time arrivals from the fixed Vitrasa InfoBus page.
5. **Given** the local profile is started without overrides, **When** a consumer requests arrivals, **Then** the Worker uses deterministic fixtures; a live-source request requires an explicit development override, while preview and production use the fixed public Vitrasa page.

### Edge Cases

- The requested stop does not exist, is outside the catalog, or uses an invalid identifier format.
- The external source returns HTTP 429, 5xx, a timeout, oversized HTML, or an unknown structure.
- The source returns negative, duplicate, or impossible times, or a time without a clear timezone.
- Two consecutive requests receive different results while the source is updating.
- The application has no network, the Worker is down, or the browser blocks a cross-origin request.
- A request arrives without an `Origin` header or with unexpected query parameters.
- The local service and remote Worker have different contract versions during a gradual deployment.
- The response contains names, destinations, or identifiers with Galician, Spanish, or Unicode characters.
- The source returns missing or malformed pagination controls, an unexpected form state, or a page count beyond the supported request budget.
- A page fails after earlier pages succeeded; earlier page rows must not be mistaken for a complete result.
- The source changes its table markup or returns an HTML error page instead of stop data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a real-time arrivals capability for a valid Vigo stop identifier.
- **FR-002**: The service MUST normalize each arrival into a stable contract containing stop identifier, line identifier or code when available, destination when available, estimated remaining time when available, source timestamp, and data status.
- **FR-003**: The service MUST expose a documented endpoint for arrivals and MUST define normalized success, empty, stale, unavailable, invalid-request, rate-limit, and upstream-error responses.
- **FR-004**: The service MUST validate stop identifiers and request parameters before contacting the external source.
- **FR-005**: The service MUST preserve attribution for normalization logic based on the VigoBusAPI repository while keeping the application-facing contract independent from the Vitrasa page format.
- **FR-006**: The service MUST support the existing application in local, development, preview, and production environments through environment-specific configuration without hardcoding credentials or private URLs; the Vitrasa source URL is fixed in code and is not environment-configurable.
- **FR-007**: The local and development execution MUST be startable from the project repository and MUST provide the same observable API contract as the production service.
- **FR-008**: The production execution MUST run as a Cloudflare Worker and MUST respond with `Access-Control-Allow-Origin: *` on all endpoint responses, including errors, per constitution Principle VI; the Worker MUST NOT implement an origin allowlist.
- **FR-009**: The service MUST apply bounded timeouts, upstream error handling, and rate-limit handling so an unavailable external source cannot leave client requests hanging indefinitely.
- **FR-010**: The service MUST retain the last valid result per stop in the existing Cache API policy: a fresh entry is current only while its age is strictly less than 30 seconds; at age 30 seconds it MUST be revalidated. A last-known entry is eligible for stale service only while its age is strictly less than 300 seconds; at age 300 seconds it MUST NOT be served. On source failure, it MUST return an in-bound last-known result marked stale with its original update time, MUST NOT present stale data as current, and MUST return the documented unavailable/rate-limit error when no in-bound entry exists.
- **FR-011**: The service MUST NOT log or return secrets, authorization headers, private configuration values, or unnecessary personal data.
- **FR-012**: The application MUST show whether arrival data is current, stale, empty, unavailable, or loading, and MUST provide a retry action after a recoverable failure.
- **FR-013**: The service MUST preserve compatibility with the existing stop-arrivals port used by the frontend, or provide an explicitly versioned migration contract before changing it.
- **FR-014**: The project MUST include automated contract tests covering valid arrivals, empty results, invalid stops, upstream failures, timeouts, stale responses, CORS behavior, and rate limits.
- **FR-015**: The project MUST document the local start command, required environment variables, production Worker URL, upstream dependency, troubleshooting steps, and the distinction between fixture data and real-time data.
- **FR-016**: The distributed project MUST include attribution to `https://github.com/David-Lor/VigoBusAPI`, retain the applicable Apache-2.0 license text and copyright notices, and state that the integration is based on the code of that project.
- **FR-017**: The project MUST include a disclaimer that it is not endorsed by, directly affiliated with, maintained by, sponsored by, or officially connected to the public transport operator or the upstream VigoBusAPI project.
- **FR-018**: The service MUST expose `GET /health` as a liveness check for the Worker and MUST NOT probe Vitrasa on every health request. Automated fixture tests MUST separately verify that upstream-unavailable outcomes map to the documented stale/error responses; `/health` does not claim upstream readiness.
- **FR-019**: The map MUST render every stop marker at its catalog longitude/latitude within Vigo and MUST NOT silently place stops at fallback or default positions.
- **FR-020**: The map MUST render lines following their correct route or stop order, using the geographic data returned by the service, and MUST surface a visible anomaly state when geographic data is missing or implausible.
- **FR-021**: Stop and line geographic data MUST be validated during contract tests with reference coordinates of known Vigo stops.
- **FR-022**: The service MUST expose the official versioned catalog through `GET /lines`, `GET /lines/{lineCode}`, and `GET /stops`; `GET /lines` MUST include the schedule manifest; line details MUST return ordered GTFS route patterns and MUST include a timetable only when one is published for that line; timetable stop IDs MUST use the same identifiers as the network stop catalog; stop records MUST preserve municipal and Vitrasa identifiers as distinct fields.
- **FR-023**: The service MUST expose arrivals at `GET /stops/{stopCode}/arrivals`; the local profile MUST use deterministic fixtures by default, with an explicit override for live-source development. Preview and production profiles use the fixed public Vitrasa source and MUST reject fixture mode.
- **FR-024**: For live arrivals, the service MUST retrieve `https://infobus.vitrasa.es:8002/Default.aspx?parada={stopCode}` and translate its line, destination, and wait-minute rows into the existing arrivals JSON contract. `stopCode` MUST match `^[0-9]{1,6}$`, MUST be forwarded unchanged as `parada`, and MUST NOT require membership in the static catalog. The arrivals endpoint MUST reject unexpected query parameters with a validation error before contacting the source. Before accepting rows, the Worker MUST verify that `#lblParada` identifies the requested stop.
- **FR-025**: The initial source request MUST be `GET` to the fixed page. The service MUST follow every pager link matching `__doPostBack('GridView1','Page$N')`, sequentially starting at page 2; it MUST NOT infer total results from the observed five-row page size. Each postback MUST be `POST` to the same fixed URL with `Content-Type: application/x-www-form-urlencoded; charset=UTF-8` and a URL-encoded body containing the latest unique hidden `form1` values (`__VIEWSTATE`, `__EVENTVALIDATION`, optional `__VIEWSTATEGENERATOR`), `__EVENTTARGET=GridView1`, and the next sequential `__EVENTARGUMENT=Page$N`. Preserve only cookies set by the fixed source origin, update cookie name/value pairs from each response's `Set-Cookie`, and forward them only to that same origin within this lookup. Missing, duplicate, malformed, skipped, or ambiguous pagination/form state is an upstream failure. A lookup MUST stop after at most 10 pages, counting the initial page; discovering an eleventh page MUST fail without returning partial data.
- **FR-026**: The service MUST validate an HTTP-success HTML response before accepting rows. Every valid page MUST contain exactly one `GridView1` with the `L.`, `Ruta`, and `Min.` headers; route rows are identified by the source's `col-linea` and `col-minutos` cells, while nested pager rows are ignored. A recognized table with zero route rows is a valid empty result. If route rows exist but any row has missing, malformed, undecodable, empty, or out-of-range required values, the whole page is an upstream failure, not an empty result. The explicit `Parada Inexistente` page MUST map to `STOP_NOT_EXIST`; a malformed identity, missing or unrecognized markup, HTML error page, or failure to fetch or parse any required page is an upstream failure. It MUST NOT return a partial result with `dataStatus: current` or `dataStatus: empty`.
- **FR-027**: Every initial and paginated request MUST use only `https://infobus.vitrasa.es:8002/Default.aspx?parada={validatedStopId}` with `redirect: "manual"`; redirects MUST be rejected. The Worker MUST NOT accept arbitrary upstream URLs, use a source-provided form action to choose a destination, or forward caller-supplied headers.
- **FR-028**: The complete paginated retrieval, including all sequential requests, response-body reads, and parsing, MUST use one aggregate 8-second deadline and preserve the existing current, empty, stale, and unavailable response semantics.
- **FR-029**: The browser-to-Worker request MUST send only the selected public stop identifier. The Worker MAY send that identifier and the source-required WebForms fields/cookie only to the fixed Vitrasa URL, and MUST discard that transient state after the lookup without logging, persisting, caching, or returning it. The project MUST NOT send or retain identity, favorites, history, settings, or user-activity tracking data for this lookup.
- **FR-030**: Each source response body MUST be limited to 128 KiB and all response bodies in one lookup MUST total no more than 1 MiB. A lookup MUST also reject more than 100 route rows, line codes longer than 32 characters, or destinations longer than 256 characters. Exceeding any limit MUST follow the upstream-failure path and MUST NOT cache or return partial data.
- **FR-031**: The fixed Vitrasa URL MUST NOT be supplied by a Worker binding. The Worker MUST identify production mode explicitly and MUST NOT serve fixture responses in production, even if a fixture flag is present.
- **FR-032**: Before or when a live arrivals lookup is initiated, the application MUST display a concise localized privacy notice naming Cloudflare and Vitrasa, disclosing that the selected public stop ID is sent and providers may process connection metadata, stating that no account/profile data is sent, and making no anonymity claim.
- **FR-033**: If a selected catalog stop has no Vitrasa identifier, the frontend MUST NOT call the arrivals gateway or substitute the internal stop ID or municipal stop code; it MUST display the localized unavailable state.
- **FR-034**: The changed arrivals UI MUST remain operable by keyboard with visible focus, announce transitions to each of the five FR-012 states (loading, current, stale, empty, unavailable) through the existing live region, meet WCAG 2.2 AA text contrast, and retain at least 44×44 CSS-pixel targets for interactive controls.

### Key Entities

- **Stop**: A Vigo bus stop identified by a stable stop identifier, with optional name, coordinates, and served lines.
- **Line**: A bus line identified by public code and destination text as displayed by the Vitrasa stop page.
- **Arrival**: A predicted bus arrival associated with a stop, line, destination, remaining time in minutes, and query timestamp.
- **Arrivals Response**: The application-facing response containing stop context, arrivals, data status, freshness metadata, and optional error information.
- **Data Status**: A controlled value describing whether data is current, stale, empty, unavailable, loading, or invalid.
- **Upstream Source**: The external Vigo public transport data service accessed through the integration based on the VigoBusAPI code.
- **Runtime Profile**: The local, development, preview, or production configuration that selects the service location and operational policies.
- **Attribution Notice**: The legal and technical notice identifying VigoBusAPI, its author, repository URL, Apache-2.0 license, and stating that this project is based on its code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a healthy upstream source, at least 95% of valid arrivals requests return a normalized response within 3 seconds under the expected project load.
- **SC-002**: For an unavailable or slow upstream source, 100% of requests terminate within 8 seconds with an explicit stale or unavailable status.
- **SC-003**: In the automated UI test matrix, 100% of the covered data states (current, stale, empty, unavailable, loading) render a meaningful, localized status for a valid stop without requiring a page reload.
- **SC-004**: Local, development, preview, and production environments pass the same contract test suite without changing application code.
- **SC-005**: The service correctly handles at least 100 consecutive valid arrivals requests in a test run without leaking secrets or producing an unbounded error response.
- **SC-006**: A reviewer can locate the VigoBusAPI "based on the code of" attribution, Apache-2.0 license text, upstream disclaimer, and setup instructions in under two minutes.
- **SC-007**: During an upstream outage, the application retains and clearly labels the last valid result when one exists, and never labels it as current.
- **SC-008**: 100% of stops with catalog coordinates render on the map within 50 meters of their reference position, and every rendered line matches its catalog route or stop order.
- **SC-009**: Automated fixture contract tests verify the line list, each line's day-type stop order, and the resource-oriented arrivals contract; a local-live Postman smoke request verifies the same arrivals contract against the public upstream while permitting an empty result.
- **SC-010**: A deterministic fixture for stop 2790 spans three HTML pages (5, 5, and 2 rows) and normalizes to these 12 `(line, destination, minutes)` tuples in ascending wait order: `(12B, HOSPITAL MEIXOEIRO, 1)`, `(11, CABRAL por STA MARINA, 8)`, `(4A, ARAGÓN por URZÁIZ, 11)`, `(17, RÍOS - A GUÍA, 26)`, `(4C, GREGORIO ESPINO por URZÁIZ, 31)`, `(27, RABADEIRA, 41)`, `(11, CABRAL por VIA TRANVIA, 43)`, `(4A, ARAGÓN por URZÁIZ, 46)`, `(17, S. BADIA - A GUÍA, 56)`, `(12B, HOSPITAL MEIXOEIRO, 59)`, `(4C, GREGORIO ESPINO por URZÁIZ, 65)`, `(27, RABADEIRA, 109)`. Replaying the fixture completes within the 8-second bound; live smoke checks permit changing times and row counts.
- **SC-011**: Automated tests verify stop-ID validation before network access, exact stop identity matching, postback state/page sequencing, the 10-page/128-KiB-per-page/1-MiB-per-lookup/100-row limits, production fixture rejection, and fail-closed behavior without any partial cache write.
- **SC-012**: Automated UI tests verify the privacy notice appears in Spanish, Galician, and English, and verify that a stop without a Vitrasa identifier sends zero arrivals requests and shows the localized unavailable state.
- **SC-013**: Automated contract regression tests assert API `info.version: 3.0.0` independently from OpenAPI document format `openapi: 3.1.0`. They assert these public operations exist: `GET /lines`, `GET /lines/{lineCode}`, `GET /stops`, `GET /stops/{stopCode}/arrivals`, `OPTIONS /stops/{stopCode}/arrivals`, and `GET /health`; the arrivals `stopCode` path parameter has pattern `^[0-9]{1,6}$`. They assert `ArrivalsResponse` requires `stopId` (string matching `^[0-9]{1,6}$`), `generatedAt` (date-time string), `dataStatus` (enum `current|stale|empty`), and `arrivals` (array of `Arrival`). They assert `Arrival` requires `lineCode` and `destination` (non-empty strings), `minutes` (integer, minimum 0, maximum 1440), and `eta` (date-time string). They preserve catalog schema shapes: `NetworkLineSummary` required fields and non-negative counts; `NetworkLineDetail` extends that summary with required ordered `patterns` entries (`id`, `headsign`, `stopIds`, `stops`); and `NetworkStop` required fields, nullable `municipalCode`/`vitrasaId`, and latitude/longitude bounds (42.10–42.32, -8.85–-8.60). Only descriptions may change without a contract-version bump.
- **SC-014**: A fixture-only load test sends 600 arrivals requests at 10 requests/second for 60 seconds without contacting Vitrasa and reports p95 response latency at or below 3 seconds.
- **SC-015**: CI enforces gzip-compressed aggregate generated JavaScript of at most 850 KiB and CSS of at most 150 KiB, in addition to existing per-file limits of 150 KiB for the entry JavaScript, 350 KiB each for the MapLibre and deck.gl chunks, and 150 KiB for CSS.
- **SC-016**: Automated frontend checks verify keyboard operation, visible focus, live-region announcements for loading, current, stale, empty, and unavailable arrivals states, WCAG 2.2 AA contrast, and minimum 44×44 CSS-pixel interactive targets for the changed arrivals UI.

## Assumptions

- The upstream public transport service remains legally and technically accessible for this use case and its usage limits are respected.
- The VigoBusAPI repository is treated as Apache-2.0 licensed according to its published repository metadata and license file; the exact notices and copyright text will be verified before implementation is distributed.
- The Worker will proxy and normalize public transport data; it will not become a general-purpose open proxy.
- Secrets and upstream credentials, if eventually required, are configured as local environment values or Cloudflare Worker secrets and are never committed.
- The existing frontend remains the consumer of the application-facing arrivals contract; this feature replaces fixture-only arrivals without changing unrelated schedule snapshot behavior.
- Short-lived caching is acceptable for resilience, provided every cached response exposes its freshness state.
- The existing VigoBusAPI-derived normalizer remains attributed; this change replaces the live source adapter for arrivals and does not remove the official static network catalog.
- The browser sends the selected stop ID to the Worker, which requests public arrivals from Vitrasa; Cloudflare and Vitrasa necessarily process transport metadata. No account, favorites, history, settings, or user-activity profile is sent, and the project does not claim control over provider-side metadata handling or retention.
- The Vitrasa Infobus stop page is the live-arrivals source for this flow because the owner selected it as the source that visibly provides line, destination, and wait-minute estimates. This choice does not imply that the previous JSON source is broken. The page currently renders server-side HTML with five rows per page, ASP.NET form state, session cookies, and `__doPostBack` pagination; it does not return an `Access-Control-Allow-Origin` header, so browser-side cross-origin fetching is unavailable and the existing Worker is the bridge.
- The source's pagination controls, not a fixed page size, define how many results must be collected. The observed stop 2790 response contains three pages and twelve rows; this is a validation fixture, not a permanent source guarantee.
- The existing arrivals JSON contract and 8-second request bound remain stable. A source page or pagination failure is treated as upstream failure, allowing the existing stale-cache behavior rather than partial data.
- Real-time data availability depends on the external transport source and is not guaranteed for every stop or time of day.

## Out of Scope

- Rebuilding the complete static Vigo line timetable snapshot.
- User accounts, personalized server-side profiles, or persistent server-side user tracking.
- Historical analytics, fleet tracking beyond the upstream arrival information, or route planning.
- Copying the entire VigoBusAPI repository into this project instead of implementing only the required adapted integration.
- Direct browser-side fetching of the Vitrasa page while it does not permit cross-origin requests; this may be reconsidered if the source adds CORS support.

> Superseding correction (2026-10-26): Feature 003 uses the fixed public Vitrasa InfoBus source and Vigo municipal/GTFS catalog data. The planned dependency was not adopted. Current normalization is independently authored from the source contract and observed outputs; this artifact records the earlier feature-002 plan only.
