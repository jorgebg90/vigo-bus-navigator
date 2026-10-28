# Data Model: Vigo Bus Real-Time API

**Feature**: 002-realtime-bus-api | **Date**: 2026-10-25

Entities below describe the application-facing contract. Upstream HTML,
WebForms fields, cookies, and table markup appear only inside the Worker adapter
and never cross the contract boundary (FR-002/FR-005).
Geographic data is owned by the static snapshot catalog (research D3).

## Arrival

A predicted bus arrival at a stop.

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `lineCode` | string | yes | Complete line identifier from the `L.` column (e.g. `4A`); non-empty |
| `destination` | string | yes | Destination from the `Ruta` column after HTML entity decoding and text normalization; non-empty |
| `minutes` | integer | yes | `0 ≤ minutes ≤ 1440`; a malformed or out-of-range source value fails the whole lookup |
| `eta` | string (date-time) | yes | `generatedAt + minutes`, UTC ISO-8601 |

Rows are extracted from the single `GridView1` table after verifying the
`#lblParada` identity and `L.`, `Ruta`, and `Min.` headers. The source line and
destination are already separate; do not split line letters from destination
text. HTML entities are decoded before text normalization. Only rows with the
source's `.col-linea` and `.col-minutos` cells are arrivals; nested pager rows
are ignored. A recognized table with zero route rows is empty. If route rows
are present, any row with missing/invalid required cells, malformed minutes,
empty normalized text, or an over-limit field fails the whole lookup; it is
never converted to an empty response. Duplicate valid rows are removed.
Ordering: ascending by `minutes`, then `destination` (ported `sort_buses`).
Duplicates with identical `lineCode`+`destination`+`minutes` are removed
(ported `clear_duplicated_buses`).

## ArrivalsResponse

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `stopId` | string | yes | Matches the Vitrasa identifier in the request path, pattern `^\d{1,6}$` |
| `generatedAt` | string (date-time) | yes | Worker store time; on stale responses it is the original store time |
| `dataStatus` | enum | yes | `current` \| `stale` \| `empty` — see Data Status |
| `arrivals` | Arrival[] | yes | May be empty; empty + `dataStatus: "empty"` is not an error |

## ErrorResponse

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `error.code` | enum | yes | `VALIDATION_ERROR` (400) \| `STOP_NOT_EXIST` (404, upstream reports the stop does not exist) \| `NOT_FOUND` (404, unknown path) \| `METHOD_NOT_ALLOWED` (405) \| `RATE_LIMITED` (429, upstream rate limit with no in-bound last-known result) \| `UPSTREAM_ERROR` (502) \| `STALE_UNAVAILABLE` (503, failure with no in-bound last-known result) \| `UPSTREAM_TIMEOUT` (504) |
| `error.message` | string | yes | Human-readable, no secrets/headers/internal traces (FR-011) |

The source's HTTP-200 `Parada Inexistente` page maps to `404 STOP_NOT_EXIST`.
A recognized `GridView1` with its expected columns and zero route rows maps to
a valid `empty` arrivals response. Missing or unrecognized page structure, or
present but unusable route rows, is an upstream failure, not an empty result.

Rate limiting: an upstream HTTP 429 enters the same stale-on-failure path as
any upstream failure; only when no in-bound last-known result exists does the
Worker answer `429 RATE_LIMITED`.

## Data Status (state transitions)

```text
            upstream OK, arrivals>0
request ───────────────────────────────► current
   │      upstream OK, arrivals=0
   ├────────────────────────────────────► empty
   │      upstream fail + last-known entry younger than 300 s
   ├────────────────────────────────────► stale   (original generatedAt kept; no-store + Age)
   │      upstream fail + no in-bound last-known result
   └────────────────────────────────────► 503 STALE_UNAVAILABLE → UI "unavailable"
             (429 RATE_LIMITED when the failure was an upstream rate limit)
```

- `current → stale` happens only on upstream failure; the last-known entry has a **300 s maximum staleness bound** — older results are never served, the Worker answers 503 instead (SC-007).
- Fresh entries use the existing **30 s TTL**; stale entries are at most **300 s old**. Cache retention is best-effort at the platform edge; when an in-bound entry is unavailable, the Worker returns the documented unavailable/rate-limit error.
- `invalid` is a **service-level** state only (HTTP 400/404), not one of the five UI data states (`loading`, `current`, `stale`, `empty`, `unavailable`) — resolves QA G2 advisory.
- A recognized table with zero route rows is `empty`. Present route rows with missing, malformed, undecodable, empty, or out-of-range required values fail the lookup; they are not dropped into a false empty result.

## Network Catalog

