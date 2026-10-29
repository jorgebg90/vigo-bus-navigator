# Implementation Plan: Direct Vigo Municipal Transit

**Branch**: `004-vigo-jsp-transit-api` | **Date**: 2026-10-27 |
**Spec**: [spec.md](spec.md)

**Status:** G2, G3 and G6 CLOSED — approved for planning and phase documentation.
G4 is CLOSED for task readiness only; see [gate-g4-task-review.md](gate-g4-task-review.md).
The supported browser action set is enabled in local development and production
by the product owner's 2026-10-28 direction. Four exact candidate mappings are
also enabled in both live profiles, limited to exact line-A parameters, by a
separate explicit product-owner decision on 2026-10-28. All other candidate
parameters remain blocked.
G5 is CLOSED WITH PRODUCT-OWNER-ACCEPTED EXCEPTIONS for the limited seven-action
scope; the exact candidate production scope is an amendment, not retroactive G5
actor approval. Outstanding evidence/reviews remain deferred; no full-feature
or WCAG conformance claim is made.

## Summary

Replace the legacy Worker transit boundary with direct browser GETs to the fixed
municipal JSP. Frontend infrastructure adapters and the schedule repository form
the logical backend-for-frontend: orchestration and validation execute in the
same browser application, with no Cloudflare Worker or other transit server.
Keep ports/domain isolated from source action names and Latin-1 envelopes;
normalize to OpenAPI 3.1 contract version 5.0.0. Local development and
production use the fixed JSP for seven general actions and four exact approved
candidate mappings; automated tests remain deterministic fixtures. Other
parameters remain fail-closed individually. No Worker fallback, alternate upstream,
hosted REST v5, or paid dependency.

Research verified actual Latin-1 catalog bytes, distinct municipal/arrival stop
IDs for one stop, observed schedule arrays with cross-line ambiguity, double-
encoded route geometry and trip-stop sequence fields. APK request-chain source
and independent `ttl`/`min` verification remain unverified but are waived from
this feature's G5 scope by the product owner (2026-10-28). Day meanings, source
schedule-ID resolution, formal CRS and full parity remain unverified G5 items.
See [research](research.md) and its evidence register.

## Technical Context

**Language/Version**: TypeScript 5.8, ES2022 browser modules; Node/npm tooling.

**Primary Dependencies**: Existing Vite 7, MapLibre GL JS 5, vite-plugin-pwa,
Vitest 3, Playwright, axe, Spectral, YAML and Ajv. No new runtime dependency;
native fetch/AbortController/URLSearchParams/TextDecoder. Preserve existing
map architecture; no reintroduction of deck.gl to the first-map dependency path.

**Storage**: Browser localStorage only for existing user state, through storage
adapter; bounded public-response caches in memory. Packaged discovery/schedule
assets remain explicitly labeled offline/migration data, not a live replacement.

**Testing**: Fixture-first unit/DOM/adapter/contract tests, Ajv 2020 normalized
schema tests, Spectral lint, and Playwright network isolation. Outstanding
accessibility validation is deferred to a future spec by product-owner decision;
the limited G5 closure does not claim WCAG conformance. No full app tests
required for this docs-only plan.

**Target Platform**: Mobile-first HTTPS static PWA, any permanently zero-cost
host. GitHub Pages supported, not required. Current code is a legacy release
until migration passes acceptance. No server runtime in target architecture.

**Project Type**: Existing vanilla TypeScript frontend PWA.

**Performance Goals**: Loading indicator <=1 s; total operation <=5 s including
read/decode/validation; healthy live arrivals >=19/20 <=5 s. Preserve existing
size limits and <=500 KiB gzip first-map-ready JS+CSS graph. Refresh selected
stop every 30 s only visible. Two concurrent requests, >=1 s between starts.

**Constraints**: 256 KiB raw/action, <=10,000 rows/positions, 128-char IDs and
2,048-char text; abort/cancel excess; no auto retries. Arrival memory LRU <=20
stops/512 KiB/300 s; catalog/service memory <=100 entries/4 MiB/24 h with
provenance. These are client budgets, not provider policy. WCAG 2.2 AA, >=44 px
targets, 320 CSS-pixel reflow, 200% zoom, keyboard/text-map alternatives.

**Scale/Scope**: Existing Map/Search/Lines/Saved, three UI locales, public
catalog/service/stop/arrivals/schedule/shape/trip/line-stop data. Eleven action
names, thirteen prior CORS parameter cases; no arbitrary enumeration or new UI
feature. Preserve saved stop and any legacy line identities without substitution.

## Constitution Check

*Evaluated before research and rechecked after proposed design.*

