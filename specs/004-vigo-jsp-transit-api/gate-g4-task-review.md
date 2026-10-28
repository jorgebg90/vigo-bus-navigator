# G4 Task Gate — Feature 004

Status: **CLOSED — APPROVED for task readiness only**.
G4 approval does not authorize implementation or production release; G5 and
source-evidence gates remain separate.

## Reviewer verdicts

### QA Tester — G4 Re-review

- Verdict: **APPROVED**
- Findings: T055 covers valid v1 migration and malformed-entry/envelope or
  unknown-version v1 preservation, in-memory recovery without a v2 write,
  malformed/unknown v2 non-overwrite, idempotency, and storage failure. T001–T004
  and T012–T060 link work to concrete verification tasks. T071 records commands,
  environment/profile, results, and external-network limitations at this gate.
- Required actions: None for G4 task readiness.
- Verification: Read-only review of the revised task backlog; no implementation,
  tests, or live requests were performed by this review.

### UX Designer — G4 Review

- Verdict: **APPROVED**
- Findings: T024, T031, T040, T041, T051, and T069 explicitly cover localized
  states, focus and announcements, accessible map/text alternatives, dated
  snapshot provenance, and automated/manual WCAG 2.2 AA evidence at the required
  viewport and text-resize settings.
- Required actions: None for G4 task readiness.
- Verification: Read-only review of the task backlog and UX baseline; no
  implementation or accessibility conformance claim.

### Frontend Developer — G4 Review

- Verdict: **APPROVED**
- Findings: T027 specifies v5 domain/port migration, distinct stop-ID namespaces,
  no synthesized ETA, and receipt/provenance equality. T055/T058 cover lossless
  favorites migration in the actual storage adapter and Saved UI. T011/T061
  distinguish synthetic fixtures from provider evidence. T041/T068 require
  truthful exact-day snapshot attribution. T074 gates Worker removal on T073.
- Required actions: None for G4 task readiness; semantic source and release
  evidence remain open.
- Verification: Read-only review of the task backlog and design artifacts; no
  implementation or runtime tests were performed by this review.

## QA findings and resolution

The initial QA re-review requested explicit malformed/unknown-version v1
recovery coverage and concrete verification/evidence locations. These were
resolved in T055, T001–T004, T012–T060, and T071, then accepted in the final QA
re-review. The UX and Frontend reviews approved the revised backlog.

## Backlog and validation

- `tasks.md` contains 74 tasks with sequential IDs T001–T074.
- Story allocation: US1 14 tasks, US2 19 tasks, US3 9 tasks.
- Setup: 4 tasks; foundational: 14 tasks; polish/release evidence: 14 tasks.
- Checklist/path format, task references, story labels, and `git diff --check`
  passed.
- The default profile remains fixture-only. Live smoke is explicit, sequential,
  and excluded from default CI. The legacy Worker removal task is gated on T073.

No application implementation, provider-live test, production evidence, or G5
approval is claimed by this gate.
