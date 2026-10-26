# Research: Vigo Bus Real-Time API

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25 | **Status**: Complete

All NEEDS CLARIFICATION items from Technical Context are resolved below. The
reference implementation studied is `David-Lor/VigoBusAPI` (Apache-2.0), revision
`develop` (v0.9.0), which this feature is based on the code of.

## D1: Upstream data source selection

**Decision**: For feature 002 live-arrivals lookups, use the owner-selected
Vitrasa InfoBus stop page:

```text
GET https://infobus.vitrasa.es:8002/Default.aspx?parada={validatedStopId}
```

The observed page is server-rendered HTML/WebForms. A valid stop response
contains `GridView1` with `L.`, `Ruta`, and `Min.` columns, plus pager links
that submit `__VIEWSTATE`, `__EVENTVALIDATION`, and `__doPostBack`; the lookup
uses the session cookie across those sequential page requests. The source
returns five rows per observed page, but consumers MUST follow the pager rather
than assume a fixed total. An HTTP-200 page containing `Parada Inexistente`
identifies a missing stop. Stop 2790 was observed with 3 pages and 12 rows.
The page does not emit `Access-Control-Allow-Origin`.

The observed page uses `form#form1`, hidden inputs `__VIEWSTATE`,
`__VIEWSTATEGENERATOR`, and `__EVENTVALIDATION`, and stop identity `#lblParada`.
Pager links are emitted as
`javascript:__doPostBack('GridView1','Page$N')`; route rows use
`.col-linea` and `.col-minutos`, while the pager is a nested table row with
`colspan="3"`. A successful postback must use the latest form state, the
session cookie, and the next sequential page argument. The Worker will reject
ambiguous/malformed form or pager state rather than guess.

The Worker will cap each response body at 128 KiB, all bodies in one lookup at
1 MiB, route rows at 100, line codes at 32 characters, and destinations at 256
characters. These limits complement the 10-page and aggregate 8-second bounds;
exceeding any bound fails the whole lookup without partial cache writes.

The inspected structure, with volatile values removed, is represented by this
sanitized excerpt:

```html
<form id="form1" method="post" action="Default.aspx?parada=2790">
  <input type="hidden" name="__VIEWSTATE" value="[redacted]">
  <input type="hidden" name="__VIEWSTATEGENERATOR" value="[redacted]">
  <input type="hidden" name="__EVENTVALIDATION" value="[redacted]">
</form>
<span id="lblParada">2790</span>
<table id="GridView1" class="modern-grid">
  <tr><th>L.</th><th>Ruta</th><th>Min.</th></tr>
  <tr><td class="col-linea">4C</td><td>GREGORIO ESPINO</td><td class="col-minutos">4</td></tr>
  <tr align="center"><td colspan="3"><table><!-- pager --></table></td></tr>
</table>
```

The first request is GET. Subsequent page requests are POSTs to the same fixed
URL with `application/x-www-form-urlencoded; charset=UTF-8`; the encoded body
contains the latest hidden values, `__EVENTTARGET=GridView1`, and the sequential
`__EVENTARGUMENT=Page$N`. Updated cookie name/value pairs from `Set-Cookie` are
used only for later requests to this fixed origin during the same lookup.

The sanitized three-page fixture manifest for stop 2790 is:

| Page | Request/control evidence | Route rows (`line`, `destination`, `minutes`) |
| --- | --- | --- |
| 1 | Initial GET; `#lblParada=2790`; hidden fields present with values redacted; pager links include `Page$2` and `Page$3` | `(12B, HOSPITAL MEIXOEIRO, 1)`, `(11, CABRAL por STA MARINA, 8)`, `(4A, ARAGÓN por URZÁIZ, 11)`, `(17, RÍOS - A GUÍA, 26)`, `(4C, GREGORIO ESPINO por URZÁIZ, 31)` |
| 2 | POST with latest redacted fields and source cookie; pager confirms page 3 | `(27, RABADEIRA, 41)`, `(11, CABRAL por VIA TRANVIA, 43)`, `(4A, ARAGÓN por URZÁIZ, 46)`, `(17, S. BADIA - A GUÍA, 56)`, `(12B, HOSPITAL MEIXOEIRO, 59)` |
| 3 | POST with latest redacted fields and source cookie; no next page | `(4C, GREGORIO ESPINO por URZÁIZ, 65)`, `(27, RABADEIRA, 109)` |

