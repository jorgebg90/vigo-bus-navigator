# Implementation Plan: Vigo Bus Real-Time API

**Branch**: `002-realtime-bus-api` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-realtime-bus-api/spec.md` (fresh G2 approved for SC-014–SC-016)

## Summary

Keep the v3.0.0 browser-facing API and official generated catalog unchanged while replacing the live-arrivals source adapter with the owner-selected Vitrasa InfoBus WebForms page (research D1). The existing Cloudflare Worker will validate the stop ID, perform bounded sequential pagination, fail closed on malformed present rows, and only cache complete results under the specified 30 s fresh / 300 s maximum stale policy. Actual EdgeCache expiry/retention remains best-effort and requires G5 runtime verification. Local runs use deterministic HTML/WebForms fixtures; no user profile data or source session state is persisted. The frontend gateway contract remains unchanged, while stop lookup uses nullable `vitrasaId`, skips requests when absent, pauses polling in background, and displays localized privacy disclosure. VigoBusAPI-derived normalization remains attributed.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ES2022, native ES modules

**Primary Dependencies**: Cloudflare Workers runtime (`workerd`/`wrangler` dev-only), built-in `HTMLRewriter` for validated WebForms table extraction (no additional runtime parser dependency); frontend reuses Vite/Vitest/Playwright with `@axe-core/playwright` for automated WCAG checks (dev-only); Spectral + ajv for OpenAPI lint/contract validation (dev-only)

**Storage**: none beyond the Cloudflare Cache API (30 s TTL, stale-on-failure revalidation); no KV, no Durable Objects, no MongoDB (research D3/D4)

**Testing**: Root Vitest Node configuration runs frontend, scripts, and pure Worker normalization tests from `worker/unit`; it excludes `worker/test` from both `test` and coverage. `worker/vitest.config.ts` runs Worker/runtime tests with `@cloudflare/vitest-pool-workers`, and `test:contract`/CI invoke that config separately so `HTMLRewriter` runs in workerd. `worker/vitest.load.config.ts` isolates the 60-second fixture-only benchmark for `test:load`; it prints and asserts p95 latency without source calls. Tests assert ages 29/30 and 299/300 seconds, protocol/body limits, and contract schema invariants. Frontend tests assert full privacy copy in all locales, no request without `vitrasaId`, visibility-aware polling, and accessibility. An opt-in G5 smoke uses a temporary remote development Worker and actual Cloudflare Cache API; requires credentials, waits for real TTLs, and is not part of local CI.

**Target Platform**: Cloudflare Workers (production), `wrangler dev --local` (local/development); evergreen browsers for the frontend consumer

**Project Type**: web application (PWA frontend + single-purpose edge Worker)

**Performance Goals**: Fixture-only load test at 10 rps / 60 s with p95 ≤ 3 s and no live-source load; healthy-source p95 remains an operational target, not a Vitrasa guarantee; one 8 s aggregate deadline across sequential pages, response reads, and parsing; maximum 10 pages, 128 KiB per response, 1 MiB aggregate response bodies, 100 route rows, 32-character line codes, and 256-character destinations; Worker stays within the ≤100k req/day free tier

**Constraints**: CORS `Access-Control-Allow-Origin: *` on every response (constitution VI, FR-008); fixed HTTPS source URL only, ASCII numeric stop ID `^[0-9]{1,6}$`, exact `#lblParada` match, redirects rejected, no caller-header forwarding or source-selected action URL; source cookies/form state are lookup-scoped and never logged/persisted/cached/returned; cache only complete normalized results; no user profile/activity data; stale data never labeled current (SC-007); WCAG 2.2 AA; all artifacts in English; Apache-2.0 attribution per research D8

**Scale/Scope**: Existing 5-route Worker and official catalog remain; arrivals source adapter changes behind `/stops/{stopCode}/arrivals`; OpenAPI API version and browser schema remain v3.0.0; HTML page-count cap 10; fixtures cover valid 5/5/2 pagination, empty, stop-not-exist, malformed/invalid rows, later-page failure, redirect, timeout, and page-budget overflow. Frontend changes are limited to explicit nullable Vitrasa-ID handling and privacy disclosure.

