# Gate G2 — Spec Review Record

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25

## Verdicts

| Actor | Verdict | Notes |
| --- | --- | --- |
| Stakeholder | APPROVED | Advisories deferred to plan: FR-020 geographic data source, SC-001 load definition, SC-003 threshold. |
| QA Tester | APPROVED | After two change rounds: CORS aligned to constitution (`Access-Control-Allow-Origin: *`, FR-008 + US2 scenario 4); FR-010 last-known retention made mandatory (incl. US3 scenario 2 wording); SC-003 restated measurably. |

## Resolved findings

1. CORS policy ambiguity → FR-008 mandates `*` per constitution Principle VI; acceptance scenario added.
2. FR-010 optional retention contradicted SC-007 → retention now MUST-level in both requirement and scenario.
3. SC-003 unmeasurable → now enumerates five UI states, automated UI matrix, 100% coverage, no reload.

## Advisories carried to plan gate (non-blocking)

- SC-001 "expected project load" quantified as 10 rps burst / 60 s (research D9).
- FR-002 field optionality pinned in the OpenAPI v2 contract.
- FR-018 health covered by `/health` liveness + contract tests (research D7); G4 to include a task.
- SC-008 line verification uses catalog stop-order polyline (research D3).
- Key entity "invalid" clarified as service-level only (data-model.md).

### QA Verdict — G2 — 2026-10-26
- Verdict: CHANGES REQUESTED
- Coverage: 5/10 reviewed focus checks fully specified and task-traceable
- Findings:
	- FR-010 gives 30-second fresh and 300-second maximum stale bounds, and the data model implies strict age limits, but the requirements/tasks do not explicitly define and test behavior at the exact 30s and 300s transitions.
	- FR-032 defines the privacy notice contents and SC-012 names all three locales; T050 only requires the notice to be visible, so it does not ensure each locale includes every required disclosure.
	- FR-023 and acceptance scenarios distinguish fixture-first local behavior from the explicit development live override, but T048 does not unambiguously require a test that the override selects the fixed live source.
	- The constitution requires pausing real-time fetches while backgrounded; the spec has no acceptance criterion for this, and Quickstart VS4 is only a manual check.
	- T057 says to preserve the v3.0.0 response schema, but no explicit regression check is tasked for the API version and browser-facing schema invariant.
	- Pagination, source response/body limits, zero-route versus malformed-row handling, null-identifier no-request behavior, and failed-page atomicity are explicit and traceable in the spec and tasks.
- Required actions:
	- Define the strict fresh/stale boundary outcomes and add automated checks just below and at 30s and 300s (fresh data must no longer be treated as fresh at 30s; last-known data must not be served at 300s).
	- Strengthen T050 to assert every required privacy disclosure in Spanish, Galician, and English.
	- Strengthen T048 to assert fixture mode by default and that the explicit development live override calls only the fixed source; retain preview/production live behavior and fixture rejection checks.
	- Add a spec acceptance criterion and automated task for pausing backgrounded arrivals polling and resuming it on foreground.
	- Add an automated regression assertion that the OpenAPI version remains 3.0.0 and the public request/response schemas remain unchanged.

### QA Verdict — G2 Final Re-review — 2026-10-26
- Verdict: APPROVED
- Coverage: 10/10 G2 source-change checklist criteria reviewed
- Findings: none
- Required actions: none

## Source-Change G2 Review — Vitrasa WebForms — 2026-10-26

**Scope**: This fresh review covers the owner-selected Vitrasa source change;
the original G2 verdicts above do not approve the WebForms migration.

| Actor | Verdict | Notes |
| --- | --- | --- |
| Stakeholder | APPROVED — final review | Confirms fixture-first local behavior, explicit development live override, live preview/production, privacy disclosure, null-identifier behavior, malformed-row failure, strict cache bounds, background polling, and v3.0.0 preservation. |
| QA Tester | APPROVED — final review | Confirms 10/10 source-change checklist criteria; exact cache boundary tests, complete privacy assertions, fixture/live profile tests, visibility polling, and API/schema regression are specified. |

The [G2 source-change checklist](checklists/g2-source-change.md) records
requirements-quality completion only; its checked items do not indicate that
implementation tasks have been completed.

## Source-Change G2 Re-review — Accessibility, Load, Payload — 2026-10-26

The original source-change approvals above predate FR-034 and SC-014–SC-016.
They do not cover those added criteria.

### Stakeholder Verdict — G2 Fresh Review — 2026-10-26
- Verdict: CHANGES REQUESTED
- User value assessment: FR-034 is in scope because accessible arrivals information helps commuters act on bus updates, and it implements the accessibility requirements ratified in G1 v1.3.0. SC-014 provides a bounded, fixture-only capacity check without load against Vitrasa; SC-015 makes the payload constraint measurable. These additions do not expand personal-data collection or weaken local-only profile boundaries.
- Findings:
	- FR-034 and SC-016 did not identify all arrivals states whose transitions must be announced; “freshness/unavailable” could omit loading, current, or empty.
	- SC-014's fixture-only load measurement must not be represented as a guarantee of live Vitrasa latency.
- Required actions:
	- Specify live-region announcements for all five FR-012 states and verify each state automatically.

### Stakeholder Verdict — G2 Re-review — 2026-10-26
- Verdict: APPROVED
- User value assessment: FR-034 and SC-016 now explicitly require live-region announcements for loading, current, stale, empty, and unavailable states. The criteria support commuters in distinguishing delayed or missing data from an absence of buses.
- Findings: none
- Required actions: none

### QA Verdict — G2 Fresh Review — 2026-10-26
- Verdict: CHANGES REQUESTED
- Coverage: 4/4 additions reviewed; 3/4 fully traceable to verification
- Findings:
	- FR-034 and SC-016 named all five state announcements, but the T052 test scope did not enumerate them.
	- T053 did not explicitly require blocking/instrumenting source calls and asserting zero Vitrasa calls.
	- The plan described aggregate gzip enforcement as active although the implementation task T054 remained pending; the G2 checklist also had stale task references.
- Required actions:
	- Enumerate the five announcements in T052, assert zero outbound source calls in T053, distinguish planned aggregate gzip enforcement from active per-file caps, and correct/extend the G2 checklist.

### QA Verdict — G2 Re-review — 2026-10-26
- Verdict: APPROVED
- Coverage: 13/13 source-change checklist criteria
- Findings: none
- Required actions: none