These are sanitized parser-fixture values, not a claim that live wait times or
page sizes remain constant. All WebForms token values and cookie values are
omitted; the manifest records only their presence and handoff behavior.

The corresponding sanitized table fixtures (token and cookie values replaced
with inert placeholders) are:

```html
<!-- Fixture page 1 of 3 -->
<span id="lblParada">2790</span>
<table id="GridView1" class="modern-grid">
  <tr><th scope="col">L.</th><th scope="col">Ruta</th><th scope="col">Min.</th></tr>
  <tr><td class="col-linea">12B</td><td>HOSPITAL MEIXOEIRO</td><td class="col-minutos">1</td></tr>
  <tr><td class="col-linea">11</td><td>CABRAL por STA MARINA</td><td class="col-minutos">8</td></tr>
  <tr><td class="col-linea">4A</td><td>ARAG&#211;N por URZ&#193;IZ</td><td class="col-minutos">11</td></tr>
  <tr><td class="col-linea">17</td><td>R&#205;OS - A GU&#205;A</td><td class="col-minutos">26</td></tr>
  <tr><td class="col-linea">4C</td><td>GREGORIO ESPINO por URZ&#193;IZ</td><td class="col-minutos">31</td></tr>
  <tr align="center"><td colspan="3"><table><tr><td><span>1</span></td><td><a href="javascript:__doPostBack('GridView1','Page$2')">2</a></td><td><a href="javascript:__doPostBack('GridView1','Page$3')">3</a></td></tr></table></td></tr>
</table>

<!-- Fixture page 2 of 3: stop label, form fields, and session cookie are as above and redacted. -->
<span id="lblParada">2790</span>
<table id="GridView1" class="modern-grid">
  <tr><th scope="col">L.</th><th scope="col">Ruta</th><th scope="col">Min.</th></tr>
  <tr><td class="col-linea">27</td><td>RABADEIRA</td><td class="col-minutos">41</td></tr>
  <tr><td class="col-linea">11</td><td>CABRAL por VIA TRANVIA</td><td class="col-minutos">43</td></tr>
  <tr><td class="col-linea">4A</td><td>ARAG&#211;N por URZ&#193;IZ</td><td class="col-minutos">46</td></tr>
  <tr><td class="col-linea">17</td><td>S. BADIA - A GU&#205;A</td><td class="col-minutos">56</td></tr>
  <tr><td class="col-linea">12B</td><td>HOSPITAL MEIXOEIRO</td><td class="col-minutos">59</td></tr>
  <tr align="center"><td colspan="3"><table><tr><td><a href="javascript:__doPostBack('GridView1','Page$1')">1</a></td><td><span>2</span></td><td><a href="javascript:__doPostBack('GridView1','Page$3')">3</a></td></tr></table></td></tr>
</table>

<!-- Fixture page 3 of 3: stop label, form fields, and session cookie are as above and redacted. -->
<span id="lblParada">2790</span>
<table id="GridView1" class="modern-grid">
  <tr><th scope="col">L.</th><th scope="col">Ruta</th><th scope="col">Min.</th></tr>
  <tr><td class="col-linea">4C</td><td>GREGORIO ESPINO por URZ&#193;IZ</td><td class="col-minutos">65</td></tr>
  <tr><td class="col-linea">27</td><td>RABADEIRA</td><td class="col-minutos">109</td></tr>
  <tr align="center"><td colspan="3"><table><tr><td><a href="javascript:__doPostBack('GridView1','Page$1')">1</a></td><td><a href="javascript:__doPostBack('GridView1','Page$2')">2</a></td><td><span>3</span></td></tr></table></td></tr>
</table>
```

