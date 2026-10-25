# Phase 0 — Research: Vigo Bus Frequency PWA

- **Date**: 2026-10-25
- **Feature**: [spec.md](spec.md) | **Constitution**: v1.2.1
- **Scope**: resolve all Technical Context unknowns before design.

## D1. Build & dev tooling

- **Decision**: **Vite** (vanilla-ts template, minimal config <50 lines),
  `base: '/<repo>/'` for GitHub Pages, `dist/` deployed via a GitHub Actions
  static Pages workflow. Toolchain capped at Vite + vite-plugin-pwa + Vitest —
  no other plugins.
- **Rationale**: TypeScript is constitutionally fixed and browsers don't execute
  TS — a compile step is unavoidable; "zero-build" would mean more hand-rolled
  tooling, not less. One dependency covers dev server (esbuild, native ESM),
  production build (Rollup minification + `manualChunks` to split the map
  engine), Service Worker generation, and test integration. Output is plain
  static files → zero adaptation for Pages.
- **Alternatives considered**: zero-build native ESM (rejected: incompatible
  with TS, no minification, hand-written SW versioning); esbuild-only scripts
  (DIY dev server/SW/budget wiring); webpack/Rollup directly (more config for
  identical output).
- **Constraint notes**: environment profiles (Principle IV) map to
  `import.meta.env` modes: `local` (fixtures, mocked proxy) vs `production`
  (edge proxy URL).

## D2. Testing stack

- **Decision**: **Vitest** — `node` environment for domain/application layers,
  `happy-dom` for infrastructure/UI unit tests, plus exactly **one Playwright
  offline smoke test** for the Service Worker. Run identically locally and in
  GitHub Actions (`vitest run --coverage`, v8 coverage).
- **Rationale**: same transform pipeline as Vite (zero duplicate config),
  first-class TS/ESM, per-file environment switching
  (`// @vitest-environment node`) — domain tests run in pure node with ports
  mocked, satisfying Principle III "no browser, network, or localStorage" by
  construction. localStorage adapters are tested against a hand-rolled
  in-memory `Storage` fake (deterministic; exercises namespacing, versioning,
  migrations) plus one thin smoke test against real `localStorage`. Workbox
  internals are never unit-tested; own precache/versioning decisions are
  extracted as pure functions and tested in node.
- **Alternatives considered**: Web Test Runner (rejected for unit scope:
  real-browser cost/flakiness; real-browser coverage lives at the Playwright
  layer); `node:test` (weaker TS/mocking/coverage DX); jsdom everywhere
  (happy-dom is faster and sufficient; switch per-file if a gap appears, YAGNI).
- **Constraint notes**: all tests run in CI with no secrets (Principles IV/VI).

## D3. Payload budget (constitution: "numeric budgets set at the plan gate")

- **Decision**: **≤ 400 KB initial JS+CSS gzipped**, structured as
  **shell ≤ 150 KB** + **lazy map chunk ≤ 250 KB** (dynamic `import()` with
  idle-time prefetch). Excluded from the budget: map tiles (network-cached)
  and the bundled JSON snapshot (SW precache, not JS). Enforced per-chunk by
  **size-limit** (`@size-limit/file`) as a hard CI gate on PRs; Lighthouse CI
  (LCP/TBT) as a secondary runtime backstop. `rollup-plugin-visualizer` stays
  a manual diagnostic.
- **Rationale**: MapLibre (~200–230 KB gz) + treeshaken deck.gl/luma
  (~100–150 KB gz) physically cannot fit a strict eager budget — the map MUST
  lazy-load on map-view entry; what the user feels at first paint is the
  ≤150 KB shell. 400 KB gz all-in is the defensible floor for the mandated
  stack while keeping SC-002 (<3s interactive, mid-range phone, 4G) credible.
- **Alternatives considered**: bundlesize (unmaintained); Lighthouse CI alone
  (lab variance makes it a poor hard gate); flat 250 KB budget (unachievable
  with the mandated stack — would force constant exceptions).
- **Constraint notes**: closes the G2 watch item and the constitution v1.2.0
  deck.gl payload note. Measured gzipped; exclusions stated for auditability.

## D4. Service Worker strategy

