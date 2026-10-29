# G5 Implementation Review

**Status: OPEN — manual evidence and agent verdicts remain outstanding.**

## Automated implementation evidence

Validated on 2026-10-29:

| Check | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm test` | 79 test files, 384 tests passed |
| `npm run test:coverage` | Passed; 94.77% statements/lines, 87.05% branches, 97.95% functions |
| `npm run lint:openapi` | Passed with 0 errors and 9 existing unused-component warnings |
| `npm run validate:feature004-contract` | Passed; OpenAPI 3.1.0, 43 schemas compiled |
| `VITE_BASE_PATH=/ npm run build` | Passed; generated OpenAPI page present |
| `VITE_BASE_PATH=/vigo-bus-navigator/ npm run build` | Passed; generated OpenAPI page present |
| Full Playwright suite at `/`, `--workers=2`, rerun after review fixes | 116 passed, 7 skipped |
| OpenAPI Playwright tests at `/` | Passed as part of the full suite |
| OpenAPI Playwright tests at `/vigo-bus-navigator/`, `--workers=2`, rerun after review fixes | 12 passed across Chromium, Android Chrome, and iOS Safari |
| README local link targets and generated-page ignore path | Verified |

During agent review, one concurrent Playwright run reported 104 passed, 12
failed, and 7 skipped, including service-worker readiness failures; another
attempt could not acquire port 4173. The rerun above was executed without
concurrent test activity and passed, so the port-contention result was not
reproducible in isolation. QA follow-up approval is still required.

Automated accessibility checks cover semantics, keyboard operation and visible
focus, Axe, responsive reflow at 320 CSS pixels and 200% text size, empty
sections, direct routing, service-worker control, and offline navigation.
Automated checks are not a substitute for the manual review below.

## Required manual evidence

### T020 — README findability

**Status: NOT PERFORMED.** The five-person README-only timed study has not been
conducted. No participant results or completion times are claimed. To close,
five repository-unfamiliar people uninvolved in the feature must each locate
all five requested README items within 60 seconds; record anonymized aggregate
results and confirm the 4/5 threshold.

### T022 — WCAG 2.2 AA manual review

**Status: NOT PERFORMED (declined).** The user declined the manual review. No
human screen-reader review or required manual checks have been conducted.
Playwright and Axe results above do not establish
screen-reader behavior, actual contrast, text-spacing overrides, target sizes,
actual 200% zoom, or the README link exception. Record the exact desktop
browser/screen-reader combination, URLs, viewport and interaction states,
criteria, results, and limitations after the review.

## Required G5 agent verdicts

The first review round returned `CHANGES REQUESTED` from all five required
actors. Scoped code re-reviews have resolved the specific UX, Frontend, and
Architect findings noted below, but these scoped approvals do not replace
overall G5 verdicts.

| Actor | Current status |
|---|---|
| QA Tester | `APPROVED` for the QA quality dimension after the isolated Playwright rerun; overall G5 remains open. |
| Stakeholder | `CHANGES REQUESTED`; T020/T022 evidence remains missing. |
| UX Designer | `CHANGES REQUESTED` overall; approved the duplicate-heading fix only. T020/T022 remain outstanding. |
| Frontend Developer | `APPROVED` for its G5 dimension after the nested-schema, heading, and Playwright follow-up. |
| Software Architect | `APPROVED` for its G5 architecture dimension after the composition-boundary fix. |

G5 remains open until all five overall verdicts are `APPROVED` and the
required manual evidence is recorded.

## First follow-up review round

All five required actors returned `CHANGES REQUESTED` on 2026-10-29:

| Actor | Findings to resolve |
|---|---|
| QA Tester | Nested Response Object descriptions are now checked, but malformed schemas nested in media-type `content` were not rejected; the concurrent Playwright result also requires an isolated rerun. |
| Stakeholder | T020 and T022 evidence is missing; README content itself exposes all five findability targets. |
| UX Designer | Navigation group headings duplicated content section labels in the heading outline; T020/T022 manual evidence remains missing. |
| Frontend Developer | Invalid nested media-type schemas were accepted; the agent's Playwright attempt could not start because port 4173 was in use. |
| Software Architect | The composition guard did not detect literal element access or extracted repository-method references. |

These findings are being addressed or remain explicitly blocked above. The
agents must re-review the relevant changes before any verdict can be upgraded.

## Scoped code-finding re-reviews

After the fixes, the Software Architect confirmed the composition-boundary
finding resolved: repository methods are discovered from `ScheduleRepositoryV5`
and dot access, literal element access, extracted methods, and destructuring are
covered by regression cases. The Architect did not rerun tests.

The Frontend Developer approved the scoped nested-schema-validation and
navigation-heading findings after reviewing the code and 27 focused tests, then
approved the Frontend Developer G5 dimension after the isolated Playwright
reruns. The UX Designer approved the scoped navigation-heading finding only;
the UX overall verdict remains `CHANGES REQUESTED` because manual evidence is
outstanding. The Software Architect approved the architecture dimension after
the composition-boundary fix. The QA Tester approved the QA dimension after the
isolated Playwright rerun. None of these approvals closes the overall gate.

### QA Verdict — G5 follow-up — 2026-10-29
- Verdict: APPROVED
- Coverage: 3/3 user stories have automated QA evidence reviewed; T020 and T022 manual evidence remains outstanding and is not counted as covered.
- Findings:
  - The nested Response Object description requirement is enforced, and malformed schemas nested in media-type content are included in the resolved validation finding.
  - Automated results now report 384/384 unit tests across 79 files, a full root Playwright run of 116 passed and 7 skipped, and 12 prefixed OpenAPI Playwright tests passed across Chromium, Android Chrome, and iOS Safari.
  - The earlier Playwright failures and port collision were reported during concurrent execution; the documented serial rerun without concurrent test activity passed. The focused OpenAPI and architecture checks are also reported as passing.
  - QA approval is limited to the QA quality dimension and does not approve G5 closure. T020 remains pending and T022 was declined and remains NOT PERFORMED; the charter requires missing manual evidence to block overall gate closure.
- Required actions: Complete and record T020 and T022 evidence before G5 closure; obtain the remaining required actor verdicts.
