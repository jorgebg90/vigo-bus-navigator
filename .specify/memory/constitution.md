# Vigo Bus Navigator Constitution

**Document status**: Ratified as v1.3.0 by Gate G1 on 2026-10-26, from the last
evidenced baseline v1.2.1. The prior v1.2.2 worktree label had no separate
ratification record; its Worker-scope wording change is incorporated here as
part of the MINOR amendment. The ratification record is at
[`specs/000-constitution/gate-g1-ratification.md`](../../specs/000-constitution/gate-g1-ratification.md).

## Core Principles

### I. Browser-First Frontend

All application logic MUST run client-side in the browser as a Progressive Web App
using JavaScript/TypeScript. Static hosting on GitHub Pages is the only production
target. The sole sanctioned exception to browser-only execution is the Cloudflare
Worker edge proxy. For feature 002 only, that existing Worker may adapt the
owner-selected public Vitrasa InfoBus page
`https://infobus.vitrasa.es:8002/Default.aspx?parada={validatedStopId}`, which
visibly provides line, destination, and wait-minute arrivals but does not permit
browser cross-origin access. This is a source-specific exception, not general
permission to scrape other sources. The adapter MUST validate the stop ID,
construct only this fixed HTTPS origin and path, reject redirects, and MUST NOT be
a general-purpose proxy. Source-issued cookies and form state may exist only
during a single lookup; they MUST NOT be logged, persisted, cached, or returned.
No other server-side component may be introduced.

**Rationale**: zero-cost, serverless operation with no accounts, no tracking, and
no infrastructure to maintain.

### II. Modular Hexagonal Architecture

The codebase MUST follow hexagonal (ports & adapters) architecture with strict
separation between:

- **Domain**: pure business rules (lines, stops, frequencies, day types) with zero
  framework, DOM, or I/O imports.
- **Application**: use cases orchestrating domain objects through ports.
- **Infrastructure**: adapters implementing the ports — `localStorage` persistence,
  REST API client (via the edge proxy), map engine bindings, Service Worker.

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
Environment profiles MUST be provided — at minimum `local` (mocked transport API /
fixture data) and `production` (edge proxy endpoint) — selected via build-time or
run-time configuration. No local workflow may require credentials, a Cloudflare
account, or any external deployment.

**Rationale**: contributors must be able to clone, run, and verify the entire
solution on their machine with zero external setup.

### V. Contract-First APIs with OpenAPI

Every HTTP interface MUST be specified in an OpenAPI document before
implementation. The current canonical v3.0.0 API includes `GET /lines`,
`GET /lines/{lineCode}`, `GET /stops`, and `GET /stops/{stopCode}/arrivals`.
Adapters on both sides (frontend API client, Cloudflare Worker) MUST conform to
the spec, and the spec MUST be versioned with the interface. Breaking changes
require a version bump and QA/architect review at the plan gate; changing only
the Worker-internal upstream adapter does not change the public API version.

**Rationale**: a homogenized, machine-readable contract decouples frontend and
proxy evolution and makes the integration testable.

### VI. Zero-Cost Serverless & Privacy by Design

All infrastructure choices MUST remain within permanent free tiers, per the
reference architecture example (`docs/reference/spec-000-architecture-example.md`):
GitHub Pages (hosting), Cloudflare Workers ≤100k requests/day (edge proxy, 30s
edge cache per stop query), CartoDB Positron/Dark Matter tiles, MapLibre GL JS
with deck.gl overlay layers. All user profile data — favorite stops, recent
history, settings — MUST persist exclusively in the user's browser `localStorage`.
An arrivals lookup sends only the selected public stop ID from the browser to the
Worker; the Worker sends that ID and source-required transient WebForms state only
to the fixed Vitrasa source. The project MUST NOT combine the lookup with identity
or profile data, create user-activity logs, or retain activity data. The existing
bounded cache of normalized public arrivals is permitted; it MUST NOT contain
source HTML or session/form state. Cloudflare and source providers may process
network metadata outside the project's control; the project MUST NOT claim that
the lookup is anonymous or control provider-side metadata retention.

**Rationale**: the project is a public-good open-source tool; zero cost and no
application-level user profiling or activity retention are non-negotiable. A
user-selected public stop ID is disclosed only to retrieve its public arrivals.

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
| Edge proxy | Cloudflare Workers | CORS `Access-Control-Allow-Origin: *`; feature 002 may adapt only the fixed Vitrasa InfoBus HTTPS page using a validated stop ID, no redirects, transient WebForms state, an 8s aggregate deadline, and 128 KiB/page + 1 MiB/lookup body limits; 30s fresh TTL + 300s last-known stale bound |
| Mapping | MapLibre GL JS + deck.gl | CartoDB Positron & Dark Matter base layers |
| Client persistence | Browser `localStorage` | Namespaced keys, versioned schema, migrations |
| CI/CD | Harness + GitHub Actions | Deploy `/worker` → Cloudflare, `/frontend` → Pages on push to `main` |

Hard constraints:

- No backend server, database, or user-account system beyond the single edge proxy.
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
| G2 | Specify | Stakeholder, QA Tester |
| G3 | Plan | Software Architect, Backend Developer |
| G4 | Tasks | QA Tester |
| G5 | Implement | QA Tester, Stakeholder |
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

**Version**: 1.3.0 (MINOR) | **Ratified**: 2026-10-26 | **Amended from**: 1.2.1
