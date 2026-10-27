All eight actors approved the proposal for conditional ratification. The Project Lead formally ratified constitution v2.0.0 on 2026-10-27; G1 is closed and v2.0.0 governs new work. Feature 004 may proceed to planning. This ratification does not constitute production validation: release remains blocked until all required GitHub Pages-origin CORS, response, route/trip, and schedule checks pass. Any failed production gate returns architecture to G1, with no Worker fallback.
# G1 Review: Direct Municipal JSP Access

- **Phase**: Constitution amendment proposal for feature 004
- **Date**: 2026-10-27
- **Proposal under review**: Remove the Cloudflare Worker from Vigo transit data access and call the fixed public municipal JSP directly from the frontend. Keep fixture-backed local default, explicit local-live, a normalized OpenAPI application contract, and no credentials/profile data. Do not restore a Worker fallback if direct production access fails verification.
- **Evidence reviewed**: Static APK analysis and browser POC from `localhost:5173`. The POC verified stop detail, line catalog, line-service catalog, lines-per-stop, and arrival requests locally. GitHub Pages-origin CORS and line-shape/trip operations remain unverified.
- **Outcome**: **BLOCKED - ALL ACTORS REQUEST CHANGES**

## Actor Verdicts

### Project Lead Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: Direct browser access is compatible with browser-first direction, but no complete constitutional amendment or migration plan exists. The proposal materially changes Principles I, II, IV, V, and VI and stack/deployment constraints; local CORS does not establish GitHub Pages viability. The feature spec still allows a Worker path.
- Required actions: Prepare exact replacement wording and a MAJOR-version migration; define fixture/local-live/production behavior, action allowlist, normalized contract, privacy/network constraints, and no-fallback rule. Verify production-origin CORS and every required operation. Obtain all eight G1 verdicts before planning.

### Software Architect Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: The proposal changes the Worker boundary across Principles I, II, IV, V, VI, the stack table, hard constraints, and harness charter. API v4 remains Worker-oriented; route geometry and trip stops are not represented in its current schema. Source contract and production CORS are incomplete.
- Required actions: Draft a v2.0.0 amendment and migration; align the charter and feature spec; keep direct access disabled in production until CORS is proven for each operation and the route/trip payloads are verified. Preserve the normalized contract and review/version any schema additions.

### Backend Developer Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: The source payloads do not yet demonstrate parity with the current OpenAPI contract, including freshness, empty/current/stale semantics, catalog metadata, timetable manifests, and route patterns. CORS is unverified for GitHub Pages, route/trip actions, and Galego line catalog. The language-specific source action conflicts with the no-language-preference-in-requests constraint.
- Required actions: Specify an allowlisted action-to-parameter matrix, validated schemas and failure handling; verify all operations from GitHub Pages; resolve the language/network constraint; decide snapshot/offline behavior, freshness provenance, and API versioning. Keep fixtures deterministic and require G1 approval.

### UX Designer Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: Direct-browser access is a plausible direction but changes ratified source/network disclosure boundaries. Locale selection conflicts with the no-language-preference request rule. Removing the Worker cache leaves freshness behavior undefined. Route geometry and ordered stops are not yet verified.
- Required actions: Amend and ratify the constitution; resolve locale handling without silently sending rider preferences; specify direct-path loading, stale, unavailable, retry, focus, and offline behavior; verify production CORS and route geometry before release. Do not show invented routes or silently fall back to another source.

### Frontend Developer Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: Direct calls are feasible only after G1 approval and production CORS verification. Existing frontend adapters consume Worker-shaped OpenAPI endpoints and need explicit source adapters. Payload encoding, character decoding, limits, and error formats are unverified. Removing the Worker changes cache and offline behavior.
- Required actions: Reconcile OpenAPI contract/versioning, implement source-specific adapters behind existing ports, test malformed/oversized responses and request allowlisting, preserve or explicitly migrate offline/freshness behavior, and document provider metadata exposure. Keep local-live opt-in and fail closed for production.

### QA Tester Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: The feature spec conflicts with the proposal by retaining a Worker production fallback. CORS evidence is not reproducible for every action/origin. Observed coordinate names differ from the current required mapping (`lat`/`lon` versus `latitud`/`longitud`). Direct-path freshness, offline behavior, API versioning, and the language-action/privacy conflict are unresolved.
- Required actions: Resolve the no-Worker-fallback contradiction; specify a repeatable GitHub Pages CORS gate; correct source-field fixtures; define source timestamps/freshness/offline and migration behavior; test that requests omit credentials/profile data and use only fixed actions.

### Stakeholder Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: Replacing unreliable arrivals is valuable, but the currently ratified constitution does not authorize the proposed source/path. OpenAPI v3/v4 baseline and schedule/frequency parity are unclear. Local CORS does not prove production browser viability or arrival freshness.
- Required actions: Obtain G1 approval for a source/path amendment; state the canonical public API version and compatibility policy; verify weekday/Saturday/Sunday-holiday schedule coverage and useful fallback behavior; establish freshness evidence before implementation.

### Communicator Verdict - G1 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: The local POC evidence is properly scoped, but the spec still describes the Worker as production default/fallback. The 2026-10-26 G1 ratification covered only the InfoBus Worker exception and cannot be retrospectively treated as approval for direct JSP calls.
- Required actions: Propose an explicit constitutional amendment and migration plan; align the active feature spec with the direct-only proposal and its production CORS gate; preserve the historical G1 record unchanged and record a new unanimous G1 decision before planning.

## Gate Decision

