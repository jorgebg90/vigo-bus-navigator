# Gate G4 — Tasks Review Record

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25

## Verdicts

| Actor | Verdict | Notes |
| --- | --- | --- |
| QA Tester | APPROVED | After one change round: 502 UPSTREAM_ERROR branch added to T020 and the failure-class split pinned in T022; /health schema assertion added to T010; advisories folded (fixture dataStatus default in T006, ground-truth reference stops in T026, SC-005 loop as T040, invalid-config case in T016). |

## Resolved findings

1. F1: 502/503 split now tested (T020) and mapped (T022) — network-level → 503, upstream non-200/unparseable → 502, rate limit → 429, timeout → 504, each only without an in-bound last-known result.
2. F2: FR-018 `/health` has an automated contract assertion (T010).
3. A1–A4 folded into T006, T016, T026, T040.

## G6 record (same phase)

| Actor | Verdict | Artifact |
| --- | --- | --- |
| Communicator | APPROVED | [blog-draft-specify-plan.md](blog-draft-specify-plan.md) — Specify + Plan narrative; all claims trace to artifacts; advisory: rewrite relative links if published to docs/blog/. |

## Source-Change G4 Review — Vitrasa WebForms — 2026-10-26

### QA Verdict — G4 Fresh Review — 2026-10-26
	- T054 combined payload test authoring with checker implementation, and T063 placed API regression assertions after implementation tasks, contrary to the test-first gate.
	- Tasks did not explicitly test the exact SC-010 tuples, uncatalogued numeric stop IDs, HTTP/HTML error pages, resistance to source-selected form actions/caller headers, or the selected-ID-only browser request.
	- T054 did not state the generated-assets build prerequisite for the size gate.
	- The quickstart live override was split into separate shell commands and attribution was numbered VS7 after VS9.
	- T064 did not record remote G5 evidence, and implementation tasks lacked explicit test dependencies and verification commands.
	- Split all tests from implementation, add the missing protocol/privacy assertions, define the payload build prerequisite, fix the quickstart, record G5 smoke evidence, and add explicit per-task test dependencies and verification.

### QA Verdict — G4 Re-review — 2026-10-26
- Verdict: CHANGES REQUESTED
- Coverage: 6/6 prior G4 required-action groups reviewed; 2 residual findings
- Findings:
	- T045 did not explicitly configure root Node Vitest to discover `worker/unit/**/*.test.ts`, where T047 places tests; the existing root config uses an explicit include list.
	- The quickstart said aggregate payload enforcement was available after T054, but T054 adds test coverage and T063 implements the checker.
- Required actions:
	- Explicitly include `worker/unit/**/*.test.ts` in root Node Vitest and verify test discovery/runtime separation; reference T063 for aggregate payload enforcement.

### QA Verdict — G4 Final Re-review — 2026-10-26
- Verdict: APPROVED
- Coverage: 50/50 (34 functional requirements and 16 success criteria)
- Findings: The two residuals from the prior review are resolved. T045 verifies that `npm test` discovers T047 while `npm run test:contract` selects only the Workers runtime. The quickstart correctly states aggregate payload enforcement follows T063.
- Required actions: none

### Communicator Verdict — G6 source-change narrative — 2026-10-26
- Verdict: APPROVED
- Draft: [blog-draft-specify-plan.md](blog-draft-specify-plan.md)
- Findings: none