| Principle / gate | Before Phase 0 | After Phase 1 |
| --- | --- | --- |
| I browser-first | PASS: direct fixed JSP GET only; omit credentials | PASS design: no Worker fallback; production uses the supported action allowlist |
| II hexagonal | PASS: existing inward ports | PASS design: pure normalizers/domain freshness; infrastructure owns transport |
| III test-first | PASS: no implementation in this workflow | PASS plan: fixture/contract/UI tests before or alongside each change |
| IV local profiles | PASS: local-live development; deterministic test fixtures | PASS design: no Cloudflare account or backend in target workflow |
| V contract-first | PASS: v5 breaking proposal, historical v3/v4 preserved | PASS planning: valid OpenAPI, Architect/Backend/QA actual approval; provisional semantics may be exercised only with labeled fixture evaluation |
| VI zero-cost/privacy | PASS: free static HTTPS, localStorage user state | PASS design: no profile/precise location/cookies, locale only ES/GA action; no activity logs |
| VII simplicity/English | PASS | PASS: reuse native browser/tooling, documentation in English |
| UX/performance | Numeric budgets specified, criteria in spec | Baseline approved by UX/Frontend at G3; G5 evidence not claimed |
| Harness | G1 fdde5b1; G2 actual approvals recorded | G3 CLOSED with all actual re-approvals; G4 task gate CLOSED; G5 not executed; G6 separate |
| Release verification | Supported browser actions verified; unresolved schedule/geometry mappings remain unavailable | Open actor/source evidence records remain visible; unsupported actions stay fail-closed, never use a proxy fallback |

No constitutional exception requested. Planning with explicit unknown source
behavior is not release acceptance; provisional contracts may cause G3 to remain
CHANGES REQUESTED. Do not label unresolved provider semantics “verified.”

## Project Structure

### Documentation

```text
specs/004-vigo-jsp-transit-api/
├── spec.md
├── gate-g1-direct-jsp-amendment-review.md
├── gate-g2-spec-review.md
├── plan.md
├── research.md
├── source-evidence.md
├── data-model.md
├── design-baseline.md
├── contracts/
│   ├── municipal-transit-v5.openapi.yaml
│   ├── README.md
│   └── action-readiness.md
├── quickstart.md
├── gate-g3-plan-review.md
└── gate-g6-story-review.md
```

`tasks.md` is deliberately not produced by `/speckit-plan`.

### Existing source and proposed later changes (not implemented here)

```text
frontend/src/
├── domain/{types,freshness,day-type}.ts
├── application/{ports,select-stop,get-stop-arrivals,get-line-frequency}.ts
├── infrastructure/
│   ├── municipal/                 # fixed browser transport, BFF adapters and normalizers
│   ├── fixtures/                  # proposed sanitized byte fixtures and metadata
│   ├── arrivals/                  # replace legacy HTTP gateway behind port
│   ├── schedule/                  # browser BFF catalog/service and labeled bundled discovery
│   ├── storage/                   # preserve versioned localStorage adapter
│   ├── system/
│   └── map/
├── ui/{stop,line,map,search,home,panel}/
├── sw/
└── infrastructure/config.ts
frontend/tests/                    # existing unit/DOM/E2E organization
scripts/                          # existing schema, provenance, payload tooling
worker/                           # legacy only; remove after accepted direct release
.github/workflows/                # static frontend deployment; no transit Worker deploy
```

**Structure Decision:** Extend existing inward-facing ports; a small municipal
infrastructure module handles fixed source requests and normalizers. The BFF is
frontend code, not a separately deployed runtime. No backend folder/service,
abstract plugin framework, or alternate provider layer.

## Phase 0 — Research decisions

[research.md](research.md) records decisions, rationale, rejected alternatives
and OPEN R1–R8. [source-evidence.md](source-evidence.md) distinguishes actual
session probes from historical APK/browser reports. Missing local APK is not
proof that no artifact exists elsewhere. No source code or credentials copied.

## Phase 1 — Boundary and design

1. Fixed allowlist request builder rejects unknown host/action/keys and malformed
   identifiers before I/O, preserves opaque trip spaces, maps gl→GA and es/en→ES.
2. Browser adapter uses credentials omit, no referrer profile data, redirect
   rejection (`redirect: 'error'`), cors mode, one 5 s deadline; body streaming
   bounds before decode/parse. Unsupported content type/charset fails closed.
3. Pure action validators validate full payload and requested identity.
   Successful empty requires a valid envelope, not missing fields or HTTP 200.
   Shapes require nested JSON validation; fixture-only provisional output may
   apply the assumed CRS84 policy but must be labeled unverified.
