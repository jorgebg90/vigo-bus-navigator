# Gate G3: Plan Review - 003 Improve Frontend Design

**Date**: 2026-10-26
**Artifacts reviewed**: plan.md, research.md, data-model.md, quickstart.md, contracts/realtime-api-v4.openapi.yaml, contracts/ui-design-contract.md

## Review History

- Round 1: Architect and Backend requested a complete v4 contract, budget enforcement, and a strict pair rule; UX and Frontend requested a full design baseline and frontend decisions.
- Round 2 (this record): the v4 contract became standalone and Spectral-clean; the UI contract was rewritten as a baseline with measured tokens; the plan gained the Frontend Architecture Decisions section; deck.gl left the first-map path.

### Software Architect Verdict - Plan - 2026-10-26
- Verdict: APPROVED
- Findings:
  - v4 is standalone and complete; the pair is nullable only, with v3 bounds preserved and a strict `oneOf` rule that also covers stops embedded in `/lines/{lineCode}`.
  - Plan, research D4, data model, and quickstart agree. Map events emit only `stopId`; selection is application-owned; the Worker remains the only server-side component.
  - The 500 KiB first-map budget is stated once with the baseline task named first.
- Required actions:
  - Extend `lint:openapi` and the regression tests to v4, including mixed null/number rejection and unlocated stops in `/stops` and `/lines/{lineCode}`.
  - Start `tasks.md` with the baseline measurement of the first-map graph.

### Backend Developer Verdict - Plan - 2026-10-26
- Verdict: APPROVED
- Findings:
  - An ajv check confirmed both-number-in-bounds and both-null pass; mixed pairs and `0/0`, `42.2/0`, `50/-8.7` are rejected.
  - D4 specifies the generator fix (retain unlocated stops, null not 0, bounds, regenerate catalog); D10 requires characterization tests and a provenance record before attribution removal; freshness tests at 29/30/299/300 s are specified.
- Required actions:
  - `tasks.md` must contain explicit tasks for the generator fix (tests first), catalog regeneration, Worker tests for unlocated stops, v4 lint/regression, D10 characterization and provenance, and freshness tests.

### UX Designer Verdict - Plan - 2026-10-26
- Verdict: APPROVED
- Findings:
  - Layouts for four viewports, the complete token set, components, navigation, panel and focus rules, chooser and keyboard route, states, reduced motion, and privacy placement are sufficient for the plan phase.
  - Non-blocking: hover/pressed and tile contrast, 44 px hit boxes, the "Still loading" announcement test, rail DOM order versus visual order, and distinct stable live-region containers are verified at implementation/G5.
- Required actions:
  - Carry into `tasks.md`: G5 evidence for tile contrast, hover/pressed, target sizes, and 200% reflow at 320 px; a task to reconcile rail DOM order with visual order; a keyboard-only and screen-reader pass of the chooser, settings menu, and sheet.

### Frontend Developer Verdict - Plan - 2026-10-26
- Verdict: APPROVED
- Findings:
  - `selectStop`, the `MapPort` callbacks, deck.gl removal, baseline task, 44 px hit mechanism, chooser, nullable `Stop` with a single mapper, and the architecture import test are all resolved and agreed.
- Required actions:
  - `tasks.md` names exact files for replaced modules and includes the architecture test, `selectStop` tests, and 44 px hit-box measurements. Real-device verification at G5.

### Project Lead Verdict - Plan - 2026-10-26
- Verdict: APPROVED. G3 is closed; `/speckit-tasks` is the next phase.
- Findings:
  - All four actor verdicts are recorded above. Principle V is satisfied by the reviewed v4 artifact.
- Required actions:
  - Implementation stays blocked until G4 (tasks review). Tasks must include the follow-ups listed by each actor.
  - Communicator (G6) drafts the planning narrative after G4.
