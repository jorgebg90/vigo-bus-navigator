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

All eight actors approved the v2.0.0 proposal for conditional ratification, and the Project Lead formally ratified it on 2026-10-27. Constitution v2.0.0 governs new work; feature 004 may proceed to planning. Production release remains blocked by semantic source mapping, route/trip and schedule validation. This formal record does not retroactively alter the historical conditional verdicts above.

## Hosting and CORS Clarification Proposal — 2026-10-27

The user clarified that production transit access must not depend on GitHub Pages. The proposed v2.1.0 MINOR amendment allows any static HTTPS host and treats CORS as origin-independent only when every required action returns `Access-Control-Allow-Origin: *` with credentials omitted. Until v2.1.0 passes G1, ratified v2.0.0 remains governing.

### Browser and Header Evidence — 2026-10-27

- Browser `fetch` from `http://localhost:5173`, with credentials omitted, returned HTTP 200 and JSON for both line catalogs, both service catalogs, stop detail, lines-per-stop, arrivals, schedule day codes 1/2/3, line-stop detail, route GeoJSON, and trip stops.
- A separate HTTP response-header check sent `Origin: https://cors-check.example`; all 13 action/parameter cases returned HTTP 200, JSON, `Access-Control-Allow-Origin: *`, and `Access-Control-Allow-Credentials: true`. Browser requests omitted credentials. This establishes origin-independent CORS for these tested cases; it does not verify untested actions.
- The schedule probe `TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A&dia=1` returned a first trip associated with C3. The expected line/day identifier mapping is unresolved and remains a production blocker. Response encoding was declared `ISO-8859-1`; correct decoding also remains to be validated.

### G1 Re-review Requirement

At the time this initial v2.1 review was recorded, only the Project Lead's fresh verdict was available; the other seven fresh actor verdicts had not yet been recorded. The Project Lead's later ratification decision is recorded below after all eight approvals.

### Project Lead Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The proposed amendment is sufficiently precise for G1 approval. Upon ratification, it explicitly supersedes v2.0.0 wording that makes GitHub Pages the only production target or the mandatory CORS origin, including the v2.0.0 release-gate wording, while retaining permanently zero-cost static HTTPS hosting. The evidence is limited: 13 tested action/parameter cases returned HTTP 200, JSON, `Access-Control-Allow-Origin: *`, and `Access-Control-Allow-Credentials: true` in a separate HTTP header check; browser fetches from localhost succeeded with credentials omitted. This establishes CORS only for those tested cases, not untested operations. This is constitutional approval, not production-release approval.
- Required actions: Obtain the other seven fresh actor approvals and formal ratification before v2.1.0 governs. Keep production release blocked until the `id=A&dia=1` line/day mapping (which returned a first C3 trip), declared ISO-8859-1 response encoding and mojibake, route/trip payload structures, and weekday/Saturday/Sunday-holiday schedule coverage and parity are semantically verified. Validate every required production action; do not infer production readiness from the limited CORS evidence.

### Project Lead Ratification — G1 v2.1 — 2026-10-27

- Decision: NOT RATIFIED
- Conditions: The reviewed record contains the eight approvals for v2.0.0, not eight fresh approvals for v2.1.0; the seven fresh v2.1.0 actor verdicts must be recorded before reconsideration. Preserve the permanently zero-cost static HTTPS hosting constraint. Keep release blocked pending resolution of the `id=A&dia=1` first-C3 schedule result, ISO-8859-1 decoding/mojibake, route/trip semantic schemas, full weekday/Saturday/Sunday-holiday coverage and parity, and validation of every other required action. CORS approval is limited to the 13 tested action/parameter cases and is not production approval.

**Historical decision note**: This NOT RATIFIED decision was made before the seven
fresh v2.1.0 actor verdicts below were recorded. It is preserved as the initial
decision and is superseded by the subsequent Project Lead ratification.

## Fresh Actor Verdicts — v2.1.0 — 2026-10-27

