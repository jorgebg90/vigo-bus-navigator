# Feature Specification: Hexagonal Architecture and OpenAPI Documentation

**Feature Branch**: `008-hexagonal-openapi-docs`

**Created**: 2026-10-28

**Status**: G2 specification, G3 plan, and G4 tasks approved — 2026-10-28

**Input**: Establish hexagonal architecture across the project, provide an endpoint/page with the OpenAPI contract rendered as HTML, have the project agents validate the work, and make the README easier to read.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Maintain and test application capabilities independently (Priority: P1)

As a maintainer, I want the application organized around clear domain, application, and infrastructure boundaries so that business rules can be changed and tested without relying on browser APIs, municipal services, or persistence.

**Why this priority**: Consistent boundaries are the foundation for safe changes, independent testing, and the project's existing browser-first architecture.

**Independent Test**: Inventory every maintained production runtime module under `frontend/src`, assign it to domain, application, or an inbound/outbound adapter responsibility, and verify allowed dependency directions. Run at least one isolated unit-test scenario for every domain rule and application use case without a browser, network, or browser storage.

**Acceptance Scenarios**:

1. **Given** a domain rule is under test, **When** its unit tests run, **Then** they execute without importing or invoking browser, framework, network, or persistence facilities.
2. **Given** an application use case needs an external capability, **When** it is exercised, **Then** it depends on an explicit port and a test can supply a controlled implementation of that port.
3. **Given** a maintainer inspects a production application module, **When** its dependencies are followed, **Then** domain rules do not depend on application or infrastructure modules, and infrastructure adapters implement application-facing contracts rather than being called directly by domain rules.
4. **Given** browser-facing behavior is changed, **When** the application is exercised, **Then** the user-facing adapter delegates work through the application boundary without embedding domain rules or direct external-service details.
5. **Given** the runtime-module inventory is reviewed, **When** any module cannot be assigned a primary responsibility or has an invalid dependency direction, **Then** architecture validation reports it as a failure rather than excluding it from the inventory.

### User Story 2 - Read the OpenAPI contract as a web page (Priority: P2)

As a developer integrating with or reviewing the transit data contract, I want a stable page that renders the project's OpenAPI contract as readable HTML so that I can inspect documented operations and schemas in a browser.

**Why this priority**: A directly browsable contract makes the supported data boundary easier to discover and review without requiring readers to open a raw specification file.

**Independent Test**: Open `<application-origin>/<configured-base-path>/docs/openapi/` directly, including in a non-root static-host deployment, and verify that every element in the canonical contract at `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml` is represented.

**Acceptance Scenarios**:

1. **Given** a reader directly requests `<application-origin>/<configured-base-path>/docs/openapi/`, **When** the static site serves the request, **Then** it returns the documentation HTML without relying on navigation from the home page or a server-side transit API.
2. **Given** a reader inspects the rendered contract, **When** they navigate by keyboard or assistive technology, **Then** the page has semantic landmarks and headings, meaningful names for interactive controls, visible keyboard focus, and access to all contract content.
3. **Given** the page is viewed at a 320 CSS-pixel viewport or at 200% text zoom, **When** the reader navigates the page, **Then** content and controls remain available without page-level horizontal scrolling or loss of functionality.
4. **Given** the canonical OpenAPI contract changes, **When** documentation is rebuilt or published, **Then** the page reflects the changed contract rather than a separately maintained stale copy.
5. **Given** the project is hosted as a static browser application, **When** the documentation page is served, **Then** it does not require adding a transit backend or changing the browser-first data flow.
6. **Given** the canonical contract is missing/unreadable, has invalid YAML/OpenAPI structure, contains an unresolved local reference, or cannot be rendered, **When** the documentation build runs, **Then** the command exits unsuccessfully and reports the contract path, failure category, and corrective guidance. If a previously generated page exists, it is removed from the intermediate and build output before validation; the failed build cannot be published. The delivered page contains no runtime contract renderer, so these are build-time failures rather than reader-facing page states.

### User Story 3 - Understand and navigate the project README (Priority: P3)

As a new contributor or user, I want the README organized into clear, scannable sections so that I can quickly understand the application, its architecture, how to run and validate it, and where to find its API documentation.

**Why this priority**: A readable README reduces onboarding effort and makes the project's behavior and constraints easier to discover.

**Independent Test**: Give a reader the README and ask them to locate the project purpose, local setup and validation commands, architecture overview, and OpenAPI documentation entry point.

**Acceptance Scenarios**:

1. **Given** a reader visits the README, **When** they scan its headings and links, **Then** the project purpose, architecture, setup, validation, and OpenAPI documentation are clearly discoverable.
2. **Given** a reader follows setup or validation instructions, **When** they run the documented commands in the supported local environment, **Then** the instructions are complete and do not imply that a backend or credentials are required.
3. **Given** existing security, privacy, hosting, or transit-data limitations are described, **When** the README is reorganized, **Then** those constraints remain accurate and are not obscured or contradicted.
4. **Given** a reader uses keyboard navigation, text enlargement, or a screen reader to navigate the README and documentation link, **When** they inspect its structure and controls, **Then** the content remains perceivable and operable.
5. **Given** a reader checks the README's project workflow, **When** they compare its actor and gate summary with the Harness Charter, **Then** all required actors and phase-specific reviewers are accurately listed or the README links directly to the charter for authoritative details.

### Edge Cases

- A module participates in more than one concern; its primary responsibility and allowed dependencies must still be identifiable.
- A maintained runtime module cannot be assigned to an architectural responsibility or is outside the expected source inventory; validation must report the gap rather than silently omit it.
- An external capability has no current production adapter; its port must remain testable without inventing a backend or enabling an unsupported integration.
- The OpenAPI contract is missing/unreadable, invalid, has an unresolved local reference, or cannot be rendered; the build must exit unsuccessfully, identify the source path and failure category, provide corrective guidance, and remove any stale generated page from the intermediate and output directories. A failed build must not be published. The static page has no runtime renderer and therefore has no reader-facing runtime rendering error state.
- A new operation or schema is added to the OpenAPI contract; the HTML page and README entry point must continue to refer to the current source contract.
- The application is deployed under a non-root static-host path; the documentation page remains reachable through the documented application base path.
- The documentation path or README link is opened directly rather than reached from the home page; static hosting must serve the page at the same base-path-aware URL.
- README simplification risks dropping an existing operational, privacy, or source-availability caveat; the content must be retained in an appropriate section.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All maintained application runtime code MUST follow the project's hexagonal architecture, with identifiable domain, application, and infrastructure responsibilities.
- **FR-001a**: The architecture scope MUST include every maintained production runtime module under `frontend/src`, including user-interface entry points, the service worker, transit-source clients, persistence, and map integrations; it MUST exclude tests, fixtures, build/development tooling, configuration, generated documentation, and static assets that do not execute application logic.
- **FR-001b**: Each in-scope runtime module MUST be inventoried and assigned a primary responsibility. Domain modules depend on no other layer; application modules may depend on domain rules and port contracts only; inbound and outbound adapters may depend on application contracts and the domain but MUST NOT be dependencies of domain or application modules. Cross-cutting or unclassified modules MUST be explicitly justified in the inventory and validated against the same dependency rules.
- **FR-002**: Domain rules MUST remain independent of frameworks, the DOM, browser APIs, network access, and persistence.
- **FR-003**: Application use cases MUST coordinate domain behavior through explicit port contracts for capabilities outside the application core.
- **FR-004**: Infrastructure adapters MUST implement the relevant port contracts, and application/domain code MUST NOT depend on adapter implementations.
- **FR-005**: User-interface and other external entry points MUST delegate application behavior through an inward-facing application boundary rather than bypassing use cases to invoke infrastructure directly.
- **FR-006**: Every domain rule and every application use case in the runtime-module inventory MUST have at least one unit-test scenario that can execute without a browser, network, or browser persistence.
- **FR-007**: The project MUST provide an HTML documentation page at the application-relative path `/docs/openapi/`, directly addressable as `<application-origin>/<configured-base-path>/docs/openapi/`, that renders the canonical contract at `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`.
- **FR-008**: For every operation in the canonical contract, the HTML documentation MUST show its path and method, summary/description when defined, each parameter's name, location, required status, and schema, request-body media types and schemas when defined, response status codes and content schemas when defined, and every component schema and reference. It MUST NOT present undocumented operations as supported.
- **FR-009**: The OpenAPI HTML page MUST remain consistent with its canonical contract. Before validation, generation MUST remove any previous page from both the public intermediate and build output. Missing/unreadable input, invalid YAML/OpenAPI structure, unresolved local references, or rendering errors MUST cause a nonzero build result and a diagnostic that identifies the canonical source path, failure category, and corrective guidance; no newly generated or stale docs page may remain in the output, and a failed build MUST NOT be published. The delivered page MUST contain no runtime contract renderer, so there is no reader-facing runtime rendering error state.
- **FR-010**: Providing the documentation page MUST preserve the static, browser-first product architecture and MUST NOT introduce a separately hosted transit backend or transit proxy.
- **FR-011**: The README MUST be reorganized into concise, scannable sections that make the project purpose, architecture, local setup, validation, and OpenAPI documentation easy to find.
- **FR-012**: README changes MUST preserve accurate existing information about hosting, data flows, privacy, security boundaries, limitations, and validation. Its architecture section MUST link to or summarize the runtime-module inventory and allowed dependency direction. Its OpenAPI link MUST resolve to `/docs/openapi/` under the configured application base path.
- **FR-012a**: README harness and workflow information MUST agree with `docs/harness-charter.md`; it MUST either accurately list all project actors and phase-specific gate reviewers or direct readers to the charter as the source of truth. The OpenAPI link MUST use descriptive link text; README accessibility expectations MUST account for the repository Markdown renderer's native focus behavior.
- **FR-013**: The specification and its downstream design, tasks, implementation, and acceptance MUST be reviewed through the project harness gates. Before planning begins, the G2 verdicts MUST be recorded as approved by the Stakeholder, QA Tester, UX Designer, and Frontend Developer; the Project Lead MUST coordinate the gate according to the Harness Charter.
- **FR-014**: Later phases MUST obtain the actor verdicts assigned to their gates in the Harness Charter, and any changes requested by a required reviewer MUST be resolved and re-reviewed before that gate is considered closed.