4. Normalizers produce only schemas in v5. Source `metros`, optional image paths,
   unverified timestamps/ETA and APK-derived display strings are not exposed.
5. Application selection owns request tokens, day/locale cancellation, deadline,
   polling/coalescing, receipt age and failure-state precedence. UI consumes
   view models; no raw JSP fields or Worker headers.
6. Discovery uses labeled packaged seeds where no approved stop enumeration
   exists; JSP primary for verified online selected data. Do not synthesize a
   provider catalog version or source generation date.
7. Preserve identity mappings, favorites and recents in localStorage. **Replace
   the destructive stop-only favorites loader**, do not simply reuse it.
   Introduce lossless v2 saved-favorite persistence and a stop/legacy-line union
   as specified in `data-model.md`; retain v1 bytes unchanged until a validated
   v2 write succeeds, with no deletion or identity substitution. Unknown saved
   identities remain saved/unavailable with safe labels. Migrate Saved rendering
   as well as ports/types and replace tests that currently expect line deletion.
8. UX [baseline](design-baseline.md): inherited navigation/layout/tokens; explicit
   receipt, empty, stale, unavailable, offline and exact-day provenance;
   ordered textual route alternative. UX changes return to UX review;
   contract changes return to Architect with both developers.

### Compatibility and migration

[contracts/README.md](contracts/README.md) documents v4→v5 field/transport breaks.
Implement profile wiring and fixtures first, then verified action normalizers,
application models, UI and accessibility, then live evidence. Do not enable
unresolved schedule/line-stop/shape operations in live profiles by guessing.
Preserve old
snapshots; exact-day fallback requires trustworthy source/date. The transit Worker is not deployed or used by the frontend. Retire its remaining
migration-era runtime after release readiness and verify packaged assets contain
no worker URLs or credential-dependent path. Do not switch production early.

The [per-action readiness matrix](contracts/action-readiness.md) is normative:
fixtures cover all eleven action names; local development and production permit
the supported line/service catalogs, stop identity, serving-lines, and arrivals
actions. The schedule, shape, trip, and line-stop-detail operations remain
individually disabled in live profiles. Fixture-only provisional evaluation is
permitted under the amended spec; a reopened G5 review validates implementation
and labels without treating assumptions as provider facts. Synthetic fixtures
never count as provider-observation proof.

### Validation and release checkpoints

- Unit/contract fixtures for all actions, ID rejection/echoes, ISO-8859-1 decoding
  and sparse/null metadata, malformed/HTML/error/oversized/timeout/rate failures.
- Age boundaries 29,999/30,000/299,999/300,000 ms; stale-empty, offline expiration,
  future-clock receipts, coalescing, late-result drop and hidden-page polling.
- Ajv 2020 tests check every normalized operation and invalid cases; contract
  lint does not prove source semantics. Extend schema regression tooling later
  without altering historical v3/v4 assertions.
- Playwright: fixtures make zero municipal requests; local-live and production
  use the same seven-action allowlist and omit credentials/profile fields.
  Unsupported live actions remain unavailable without network requests;
  fixture-only provisional scenarios exercise their assumptions and labels
  without municipal traffic.
- Browser release corpus records every field required in FR-009; CORS headers
  require DevTools/automation capture where not exposed to page JS. Wildcard
  across actions is origin-independent; otherwise actual static host tested.
- Verify 20 stops/10 lines, timetable three-day coverage across supported lines,
  CRS/ordered trip fixtures and trusted snapshot provenance before release.
- G5 has a product-owner-approved limited-scope closure for the seven supported
  production actions. Actual actor verdicts and deferred evidence are recorded
  separately; deferred work is not represented as a pass or approval. No test
  claim is inferred from plans.

## Work breakdown status

- [x] Confirm governance commit and Spec Kit paths/template; no extensions file.
- [x] G2 real reviews, conservative clarification fixes and re-approvals.
- [x] Bounded evidence research and explicit unresolved-source register.
- [x] Plan/data/design/contract/quickstart proposals.
- [x] G3 closure: actual required verdicts, bounded fixes and explicit re-approvals recorded.
- [x] G6 specification/plan drafts and actual Communicator approvals recorded.
- [x] Documentation/schema validation and final after_plan hook check; see G3 final verification.
- [x] G4 task review with required QA, UX, and Frontend approvals; verdicts recorded in `gate-g4-task-review.md`.
- [ ] Production R1–R8, G5 and implementation — outside this planning workflow.

## Complexity Tracking

No constitutional violation or complexity exception. Provisional source
operations are restricted to deterministic fixture evaluation, not resolved
with more infrastructure or enabled in live profiles.