**Payload Budget**: Gzip-compressed aggregate generated JavaScript ≤850 KiB
and CSS ≤150 KiB. Keep existing per-file `size-limit` caps: entry JavaScript
150 KiB, MapLibre and deck.gl chunks 350 KiB each, and CSS 150 KiB. T063 will
add a Node checker to `npm run size` for aggregate gzip limits; until T063 is
implemented, that command enforces only existing per-file limits from
`.size-limit.json`. The initial entry JavaScript plus CSS is therefore capped
at 300 KiB compressed; lazy map chunks remain separate. Changed UI keeps
WCAG 2.2 AA contrast, keyboard focus, live-region status announcements, and
≥44×44 CSS-pixel interactive targets.

**Environment profiles** (Principle IV):

| Profile | Arrivals base URL | Upstream | Use |
| --- | --- | --- | --- |
| `local` / development | `http://localhost:8787` | deterministic fixtures by default; live Vitrasa requires explicit development override | `wrangler dev --local` from repo |
| `preview` | configured preview Worker URL | fixed Vitrasa URL; fixture responses are rejected | preview frontend / smoke tests |
| `production` | configured production Worker URL | fixed Vitrasa URL; fixture responses are rejected | GitHub Pages frontend |

Local configuration defaults to `DEPLOYMENT_ENV=development` and
`UPSTREAM_FIXTURES=true`, so repository validation requires no network. To test
against Vitrasa explicitly, use Wrangler overrides
`npm run dev:worker -- --var DEPLOYMENT_ENV:development --var
UPSTREAM_FIXTURES:false`. Deploy the live preview Worker with
`npx wrangler deploy --cwd worker --env preview`, then build the preview
frontend with `VITE_PROFILE=preview` and
`VITE_ARRIVALS_BASE_URL=https://<preview-worker>.<account>.workers.dev` and
serve it using `npm run preview`. Production uses its separate named Wrangler
environment and existing deploy workflow. Preview/production reject fixture
mode; the source URL is not a binding.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Ratified v1.3.0 allows only the existing Worker to adapt the owner-selected fixed Vitrasa page |
| II. Modular Hexagonal Architecture | PASS | Frontend `ArrivalsGateway` port unchanged apart from additive `dataStatus`; upstream access isolated in the Worker adapter; ported normalization is a pure module, unit-testable without network |
| III. Test-First (NON-NEGOTIABLE) | PASS | Worker parser/protocol, Node-pure normalizer, frontend/privacy/accessibility, load, payload, and contract regression tests T046–T055 precede implementation tasks T056–T064; G4 verifies ordering |
| IV. Local Testability & Profiles | PASS | `wrangler dev --local` defaults to fixtures with no network; explicit live-development override and named preview/production environments use the same contract |
| V. Contract-First APIs with OpenAPI | PASS | The current v3.0.0 contract defines `/lines`, `/lines/{lineCode}`, `/stops`, and `/stops/{stopCode}/arrivals`; only the Worker-internal source changes |
| VI. Zero-Cost Serverless & Privacy | PASS | Ratified v1.3.0 limits source disclosure to the selected stop ID and transient lookup state; Cache API only, bounded response sizes, no account/profile data |
| VII. Clean Code, Simplicity & English | PASS | No Worker framework or added runtime parser dependency; built-in `HTMLRewriter` has a small source-specific extraction surface; artifacts in English |
| Hard constraint: WCAG 2.2 AA | PASS | Localized privacy/freshness states, keyboard/focus, live-region, contrast, and 44×44 target checks are assigned before implementation; G5 verifies |
| Hard constraint: mobile-first budget | PASS | SC-015 sets aggregate gzip ceilings; existing per-file caps are active, and T054 adds aggregate enforcement to `npm run size` before implementation is complete |

**Post-design re-evaluation**: G1 is closed and the v1.3.0 amendment is ratified. Fresh G2 approval covers SC-014–SC-016; fresh G3 approval is recorded from Software Architect and Backend Developer; fresh G4 approval is recorded from QA Tester. T045–T064 are implemented and locally validated. T065's named preview configuration and local build are implemented; remote preview deployment/smoke remains credential-gated. T066's actual EdgeCache smoke and G5 evidence remain pending Cloudflare credentials.