G1 is not closed. The current constitution remains authoritative. Do not proceed to `/speckit-plan` Phase 0 or Phase 1, amend the constitution, or implement the direct JSP path until a constitution amendment proposal is approved by Project Lead and all eight actors. The proposal must define fixed JSP host/action allowlists, direct-browser request constraints, normalized OpenAPI compatibility, locale handling, freshness/offline behavior, and the hard stop/no-Worker-fallback rule if production verification fails.

## G1 Re-review — 2026-10-27

- **Proposal reviewed**: Proposed v2.0.0 direct-JSP amendment and aligned feature 004 artifacts, including the user-approved clarification decisions recorded in `spec.md`.
- **Evidence status**: The original APK analysis and localhost POC remain the only source/browser observations. GitHub Pages-origin CORS, schedule parity, and route/trip responses are still unverified. No production checks are represented as passed.
- **Outcome**: **UNANIMOUS APPROVAL FOR CONDITIONAL RATIFICATION**. This approves the proposal's governance and release conditions; it does not approve production release or close deployment gates.

### Project Lead Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The amendment and charter define direct-only access, the production-origin validation gate, and no Worker fallback. The spec aligns on receipt-age freshness, the `GA`/`ES` action mapping, OpenAPI `info.version` 5.0.0, and provenance-gated schedule snapshots. Production-origin CORS and route/trip verification remain unperformed release blockers, not blockers to conditional G1 ratification.
- Required actions: Obtain and record all eight verdicts and Project Lead ratification before planning. Before production, validate every required action from GitHub Pages, including route/trip payloads. Any failure blocks release and returns architecture to G1; no Worker fallback is permitted.

### Software Architect Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The prior architecture findings are resolved for conditional ratification. The proposed constitution, charter, and spec align on direct-only access, the v5.0.0 normalized contract, locale mapping, receipt-age freshness, privacy, and snapshot provenance. Production CORS and route/trip evidence remain unperformed release gates.
- Required actions: Obtain all eight approvals and Project Lead ratification. Before production, record GitHub Pages-origin CORS and response/schema validation for every required action and parameter class. Failure blocks release and returns architecture to G1; no Worker fallback is permitted.

### Backend Developer Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: Identifier and coordinate mappings are evidence-based; action allowlisting, schema/error validation, receipt-age freshness, locale mapping, OpenAPI versioning, and timetable snapshot provenance are specified sufficiently for conditional ratification. GitHub Pages-origin behavior and route/trip payloads remain unverified.
- Required actions: Obtain all eight approvals and Project Lead ratification. Before production, validate every required action and parameter class from GitHub Pages, including route/trip. Any failure blocks release and returns to G1 without Worker fallback.

### UX Designer Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The policy is sufficiently clear for conditional ratification, not implementation acceptance. Production-origin CORS and route/trip behavior remain unverified. Detailed loading, retry, focus, accessible announcements, privacy/network-metadata disclosure, and rider-facing provenance states remain UX design work for G2/G3.
- Required actions: Specify and review those UX states at G2/G3 and validate WCAG 2.2 AA at G5. Do not treat this verdict as implementation UX approval. Retain all production release gates.

### Frontend Developer Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The source-adapter boundary, normalized models, deterministic fixtures, opt-in local-live profile, validation/error states, receipt-age freshness, and offline/snapshot behavior are sufficiently clear for conditional ratification. Encoding, concrete limits, and adapter migration remain plan/implementation work, not G1 blockers.
- Required actions: Define adapter migration, encoding/decoding, payload limits, and error handling before implementation. Complete GitHub Pages-origin checks before production. G1 still requires all eight verdicts and Project Lead ratification.

### QA Tester Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The spec makes the prior QA concerns testable, including repeatable production-origin evidence, source mappings, receipt-age freshness, offline provenance, v5.0.0 contract versioning, locale mapping, and the closed allowlist. This is conditional G1 approval only; no unrun checks are claimed as passed.
- Required actions: Keep production blocked until reproducible GitHub Pages-origin checks pass for every required action and parameter class, including bounded payloads, encoding, and route/trip. Record evidence; failure returns architecture to G1 without Worker fallback.

### Stakeholder Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: Conditional ratification is appropriate. The spec defines the v5.0.0 contract without a new REST endpoint, three-day-type schedule parity, provenance-dated snapshot use for gaps, receipt-age freshness, and the `GA`/`ES` action mapping. None of CORS, schedule parity, route/trip behavior, or provider freshness has been demonstrated.
- Required actions: Before production, record actual GitHub Pages-origin checks for all required operations and verify weekday, Saturday, and Sunday/holiday coverage. Use only a matching snapshot with trustworthy visible provenance/date; otherwise show unavailable. Any failed gate blocks release and returns to G1; no Worker fallback.

### Communicator Verdict — G1 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: The proposed constitution and feature artifacts encode the accepted clarifications and distinguish localhost/APK observations from unverified provider behavior. The original v1.3.0 status and CHANGES REQUESTED record remain historical; the proposal is suitable for conditional ratification.
- Required actions: Keep GitHub Pages-origin CORS and response validation for every required operation as a production blocker. That evidence remains outstanding; any failure returns architecture review to G1 without Worker fallback.

### G1 Re-review Decision

All eight actors approved the proposal for conditional ratification. This unanimous review does not itself constitute production validation. The proposed v2.0.0 must remain clearly marked as pending until the Project Lead records the formal ratification decision. The v1.3.0 constitution remains governing until then. Feature 004 MUST NOT enter planning or implementation before formal ratification. Production release remains blocked until all required GitHub Pages-origin CORS, response, route/trip, and schedule checks pass.
