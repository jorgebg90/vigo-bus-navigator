# Quickstart: Vigo Bus Real-Time API

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25

Runnable validation scenarios proving the feature end-to-end. Contract
details live in [contracts/realtime-arrivals.openapi.yaml](contracts/realtime-arrivals.openapi.yaml);
field semantics in [data-model.md](data-model.md); design rationale in
[research.md](research.md).

## Prerequisites

- Node.js ≥ 22, `npm install` at repo root (installs the `worker` workspace,
  including `wrangler` as a dev dependency).
- No Cloudflare account, credentials, or network access needed for local
  validation (fixtures are served by the Worker; the frontend always calls its API).

## VS1 — Local fixture mode (no network)

```sh
npm run dev:worker                              # fixture-first, no network
npm run dev                                      # second terminal; frontend calls Worker API
curl 'http://localhost:8787/lines'                 # → official line catalog
curl 'http://localhost:8787/lines/4A'              # → ordered GTFS patterns
curl 'http://localhost:8787/stops'                  # → official stop catalog
curl 'http://localhost:8787/stops/1001/arrivals'   # → 200, dataStatus: current
curl 'http://localhost:8787/stops/2000/arrivals'   # → 200, dataStatus: empty
curl 'http://localhost:8787/stops/999999/arrivals' # → 404 STOP_NOT_EXIST
curl 'http://localhost:8787/health'                # → 200 { "status": "ok" }
```

To exercise the public source intentionally, run the same Worker and WebForms
adapter as production with live Vitrasa enabled (this is a low-volume manual
check, not a load-test profile):

```sh
npm run dev:worker:live
```

In a second terminal, run `npm run dev` and open the local frontend. Its
arrivals requests go to this local Worker, which uses the production
`fetchVitrasaArrivals` implementation and fixed `.aspx` source URL. Only the
fixture/live source selection differs. The live command makes external
requests when an arrivals lookup is requested; use it for low-volume manual
checks only, never for automated tests or load testing.

Every response (including errors) carries `Access-Control-Allow-Origin: *`.
Fresh current/empty responses carry `Cache-Control: public, max-age=30` and
`x-edge-stored-at`; stale responses use `Cache-Control: no-store` and `Age`.

## VS2 — Contract tests

```sh
npm run test:contract
npm test
```

Covers the FR-014 matrix and WebForms bridge in the dedicated Cloudflare
Workers Vitest pool, plus pure row normalization in the Node-only suite:
deterministic three-page 5/5/2 arrival fixture for stop
2790; session cookie and refreshed hidden-field postback handling; pager
sequence; 10-page cap including the initial page; rejection of an eleventh
page and redirects; stop-ID validation before any source request; exact stop
identity matching; 128 KiB/page, 1 MiB/lookup, 100-row, and field-length limits;
HTTP-200 `Parada Inexistente` to `STOP_NOT_EXIST`; valid empty table versus
malformed markup; failure on a later page returns stale/unavailable and never
stores partial data; aggregate 8-second deadline; and no source state in
responses, cache, logs, or persistent bindings. Existing CORS, freshness, error
taxonomy, exact 30-second fresh/300-second stale transitions, and API v3.0.0
schema-regression tests also run in this pool. The Node/DOM suite verifies full
privacy copy in all locales, zero calls for stops without `vitrasaId`, polling
pause/resume, and accessibility. `npm run test:load` runs the fixture-only
10 rps / 60 s load test; it never contacts Vitrasa.

## VS3 — Stale-on-failure behavior

With fixture mode's fault injection (`UPSTREAM_FIXTURE_FAULT=timeout`), a
second request for a previously cached stop returns `dataStatus: "stale"`
with the original `generatedAt`/`x-edge-stored-at`; a request for a
never-cached stop returns `503 STALE_UNAVAILABLE` within the 8 s bound
(SC-002).

## VS4 — Frontend integration (local profile)

