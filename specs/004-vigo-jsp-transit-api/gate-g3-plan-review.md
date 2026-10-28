# G3 Plan Gate — Feature 004

Date: 2026-10-27. Status: **CLOSED — APPROVED for planning only**.
G2 is [closed](gate-g2-spec-review.md). Constitution v2.1.0 at `fdde5b1`.
Actual tool-returned verdicts below; no approval is inferred.

## Initial review round

### Software Architect Verdict — G3 — 2026-10-27
- Verdict: APPROVED
- Findings: Direct allowlisted JSP GET, credentials omitted, no fictional API/Worker, free static HTTPS, fixture default and ES/GA mapping follow the constitution. Infrastructure normalizes, application/domain owns selection/freshness, UI consumes normalized models. Explicit source blockers do not require an architectural change; provisional operations remain disabled.
- Required actions: Record all other required G3 verdicts. Release-only: lawful source call chain, schedule/day mapping, min/ttl, CRS/full corpus, fixtures/parity/browser/source-policy and G5 evidence. No additional Architect design change required.
- Verification: Bounded document review; no tests/live requests/edits.

### Backend Developer Verdict — G3 — 2026-10-27
- Verdict: CHANGES REQUESTED
- Findings: Boundary, ID distinction, nullable coordinates and receipt freshness are sound. Existing storage loader drops line favorites and tests expect that loss, so “preserve adapter” is insufficient. Duplicate receipt timestamps need an equality rule and stopId needs explicit application namespace. PublishedTime accepting 24–47 conflicts with only-when-verified policy.
- Required actions: Define lossless versioned migration with IDs/order/unresolved items retained and quota/corruption tests; clarify canonical receipt timestamp/stopId; enforce rejection of unverified extended hours. Source unknowns remain release-only blockers.
- Verification: Reported contract lint: 0 errors, 9 extension-referenced unused-component warnings. No live calls/edits.

### UX Designer Verdict — G3 — 2026-10-27
- Verdict: APPROVED
- Design baseline: `design-baseline.md`, G2-approved spec, inherited feature 003 UI contract and proposed plan/data/contract.
- Accessibility evidence: Document review only; layouts/tokens, keyboard/focus, target size, status announcements, textual routes and reduced motion are specified. No implementation/WCAG-conformance claim.
- Findings: Strict receipt ages, online coalesced Retry, no manual Refresh, offline behavior, legacy saved lines and trustworthy dated timetable provenance align with requirements.
- Required actions: none for design approval; other actor reviews and G5 evidence independent.

### Frontend Developer Verdict — G3 — 2026-10-27
- Verdict: CHANGES REQUESTED
- Design alignment: Responsive baseline and interactions feasible within existing architecture.
- Verification: Read-only artifact and existing frontend module review; no runtime/tests/edits.
- Findings: Current Favorite/StoragePort/Saved only accept stops and loader rewrites away lines; unresolved fallback may expose IDs. Per-operation live readiness ambiguous, especially arrivals with ttl open versus merely “provisional” actions; global production false does not specify local-live.
- Required actions: Explicit lossless storage/domain/UI migration and safe labels/tests. Per-operation fixture/local-live/production policy; unresolved actions including arrivals disabled. Record actual re-review.

### QA Tester Verdict — Breaking-contract Plan Review — 2026-10-27
- Verdict: CHANGES REQUESTED
- Coverage: 5/5 review dimensions: testability, compatibility, action coverage, release evidence and version bump.
- Findings: Version/compatibility matrix appropriate. “Every required action” scope and partial-release rule unclear. Provisional unconstrained line-stop/string geometry schemas cannot establish semantics. Separate provider observations from synthetic adversarial tests.
- Required actions: Per-action readiness/browser/semantic/fixture matrix for eleven actions; explicit release scope; automated nested geometry, full trip/identity, schedule/day and stop-echo checks; separate synthetic tests from provider proof.
- Note: Constitution V breaking-contract QA review; not a substitute/additional participant for charter G3.