### Key Entities

- **Domain rule**: A product rule about transit lines, stops, schedules, day types, or related concepts that has no dependency on external effects.
- **Port contract**: An explicit capability boundary through which an application use case requests an external effect or service.
- **Infrastructure adapter**: An implementation of a port that connects application behavior to a browser capability, municipal source, persistence, map engine, or other external system.
- **OpenAPI contract**: The canonical structured description of supported HTTP operations and their inputs and outputs.
- **OpenAPI documentation page**: A browser-readable HTML representation of the canonical OpenAPI contract, available at a stable documented URL.
- **Harness verdict**: A recorded approval or change request by a project actor for a specified SDD gate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of maintained application runtime modules can be assigned to a documented architectural responsibility, with no domain-to-infrastructure dependency paths found by the architecture validation.
- **SC-002**: At least one isolated unit-test scenario passes for every domain rule and application use case in the runtime-module inventory, without a browser, network access, or browser persistence.
- **SC-003**: 100% of operations, defined descriptions, parameters, request-body details, response details, component schemas, and references in the canonical OpenAPI contract are represented in the HTML documentation page. Automated comparison against the canonical contract finds no missing or extra operations or schema elements; direct requests to `/docs/openapi/` return the page under both root and non-root configured base paths.
- **SC-004**: For missing/unreadable input, invalid YAML/OpenAPI structure, unresolved local references, and rendering errors, the build exits nonzero and reports the canonical source path, failure category, and corrective guidance. When a stale generated page is seeded in both the intermediate and output locations before the test, both are absent after failure and the deployment/publish step is blocked because the build failed. The page has no runtime contract renderer or runtime rendering error state.
- **SC-005**: In a README-only findability check, at least 4 of 5 people unfamiliar with this repository and not involved in the feature can each locate all five items—project purpose, local setup, validation commands, architecture overview, and OpenAPI page link—within 60 seconds. Participants receive the README only, start the timer when they begin reading it, and may not search the repository or other project documentation.
- **SC-006**: The required G2 reviewers each record an approved verdict before the feature proceeds to planning, and the verdicts for subsequent gates are recorded according to the Harness Charter.
- **SC-007**: The OpenAPI page and README documentation link pass automated accessibility checks and manual WCAG 2.2 AA review at G5. Design and verification MUST address semantic structure (1.3.1, 1.3.2), text and non-text contrast (1.4.3, 1.4.11), text enlargement and reflow (1.4.4, 1.4.10, 1.4.12), keyboard access and visible/unobscured focus (2.1.1, 2.4.3, 2.4.7, 2.4.11), link purpose (2.4.4), target size (2.5.8), and accessible names/state for implemented controls (4.1.2). Page controls MUST provide at least 44 CSS-pixel touch targets per the constitution; inline README text links use the applicable WCAG 2.2 target-size exception. The static page MUST use no motion, or honor reduced-motion preferences if motion is later introduced. Manual review MUST include screen-reader access to contract content. Automated scans alone do not constitute approval.

## Assumptions

- "The whole project" means every maintained production runtime module under `frontend/src`, including user-interface entry points, the service worker, and browser-side integrations. Tests, fixtures, build/development tooling, configuration, generated documentation, and non-executable static assets are outside the runtime-layer inventory.
- In keeping with the current static, browser-first product and constitution, "endpoint/page" is satisfied by the static HTML page at `/docs/openapi/`, prefixed by the configured application base path; it does not imply a new hosted transit API or backend endpoint.
- The canonical OpenAPI source for this feature is `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`; the HTML page provides a browser-readable representation rather than defining an additional API.
- The README is expected to remain in English, consistent with the Harness Charter.
- Project-agent validation follows the currently ratified Harness Charter and its phase-specific reviewer assignments; not every actor is required to approve every gate.
- The README findability cohort consists of five people unfamiliar with this repository and uninvolved in the feature, tested individually using only the README.
- The documentation page MUST meet applicable WCAG 2.2 AA criteria; G5 requires automated and manual evidence, including keyboard, focus not obscured, screen-reader, responsive, contrast, and target-size checks. Generation failures are validated at build time and are not a page UI state because the delivered document contains no runtime renderer.
