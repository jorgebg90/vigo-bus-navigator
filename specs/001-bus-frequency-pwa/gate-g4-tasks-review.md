# G4 Tasks Review

**Feature**: `001-bus-frequency-pwa`
**Reviewer**: QA Tester
**Date**: 2026-10-25

### QA Verdict - G4 - 2026-10-25

- Verdict: APPROVED
- Coverage: 18/18 functional requirements mapped to implementation and/or automated verification tasks; all 6 user stories have independent test suites; all 8 success criteria have validation coverage.
- Findings:
  - Tasks T001-T077 are sequential, checkbox-formatted, and include concrete repository paths.
  - Tests precede implementation tasks for every user story and cover pure domain, application, DOM, Worker contract, storage, offline, and i18n behavior.
  - T009 identifies `frontend/src/application/ports.ts` as the canonical TypeScript port location.
  - T010 enumerates live, timeout, upstream, network, unparseable, and empty-arrivals fixtures.
  - T046 carries the map bundle calibration and CartoDB OpenAPI exception requirements.
  - T054 records the future `v2` localStorage key rollover watch item.
  - T006 pins the Playwright browser matrix for the offline smoke test.
  - OpenAPI 405 handling, minutes-since-midnight schedules, visible-only 30-second refresh, snapshot generation, i18n parity, and the 500 KB budget are explicitly represented.
- Required actions: none for G4. Implementation must keep the test-first ordering and execute the focused tests before the G5 review.

## Verification Evidence

- Task format validator: passed, `TASK_COUNT:77`, `G4_TASK_REVIEW_FIXES_VALID`.
- `git diff --check`: passed.
- MVP scope: T001-T030 delivers US1 from bundled data without network access.
- Full delivery scope: T001-T078 covers setup, foundation, US1-US6, cross-cutting quality, CI-equivalent validation, and G6 documentation.

## Post-analysis Amendments

The interactive remediation review added T078 and the first four Communicator drafts, aligned the specification status to `Approved`, defined five-item recent-view retention, fixed the SC-003 browser matrix to Chrome Android/Safari iOS/Chrome desktop, added Lighthouse CI and privacy-audit coverage, and confirmed `frontend/src/application/ports.ts` as the canonical port source.

### QA Verdict - G4 Re-review - 2026-10-25

- Verdict: APPROVED
- Coverage: 7/7 prior analysis findings resolved.
- Findings: none.
- Required actions: none.