- **Decision**: **Workbox `generateSW` via vite-plugin-pwa**: precache app
  shell + bundled versioned JSON snapshot (content-hash revisioning = atomic
  versioned cache updates), one `runtimeCaching` entry for the edge proxy
  (`NetworkFirst` with short timeout — live arrivals must not serve stale
  beyond the 30s edge TTL), `registerType: 'autoUpdate'`. SW disabled in the
  `local` dev profile so fixtures aren't masked by stale caches.
- **Rationale**: offline shell + versioned snapshot + cache cleanup on deploy
  is precisely the precache-manifest problem Workbox solves; hand-writing it
  means re-implementing revisioning and cache pruning — bug-prone boilerplate
  against Principle VII. Escape hatch: migrate to `injectManifest` if custom
  fetch logic is ever needed.
- **Alternatives considered**: hand-written SW (rejected); `injectManifest`
  from day one (complexity before need); no SW (violates the offline hard
  constraint).

## D5. Bundled schedule snapshot format (FR-015)

- **Decision**: **plain JSON, code-split into manifest + per-line files** with
  a shared stops dictionary; no custom binary format.

  ```text
  public/data/
  ├── manifest.json        # datasetVersion, validFrom, generatedAt, per-line {file, size, sha}
  ├── stops.json           # id → {name, lat, lon}; coords rounded to 5 decimals
  └── lines/{lineId}.json  # timetable by day type, referencing stop ids
  ```

  Boot payload: manifest + stops + line index; timetables lazy-loaded per line
  on demand. Free size reductions: minified output, array-based records, times
  as seconds-since-midnight, day-type enum codes, coordinate rounding, stop
  deduplication. Versioning via `datasetVersion` + validity dates; content-
  hashed filenames for clean SW cache-busting. A documented generation script
  emits the minified snapshot from a human-readable canonical source kept in
  the repo (diff-friendly per line).
- **Rationale**: JSON is browsable in devtools, parseable with zero
  dependencies, compresses ~5–10× over the wire, and works offline via the SW
  cache. `JSON.parse` beats any JS-level binary decoder at this scale.
- **Alternatives considered**: single monolithic JSON (no lazy loading —
  rejected); MessagePack/Protobuf (~20–40% smaller but schema + decoder
  dependency + opaque diffs — rejected); pre-compressed `.gz` +
  `DecompressionStream` (redundant — CDN already gzips; SW caches the
  decompressed response).

## D6. LocalStorage persistence adapter (FR-008, FR-012)

- **Decision**: a **`StoragePort` interface** with a versioned-envelope JSON
  document per namespaced key.
  - **Namespacing**: `vbn:v1:favorites`, `vbn:v1:prefs` — app prefix avoids
    collisions; schema-version segment makes stale schemas detectable at the
    key level; one key per aggregate keeps writes atomic per domain.
  - **Envelope + migrations**: every value is `{ v: 1, data: … }`. On load,
    `v < current` runs the ordered pure migration chain; `v > current`
    (downgrade) reads defaults and never overwrites. Only migration code may
    touch old shapes.
  - **Quota-safe writes**: try/catch around `setItem`, detect
    `QuotaExceededError` (by `name`, legacy code 22 for old Safari); on failure
    swap to a session-only `MemoryAdapter`, expose `persisted: false`, surface
    a subtle UI notice. Debounce writes (serialize once per tick).
  - **Corruption detection**: `JSON.parse` in try/catch + structural envelope
    validation; on failure, best-effort backup of the raw string to a
    `.corrupt` key, reset to defaults, console-log (no telemetry).
  - **Size**: favorites + prefs are KB-scale vs the ~5–10 MB quota; plain JSON
    with readable keys is fine. The schedule snapshot and live arrivals never
    live here — they belong to the SW Cache API.
- **Rationale**: fits hexagonal architecture (domain depends on `StoragePort`,
  not on `localStorage`), test-first friendly (migrations/guards are pure
  functions), degrades gracefully instead of crashing (FR-012).
- **Alternatives considered**: single state key (one bad write corrupts
  everything); localForage/IndexedDB (async complexity for KB-scale data —
  YAGNI); no version envelope (first schema change would silently brick state).

