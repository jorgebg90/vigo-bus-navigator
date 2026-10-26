# Gate G1 — Constitution Ratification Record

- **Phase**: Constitution
- **Date**: 2026-10-25
- **Artifact under review**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **Reference architecture**: [docs/reference/spec-000-architecture-example.md](../../docs/reference/spec-000-architecture-example.md)
  (external EXAMPLE, non-normative; absorbed into the constitution)
- **Historical outcome**: **CLOSED — initially ratified as v1.1.0**. The last
  evidenced baseline is v1.2.1 (committed constitution footer; also referenced
  by feature 001).
- **Current review**: **CLOSED — RATIFIED as v1.3.0 on 2026-10-26**, from the
  last evidenced baseline v1.2.1.
- **Gate status**: CLOSED — all five reviewing actors approved and the Project
  Lead authorized ratification and closure.
- **Version-history note**: The worktree previously labeled the constitution
  v1.2.2, and feature 002 task T036 records a Worker-scope wording change, but
  this record has no separate v1.2.2 amendment/sign-off section. No historical
  actor approval is inferred; T036's wording change is included in the current
  v1.2.1 → v1.3.0 proposal.

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

## Amendment v1.1.0 → v1.2.0 (MINOR) — Post-ratification

Requested by the project owner immediately after G1 closure; applied by the
Project Lead under the governance amendment procedure (documented rationale, no
actor objections, no artifact migration required — no plans or specs exist yet).

- **Changed constraint**: mandated mapping stack is now **MapLibre GL JS +
  deck.gl** (vector rendering with GPU-accelerated overlay layers), replacing
  "Leaflet.js / MapLibre GL". CartoDB Positron/Dark Matter base tiles unchanged.
- **Rationale**: deck.gl overlay layers on MapLibre GL JS provide a single,
  modern vector-stack for stop markers, line geometries, and future real-time
  vehicle positions — avoiding a later migration off raster-oriented Leaflet.
- **Bump rationale**: MINOR — materially expanded guidance on a mandated
  technology choice; no principle removed or redefined incompatibly.
- **Migration**: none; the reference architecture example lists "Leaflet.js /
  MapLibre GL" as interchangeable options — the constitution now narrows that
  choice and remains the superseding document per Governance.
- **Compatibility note**: deck.gl + MapLibre GL JS carry a heavier payload than
  Leaflet; the plan gate MUST set the numeric performance/payload budget
  (mobile-first hard constraint) with this choice accounted for.

**Gate G1: CLOSED.** Constitution **v1.2.0** is the governing document.

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

## Amendment v1.2.1 → v1.3.0 (MINOR) — RATIFIED

**Status**: RATIFIED from the last evidenced baseline v1.2.1 by all six actors;
Project Lead closed G1 on 2026-10-26.

**Rationale**: The project owner selected the public Vitrasa InfoBus stop page
for live arrivals because it exposes line, destination, and wait-minute data.
The page is HTML/WebForms and does not permit browser cross-origin access, so
the existing Cloudflare Worker must adapt it. This source-specific allowance
does not authorize a general scraper, another proxy, or any additional backend.

**Proposed changes**:

- Fold in the pending T036 Principle I / stack wording change from
  "REST↔SOAP translation" to source-specific upstream adaptation, not a
  general proxy permission.
- Principle I permits only the existing Worker to adapt
  `https://infobus.vitrasa.es:8002/Default.aspx?parada={validatedStopId}` for
  feature 002; require fixed HTTPS origin/path, validated stop IDs, rejected
  redirects, request-scoped WebForms state, and no source-state retention.
- Principle VI documents disclosure of the selected public stop ID and
  source-required transient state to Vitrasa, prohibits identity/profile
  coupling and activity logging, and limits cache contents to normalized public
  arrivals. It explicitly avoids an anonymity claim about provider metadata.
- Principle V names the current canonical v3.0.0 routes and clarifies that an
  internal Worker source-adapter change does not alter the public contract.
- The edge-proxy stack constraint records the 8-second aggregate deadline,
  128 KiB per-page / 1 MiB per-lookup response-size limits, and existing
  30-second fresh / 300-second last-known bounds.

**Migration plan**: Update feature 002's spec, research, plan, data model,
quickstart, source description in the OpenAPI contract, tasks, and test fixtures
to describe the selected source and its failure/privacy boundaries. Preserve
the v3.0.0 browser-facing routes and response schema. No other feature or
service is authorized to use this exception. Correct Principle V's historical
root-route example to the current canonical API, define the unchanged-code
Vitrasa stop-ID mapping, add parser/body/row bounds, and require production
fixture rejection. No migration of the public response schema is needed. The
MINOR bump is from v1.2.1; the undocumented v1.2.2 label is not treated as
ratified history.

| Actor | Verdict | Notes |
| --- | --- | --- |
| Software Architect | APPROVED — final review | Confirms v1.2.1 baseline, v1.3.0 amendment, fixture-first local, live preview/production, liveness-only health, T036 naming, and sanitized three-page fixture evidence; no remaining plan blocker. |
| Backend Developer | APPROVED — final review | Confirms the Workers-pool setup is sufficiently specified in T045 for this gate; implementation correctly remains blocked until G1–G4 close. |
| QA Tester | APPROVED — final review | T049 verifies transient WebForms state is absent from responses, cache, logs, and persistent bindings on success/failure; partial-cache failure is covered. |
| Stakeholder | APPROVED — final review | Confirms user value, bounded source selection, and clear disclosure; no required edits. |
| Communicator | APPROVED — final review | Confirms the amendment narrative; blog G6 accuracy was separately approved after observed/proposed behavior and G5 state were clarified. |
| Project Lead | APPROVED — G1 closed | Confirms all five actor approvals are recorded, finds no remaining discrepancy, and authorizes v1.3.0 ratification and G1 closure. |

### Communicator Verdict — G1 amendment narrative — 2026-10-26

- Verdict: APPROVED
- Findings: The amendment narrative accurately presents v1.3.0 as a proposal from the last evidenced v1.2.1 baseline, does not treat v1.2.2 as ratified, and states the bounded Worker/source and migration changes without implying broader authorization. No Communicator edits remain. The feature 002 G6 blog accuracy review is separately approved.
- Scope: This verdict approves only the G1 narrative for Communicator accuracy. It does not infer any other actor's approval and does not close G1.
