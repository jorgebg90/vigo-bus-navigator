# G2 Source-Change Checklist: Vigo Bus Real-Time API

**Purpose**: Review requirement clarity, consistency, and task traceability for the WebForms source change.
**Created**: 2026-10-26
**Feature**: [spec.md](../spec.md)

**Note**: This custom checklist records requirements-quality review, not implementation completion.
**Review Ownership**: This checklist is reviewer-owned. Mark an item `[x]` only when its requirements-quality criterion is satisfied.
**Marker Semantics**: `[x]` means the criterion has been reviewed and satisfied for requirements quality. It does not mean implementation work is complete.

## Requirement Consistency

- [x] CHK001 Are local fixture-first behavior, the explicit development live override, and live preview/production behavior distinguished without conflicting requirements? [Spec §FR-023, US2/US6]
- [x] CHK002 Does the null-`vitrasaId` requirement prohibit both an arrivals request and substitution of another identifier? [Spec §FR-033, US1]
- [x] CHK003 Does the spec distinguish a recognized zero-route table from malformed present route rows? [Spec §FR-026]

## Acceptance Criteria and Task Traceability

- [x] CHK004 Are the strict 30-second fresh and 300-second stale boundaries defined at the exact transition and covered just below and at each boundary? [Spec §FR-010, SC-011; Task T049]
- [x] CHK005 Do the three-locale privacy tests assert every required disclosure, not only that a notice is visible? [Spec §FR-032, SC-012; Task T051]
- [x] CHK006 Do tasks identify automated checks for pagination sequencing, response/body bounds, and failure without partial results or cache writes? [Spec §FR-025–FR-030, SC-011; Tasks T048–T050]
- [x] CHK007 Does task coverage explicitly prove fixture default and the `development` live override select the intended source, while preview/production reject fixture mode? [Spec §FR-023, US2/US6; Task T049]
- [x] CHK008 Are API `info.version: 3.0.0` and OpenAPI `openapi: 3.1.0` distinguished, with explicit regression coverage for each public operation, the stopCode pattern, named ArrivalsResponse/Arrival fields and bounds, and NetworkLineSummary/NetworkLineDetail/NetworkStop shapes? [Spec §SC-013; Task T055]

## Constitutional Coverage

- [x] CHK009 Does the spec define an acceptance criterion, with automated verification in tasks, for pausing real-time fetches while the document is backgrounded and resuming when foregrounded? [US1 scenario 8; Task T051; Quickstart VS4]
- [x] CHK010 Does the privacy requirement limit lookup data to the selected public stop ID and transient source-required state, excluding profile/activity data and anonymity claims? [Spec §FR-029/FR-032]
- [x] CHK011 Do accessibility requirements and tasks explicitly verify keyboard/focus, live-region announcements for all five arrivals states, WCAG 2.2 AA contrast, and 44×44 CSS-pixel targets? [Spec §FR-034, SC-016; Task T052]
- [x] CHK012 Is the 10 rps/60 s/p95 load target measured using fixtures only, with zero outbound Vitrasa calls and no live-source latency guarantee implied? [Spec §SC-014; Task T053; Research D11]
- [x] CHK013 Are aggregate gzip ceilings distinguished from existing per-file limits, and is aggregate enforcement explicitly planned in T054 rather than claimed as already active? [Spec §SC-015; Task T054]

## Notes

- All criteria are satisfied for requirements quality. This checklist does not mark implementation work complete.
- `/speckit-implement` reads checklist state as a gate and must not modify markers.