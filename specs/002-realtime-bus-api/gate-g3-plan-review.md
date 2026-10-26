# Gate G3 — Plan Review Record

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25

## Verdicts

| Actor | Verdict | Notes |
| --- | --- | --- |
| Software Architect | APPROVED | After two change rounds: stale-retention mechanism specified (two Cache API entries, 300 s maximum staleness bound, no-store + Age on stale, 503/429 beyond the bound); contract 200 response pins per-status cache headers. Advisories recorded as tasks follow-ups. |
| Backend Developer | APPROVED | After one change round: 429 RATE_LIMITED added; frontend caller uses Stop.code (research D10); wrangler/vitest-pool-workers deps, dev:worker script and lint:openapi repoint planned; ArrivalsGateway mapping table pinned; unknown path → 404 NOT_FOUND; drop-rule for empty destinations; OPTIONS 204 in contract. |

## Resolved findings (architect)

1. Cache API evicts at `max-age` → two-entry scheme (fresh 30 s + last-known 300 s) in research D4.
2. Unconditional Cache-Control in contract → enum per `dataStatus`, Age header documented.

## Resolved findings (backend)

1. Rate-limit case missing → 429 RATE_LIMITED across contract/data-model/quickstart.
2. Caller passed internal `stop.id` → caller uses public `Stop.code` (D10).
3. Local dev not reproducible → wrangler + @cloudflare/vitest-pool-workers devDeps, `dev:worker` script, `lint:openapi` repoint.
4. Cache testability → miniflare pool + injected cache port for node unit tests.
5. Port additivity → mapping table; `dataStatus` required on `live`, fixture defaults `current`.
6. Contract ambiguities → 404 NOT_FOUND for unknown paths; drop-rule for empty destination/out-of-range minutes; OPTIONS 204.

## Follow-ups carried to tasks phase (non-blocking)

- Constitution PATCH amendment: Principle I / stack table wording "REST↔SOAP translation" → "upstream transport adaptation and CORS injection".
- Port type update: `unavailable.reason` union → `stop-not-exist | upstream | unknown`, stop-view consumer updated accordingly.
- G4 must verify task coverage of `dev:worker`, `lint:openapi` repoint, and worker devDependencies.

## Source-change G3 Review — Vitrasa WebForms — 2026-10-26

**Scope**: Fresh Software Architect review of the owner-selected WebForms migration. This verdict does not reuse the earlier JSON-source approval and does not imply Backend or G4 approval.

### Architect Verdict — G3 plan — 2026-10-26

- Verdict: CHANGES REQUESTED
- Findings:
	- The plan correctly keeps the browser API at v3.0.0 and the Worker as the sole server-side exception. The approved artifacts specify built-in `HTMLRewriter`, fixed-origin GET/POST pagination, lookup-scoped cookies, redirect rejection, bounded responses/pages/rows/deadline, atomic complete-result caching, fixture-first local execution, production fixture rejection, nullable `vitrasaId`, privacy disclosure, visibility-aware polling, and tests-before-implementation ordering.
	- The migration-specific test plan does not close the stated G5 EdgeCache runtime-verification requirement. The Workers pool/Miniflare age tests are not an actual Cloudflare EdgeCache runtime test; quickstart VS6 does not test cache expiry or retention.
	- `preview` is named as a live profile, but no task or quickstart command deploys that environment or proves how the preview frontend selects its Worker URL. The deploy workflow task only names production deployment.
	- The plan sets a 10 rps / 60 s and p95 ≤ 3 s goal, but no migration task measures it. A fixture-only load check is needed; live Vitrasa must not be load-tested. One cache miss can fan out to ten sequential upstream requests.
	- The plan puts the `HTMLRewriter` extraction in `worker/src/normalize.ts`, which also owns normalization. Make the boundary explicit: Worker-runtime HTML extraction/protocol handling in the acquisition adapter, with pure source-row-to-contract normalization independently Node-testable and free of HTMLRewriter/I/O.
	- The Constitution Check's accessibility and payload PASS claims are not fully evidenced by the migration tasks. T050 covers privacy text, null IDs, and polling, but not keyboard/focus, screen-reader behavior for the changed states, contrast, or 44 px targets. The plan also says the size budget is unchanged without naming the actual numeric budget or reconciling it with the per-file limits in `.size-limit.json`.
	- Status text is stale: plan structure labels G2 as pending although the source-change G2 record is approved. No required design artifacts are missing; the plan's status references need alignment.
- Required actions:
	1. Add a concrete G5 procedure/task and quickstart scenario that verifies cache behavior on an actual Cloudflare runtime, including fresh/stale age boundaries and stale-on-failure retention. Name the test environment and how it avoids enabling fixture responses in preview/production; record the required Cloudflare credentials/deployment and ensure this is not a local prerequisite.
	2. Specify preview deployment and frontend URL selection, including an executable preview deploy/smoke path, live-source configuration, fixture rejection, and separation from the production deployment.
	3. Add a fixture-only test task for the stated 10 rps / 60 s and p95 ≤ 3 s target, with a clear measurement and no load against Vitrasa. Document the upstream request amplification and its acceptable-use/free-tier implications; live smoke remains low-volume.
	4. Separate the Workers-only HTML/WebForms adapter from the pure normalization module in the plan and task paths, and test each in its appropriate runtime.
	5. Extend the frontend validation task to cover the changed privacy/status/retry/unavailable UI for keyboard and visible focus, screen-reader announcements, contrast, and ≥44 px targets. State the existing numeric payload limits (or explicitly revise them) and ensure the CI gate actually enforces the stated combined/per-chunk budget.
	6. Correct the stale G2 status reference in the plan and keep all G3/G4 status text scoped to approvals actually recorded.
- Advisories:
	- The endpoint is public and a cache miss may make up to ten upstream requests. Confirm Vitrasa usage constraints and document a request-budget/degradation policy that protects the free tier without adding a server, database, or user tracking.
	- Keep the existing API-version/schema regression assertions and the T045→T046–T050→T051+ test-first order; these are correctly scoped in the current task sequence.

## Source-Change G3 Re-review — Vitrasa WebForms — 2026-10-26

These verdicts review the revised plan after the fresh source-change G2
approval. They do not imply implementation or G5 runtime verification.

### Architect Verdict — G3 plan — 2026-10-26

- Verdict: APPROVED
- Findings:
	- The plan addresses all six actions from the prior source-change review and is consistent across plan, research, data model, quickstart, and tasks.
	- The EdgeCache smoke is opt-in, uses a temporary remote Worker and deterministic injected responses, and is explicitly excluded from local CI, preview, production, and Vitrasa traffic. Actual Cloudflare execution remains a post-implementation G5 check.
	- Preview deployment and frontend configuration are specified separately from production. The fixture-only load test measures 600 requests at 10 requests/second for 60 seconds and asserts zero Vitrasa calls; research documents the up-to-ten-request pagination fan-out, no-retry policy, and stale/error degradation.
	- Worker-only HTML extraction and pure Node-testable normalization have distinct modules and runtime-specific tests. Frontend accessibility requirements and aggregate/per-file payload limits have explicit validation tasks.
	- G2 is consistently recorded as fresh-approved; G3 and G4 remain pending their respective reviews.
- Required actions: none

### Backend Developer Verdict — G3 — 2026-10-26
- Verdict: APPROVED
- Findings: none
- Required actions: none
