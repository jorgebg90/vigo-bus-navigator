# Implementation Plan: Vigo Bus Frequency PWA

**Branch**: `001-bus-frequency-pwa` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-bus-frequency-pwa/spec.md` (G2-approved)

## Summary

Build the Vigo Bus Navigator v1: a pure-frontend PWA (TypeScript, hexagonal
ports & adapters) deployed to GitHub Pages, showing bus line frequencies by
day type (P1), live stop arrivals via a Cloudflare Worker REST→SOAP edge proxy
declared OpenAPI-first (P2), an accessible lazy-loaded map (P3), device-only
favorites in versioned `localStorage` envelopes (P4), offline repeat visits via
Workbox precache (P5), and a trilingual ES/GL/EN UI (P6). Research decisions
D1–D8 in [research.md](research.md) resolve all technical unknowns.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ES2022 target, native ES modules

**Primary Dependencies**: Vite 7 + vite-plugin-pwa (Workbox generateSW);
MapLibre GL JS + deck.gl (lazy chunk); Vitest (+happy-dom, v8 coverage);
Playwright (single offline smoke test); fast-xml-parser (Worker only);
Spectral + ajv (OpenAPI lint/contract tests, dev-only)

**Storage**: bundled versioned JSON snapshot (`public/data/`, SW-precached) for
schedules; `localStorage` namespaced versioned envelopes (`vbn:v1:*`) for
favorites/preferences; SW Cache API runtime entry for live arrivals

**Testing**: Vitest (node env for domain/application — no browser/network/
localStorage; happy-dom for UI/adapter unit tests); miniflare/workerd contract
tests for the Worker against the OpenAPI schema; one Playwright offline spec

**Target Platform**: evergreen mobile + desktop browsers (PWA), static hosting
on GitHub Pages; Cloudflare Workers for the sole edge proxy

**Project Type**: web application (PWA frontend + single-purpose edge Worker)

**Performance Goals**: SC-002 <3s interactive on mid-range phone/4G; initial
JS+CSS ≤ **500 KB gz** (shell ≤ 150 KB + lazy map chunk ≤ 350 KB; tiles and
JSON snapshot excluded) — sized to the mandated stack's real weights
(MapLibre ~200–230 KB gz + treeshaken deck.gl/luma ~100–150 KB gz, D3);
live arrivals freshness ≤ 60s (SC-008): stop view refreshes every **30s,
visible-only**, edge TTL 30s with deterministic `x-edge-stored-at` stamping

**Constraints**: WCAG 2.2 AA (semantic markup, keyboard, screen reader,
contrast, ≥44px touch targets); offline-capable (SW precache of shell +
snapshot); refresh paused when hidden (`visibilitychange`); zero-cost free
tiers (Workers ≤100k req/day); all user data device-local; UI in ES/GL/EN;
artifacts in English

**Scale/Scope**: ~40 bus lines, ~1.5k stops (Vigo urban network), 6 user
stories, 1 REST endpoint, 3 UI locales, 2 deploy targets (Pages, Worker)

**Environment profiles** (Principle IV):

| Profile | Schedule data | Live arrivals | SW | Use |
| --- | --- | --- | --- | --- |
| `local` (default) | bundled fixtures | mocked proxy fixtures | disabled | dev + all tests |
| `production` | bundled snapshot | edge proxy URL | enabled | GitHub Pages |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Evidence |
| --- | --- | --- |
| I. Browser-First Frontend | PASS | Static PWA on Pages; sole server-side component is the sanctioned Cloudflare Worker (REST↔SOAP + CORS) |
| II. Modular Hexagonal Architecture | PASS | Ports defined in [contracts/internal-ports.md](contracts/internal-ports.md); adapters (fetch snapshot, HTTP arrivals, localStorage, MapLibre, SW) depend inward; domain imports nothing |
| III. Test-First (NON-NEGOTIABLE) | PASS | Vitest node-env for domain/application with ports mocked (D2); coverage non-regression in CI; G4 gate will verify task-level testability |
| IV. Local Testability & Profiles | PASS | `local`/`production` profiles; fixtures for snapshot and proxy; SW disabled locally; no credentials anywhere local |
| V. Contract-First OpenAPI | PASS | [contracts/stop-arrivals.openapi.yaml](contracts/stop-arrivals.openapi.yaml) written before implementation; Spectral lint + miniflare contract tests; internal ports documented |
| VI. Zero-Cost Serverless & Privacy | PASS | GitHub Pages + Workers free tier (≤100k req/day, 30s edge cache), CartoDB tiles, MapLibre + deck.gl (v1.2.0), localStorage-only user data, no accounts/analytics |
| VII. Clean Code & English | PASS | YAGNI rulings recorded per research decision (toolchain capped, zero-dep i18n, single-route Worker without framework); all artifacts in English |
| Hard constraint: WCAG 2.2 AA | PASS | Budgeted into plan (SC-004, MapPort theme contract, `lang` switching); G5 verifies live-region behavior of the auto-refreshing stop view |
| Hard constraint: mobile-first budget | PASS | **Numeric budget set at this gate**: ≤500 KB gz initial JS+CSS (shell ≤150 KB, map chunk ≤350 KB — matches D3's cited library weights), size-limit per-chunk in CI (D3) |

**Post-design re-evaluation**: all gates PASS. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-bus-frequency-pwa/
├── plan.md                          # This file
├── research.md                      # Phase 0: decisions D1–D8
├── data-model.md                    # Phase 1: entities, validation, storage mapping
├── quickstart.md                    # Phase 1: runnable validation scenarios VS1–VS6
├── contracts/
│   ├── stop-arrivals.openapi.yaml   # OpenAPI 3.1 contract (edge proxy endpoint)
│   └── internal-ports.md            # Hexagonal port contracts
├── checklists/requirements.md       # Spec quality checklist (all pass)
├── gate-g2-spec-review.md           # G2 record
└── tasks.md                         # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
frontend/                            # PWA deployed to GitHub Pages (Vite root)
├── index.html
├── vite.config.ts                   # base path, manualChunks, vite-plugin-pwa
├── public/
│   ├── data/                        # bundled schedule snapshot (D5)
│   │   ├── manifest.json
│   │   ├── stops.json
│   │   └── lines/{lineId}.json
│   └── icons/                       # PWA icons
├── src/
│   ├── domain/                      # pure: Line, Stop, Timetable, DayType,
│   │   │                            # TimeBand, Arrival, Favorite, Preferences
│   │   ├── day-type.ts              # date + holiday calendar → DayType
│   │   └── frequency.ts             # band lookups, first/last, no-service
│   ├── application/                 # use cases (orchestrate ports)
│   │   ├── get-line-frequency.ts
│   │   ├── get-stop-arrivals.ts     # live → scheduled fallback (FR-017)
│   │   ├── toggle-favorite.ts
│   │   └── ports.ts                 # canonical TypeScript port definitions; contracts/internal-ports.md documents them
│   ├── infrastructure/
│   │   ├── schedule/                # ScheduleRepository: bundled fetch adapter
│   │   ├── arrivals/                # ArrivalsGateway: edge-proxy HTTP adapter
│   │   ├── storage/                 # StoragePort: localStorage envelopes (D6)
│   │   ├── map/                     # MapPort: MapLibre GL JS + deck.gl adapter
│   │   ├── system/                  # ClockPort, VisibilityPort adapters
│   │   └── fixtures/                # local profile fakes (schedule + arrivals)
│   ├── i18n/                        # es.ts (canonical), gl.ts, en.ts (D8)
│   ├── ui/                          # views/components (framework-free DOM)
│   │   ├── home/                    # catalog, search, favorites section
│   │   ├── line/                    # frequency table, day-type switcher
│   │   ├── stop/                    # live arrivals, auto-refresh, live region
│   │   ├── map/                     # map view (lazy entry point)
│   │   └── settings/                # theme + language
│   ├── sw/                          # Workbox config glue (pure decisions tested)
│   └── main.ts                      # composition root (wire adapters to ports)
└── tests/
    ├── unit/                        # Vitest node env (domain/application)
    ├── dom/                         # Vitest happy-dom (UI, adapters)
    └── e2e/                         # Playwright: offline smoke test

worker/                              # Cloudflare Worker (separate deploy)
├── src/
│   ├── index.ts                     # fetch handler: gate, validate, cache
│   ├── soap.ts                      # envelope template + XML escape
│   └── parse.ts                     # fast-xml-parser mapping (isArray guard)
├── wrangler.toml                    # route/env config (no secrets committed)
└── test/
    └── contract.test.ts             # miniflare: responses match OpenAPI schema

scripts/snapshot/                    # FR-015 documented update pipeline
├── source/                          # canonical human-readable data (per-line CSV/JSON)
├── generate.ts                      # canonical source → minified public/data/** snapshot
└── README.md                        # regeneration procedure + validity dates policy

.github/workflows/
├── ci.yml                           # lint, typecheck, unit/dom/contract tests,
│                                    # i18n key parity, size-limit (hard gate)
└── deploy.yml                       # main → Pages (frontend) + Cloudflare (worker)
```

**Structure Decision**: two top-level deploy units (`frontend/`, `worker/`)
matching the constitution's architecture (Pages + single edge proxy). The
frontend follows hexagonal layering with the composition root in `main.ts`;
infrastructure adapters are interchangeable per environment profile via
`import.meta.env`. Map code is isolated behind `MapPort` and loaded as a lazy
chunk (D3).

## Complexity Tracking

> No constitutional violations — this section is intentionally empty.
> Notable justified trade-offs are recorded as research decisions: build step
> via Vite (D1, TS is mandatory), two dev-only schema tools (D7, OpenAPI
> verification), fast-xml-parser as the Worker's sole runtime dependency (D7).