```sh
npm run dev:worker:live                         # terminal 1, optional real Vitrasa data
npm run dev                                    # terminal 2
```

For offline fixture-first testing, use `npm run dev:worker` in terminal 1
instead. The local frontend is configured for `http://localhost:8787` in both
modes.

Open `http://localhost:5173`, select a line, then a stop: the stop view shows
arrivals with a freshness indicator (current / stale / empty / unavailable /
loading — each a distinct localized status, SC-003). Backgrounding the tab
pauses the 30 s refresh; foregrounding resumes it. The localized privacy
notice names Cloudflare and Vitrasa and explains the stop-ID and connection
metadata disclosure without claiming anonymity.

## VS5 — Map correctness

With the fixture catalog, open a line view and verify: every stop marker sits
at its catalog coordinates inside Vigo (FR-019), and the line polyline
follows the catalog stop order (FR-020). Snapshot generation fails the build
if any coordinate falls outside the Vigo bounding box.

## VS6 — Production smoke (post-deploy)

```sh
curl 'https://<worker-url>/stops/1462/arrivals' | jq . # real Vigo stop (Vitrasa ID)
curl 'https://<worker-url>/health'
```

Preview uses its named Wrangler environment with live Vitrasa and fixtures
disabled, then runs the same public contract smoke checks as production. A
remote preview deploy/smoke requires Cloudflare credentials and is not run by
the local fixture checks.

Verify `dataStatus`, `Access-Control-Allow-Origin: *`, and that the GitHub
Pages frontend resolves arrivals through the configured Worker URL. A live
smoke check may observe changing routes and minutes; only the recorded fixture
is used for an exact row-count assertion. The browser sends the selected stop
ID to the Worker; Vitrasa and Cloudflare process the request and associated
network metadata. No account/profile data is sent, and the project does not
claim control over provider-side metadata handling.

## VS8 — Preview profile

Preview requires Cloudflare deployment credentials and a Vitrasa-live preview
Worker. Deploy it separately from production, then build the frontend against
its Worker URL:

```sh
npx wrangler deploy --cwd worker --env preview
VITE_PROFILE=preview VITE_ARRIVALS_BASE_URL='https://<preview-worker>.<account>.workers.dev' npm run build
npm run preview
```

Preview rejects fixture mode. The local preview-profile build is credential-free;
remote deployment and smoke requests require Cloudflare credentials and must
remain low-volume. Do not use this profile for load testing.

## VS9 — Payload and EdgeCache verification

The CI `npm run size` gate checks aggregate gzip limits and existing per-file
caps after a static build. The limits are JavaScript ≤850 KiB
aggregate and CSS ≤150 KiB aggregate; current per-file caps are entry JS
150 KiB, MapLibre and deck.gl chunks 350 KiB each, and CSS 150 KiB. Run it
locally without credentials:

```sh
npm run build
npm run size
```

The optional G5 check is planned to use a temporary remote development Worker
to exercise the actual Cloudflare Cache API with deterministic injected
responses. It must wait for the 30 s and 300 s TTL transitions and never call
Vitrasa. T066 implementation and G5 evidence are pending. When that task is
implemented, it will require a Cloudflare token supplied in the user's shell;
the token must not be committed. This check is separate from local
prerequisites, named preview, and production.

No remote EdgeCache command is available until T066 is implemented; do not
substitute preview or production for this verification.

## Attribution check

- `NOTICE` at repo root states the project is based on the code of
  VigoBusAPI with its copyright and Apache-2.0 license.
- Ported Worker files carry the attribution header.
- README contains the provenance section and non-affiliation disclaimer.

> Superseding correction (2026-10-26): Feature 003 uses the fixed public Vitrasa InfoBus source and Vigo municipal/GTFS catalog data. The planned dependency was not adopted. Current normalization is independently authored from the source contract and observed outputs; this artifact records the earlier feature-002 plan only.
