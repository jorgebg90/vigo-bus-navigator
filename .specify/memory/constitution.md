# Vigo Bus Navigator Constitution

**Document status**: Ratified as v2.0.0 MAJOR by Gate G1 on 2026-10-27. This
amendment supersedes v1.3.0 for new work; the previous constitution and its
ratification remain historical evidence at
[`specs/000-constitution/gate-g1-ratification.md`](../../specs/000-constitution/gate-g1-ratification.md).

## Core Principles

### I. Browser-First Frontend

All application logic and transit-data requests MUST run client-side in the
browser as a Progressive Web App using JavaScript/TypeScript. Static hosting on
GitHub Pages is the only production target. The application MUST call the fixed
public Vigo municipal JSP endpoint directly over HTTPS using GET requests and a
closed allowlist of documented `tipo` actions. It MUST NOT use a Cloudflare
Worker, backend server, or other server-side adapter for transit data. Requests
MUST omit credentials, validate and encode action parameters, reject arbitrary
hosts/actions, and keep user profile data out of requests. Direct access MUST
remain disabled for production until CORS and response behavior have been verified
from the actual GitHub Pages origin for every required action. If any required
production check fails, deployment MUST be blocked and the architecture MUST
return to G1; a Worker fallback is not permitted by this principle.

The initial source allowlist is limited to the public transit actions recorded
from VigoPlus: line catalogs, line services, line schedules, stop details, lines
serving a stop, line-stop details, route GeoJSON, trip stop sequences, and arrival
estimates. Each action and its permitted parameters MUST be documented in the
OpenAPI source contract. New actions require contract and security review.
Language-dependent catalog and service actions MUST use `GA` for Galego UI and
`ES` for Castellano or English UI. The selected action makes the catalog locale
observable to the provider; the client MUST NOT send a separate locale field or
other UI profile data. The English UI uses `ES` because the source has no English
action.

**Rationale**: static hosting and direct public-data access minimize
infrastructure while retaining a constrained and auditable source boundary.

### II. Modular Hexagonal Architecture

The codebase MUST follow hexagonal (ports & adapters) architecture with strict
separation between:

- **Domain**: pure business rules (lines, stops, frequencies, day types) with zero
  framework, DOM, or I/O imports.
- **Application**: use cases orchestrating domain objects through ports.
- **Infrastructure**: adapters implementing the ports — `localStorage` persistence,
  direct source API clients and normalizers, map engine bindings, Service Worker.

Dependency direction is strictly inward: infrastructure depends on application and
domain; the domain depends on nothing. Every port MUST have an explicit interface
contract, and modules MUST be independently testable.

**Rationale**: modularity and inversion of control keep the app testable, swappable
(e.g. map engine), and free of hidden coupling.

### III. Test-First with Unit Coverage (NON-NEGOTIABLE)

Every feature MUST be covered by unit tests written before or alongside the
implementation (Red-Green-Refactor). Domain and application layers MUST be fully
unit-testable without a browser, network, or `localStorage`. A task is not done
until its tests pass. Where coverage is measured, domain/application layers MUST
NOT regress.

**Rationale**: tests are the executable proof that each spec acceptance criterion
holds; they are the harness QA gate's primary evidence.

### IV. Local Testability & Environment Profiles

The application MUST run and be fully testable locally without deploying anywhere.
Environment profiles MUST be provided — at minimum `local` (fixture data),
`local-live` (explicit opt-in direct calls from localhost), and `production`
(direct browser calls from GitHub Pages) — selected via build-time or run-time
configuration. Automated tests MUST use deterministic fixtures by default. No
workflow may require credentials, a Cloudflare account, or an external backend.
Production direct calls MUST remain disabled until a repeatable browser check
proves CORS and response compatibility from the actual GitHub Pages origin for
every required action.

**Rationale**: contributors must be able to clone, run, and verify the entire
solution on their machine with zero external setup.

### V. Contract-First APIs with OpenAPI

Every HTTP interface used by the browser MUST be specified in an OpenAPI document
before implementation. OpenAPI MUST describe the fixed municipal JSP host,
allowlisted GET actions and parameters, source response schemas, and normalized
application data models. Source-specific field names and envelopes MUST be mapped
to stable frontend/domain fields. Breaking changes to the normalized contract
require a version bump and QA/architect review at the plan gate. The PWA does not
expose a server-side API and no Worker adapter is deployed.

**Rationale**: a machine-readable source and normalized-data contract decouples
frontend models from volatile JSP response fields and makes the integration
testable without deploying a server-side API.

### VI. Zero-Cost Client-Only & Privacy by Design

All infrastructure choices MUST remain within permanent zero-cost static hosting
and public-data usage limits: GitHub Pages, the fixed Vigo municipal data service,
CartoDB map tiles, and browser-compatible mapping libraries. The application
MUST NOT deploy or depend on a Cloudflare Worker, backend server, or server-side
transit adapter. All user profile data — favorite stops, recent history, and
settings — MUST persist exclusively in browser `localStorage`. Transit requests
MUST use only public identifiers and allowlisted actions, MUST omit credentials,
and MUST NOT include profile data. Catalog and service actions MAY follow the UI
locale only through the fixed `ES`/`GA` mapping in Principle I; this makes the
selected catalog locale observable to the provider. No separate locale or other
UI profile data may be sent. The project MUST NOT create user-activity logs or
retain user activity. Any client-side cache of public data MUST be bounded and
preserve client-receipt age; arrival status MUST describe time since receipt and
MUST NOT imply an unverified provider generation time. The cache MUST NOT contain
credentials or session state. The municipal service and network
intermediaries may process ordinary connection metadata; the project MUST NOT
claim that direct requests are anonymous or control provider-side metadata
retention.

