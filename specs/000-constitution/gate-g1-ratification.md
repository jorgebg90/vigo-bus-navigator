# Gate G1 — Constitution Ratification Record

- **Phase**: Constitution
- **Date**: 2026-10-25
- **Artifact under review**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **Reference architecture**: [spec_000_architecture.md](../../spec_000_architecture.md) (APPROVED)
- **Outcome**: **CLOSED — RATIFIED as v1.1.0**

## Round 1 — Review of v1.0.0

### Software Architect Verdict — constitution — 2026-10-25

- Verdict: APPROVED
- Findings:
  - Principle I correctly enforces browser-only execution with GitHub Pages as the
    sole production target, and carves out exactly one server-side exception — the
    Cloudflare Worker edge proxy — with its scope limited to REST↔SOAP translation
    and CORS injection, matching spec_000 §3–§4.1 precisely.
  - Principle II mandates the exact boundary set the charter defends (data
    acquisition via REST client adapter, domain logic, presentation via map engine
    bindings, persistence via `localStorage` behind an interface), with strictly
    inward dependencies, explicit port contracts, and zero framework/DOM/I/O
    imports in the domain.
  - Principle V makes OpenAPI contract-first binding on both adapters (frontend
    client and Worker) for `GET /?stop_id={id}`, with versioned specs and
    mandatory review on breaking changes.
  - Principle VI and the Technology Stack table are fully consistent with
    spec_000 §2: permanent free tiers (Workers ≤100k req/day, 30s edge cache),
    CartoDB Positron/Dark Matter, Leaflet.js/MapLibre GL, and `localStorage`-only
    user data with no accounts or identifying analytics.
  - Hard constraints replicate spec_000 §4.2's `visibilitychange` pause and
    Service Worker offline caching, closing potential drift between the normative
    spec and the constitution.
  - Governance grants the Software Architect veto power over violations of
    Principles I, II, V, and VI — exactly the architectural invariants. The gate
    table (G1–G6) matches the harness charter verbatim.
  - Advisory (non-blocking): the charter's Working Agreements stated "no backend"
    without noting the Worker exception; charter wording aligned in this round.
  - Advisory (non-blocking): temporary Sync Impact Report comment removed before
    commit, as intended.
- Required actions: none

### Backend Developer Verdict — constitution — 2026-10-25

- Verdict: APPROVED
- Findings:
  - Principle II mandates `localStorage` persistence and REST API client as
    infrastructure adapters behind ports with inward-only dependencies — satisfies
    the repository-style persistence adapter, dependency injection, and a
    framework-free, DOM-free data layer.
  - Principle III requires domain/application layers unit-testable without
    browser, network, or `localStorage` — directly supports a pure-function,
    mockable data layer.
  - Principle IV mandates a `local` profile with mocked transport API / fixture
    data and zero external setup — fully covers the local-profile requirement.
  - Principle V mandates an OpenAPI spec before implementation for
    `GET /?stop_id={id}`, versioned with the interface, with breaking changes
    gated by review.
  - Principle VI + stack table mandate `localStorage`-only persistence with
    namespaced keys, versioned schema, migrations, plus the 30s edge cache per
    stop query.
  - Hard constraints (Service Worker caching, `visibilitychange` pause) support
    offline tolerance and acquisition throttling.
  - Gap (non-blocking, deferred to specify): quota-safe writes and graceful
    corruption recovery are not named in the constitution; they MUST be captured
    as non-functional requirements in the persistence feature spec.
  - Gap (non-blocking, deferred to specify/plan): static schedule data contracts
    (lines, stops, timetables, frequencies) and their source (bundled JSON vs
    CORS-enabled public feed) are not addressed; Principle I permits bundled
    static assets, so no conflict — contracts must be declared at specify/plan
    time to satisfy the "no undeclared network calls" rule.
  - Observation (for plan gate): client-side cache behavior versus the mandated
    30s edge `Cache-Control` TTL must be reconciled in the data acquisition
    contract (cache layering, staleness, offline fallback).
- Required actions: none

### QA Tester Verdict — constitution — 2026-10-25

- Verdict: APPROVED
- Findings:
  - Principle III declares test-first with unit coverage NON-NEGOTIABLE — a task
    is not done until its tests pass; verifiable through test evidence per task.
  - Principles II + III jointly guarantee domain/application layers are
    unit-testable without browser, network, or `localStorage` (no framework/DOM/I/O
    imports in domain, inward-only dependencies, independently testable modules).
  - Principle IV satisfies local testability: mandatory `local` and `production`
    profiles, with explicit prohibition on credentials, Cloudflare accounts, or
    deployment in any local workflow — verifiable by a clean clone-run-test cycle.
  - The gate table matches docs/harness-charter.md exactly; QA holds the correct
    verification points: G2 (Specify), G4 (Tasks testability), G5 (Implement).
  - Acceptance-criteria measurability is adequately enforced: Principle III binds
    acceptance criteria to executable tests, and the QA verdict at G2 blocks specs
    with unmeasurable criteria before planning begins.
  - All principles are declarative and testable; MUST statements are objectively
    verifiable.
  - Minor (non-blocking): Principle III's coverage clause is conditional ("where
    coverage is measured... MUST NOT regress") — no tool or threshold mandated;
    acceptable for v1.x, may be tightened in a later MINOR amendment.
- Required actions: none

### Stakeholder Verdict — constitution — 2026-10-25