## Applied planning fixes for bounded re-review

1. `data-model.md` now specifies v1→v2 lossless storage migration, original-byte
   retention, stop/legacy-line union, safe Saved labels, updated ports/UI and
   replacement of destructive old test expectations; quota/corruption tests.
2. `ArrivalReceipt.stopId` is selected application NetworkStop.id. Canonical
   fetchedAt must equal provenance.fetchedAt; equality/association tests required.
3. PublishedTime schema accepts 00:00–23:59 only; extended hours require evidence
   and affected contract review before schema/normalizer change.
4. `contracts/action-readiness.md` plus machine-readable x-profile-readiness:
   fixtures all actions, explicit local-live allow/deny lists, arrivals disabled
   while ttl unresolved, production all disabled. All eleven required for release;
   no partial production release by disabling features.
5. Matrix separates synthetic rejection tests from provider-observed semantics.
   Provisional schemas cannot enable a call/output by merely compiling.

## Planning validation evidence

- Spectral: **0 errors, 9 warnings** (`oas3-unused-component`). These normalized
  schemas are referenced by x-browser-ports, not HTTP response $refs; unused
  warnings are expected for in-process models. No fictional response/path added
  to silence lint. The warnings are retained and explicitly acknowledged.
- YAML parse and Ajv 2020 compilation: 41 components compiled and all local refs
  resolved in the initial and final revised-contract checks. Final check also
  passed 17 positive/negative structural cases (00–23 times vs extended hours,
  position tuples/ranges, atomic nullable stop coordinates, receipts with required
  provenance receipt time, no invented ETA, snapshot provenance, valid-empty vs
  missing stop identity envelope). All eleven action names match the source
  allowlist; local-live six/five lists form an exact partition; production list
  empty and partial-release false. Formats/provider semantics were not evaluated.
- No full application suite, live browser acceptance, or runtime edit in this
  planning workflow. Research CLI GETs are not CORS/semantic release approval.
- Historical v3/v4 file preservation, final diff hygiene and after_plan hook
  check are reported in the final verification section.

## OPEN release blockers