### Software Architect Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The v2.1 proposal explicitly supersedes v2.0's GitHub Pages-only target and mandatory Pages-origin CORS wording while retaining zero-cost static HTTPS hosting. Wildcard CORS supports host independence only for the 13 tested cases. Production remains blocked by the schedule mapping anomaly, encoding, route/trip semantics, and schedule parity.
- Required actions: Keep v2.0 governing until fresh unanimous G1 approval and Project Lead ratification. Verify all source semantics and required operations before production.

### Backend Developer Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The fixed host/action contract, omitted credentials, v5.0.0 normalized contract, locale mapping, and no-Worker policy are sufficient for v2.1 G1 review. CORS evidence covers only 13 cases. The `id=A&dia=1` response, ISO-8859-1 decoding, route/trip schemas, and schedule parity remain unverified.
- Required actions: Obtain all fresh G1 approvals and ratification. Keep production blocked pending every required action, parameter, decoding, payload, and schedule validation.

### UX Designer Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: Hosting independence and the privacy constraints are clear for G1; CORS evidence is limited to the tested cases and does not establish semantic or production readiness.
- Required actions: At G2/G3, specify an accessible, proportionate disclosure for locale observable from catalog actions, public identifiers sent to the municipal provider, and ordinary network metadata. Define the disclosure in the UX baseline; no blocking consent interaction is established by this verdict. Keep semantic and production gates open.

### Frontend Developer Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The proposal permits any permanently zero-cost static HTTPS host and supersedes v2.0's Pages-only wording on ratification. The 13 tested cases establish only limited wildcard CORS, not production release readiness. Schedule identity, encoding, route/trip semantics, and parity remain blockers.
- Required actions: Obtain the other actor approvals and ratification. Validate all required source operations and resolve the semantic blockers before production.

### QA Tester Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The proposal is testable for conditional G1 approval and retains the zero-cost constraint. The tested CORS cases do not establish all-operation or semantic correctness. The C3 result, ISO-8859-1 decoding, route/trip payloads, and day-type parity remain unverified.
- Required actions: Obtain all fresh approvals and ratification. Before release, validate every operation and parameter, decoding, schema, payload bounds, route/trip, and schedule parity.

### Stakeholder Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The amendment clearly permits a non-GitHub Pages static host without abandoning zero-cost hosting. The 13 CORS cases do not amount to production approval. Schedule identity, decoding, route/trip semantics, and weekday/Saturday/Sunday-holiday parity remain unresolved.
- Required actions: Obtain fresh unanimous G1 approval and ratification; verify all semantic and production gates before release.

### Communicator Verdict — G1 v2.1 Review — 2026-10-27
- Verdict: APPROVED
- Findings: The documents accurately separate v2.0 history, the pending v2.1 proposal, the limited wildcard CORS evidence, and unresolved production semantics. No untested action or production behavior is claimed as verified.
- Required actions: Obtain fresh unanimous approval and ratification. Keep production blocked until schedule mapping, encoding, route/trip schemas, and schedule parity are verified.

### Project Lead Ratification — G1 v2.1 — 2026-10-27
- Decision: RATIFIED
- Conditions: Constitution v2.1.0 governs effective 2026-10-27, retaining permanently zero-cost static HTTPS hosting and superseding v2.0.0 GitHub Pages-only and mandatory-origin CORS wording. This ratification does not approve production release. Keep release blocked pending resolution of the `id=A&dia=1` first-C3 result, ISO-8859-1 decoding/mojibake, route/trip semantics, full weekday/Saturday/Sunday-holiday schedule coverage and parity, and validation of every required action. CORS approval is limited to the 13 tested action/parameter cases.

### G1 v2.1 Decision

All eight fresh v2.1.0 actor verdicts are APPROVED, and the Project Lead ratified
the amendment on 2026-10-27. G1 is closed for v2.1.0. The v2.0.0 Pages-only
hosting and CORS-origin wording is superseded; permanently zero-cost static
HTTPS hosting remains required. CORS is approved as origin-independent only for
the 13 tested action/parameter cases that returned `Access-Control-Allow-Origin:
*`. Production release is NOT approved: the schedule identifier anomaly,
ISO-8859-1 decoding, route/trip semantics, full schedule parity, and any untested
required operation remain blockers.
