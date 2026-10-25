# Gate G3 — Plan Review Record

- **Phase**: Plan
- **Date**: 2026-10-25
- **Artifacts under review**: [plan.md](plan.md), [research.md](research.md),
  [data-model.md](data-model.md), [contracts/](contracts/)
- **Governing document**: constitution v1.2.1
- **Required verdicts**: Software Architect, Backend Developer
- **Outcome**: **CLOSED — PLAN APPROVED**

## Round 1

### Software Architect Verdict — plan — 2026-10-25 (round 1)

- Verdict: CHANGES REQUESTED
- Findings:
  - ✅ Hexagonal boundaries are real: six explicit driven ports
    (ScheduleRepository, ArrivalsGateway, StoragePort, ClockPort,
    VisibilityPort, MapPort), strictly inward dependency rule, pure domain
    entities, composition root in `main.ts`, node-env domain tests with mocked
    ports. Advisory: pin the canonical TS location of the ports module at
    tasks (`application/ports.ts` vs `contracts/internal-ports.ts`).
  - ✅ Pure-frontend Pages architecture honored; Worker is the sole sanctioned
    server-side exception. Module boundaries match the charter (acquisition /
    domain / presentation / persistence).
  - ⚠️ OpenAPI contract-first largely honored, but D7's decided 405 method
    gate was absent from the contract (no 405 response, no
    `METHOD_NOT_ALLOWED` in the error enum) — Worker behavior and contract
    would diverge on day one.
  - ❌ Payload budget internally inconsistent: D3 cites ~300–380 KB gz for the
    mandated MapLibre + deck.gl stack, yet capped the lazy map chunk at
    ≤250 KB — unachievable per the research's own estimates; would force the
    "constant exceptions" D3 itself rejects.
  - ⚠️ G2 watch item #1 (FR-001 search semantics) silently dropped — deferral
    acceptable only with an explicit note.
  - ⚠️ G2 watch item #4 (100k req/day headroom) not numerically resolved: no
    refresh interval pinned, no requests/day math; `caches.default` hits still
    consume Worker invocations — the 30s TTL protects the origin, not the
    quota.
  - ✅ G2 watch item #3 (client cache vs 30s edge TTL) reconciled via
    `NetworkFirst` + age-stamping; ≤60s freshness (SC-008) holds with a
    ≤30s refresh interval.
  - ✅ Environment profiles implement Principle IV concretely. YAGNI
    discipline strong across D1/D4/D6/D7/D8.
- Required actions:
  1. Reconcile the budget split (raise the map chunk cap to ≈≤350 KB gz,
     total ≈≤500 KB) and keep the hard CI gate.
  2. Pin the stop-view auto-refresh interval (30s, visible-only) and record
     the free-tier headroom math.
  3. Close FR-001 search semantics (fields, case/diacritics) or add an
     explicit deferral note.
  4. Declare the 405 response + `METHOD_NOT_ALLOWED` in the OpenAPI contract.

### Backend Developer Verdict — plan — 2026-10-25 (round 1)

- Verdict: CHANGES REQUESTED
- Findings:
  - ❌ Serialization unit mismatch: D5 said seconds-since-midnight; the data
    model says minutes-since-midnight. The snapshot generator/parser/fixtures
    can't be built until one unit is chosen.
  - ❌ FR-015 update pipeline had no home: no location for the generation
    script, canonical source, or its documentation, despite the MUST.
  - ❌ 405 method gate absent from the OpenAPI contract (same finding as the
    Architect).
  - ✅ Contracts otherwise complete and consistent: manifest/stops/per-line
    split supports lazy loading; `Arrival` matches the OpenAPI schema exactly;
    envelopes match D6; manifest enrichment (`validUntil`, `holidays`,
    `LineIndexEntry`) satisfies FR-011.
  - ✅ localStorage adapter satisfies the mandate in full (namespacing,
    migrations, quota guard + session-only fallback, corruption backup/reset,
    confinement behind `StoragePort`). Task-level minor: key-rollover cleanup
    when the `v1` segment eventually bumps.
  - ✅ Worker design implementable as specified (validation, SOAP template,
    `isArray` cardinality guard, deterministic TTL via `x-edge-stored-at`,
    CORS-before-cache, timeout mapping; empty arrivals = 200, not an error).
  - ✅ No undeclared network calls; CartoDB tiles acceptable but the exception
    rationale must be written into internal-ports.md.
  - ✅ FR-017 degradation correctly modeled by the `ArrivalsResult` union.
    Task-level minor: pin the freshness anchor (`generatedAt` server time)
    so SC-008 is unambiguous.
  - ✅ Local fixtures cover happy + error paths. Task-level: enumerate one
    fixture per `unavailable` reason plus the empty-arrivals live case.
- Required actions:
  1. Reconcile the snapshot time unit (minutes recommended) between D5 and
     the data model.
  2. Allocate the FR-015 update pipeline in the plan structure
     (`scripts/snapshot/` with canonical source and README).
  3. Declare the 405 gate in the OpenAPI contract (or record exclusion).
  4. Add the CartoDB exception note to internal-ports.md rules.

## Amendments applied (round 2 inputs)

| # | Action | Resolution |
| --- | --- | --- |
| A1 | Budget consistency | Plan + D3 amended: **≤500 KB gz total** (shell ≤150 KB, map chunk ≤350 KB — matches cited library weights); size-limit calibration spike as first map task |
| A2 | Refresh interval + headroom | Pinned in plan: **30s, visible-only**; math recorded (~120 req/h per active viewer → ~800 concurrent hourly-active viewers/day vs 100k/day quota); cache-hits-count caveat noted |
| A3 | FR-001 search semantics | Pinned in plan: matches `Line.code` + `Line.name`, case- and diacritics-insensitive (`normalize('NFD')` fold), prefix-first ranking |
| A4 | 405 in contract | `405` response + `METHOD_NOT_ALLOWED` enum added to stop-arrivals.openapi.yaml (validated as YAML, 5 error codes) |
| B1 | Time unit | Minutes-since-midnight integers everywhere; D5 aligned to the data model |
| B2 | Update pipeline home | `scripts/snapshot/` added to the plan structure (canonical source + `generate.ts` + README) |
| B3 | CartoDB exception | One-line exception recorded in internal-ports.md rules |
| B4 | Freshness anchor | `fetchedAt` documented as anchored to the response's server-side `generatedAt` in the ArrivalsGateway contract |

## Round 2 — Sign-off

| Actor | Verdict | Notes |
| --- | --- | --- |
| Software Architect | APPROVED | All four required actions resolved; budget now internally consistent; watch items #1–#4 closed or pinned. |
| Backend Developer | APPROVED | All four required actions resolved; contracts and adapters implementable as specified. |
| Project Lead | APPROVED | Gate procedure followed; amendments recorded; plan approved. |

**Gate G3: CLOSED.** Plan 001 is approved and ready for `/speckit-tasks`.

## Watch items carried to G4 (tasks)

1. Pin the canonical TS location of the ports module
   (`application/ports.ts` re-export).
2. First map task = size-limit calibration spike (validate treeshaken
   deck.gl/luma weight against the 350 KB chunk cap).
3. Define `localStorage` key-rollover/cleanup behavior for a future schema
   version bump.
4. Enumerate one fixture per `unavailable` reason (`timeout`/`upstream`/
   `network`) plus the empty-arrivals live case.
5. Fix the concrete browser test matrix (from G2).
6. ES/GL/EN translation-completeness check in CI (from G2).