**Rationale**: the owner selected this page because it visibly provides the
requested stop's line, destination, and wait-minute estimates. This decision is
not based on a claim that the existing JSON source is broken. Direct browser
fetching is unavailable because the page does not permit cross-origin access;
the existing Worker is the only sanctioned bridge.

**Alternatives considered**: (a) use the Vigo open-data JSON endpoint already
used by the previous adapter — not selected for this owner-requested source
change; no claim is made that it is unavailable or broken; (b) fetch this page
directly from the browser — rejected because the source omits CORS permission;
(c) use another proxy/service — rejected because the constitution permits only
the existing Worker and the user requested this source.

## D2: Normalization pipeline ported from VigoBusAPI

**Decision**: retain the TypeScript normalizer with its VigoBusAPI attribution,
but adapt its input from JSON objects to validated route rows extracted from the
Vitrasa HTML table:

- Validate `GridView1`, the `L.`, `Ruta`, and `Min.` headers, row cell count,
  `#lblParada` identity, and the form/pager state before mapping rows to
  `Arrival`. The path stop ID is an ASCII numeric Vitrasa identifier, passed
  unchanged; catalog membership is not required. Use Cloudflare's built-in `HTMLRewriter`; it requires no added
  production parser dependency. Run its tests in the Workers Vitest pool.
- Keep source line and destination as separate fields; do not apply the JSON
  adapter's line-letter split to destinations already rendered by the page.
- Decode HTML entities using the HTML parser, then retain `CHARS_FIXED`
  mojibake repair for source text that still needs it.
- Select `#GridView1 tr` and accept only rows with the source's `.col-linea`
  and `.col-minutos` cells; the nested pager table has no such cells and is not
  an arrival row.
- Keep a hard maximum of 10 pages including the initial GET; response-size,
  aggregate-size, row-count, and field-length bounds are specified in D1.
- Require every present route row to have valid, non-empty line, destination,
  and in-range minute cells; any malformed route row fails the entire lookup
  rather than being dropped into a false empty result. Keep stable ordering by
  `minutes`, then `destination`, and exact duplicate removal across pages.
- Map the explicit visible text `Parada Inexistente` to HTTP 404
  `STOP_NOT_EXIST`; a recognized route table with zero route rows is `empty`.

**Rationale**: these functions embody years of upstream-data quirks; porting
them (with attribution) is exactly what "based on the code of" requires, and
keeps our contract stable regardless of upstream quirks.

**Alternatives considered**: field-for-field passthrough — rejected: it would
leak HTML encoding and source layout into our contract (violates spec
FR-002/FR-005). Reusing the JSON-specific `fix_bus` line-letter split on page
text was rejected because the source already exposes the full line code.

## D3: Geographic data source for map correctness (FR-019/FR-020/FR-021)

**Decision**: stop coordinates and line stop-order come exclusively from the
**static schedule snapshot catalog** (`public/data/`), not from the real-time
service. The real-time service carries no geographic fields. Map correctness
is enforced by validating catalog coordinates at snapshot-generation time
against a Vigo bounding box (lat 42.19–42.31, lon −8.79…−8.67) and by
contract tests comparing known reference stops. Lines render as
stop-order polylines (no shape geometry exists upstream).

**Rationale**: resolves the QA G2 advisory (FR-020 data-source conflation).
The arrivals upstream does not expose coordinates; the snapshot already owns
stop geometry per spec 001.

**Alternatives considered**: geolocate stops via the HTML stop page (name
only, no lat/lon) or MongoDB stop store from VigoBusAPI — rejected: requires a
database (violates constitution VI zero-cost/no-infra) and duplicates the
snapshot's role.

## D4: Stale retention and edge caching

**Decision**: use the Cloudflare Cache API (`caches.default`) with **two entries per stop**, distinguished by cache key:

