# Gate G2 — Specification Review Record

- **Phase**: Specify
- **Date**: 2026-10-25
- **Artifact under review**: [spec.md](spec.md) + [checklists/requirements.md](checklists/requirements.md)
- **Governing document**: constitution v1.2.1
- **Required verdicts**: Stakeholder, QA Tester
- **Outcome**: **CLOSED — SPEC APPROVED**

## Owner clarifications encoded (pre-gate)

| Question | Decision | Encoded in |
| --- | --- | --- |
| Q1 — live data scope | **B** — live stop arrivals in v1, via edge proxy under OpenAPI contract | US2, FR-016/017/018, SC-008 |
| Q2 — static schedule source | **A** — versioned bundled snapshot + documented update pipeline | FR-015, FR-011 |
| Q3 — launch UI languages | **C** — Spanish (default) + Galician + English | US6, FR-014 |

## Round 1 — Review of the clarified spec

### Stakeholder Verdict — specify — 2026-10-25

- Verdict: APPROVED
- User value assessment: This spec is exactly the tool a Vigo commuter needs at
  the bus stop: find your line, see today's frequency (weekday / Saturday /
  Sunday-holiday) in at most 3 taps, know when the next bus actually comes, and
  keep your daily lines one tap away — all without an account, without tracking,
  and without a single byte of personal data leaving the phone. Priorities are
  ordered by real street value: scheduled frequencies first, live certainty
  second, spatial orientation third, convenience after. The ES+GL+EN decision
  respects Vigo's bilingual riders and its visitors.
- Findings:
  - Positive: US1 + FR-002/003/004 deliver the core promise; acceptance
    scenario 3 ("no service on this day type") reflects a real commuter failure
    mode.
  - Positive: all three owner clarifications correctly encoded (live arrivals:
    US2/FR-016/017/018/SC-008; bundled snapshot: FR-015/FR-011; languages:
    FR-014/US6).
  - Positive: privacy guardrails measurable — FR-008 + SC-007 make Principle VI
    verifiable.
  - Positive: accessibility and mobile-first enforceable — SC-001 (≤3
    interactions), SC-002 (<3s interactive), SC-003 (browser matrix), SC-004
    (keyboard + screen reader per WCAG 2.2 AA), SC-006 (1-tap favorites).
  - Positive: G1 follow-ups #1, #2, #5 closed at spec level (FR-012, FR-015,
    FR-014); #3 correctly anchored by SC-002 ("payload budget set at the plan
    gate").
  - Advisory (non-blocking): SC-004 covers P1 flows; the auto-refreshing P2 stop
    view is a classic screen-reader trap — QA should verify non-disruptive live
    regions at G5. WCAG 2.2 AA applies to the whole UI regardless.
  - Advisory (non-blocking): SC-008 (≤60s freshness) aligns with the 30s edge
    cache; free-tier watch item (G1 follow-up #4) stays open for the plan gate —
    auto-refresh intervals are where that budget is spent.
- Required actions: none

### QA Tester Verdict — specify — 2026-10-25 (round 1)

- Verdict: CHANGES REQUESTED
- Coverage: 16/18 FRs with testable acceptance criteria (FR-011 and FR-012 only
  via edge-case bullets); FR-013, FR-015 (update pipeline), FR-018 are
  process/artifact requirements verifiable at G3/G4. 6/6 user stories have
  independent tests; 8/8 SCs measurable and technology-agnostic.
- Findings:
  - FR-003: no day-type boundary edge case — behavior across midnight and
    holiday-vs-weekend precedence unspecified.
  - FR-011: no acceptance scenario in any user story; traceability gap.
  - FR-001: search semantics (matched fields, diacritics) to be pinned at plan
    gate — acceptable at spec level.
  - FR-017/SC-008 mutually consistent ("bounded interval" ≤ 60s staleness). OK.
  - SC-002 defers numeric budget to plan gate — G3 watch item.
  - SC-003 "current stable versions" time-relative — browser matrix fixed at
    tasks gate.
  - FR-014/US6: translation-completeness check needed at tasks gate.
  - Edge cases otherwise strong: localStorage corruption/quota (FR-012),
    offline (FR-009), stale data, live-data degradation (FR-017).
  - Constitutional constraints honored: FR-013→Principle IV, FR-018→Principle V,
    FR-008/SC-007→Principle VI, SC-004→WCAG 2.2 AA.
- Required actions:
  1. Add explicit edge case(s) for day-type boundaries under FR-003: midnight
     rollover while open; holiday coinciding with Saturday/Sunday precedence.
  2. Add acceptance traceability for FR-011: one Given/When/Then scenario
     verifying the schedule dataset version/date is visible.

## Amendment — QA required actions applied

- **Edge cases added**: midnight rollover (day type re-evaluated or refresh
  prompt) and holiday precedence (holiday calendar wins over Saturday/Sunday —
  holiday always maps to Sunday/holiday schedule).
- **US1 acceptance scenario 4 added**: the schedule dataset version/date is
  visible next to the frequency table (covers FR-011).

## Round 2 — Sign-off

| Actor | Verdict | Notes |
| --- | --- | --- |
| Stakeholder | APPROVED | Round 1 verdict stands; additions increase commuter trust. |
| QA Tester | APPROVED | Both required actions resolved; 18/18 FRs now have testable acceptance coverage or explicit G3/G4 verification points. |
| Project Lead | APPROVED | Gate procedure followed; verdicts recorded. |

**Gate G2: CLOSED.** Spec 001 is approved and ready for `/speckit-plan`.

## Watch items carried to later gates

1. **G3 (plan)**: pin FR-001 search semantics (fields, case/diacritics).
2. **G3 (plan)**: set the numeric payload/performance budget for SC-002,
   accounting for MapLibre GL JS + deck.gl weight (constitution v1.2.0 note).
3. **G3 (plan)**: reconcile client caching with the 30s edge TTL (G1 follow-up).
4. **G3 (plan)**: Cloudflare 100k req/day free-tier headroom vs. auto-refresh
   interval (SC-008).
5. **G4 (tasks)**: fix the concrete browser test matrix for SC-003.
6. **G4 (tasks)**: ES/GL/EN translation-completeness check for FR-014.
7. **G5 (implement)**: accessibility verification of the auto-refreshing stop
   view (live regions) beyond P1 flows.