- Verdict: CHANGES REQUESTED
- User value assessment: The constitution was outstanding on commuter-trust
  pillars (absolute privacy, 0.00 € forever, `visibilitychange` pausing, offline
  caching), but silent on two properties the Stakeholder charter holds as core
  value: accessibility and mobile-first usability. A public-good transit tool
  that a visually impaired or elderly commuter cannot use, or that is clumsy on
  a small phone at a bus stop, fails its mission. If these are not constitutional
  mandates, no harness gate will ever check them — fixing at G1 is cheap,
  retrofitting after implementation is not.
- Findings:
  - Positive: Principle VI is exactly the privacy posture commuters deserve.
  - Positive: hard constraints mandate background-fetch pausing and offline
    caching, matching real street conditions (tunnels, underground stops, metered
    data).
  - Positive: PWA via GitHub Pages means instant URL access, no app-store
    friction — ideal for occasional riders and visitors.
  - Positive: the 30s edge cache protects the free tier and project longevity.
  - Positive: gates G2 and G5 include a Stakeholder verdict, guaranteeing
    commuter needs (find a line, frequencies by day type, favorites, times from a
    stop) are validated at specify and implementation time.
  - Gap (blocking): no accessibility mandate — no WCAG target, no
    keyboard/screen-reader/contrast/touch-target requirement.
  - Gap (blocking): no mobile-first mandate — no responsive-design-first
    requirement and no performance/payload budget for low-end phones on flaky
    connections, the dominant usage context.
  - Gap (clarification): Principle VII did not state the product UI is exempt
    from the English-only rule — an accidental English-only bus app would not
    serve Vigo's Spanish- and Galician-speaking riders.
  - Risk (non-blocking, watch at plan gates): the 100k requests/day Cloudflare
    free tier could be exceeded if the tool becomes popular; the edge cache
    mitigates origin load but every invocation counts.
- Required actions:
  1. Amend the hard constraints: the UI MUST conform to WCAG 2.2 AA — semantic
     markup, full keyboard operability, screen-reader support, minimum contrast
     ratios, touch targets of at least 44px.
  2. Amend the hard constraints: the frontend MUST be designed mobile-first and
     MUST respect a lightweight payload/performance budget; numeric budgets may
     be set at the plan gate.
  3. Clarify Principle VII: the English-only rule governs development artifacts
     and does not constrain the product UI language; UI localization is a
     spec-level decision.

### Communicator Verdict — constitution — 2026-10-25

- Verdict: APPROVED
- Findings:
  - Principle VII mandates English across all development artifacts including
    blog posts — full coverage, no loopholes.
  - Story gate G6 correctly positioned in both normative tables (constitution and
    harness charter): every phase gets a narrative in docs/blog/. The charter's
    mermaid diagram renders G6 only at Implement→Converge; the tables govern —
    worth a caption when the story gate is first explained on the blog.
  - The constitution is quotable for SDD newcomers: every principle carries a
    rationale, with ready-made pull quotes ("the simplest solution passing its
    harness gate wins"; "zero cost and absolute privacy are non-negotiable
    product properties").
  - Drafting feasibility confirmed: phase-0 (repository init) sources from README
    and the harness charter; phase-01 (constitution) sources from the seven
    principles, technology constraints, governance, and ratification metadata.
    All six referenced actor files exist, so charter links resolve.
- Required actions: none

## Amendment v1.0.0 → v1.1.0 (MINOR)

Applied per Stakeholder required actions; the Project Lead approved after
confirming no actor objected (Architect's advisory on charter wording also
resolved):

- **Added hard constraint**: WCAG 2.2 AA conformance (semantic markup, keyboard
  operability, screen-reader support, contrast ratios, ≥44px touch targets).
- **Added hard constraint**: mobile-first design with a lightweight
  payload/performance budget; numeric budgets set at the plan gate.
- **Clarified Principle VII**: English-only governs development artifacts; the
  product UI language is a spec-level decision for Vigo's riders.
- **Housekeeping**: removed the temporary Sync Impact Report; aligned the harness
  charter's "no backend" wording with the Worker exception.
- **Bump rationale**: MINOR — new materially expanded constraints and a PATCH-level
  clarification folded into one amendment; no principle removed or redefined
  incompatibly.

## Round 2 — Sign-off on v1.1.0

| Actor | Verdict | Notes |
| --- | --- | --- |
| Software Architect | APPROVED | Round 1 verdict stands; amendments introduce no architectural change. |
| Backend Developer | APPROVED | Round 1 verdict stands; persistence gaps tracked for specify phase. |
| QA Tester | APPROVED | Round 1 verdict stands; new constraints are objectively testable. |
| Stakeholder | APPROVED | All three required actions resolved in v1.1.0. |
| Communicator | APPROVED | Round 1 verdict stands; amendment narrative ready for phase-01 post. |
| Project Lead | APPROVED | Gate procedure followed; verdicts recorded; constitution ratified. |

**Gate G1: CLOSED.** Constitution v1.1.0 is the governing document.

## Follow-ups carried to later phases

1. **Specify**: non-functional requirements for quota-safe `localStorage` writes
   and corruption recovery (Backend Developer).
2. **Specify/Plan**: static schedule data contracts and their source; declare all
   network calls (Backend Developer).
3. **Plan**: reconcile client-side caching with the 30s edge TTL; set numeric
   performance/payload budgets (Backend Developer, Software Architect).
4. **Plan gates**: watch Cloudflare 100k req/day free-tier headroom
   (Stakeholder).
5. **Specify**: decide product UI language(s) for Vigo's riders (Stakeholder).
