# Gate G5 — Implementation Review Record

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-26 | **Status**: Local implementation accepted; pending external operational verification and formal G5 closure

## Implementation evidence

| Check | Result |
| --- | --- |
| Unit + DOM suite (Vitest) | 73/73 passed across 26 files |
| Worker contract suite (fixtures, no network) | 23/23 passed — success/empty/stale, 400/404/405/429/502/503/504, OPTIONS 204, /health, CORS `*` everywhere, staleness bound, SC-005 loop; tests use plain-node Vitest and `MemoryCache` |
| Coverage thresholds | 54.54% statements/lines, 83.33% branches, 75% functions (unchanged budgets) |
| TypeScript | both workspaces clean |
| OpenAPI lint (v2 contract) | no errors |
| Snapshot generation with Vigo bounding-box validation | passes |
| Production build + size-limit | within budgets |
| Playwright matrix (Chromium desktop, Android, iOS WebKit) | 24/24 passed incl. freshness-transition and map-position scenarios |

## Quickstart validation (VS1–VS7)

- VS1 fixture mode: 1234 → current, 2000 → empty, 999999 → 404 STOP_NOT_EXIST, /health → ok ✅
- VS2 contract matrix: green ✅
- VS3 stale-on-failure: stale beyond 30 s TTL with original generatedAt + no-store + Age; 503/502/429/504 per failure class; never beyond the 300 s bound ✅
- VS4 frontend local profile: five localized freshness states (loading, current, stale, empty, unavailable), aria-live, retry ✅
- VS5 map correctness: markers at catalog coordinates inside Vigo, route polyline follows stop order; ground-truth test compares stops from the real catalog with pinned references within 50 m; invalid stops are announced and excluded (focused test passes) ✅
- VS6 production smoke: pending real deployment (documented)
- VS7 attribution audit: NOTICE + LICENSE + README provenance + ported-file headers; automated test ✅

## Pending

- QA Tester re-review of the resolved loading-state and map ground-truth findings
- Stakeholder confirmation after the loading state was implemented (prior approval preceded this fix)
- SC-001 load target (10 requests/second, p95 <= 3 seconds) has no recorded load-test evidence
- EdgeCache behavior is not established by the plain-node `MemoryCache` contract suite

## Independent read-only review

An independent code review found both original QA blockers credibly resolved: the loading state is rendered and covered for all five states, and the ground-truth check compares real catalog coordinates with pinned references. It recommended retaining CHANGES REQUESTED until load-target evidence and EdgeCache runtime coverage are addressed. This review is not a formal harness verdict.

## Source-Change Implementation Evidence

The Vitrasa WebForms adapter implementation is under review; this evidence does
not close G5. It supplements the JSON-era runtime evidence above and keeps that
earlier review history intact.

| Check | Result |
| --- | --- |
| TypeScript / lint | `npm run typecheck` and `npm run lint` pass |
| Node unit + DOM suite | 75/75 tests pass across 26 files; coverage 70.53% statements/lines, 87.17% branches, 80% functions |
| Worker contract suite | 53/53 tests pass across 5 files, fixture-only |
| SC-014 fixture load | 600 requests at 10 rps for 60 s; zero source calls; p95 0.00 ms in this local runtime |
| Playwright | 27/27 scenarios pass across Chromium, Android Chrome, and iOS Safari |
| OpenAPI | API v3.0.0 remains distinct from OpenAPI 3.1.0; regression tests pass and Spectral reports 0 findings |
| Payload budget | Build passes; aggregate gzip JavaScript 562.2 KiB, CSS 10.8 KiB; existing per-file caps pass |
| Wrangler profiles | Preview and production dry runs pass with fixture mode disabled; no deployment performed |
| Local fixture smoke | `/health` 200; stop 1001 current; stop 2000 empty; stop 999999 `STOP_NOT_EXIST`; localhost only |

## Pending Source-Change Evidence

- QA Tester approved the latest local fixes on 2026-10-26; Stakeholder accepted the local implementation pending external operational verification on 2026-10-26. These decisions do not close G5.
- Low-volume remote preview deployment/smoke; requires Cloudflare credentials and was not attempted.
- T066 actual Cloudflare Cache API freshness/retention smoke and its opt-in command; requires Cloudflare credentials and remains unimplemented. Local EdgeCache tests now verify strict 30-second and 300-second age bounds even when the backing cache retains entries, but they do not establish remote Cache API retention behavior.
- SC-001 healthy-upstream latency has not been measured. The fixture-only SC-014 run is not evidence for this live-source success criterion.
- T065 and T066 remain open, so T067 and G5 remain pending. No preview, production, or Vitrasa request was made during local validation.

## Local Follow-up Evidence — 2026-10-26

- `npm run typecheck`: passed.
- `npm test`: 78/78 passed across 27 files, including strict EdgeCache age-bound tests and stable live-region transition coverage.
- `npm run test:contract`: 54/54 passed across 5 files; unexpected arrivals query parameters return 400 before any source call.
- `npm run test:load`: 600 fixture-only requests at 10 rps; p95 1 ms, zero source calls.
- `npm run test:e2e -- --workers=3`: 27/27 passed across Chromium, Android Chrome, and iOS Safari.
- `npm run lint:openapi`, `npm run build`, and `npm run size`: passed; aggregate gzip payload is 562.3 KiB JavaScript and 10.8 KiB CSS.
- The prior review findings for live-region node stability and undefined query-parameter behavior are addressed by local changes and tests. The live-region test now checks all five states on the same node. The approvals recorded below apply to local implementation only and do not close G5.

## Review Decisions — 2026-10-26

- QA Tester: APPROVED to proceed to Stakeholder; verified all five live-region states on one node, strict local EdgeCache age bounds, and query-parameter rejection before source access. QA explicitly left G5 pending remote checks and live-only criteria.
- Stakeholder: ACCEPTED the local implementation pending external operational verification. Required remaining evidence is T065 preview smoke, T066 Cloudflare Cache API smoke, T067 documentation verification, SC-001 healthy-upstream latency, and SC-009 live-source smoke. No remote checks were performed as part of this review.