[Research R1–R8](research.md#open-release-evidence-register) and the per-action
matrix remain authoritative even if G3 closes. G3 design approval is not proof
that source schedule/day/CRS/min/ttl/APK semantics or production readiness exist.
G4/G5 and implementation are not executed by this workflow.

## Re-review of applied fixes

### Backend Developer Verdict — G3 Re-review — 2026-10-27
- Verdict: APPROVED
- Findings: Lossless v2 migration retains stop/line IDs/order/v1 bytes and invalid
  v2, defines corruption/quota/safe labels. Receipt app-stop namespace/equality,
  00–23 time restriction and explicit per-profile readiness resolve findings.
- Required actions: none for G3. Source/release evidence remains open.
- Verification: Read-only review, no edits/tests/live calls.

### Frontend Developer Verdict — G3 Re-review — 2026-10-27
- Verdict: APPROVED
- Design alignment: UX-approved baseline and final migration/readiness documents agree.
- Verification: Bounded read-only planning review, no implementation/test claim.
- Findings: Lossless stop/legacy-line union, original byte retention, safe labels,
  replacement tests, app receipt equality and strict published time schema are
  feasible. Explicit fixture-all/local-live6-allowed5-denied/production-none policy
  and no partial production release close previous findings.
- Required actions: none for scoped re-review; production/source evidence remains open.

### QA Tester Verdict — Breaking-contract Plan Re-review — 2026-10-27
- Verdict: APPROVED
- Coverage: 5/5 dimensions.
- Findings: Eleven-action matrix, no partial release, fail-closed full payload/
  relationship validation and synthetic-versus-provider evidence separation
  resolve findings. Migration, timestamp/identity and extended-hour rejection
  rules are testable.
- Required actions: none for scoped plan review. Complete final revised-contract
  validation; close R1–R8 before release. Update root README at accepted direct
  release, not to falsely describe current legacy runtime now.
- Note: Not a replacement/additional participant for charter G3.

### Software Architect Verdict — G3 Final-delta — 2026-10-27
- Verdict: APPROVED
- Findings: Lossless persistence, receipt equality/app identity, restricted times
  and readiness extension/matrix align with direct-browser architecture; no
  server or fallback added. Synthetic tests do not become provider proof.
- Required actions: none for G3; release-only evidence remains open.
- Verification: No edits/tests/live requests.

### UX Designer Verdict — G3 Final-delta — 2026-10-27
- Verdict: CHANGES REQUESTED
- Accessibility evidence: Document review only, no delivered WCAG claim.
- Findings: Model/design align on saved identity, safe labels, no new line creation,
  receipt/time and readiness rules. Migration-recovery/persistence warning not
  fully specified for malformed data or quota/access failure.
- Required actions: Accessible Saved/storage warning for recovered in-memory
  records and failed migration write; say persistence is unconfirmed, reuse
  inherited polite banner, never imply saved.

### Final bounded UX fix

`design-baseline.md` now specifies localized malformed/unknown-version and
quota/access messages, recovered in-tab availability, source bytes retained,
possible loss of in-memory changes, one polite non-duplicated banner, no focus
steal/raw data/false saved message, wrapping and G5 checks. Model links that
warning table. UX and Frontend targeted agreement requested; no runtime edit.

### UX Designer Verdict — G3 Warning Fix — 2026-10-27
- Verdict: APPROVED
- Design baseline: Saved persistence-warning subsection and model linkage.
- Accessibility evidence: Document review confirms localized malformed/unknown-
  version/quota/access messages, memory availability and persistence unconfirmed,
  possible in-tab loss, one polite describedby banner without focus steal/raw
  data/new controls/false saved, and planned state/reflow/announcement checks.
- Findings: Targeted missing warning design addressed; prior UX approval unchanged.
- Required actions: none for G3. G5 validation remains required.

### Frontend Developer Verdict — G3 Warning Agreement — 2026-10-27
- Verdict: APPROVED
- Design alignment: Inherited warning banner, memory/original-data preservation,
  unconfirmed persistence and safe labels fit Saved without new interactions
  or a frontend/backend contract change.
- Verification: Read requested passages only; no code/tests/build/WCAG assessment.
- Required actions: none for narrow agreement.

## Closure

Latest Software Architect, Backend Developer, UX Designer and Frontend Developer
verdicts are all APPROVED. Constitution V's additional QA breaking-contract plan
review is also APPROVED. Initial requested changes remain visible above; fixes
were explicitly re-reviewed by accountable actors. G3 closes the design/plan
gate only. No required source evidence, G4/G5 result, release or implementation
completion is inferred. G6 documentation review remains separate.

## Final planning verification — 2026-10-27

- Final Spectral run: 0 errors, 9 acknowledged in-process-model unused warnings.
- Final YAML/reference/Ajv 2020 run: 41 schema compilations, 17 structural
  positive/negative examples, exact eleven-action coverage and six/five
  local-live partition passed. Formats and provider semantics not evaluated.
- Spec Kit `check-prerequisites.sh --paths-only --json` confirms current branch/
  feature/plan paths; `--json` discovers research, data-model, contracts and
  quickstart. setup-plan was already executed before this bounded workflow;
  its template was completed, not reset.
- Tracked and new-file whitespace checked; one Markdown date trailing-space
  finding corrected. Historical v3/v4 contract directories have no diff against
  governance commit `fdde5b1`. All changes are feature/blog documentation.
- `.specify/extensions.yml` absent at final after_plan check: no hooks to dispatch.
- G6 [actual Communicator approvals](gate-g6-story-review.md) recorded for
  specification and plan drafts in `docs/blog/`.
- No tasks.md, runtime edits, full app test execution, deployment, new commit
  or push. HEAD remains `fdde5b1`; current work intentionally uncommitted.