**Gate status for this source change**: G1 ratified v1.3.0 from the last evidenced v1.2.1 baseline; G2 is freshly approved by Stakeholder and QA, including SC-014–SC-016; G3 is freshly approved by Software Architect and Backend Developer; G4 is freshly approved by QA Tester. T045–T064 passed their local gates; T065 remote preview smoke and T066 EdgeCache verification remain pending. The prior G3 approval covered the JSON adapter and does not approve this WebForms plan.

## Project Structure

### Documentation (this feature)

```text
specs/002-realtime-bus-api/
├── spec.md                              # source-change G2 approved
├── plan.md                              # This file
├── research.md                          # Phase 0: decisions D1–D12
├── data-model.md                        # Phase 1: entities, states, validation
├── quickstart.md                        # Phase 1: validation scenarios VS1–VS9
├── contracts/
│   └── realtime-arrivals.openapi.yaml   # OpenAPI 3.1 contract v3.0.0
├── checklists/requirements.md           # Spec quality checklist (all pass)
├── gate-g2-spec-review.md               # G2 record
└── tasks.md                             # Phase 2 output; source-change G4 review pending
```

### Source Code (repository root)

```text
worker/                                # Cloudflare Worker (existing workspace, reworked)
├── src/
│   ├── index.ts                       # fetch handler: routing, CORS, validation, stale-on-failure
│   ├── upstream.ts                    # fixed Vitrasa WebForms client, pagination, aggregate deadline
│   ├── source-html.ts                 # Workers-only HTMLRewriter extraction
│   ├── normalize.ts                   # pure source-row-to-contract mapping; Node-testable
│   ├── cache.ts                       # fresh + last-known Cache API entries (D4), x-edge-stored-at
│   ├── fixtures.ts                    # UPSTREAM_FIXTURES mode: paginated HTML and failure fixtures
│   └── env.ts                         # typed fixture/fault environment; source URL is not configurable
├── test/                              # Cloudflare runtime/contract tests (FR-014 matrix, Workers pool)
├── unit/                              # pure normalization tests under root Node Vitest
├── vitest.config.ts                   # dedicated Cloudflare Workers test-pool config
├── package.json                       # adds wrangler + @cloudflare/vitest-pool-workers devDependencies
└── wrangler.toml                      # name and fixture-mode variables; fixed source is code-owned

frontend/
├── src/
│   ├── application/get-stop-arrivals.ts   # passes nullable Stop.vitrasaId; no request when absent
│   ├── infrastructure/config.ts           # local/preview/production Worker URL selection
│   ├── ui/stop/                           # freshness states and localized privacy disclosure
│   └── i18n/{es,gl,en}.ts                 # status and privacy copy parity
└── tests/e2e/                           # stop freshness + map correctness scenarios

scripts/snapshot/                      # extended: Vigo bounding-box coordinate validation (FR-019)
scripts/check-payload-budget.ts        # T063: aggregate gzip limits for generated JS and CSS
scripts/check-payload-budget.test.ts   # T054: boundary tests for aggregate payload limits

package.json                           # `dev:worker`, test profiles, aggregate `size`, and OpenAPI validation scripts
NOTICE                                 # "based on the code of VigoBusAPI" attribution (research D8)
LICENSE                                # Apache-2.0 text incl. retained VigoBusAPI copyright
```

**Structure Decision**: extend the existing two-workspace layout (`frontend/` + `worker/`). `worker/src/source-html.ts` uses `HTMLRewriter` to extract validated rows; `worker/src/normalize.ts` remains pure and independently Node-testable. A dedicated Worker Vitest config runs parser/protocol tests in workerd. Preview deploys as the named live Worker environment; its frontend profile receives the preview Worker URL at build time. The existing JSON-specific `parseEstimaciones` and line-letter splitting are replaced for live arrivals.

## Complexity Tracking

No constitution violations — table intentionally empty.