- **Fresh entry** — key `?stop_id=N`: stored with `Cache-Control: public, max-age=30` (constitution VI TTL) plus a deterministic `x-edge-stored-at` header; served while fresh. The platform evicts it at the 30 s TTL, so it can never serve stale data by itself.
- **Last-known entry** — key `?stop_id=N&lk=1` (internal, not part of the public contract): stored with `Cache-Control: public, max-age=300`, a **5-minute maximum staleness bound**. On upstream timeout/error/5xx/429, if this entry exists (in-bound by construction), it is served with `dataStatus: "stale"`, its original `generatedAt`/`x-edge-stored-at`, `Cache-Control: no-store`, and an `Age` header so recovery is visible within one poll interval. If no in-bound last-known entry exists, the Worker answers `503 STALE_UNAVAILABLE` — or `429 RATE_LIMITED` when the upstream failure was a rate limit. No KV, no Durable Objects.

**Rationale**: satisfies FR-010/SC-007 with zero new infrastructure. The two-entry split is required because the Cache API honors `max-age` on `cache.match`: a single 30 s entry is evicted at the TTL and cannot retain a 300 s last-known result (architect G3 finding). The 300 s bound quantifies FR-010's "short-lived"; `no-store` + `Age` keep browsers from caching the stale payload and hiding recovery.

**Alternatives considered**: Workers KV last-known store — rejected: costs and adds a storage dependency for a 5-minute problem; single cache entry with custom TTL logic — rejected: `cache.match` eviction cannot be overridden.

**Test runtime**: contract tests run under `@cloudflare/vitest-pool-workers` (miniflare) so `caches.default` is real; the cache module additionally accepts an injected cache port so pure unit tests run in plain node.

## D5: Contract versioning and compatibility (FR-013)

**Decision**: retain OpenAPI 3.1 API contract version **3.0.0** in
`contracts/realtime-arrivals.openapi.yaml`. This source-adapter change does not
change the browser-facing paths or normalized arrivals response; update the
contract's source description only. The frontend `ArrivalsGateway` and its
`dataStatus` behavior remain unchanged.

**Rationale**: the API contract already includes the resource-oriented arrivals
route and freshness/error semantics. Keeping its version avoids a needless
public breaking change when only the upstream transport adapter changes.

**Alternatives considered**: a new contract version — rejected because the
public request and response schemas remain byte-for-byte compatible.

## D6: Local/development execution (FR-007)

**Decision**: `npm run dev:worker` runs `wrangler dev --local` from the
`worker/` workspace; the frontend `local` profile points
`VITE_ARRIVALS_BASE_URL` at `http://localhost:8787`. The local profile defaults
to `DEPLOYMENT_ENV=development` and `UPSTREAM_FIXTURES=true`, serving recorded
HTML/WebForms fixtures without network. Live-source development requires an
explicit `UPSTREAM_FIXTURES=false` override. Named `preview` and `production`
Wrangler environments use the fixed live source and reject fixture mode. The
same Worker request/response code path serves each profile.

**Rationale**: constitution IV requires full local testability without
credentials; fixture mode gives deterministic contract tests and E2E.

**Alternatives considered**: separate local mock server — rejected: two
implementations to keep in sync with one contract.

## D7: Health/readiness (FR-018)

**Decision**: `GET /health` returns `{ "status": "ok" }` as Worker liveness
with `200`; it does not claim that Vitrasa is reachable. Fixture contract tests
verify the arrivals endpoint's response behavior for healthy and failed
upstream scenarios; they are not a production readiness probe. No upstream
request is made by `/health`.

**Rationale**: an upstream probe on every health call would consume requests
against the Vitrasa page. Liveness and upstream response behavior are distinct;
the public endpoint makes no unsupported readiness claim.

**Alternatives considered**: readiness endpoint performing a live upstream
call with 1 s timeout — rejected for v1: upstream has no documented health
endpoint and each probe consumes quota.

## D8: Attribution and licensing mechanics (FR-016/FR-017)