`GET /lines` and `GET /stops` return `datasetVersion` and `generatedAt` with
the official snapshot. `GET /lines/{lineCode}` returns the line's ordered GTFS
route patterns; it does not group stops by service day type or provide live
arrival estimates.

## Stop

| Field | Type | Validation |
| --- | --- | --- |
| `id` | string | Internal catalog identity, e.g. `stop-2789` |
| `code` | string | Existing catalog code field; not used as an arrivals identifier when `vitrasaId` is null |
| `vitrasaId` | string \| null | Public Vitrasa identifier used unchanged as `{stopCode}` in `/stops/{stopCode}/arrivals` and as the source's `parada` parameter; ASCII digits only, 1–6 characters; if null, frontend makes no request and never substitutes `id`, `code`, or `municipalCode` |
| `municipalCode` | string \| null | GTFS `stop_id` used to join municipal and schedule data; a distinct namespace from Vitrasa IDs |
| `name` | string | Public stop name |
| `lat`, `lon` | number | Geographic coordinates from the official snapshot |
| `lineIds` | string[] | Lines that serve the stop; line patterns carry their own ordered stop IDs |

When `vitrasaId` is null, the arrivals UI does not call the gateway and shows
the localized unavailable state. It never substitutes another stop field.

## Privacy Disclosure

The arrivals view displays a localized notice before or when it initiates a
live lookup. The notice says the selected public Vitrasa stop ID is sent to
Cloudflare and Vitrasa, both may process connection metadata, no account or
profile data is sent, and the project does not claim anonymity.

## ArrivalsGateway mapping (frontend port)

| HTTP status / payload | `dataStatus` | ArrivalsResult |
| --- | --- | --- |
| 200 | `current` | `live` with status `current` |
| 200 | `empty` | `live` with status `empty` |
| 200 | `stale` | `live` with status `stale` (original `generatedAt`) |
| 404 `STOP_NOT_EXIST` | — | `unavailable` reason `stop-not-exist` |
| 429 / 502 / 503 / 504 | — | `unavailable` reason `upstream` |
| 400 / 405 / network error | — | `unavailable` reason `unknown` |

`dataStatus` is **required** on the `live` variant of `ArrivalsResult`; the
existing fixture adapter sets it to `"current"`, so FR-013 compatibility is
preserved for all current callers.

## Vitrasa Source Lookup (Worker-internal)

| Data | Lifetime | Handling |
| --- | --- | --- |
| Selected public stop ID | One lookup | Validated before network access; used to construct the fixed Vitrasa URL |
| Hidden WebForms fields | One lookup, refreshed from each page | Forwarded only to the fixed Vitrasa page for postbacks; never logged, cached, persisted, or returned |
| Vitrasa session cookie | One lookup | Forwarded only to the fixed Vitrasa page; never logged, cached, persisted, or returned |
| Extracted arrival rows | Until lookup completes | Kept in memory and combined; any page failure discards the partial collection |
| Response bodies | Until page parsing completes | At most 128 KiB per page and 1 MiB per lookup; larger bodies fail the whole lookup |
| Extracted result | Until lookup completes | At most 100 rows; line code at most 32 characters; destination at most 256 characters |

The initial page is a GET and must identify the requested stop in
`#lblParada`. Pagination uses `form#form1` and links matching
`__doPostBack('GridView1','Page$N')`. Each postback is a POST to the same fixed
URL with `application/x-www-form-urlencoded; charset=UTF-8`; its URL-encoded
body carries the latest unique `__VIEWSTATE`, `__EVENTVALIDATION`, optional
`__VIEWSTATEGENERATOR`, fixed `__EVENTTARGET=GridView1`, and sequential
`__EVENTARGUMENT=Page$N`. Only cookie name/value pairs set by the fixed source
origin are forwarded to that origin during this lookup; updated `Set-Cookie`
values replace or expire the matching name. The fixed source URL is
reconstructed for every page; the source form action is never followed.
At most 10 pages, including the initial GET, may be requested.

## Runtime Profile (frontend + worker wiring)

| Profile | Arrivals base URL | Upstream | Purpose |
| --- | --- | --- | --- |
| local / development | `http://localhost:8787` | deterministic fixtures by default; live source only with explicit development override | repo-local `wrangler dev --local` |
| preview | configured preview Worker URL | live Vitrasa InfoBus WebForms page; fixture mode rejected | preview frontend/smoke tests |
| production | configured production Worker URL | live Vitrasa InfoBus WebForms page; fixture mode rejected | GitHub Pages frontend |

No secrets or configurable upstream URLs are required; the source origin and
path are fixed in the Worker. The browser sends only the selected public stop
ID to the Worker. Cloudflare and Vitrasa may process connection metadata; the
project does not claim anonymity or control provider-side metadata retention.