## D7. Cloudflare Worker REST→SOAP proxy (FR-016/017/018)

- **Decision**: **one zero-dependency `fetch` handler** with manual URL
  parsing, string-template SOAP envelope, **fast-xml-parser** (sole runtime
  dependency — pure JS, V8-isolate compatible) for XML→JSON, `caches.default`
  with deterministic 30s TTL, `AbortSignal.timeout(6000)` upstream, and an
  **OpenAPI 3.1** contract in `contracts/`, linted in CI (Spectral, dev-only)
  and verified by contract tests in **miniflare/workerd** asserting responses
  against the schema (ajv).
  - Method gate GET-only (405); `stop_id` validated against `^\d{1,6}$` (400).
  - SOAP envelope: template literal + XML-escape helper; `Content-Type:
    text/xml; charset=utf-8`; `SOAPAction` per the legacy WSDL.
  - Parsing options: `ignoreAttributes: true`, `parseTagValue: false`,
    `isArray` callback for the arrivals node (SOAP returns a single arrival as
    an object, not a one-element array — classic cardinality trap).
  - Caching: `caches.default` keyed on the normalized URL; `cache.match` first;
    on miss, fetch upstream and `ctx.waitUntil(cache.put(...))` with
    `Cache-Control: public, max-age=30` **plus** an `x-edge-stored-at` header
    validated on match (Cache API heuristics vary — age-stamping makes the TTL
    deterministic and testable). CORS headers applied before caching so cached
    and fresh paths are identical.
  - Error mapping (uniform body `{ error: { code, message } }`):
    `400 VALIDATION_ERROR`, `502 UPSTREAM_ERROR` (legacy non-200 / sanitized
    SOAP Fault), `502 UPSTREAM_UNPARSEABLE`, `504 UPSTREAM_TIMEOUT`;
    `200 { "arrivals": [] }` means no upcoming buses — not an error.
- **Rationale**: a single-purpose Worker doesn't justify a framework;
  age-stamping gives the test hook for the 30s TTL and free-tier headroom
  watch items.
- **Alternatives considered**: regex extraction (fragile against namespaces/
  CDATA/cardinality); itty-router/Hono (overhead for one route — YAGNI);
  sax-wasm streaming (KB-scale responses don't need it); Cache-Control alone
  (TTL not guaranteed on match — kept as belt-and-braces).

## D8. i18n approach (FR-014, US6)

- **Decision**: **zero-dependency typed message catalogs** (TS objects with
  `satisfies`) + `Intl` APIs, CI completeness via `tsc --noEmit` + a
  key-parity script.

  ```text
  src/i18n/
  ├── es.ts   # canonical; type Messages = typeof es
  ├── gl.ts   # satisfies Messages
  └── en.ts   # satisfies Messages
  ```

  `satisfies` makes missing/extra keys in GL/EN compile-time errors. Runtime:
  ~20-line lookup with fallback chains `gl→es`, `en→es`; `{name}` token
  interpolation; plurals via explicit `_one`/`_other` keys +
  `Intl.PluralRules`; dates/numbers via `Intl.DateTimeFormat`/
  `Intl.NumberFormat`. Switching sets `document.documentElement.lang` (WCAG)
  and persists to `vbn:v1:prefs`. Initial detection: `navigator.language`
  prefix match, default `es`. The key-parity script (flatten catalogs, assert
  identical key sets, no empty strings) closes the G4 translation-completeness
  watch item.
- **Rationale**: three locales with a small message surface don't earn a
  framework; platform APIs + types fit Principles VI/VII.
- **Alternatives considered**: typesafe-i18n (codegen watcher — disproportionate
  for 3 locales); Lingui (right choice if external translators arrive —
  documented migration path); i18next (async catalog loading for no gain).

## Environment profiles (Principle IV)

| Profile | Schedule data | Live arrivals | Service Worker | Usage |
| --- | --- | --- | --- | --- |
| `local` (default) | bundled fixtures | mocked proxy fixtures | disabled | dev + tests, zero credentials |
| `production` | bundled snapshot | edge proxy URL | enabled | GitHub Pages deployment |

All NEEDS CLARIFICATION items from the Technical Context are resolved.