**Decision**: add a `NOTICE` file at repo root stating: "This project
includes code based on the code of VigoBusAPI
(https://github.com/David-Lor/VigoBusAPI), Copyright 2019-2022 David Lorenzo,
licensed under the Apache License 2.0", list the ported functions
(D2), and keep the full Apache-2.0 text in `LICENSE` with the VigoBusAPI
copyright retained. Ported files carry a header comment with the same
attribution. README gets a provenance section with the non-affiliation
disclaimer (FR-017, mirroring the upstream project's own disclaimer).

**Rationale**: Apache-2.0 §4 requires retaining copyright/license notices and
marking modifications; a `NOTICE` file plus per-file headers is the standard
mechanism, and "based on the code of" is stated verbatim.

**Alternatives considered**: attribution only in README — rejected: too weak
for a distributed Worker bundle.

## D9: Performance budget and load definition (SC-001)

**Decision**: define "expected project load" as a 10 rps burst for 60 s
against the Worker (well under the 100k req/day free tier); retain p95 ≤ 3 s
as the healthy-source target. One observed three-page lookup for stop 2790
completed in 1.485 s, but this is a sample, not a source guarantee. Enforce a
single 8 s absolute deadline across all sequential page requests, response-body
reads, and parsing; use only the remaining deadline budget for each next page.
Any deadline exhaustion follows the existing stale/unavailable path.

**Rationale**: preserves the existing user-facing target while the fixture
suite deterministically verifies deadline accounting and the observed three-
page case without depending on live-source timing.

**Alternatives considered**: apply a fresh 6 s timeout to every page —
rejected: sequential pages could exceed the 8 s request bound. The aggregate
deadline is authoritative.

## D10: Stop identifier used by the caller

**Decision**: the frontend calls the arrivals endpoint with **`Stop.vitrasaId`** (the public numeric Vitrasa identifier, e.g. `1001`), not the internal catalog `id` (`stop-1001`), municipal code, or catalog `code` fallback. The prior caller passed `stop.id`, which would fail the contract pattern `^[0-9]{1,6}$`; implementation tasks use the explicit Vitrasa field. When it is null, no gateway request is made. The catalog keeps its identifiers unchanged.

**Rationale**: resolves the integration-breaking mismatch found at G3 without touching the shipped snapshot format.

**Alternatives considered**: change catalog ids to numeric — rejected: unnecessary churn on the validated spec-001 snapshot.

## D11: Upstream request budget and load validation

**Decision**: Never load-test the live Vitrasa page. A cache miss can trigger
one initial GET plus up to nine sequential POSTs; the Worker makes no automatic
page retries, stops at ten pages/eight seconds, and uses existing stale/error
behavior on failure. The UI polls at most every 30 seconds while visible and
pauses while hidden. Live smoke checks remain low-volume and are run manually.
Measure the 10 rps / 60 s Worker target only with deterministic fixtures; this
measures Worker overhead, not Vitrasa latency or capacity.

The Cloudflare 100k requests/day allowance applies to Worker requests, not a
guarantee of Vitrasa's acceptable-use limits. The project owner must confirm
the source's terms before deployment; no public source request quota was
verified. If Vitrasa rate-limits or fails, do not retry automatically and use
the bounded stale/error path.

**Rationale**: a single cold lookup may fan out to ten upstream requests, so a
live load test could burden the public service and would not measure the
Worker's own capacity.

**Alternatives considered**: load-test Vitrasa directly — rejected; it is a
public dependency without a verified load-testing allowance.

## D12: EdgeCache runtime verification

**Decision**: Keep deterministic Cache API tests in the Workers Vitest pool
and add a separate, opt-in G5 smoke using a temporary `wrangler dev --remote`
Worker entrypoint. That harness calls the production cache module with an
injected deterministic upstream fetcher and verifies fresh hits/expiry plus
last-known stale-on-failure retention/expiry on Cloudflare's actual Cache API.
It runs only in a temporary development session with fixtures, requires
Cloudflare deployment credentials, never targets the named preview or
production environment, and is not part of local CI. The smoke waits for the
real 30 s and 300 s TTLs; local tests cover exact boundary clocks.

**Rationale**: Miniflare proves Worker logic but does not prove platform edge
cache eviction/retention semantics. The remote smoke isolates that platform
question without contacting Vitrasa or weakening preview/production fixture
prohibitions.