**Rationale**: the project is a public-good open-source tool; zero cost and no
application-level user profiling or activity retention are non-negotiable. Transit
requests contain only allowlisted source actions, the selected catalog locale as
encoded by that action, and public identifiers needed to retrieve transit data.

### VII. Clean Code, Simplicity & English Documentation

YAGNI applies: the simplest solution passing its harness gate wins. Code MUST be
readable, small in surface, and free of dead abstraction. ALL development
artifacts — specifications, plans, tasks, code comments, commit messages, and
blog posts — MUST be written in English. This rule governs development artifacts
only and does NOT constrain the product UI language; UI localization is a
spec-level decision serving Vigo's riders.

**Rationale**: the project doubles as public documentation of an SDD experiment;
clarity and a single language keep it accessible and reviewable, while the
product itself must speak the language of its users.

## Technology Stack & Constraints

| Component | Mandated technology | Constraint |
| --- | --- | --- |
| Language | JavaScript/TypeScript | Type-safe contracts preferred at port boundaries |
| Hosting | GitHub Pages | Static PWA only; HTTPS |
| Transit data | Browser `fetch` | Direct GET to fixed `https://datos.vigo.org/vci_api_app/api2.jsp`; allowlisted actions and parameters; omitted credentials; GitHub Pages CORS gate required |
| Mapping | MapLibre GL JS + deck.gl | CartoDB Positron & Dark Matter base layers |
| Client persistence | Browser `localStorage` | Namespaced keys, versioned schema, migrations |
| CI/CD | Harness + GitHub Actions | Deploy `/frontend` → GitHub Pages on push to `main`; no transit Worker deployment |

Hard constraints:

- No backend server, database, Cloudflare Worker, or user-account system for transit data.
- Production transit requests MUST originate in the browser and target only the fixed municipal HTTPS endpoint with allowlisted GET actions.
- Direct production access MUST NOT be enabled until CORS is verified from the actual GitHub Pages origin for every required action. Failure blocks deployment; no Worker fallback is permitted.
- No paid service or dependency that exceeds a 0.00 € recurring cost level.
- The frontend MUST pause real-time fetching when backgrounded (`visibilitychange`)
  and MUST cache static assets via Service Worker for offline capability.
- The UI MUST conform to WCAG 2.2 AA: semantic markup, full keyboard operability,
  screen-reader support, minimum contrast ratios, and touch targets of at least
  44px.
- The frontend MUST be designed mobile-first (small viewports and touch first)
  and MUST respect a lightweight payload/performance budget suitable for low-end
  devices and metered connections; numeric budgets are set at the plan gate.

## Development Workflow & Harness Quality Gates

All work MUST follow the Spec-Driven Development cycle (constitution → specify →
clarify → plan → tasks → analyze → implement → converge), and every phase MUST
close its harness validation gate as defined in `docs/harness-charter.md`:

| Gate | Phase | Required verdicts |
| --- | --- | --- |
| G1 | Constitution | All actors |
| G2 | Specify | Stakeholder, QA Tester, UX Designer, Frontend Developer |
| G3 | Plan | Software Architect, Backend Developer, UX Designer, Frontend Developer |
| G4 | Tasks | QA Tester, UX Designer, Frontend Developer |
| G5 | Implement | QA Tester, Stakeholder, UX Designer, Frontend Developer, Software Architect |
| G6 | Each phase | Communicator (blog draft exists and is accurate) |

A `CHANGES REQUESTED` verdict blocks the phase until resolved and re-approved.
Verdicts are recorded in the feature artifacts under `specs/`. Every pull request
and review MUST verify constitutional compliance; complexity beyond these
principles must be explicitly justified in the plan.

## Governance

This constitution supersedes all other development practices and preferences.
Amendments require: (1) a documented proposal with rationale, (2) Project Lead
approval after consulting the accountable harness actors, (3) a migration plan
for any principle that invalidates existing artifacts or code.

### v2.0.0 Migration

This MAJOR amendment redefines the v1.3.0 Worker exception and was ratified by
all eight actors at G1 and the Project Lead on 2026-10-27. It governs new work.
The existing v1.3.0 application may remain available only as a legacy release
while feature 004 is implemented; no new feature or deployment may add to the
Worker-based transit path. Before feature 004 production release, its direct
browser calls must pass the GitHub Pages-origin CORS and payload gate for every
required allowlisted action, its normalized OpenAPI contract and migration must
be approved, and the transit Worker must be removed from application runtime and
deployment. During migration, an uncovered line/day timetable MAY use the
matching bundled snapshot only when its source and trustworthy date are
identified; otherwise that timetable is unavailable. Snapshot data MUST NOT be
represented as JSP or live data, and the snapshot MUST be retained until
weekday, Saturday, and Sunday/holiday coverage and parity are verified. Failure
of any production gate blocks release and returns the architecture to G1; no
Worker fallback is allowed.

Versioning follows semantic rules: MAJOR for backward-incompatible principle
removals or redefinitions, MINOR for new principles or materially expanded
sections, PATCH for clarifications and non-semantic refinements.

Compliance review expectations: the Project Lead verifies gate verdicts at every
phase boundary; the QA Tester flags constitutional violations as defects; the
Software Architect may veto any plan that violates Principles I, II, V, or VI.
Use `docs/harness-charter.md` for runtime harness guidance. The reference
architecture example (`docs/reference/spec-000-architecture-example.md`) is
non-normative background material; where it diverges from this constitution
(e.g. mapping engine), this constitution supersedes.

**Version**: 2.0.0 (MAJOR) | **Last Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
