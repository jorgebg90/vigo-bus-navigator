# Source Evidence: Vigo Municipal JSP API (feature 004)

**Reading note / consolidated confidence:** This is the research actor's
session report, not a provider specification. The addendum supersedes the
initial “three unprobed actions” status. Total 23 CLI GETs, no new browser
verification. Numeric `metros` alone does not establish units/meaning;
coordinate ranges alone do not prove CRS. Shared identifiers do not prove an
APK call chain. “Not found” means unavailable for inspection in this session,
not a proof about all files/devices. Full-body schema/identity fixtures remain
OPEN. See `research.md` and `contracts/action-readiness.md` for normative
planning decisions rather than speculative interpretation below.

**Scope**: Bounded source-verification research for `specs/004-vigo-jsp-transit-api` (G2 closed). Covers (1) local search for the decompiled VigoPlus APK referenced by the spec/G1 record, and (2) a bounded set of live, read-only GET probes against the public endpoint to verify field names, types, nullability, identifier linkage, and encoding for the 11 documented `tipo` actions.

**Date/time of this research**: 2026-10-27 ~19:40–19:42 UTC (2026-10-27 ~20:40–20:42 CET), from this workstation.

**Constraints honored**: read-only GET only; credentials omitted (no cookies/auth sent — plain `urllib.request` with only a `User-Agent` header); sequential requests, ≈1/sec; 5 s socket timeout; response bodies capped at 20,000 bytes per request; no brute-forced identifiers — every `id`/`stop_id`/`linea` value used was one already present in the spec/POC record (`id=90`, `stop_id=2789`, `id=A`) or extracted from a response returned during this same bounded investigation (schedule `trip_id`/`shape_id` values); no decompiled source code reproduced; total live HTTP requests issued: **20** (budget cap reached — see Gaps).

## 0. 2026-10-28 browser implementation smoke

The product owner directed that supported operations use real JSP calls in
local development and production. A follow-up smoke was run from
`http://127.0.0.1:5173/` in headless Chromium using browser `fetch` with
`mode: "cors"` and `credentials: "omit"`, sequentially with no retries. All
seven supported operations returned HTTP 200, parsed as JSON, and allowed the
browser cross-origin fetch. Responses declared
`application/json;charset=ISO-8859-1`; earlier header probes recorded
`Access-Control-Allow-Origin: *`.

| Action | Parameters | Bytes | Parsed shape |
| --- | --- | ---: | --- |
| `TRANSPORTE_LINEAS_ES` | none | 8,359 | array of 44 |
| `TRANSPORTE_LINEAS_GA` | none | 8,359 | array of 44 |
| `TRANSPORTE_LINEAS_SERVICIOS_ES` | none | 10,864 | array of 72 |
| `TRANSPORTE_LINEAS_SERVICIOS_GA` | none | 10,867 | array of 72 |
| `TRANSPORTE_PARADA_ID` | `id=90` | 99 | array of 1 |
| `TRANSPORTE_LINEAS_PARADA` | `id=2789` | 119 | array of 1 |
| `TRANSPORTE-ESTIMACION-PARADA` | `id=90&ttl=5` | 281 | object with `parada` and `estimaciones` |

The running UI also rendered the live line catalog, the municipal serving line
for stop 2789, and live estimates for Vitrasa stop 90. The stop identity echoed
by the arrival payload matched the requested ID. Live arrival results are now
enabled in both local-live and production; the app's client receipt freshness
policy does not rely on `ttl=5` behavior. This smoke records the supported
operation set, not empty/error coverage, complete catalog parity, all eleven
actions, production deployment, or G5/actor approval. Schedule, geometry, trip,
and line-stop-detail operations remain unavailable.

### 0.1 Production GitHub Pages-path browser smoke (2026-10-28)

Built the production artifact with the deployment workflow's profiles and base
path (`VITE_PROFILE=production`, `VITE_MUNICIPAL_PROFILE=production`,
`VITE_BASE_PATH=/vigo-bus-navigator/`) and opened the artifact in headless
Chromium at `http://127.0.0.1:4173/vigo-bus-navigator/`. The page loaded from
the Pages subpath, the airport stop was selected through Search, and live
arrivals rendered with a client receipt timestamp. The browser observed these
cross-origin JSP requests:

| Action | Parameters | Method | HTTP |
| --- | --- | --- | ---: |
| `TRANSPORTE_LINEAS_ES` | none | GET | 200 |
| `TRANSPORTE_LINEAS_SERVICIOS_ES` | none | GET | 200 |
| `TRANSPORTE-ESTIMACION-PARADA` | `id=90&ttl=5` | GET | 200 |

This verifies the production build and configured Pages base path can perform
real browser requests without a deployed Worker. It is a bounded interaction
smoke, not deployment to GitHub Pages, full parity evidence, or G5/actor
approval. The seven-action smoke above remains the evidence for the full
supported allowlist; the four unsupported operations remain unavailable.

---

## 1. Local APK/decompiled-source evidence: NOT FOUND

An explicit, conservative filesystem search was performed for the "APK/base" decompiled source that `spec.md` and `gate-g1-direct-jsp-amendment-review.md` attribute the original call-chain findings to:

- Repository tree: `grep -ri "apk\|decompil\|smali\|jadx\|classes.dex"` across `specs/004-vigo-jsp-transit-api/` found only narrative *references* to the prior APK analysis in `spec.md`, `gate-g1-direct-jsp-amendment-review.md`, and `checklists/requirements.md` — no APK binary, decompiled project, or extracted source tree is checked into the repository.
- `find` over the full filesystem (`/`, depth-bounded) for `*.apk` found exactly one file: `/Users/jorgebg/Library/apktool/framework/1.apk`. This is apktool's generic cached **Android framework-res.apk** (used by apktool to resolve `@android:` resource references for *any* app it decompiles) — it is not an app-specific artifact, contains no VigoPlus/`org.vigo.apps.vigoplus` code, and must not be cited as app evidence.
- No directories named `smali`, `smali_classes*`, or containing `*vigo*` (apktool output conventions) were found anywhere under the user's home directory outside this repository.
- No `Downloads`/`Desktop` APK files, no `jadx` output folders, and no cached decompilation workspace were found.

**Conclusion**: The decompiled VigoPlus `APK/base` is **not present on this machine in this session**. The call-chain claims attributed to "static APK analysis" in `spec.md:9-13,40,189-191` and `gate-g1-direct-jsp-amendment-review.md:13,17,36,40` could **not** be independently re-verified against decompiled source/class/method references in this investigation. This is recorded as a release blocker below (§4), not inferred as false — only as **unverified in this session** due to source absence. No prior-session APK artifact path, hash, or archive was discoverable to even attempt opening it.

## 2. POC reviewed

- `frontend/poc-vigo-jsp.html:1-27` and `frontend/poc-vigo-jsp.js:1-61` — static-only browser harness. Fixed `endpoint = 'https://datos.vigo.org/vci_api_app/api2.jsp'`; builds requests with `{ tipo, id, ttl }` query params for `TRANSPORTE_PARADA_ID` and `TRANSPORTE-ESTIMACION-PARADA` (GET via `URLSearchParams`, and an alternate POST multipart/`FormData` path for the same two actions), `mode:'cors'`, `credentials:'omit'`. No other actions are exercised by this harness; it only supports the two actions above, which matches what `spec.md:26` already documents as POC-tested. Nothing new was learned from the POC code itself beyond what `spec.md` already states; it was read only to confirm the exact request shape (plain `URL.searchParams`, not JSON body) and that credentials are genuinely omitted client-side.

## 3. Live bounded probe results (verified facts)

Fixed base confirmed live: `https://datos.vigo.org/vci_api_app/api2.jsp`. All 10 requests below returned `HTTP 200`, `Content-Type: application/json;charset=ISO-8859-1`, and `Access-Control-Allow-Origin: *`. Each finding is a semantic fact derived from parsing the actual response body, not merely the HTTP 200 status (per the "never HTTP200 = semantic proof" constraint).

### 3.1 Encoding: genuinely ISO-8859-1, not UTF-8-mislabeled, not mojibake

- Server declares `charset=ISO-8859-1` on every response.
- Byte-level test on `TRANSPORTE_LINEAS_ES`: the string `"Encarnación"` is carried as raw byte `0xF3` for `ó`. Decoding the raw bytes as **UTF-8 fails outright** (`UnicodeDecodeError: invalid continuation byte` at the `0xF3` position) — proving the bytes are single-byte Latin-1, not valid UTF-8 (so it is not a UTF-8 payload with a wrong header). Decoding the same raw bytes as **ISO-8859-1 produces correct text** (`"Encarnación"`, `"Termómetro"`, `"Avda."`, `"Estación Ferrocarril Guixar"`, `"Ciencias Xurídicas (CUVI)"`, all correctly accented). This was reproduced identically across `TRANSPORTE_LINEAS_ES`, `TRANSPORTE_LINEAS_GA`, `TRANSPORTE_LINEAS_SERVICIOS_ES/GA`, and `TRANSPORTE_LINEA_HORARIOS_EXTEND`.
- **Conclusion**: the previously unresolved "declared ISO-8859-1 and mojibake" risk is **resolved for these 5 tested actions**: the correct, reproducible client behavior is to decode the response body as ISO-8859-1 (Latin-1) before JSON-parsing; doing so yields clean accented Spanish/Galician text with no mojibake. This was not tested for the other 6 actions (arrivals/stop/schedule were ASCII-only in the tested samples and therefore not a discriminating test — see 3.4/3.5 below, which succeeded under both encodings because no accented bytes appeared in those particular responses).

### 3.2 `TRANSPORTE_PARADA_ID` (stop record) — verified schema from `id=90`

Request: `?tipo=TRANSPORTE_PARADA_ID&id=90`. Response (99 bytes):
```json
[{"lon":-8.632864690,"id":90,"nombre":"Aeroporto de Peinador","lat":42.225956918,"stop_id":"2789"}]
```
- Top-level shape is a **JSON array** of one record (not a bare object).
- Fields and observed types: `lon` (JSON number, float, negative — confirms WGS84-style decimal degrees, longitude first key in the object but ordering is not semantically significant), `id` (JSON number, integer — matches the queried `id=90`), `nombre` (string), `lat` (JSON number, float, positive), `stop_id` (**JSON string**, quoted `"2789"`, despite being numeric content — this is a **string-typed field**, not an integer, which matters for any OpenAPI schema).
- Confirms `spec.md:28`'s field list (`id`, `stop_id`, `nombre`, `lat`, `lon`) exactly; confirms `latitud`/`longitud`/`stop_vitrasa` are genuinely **absent** from this action's response (they appear only in the arrivals action — see 3.4).
- Coordinate values `lat=42.225956918, lon=-8.632864690` are the real-world WGS84 coordinates of Vigo airport (Peinador) — consistent with decimal-degree WGS84, not a projected CRS. (Only establishes CRS for point stop coordinates, not for route geometry — see Gaps.)

### 3.3 `TRANSPORTE_LINEAS_PARADA` (lines serving a stop) — verified from `id=2789`

Request: `?tipo=TRANSPORTE_LINEAS_PARADA&id=2789`. Response (119 bytes):
```json
[{"descripcion":"Universidade - Aeroporto","imagen":"Termómetro Línea A.png","orden":15,"color":"#77298F","linea":"A"}]
```
- Confirms the **municipal `stop_id` (2789)**, not the arrivals/source `id` (90), is the correct key for this action — matching `spec.md:29`'s field list (`linea`, `descripcion`, `imagen`, `orden`, `color`). Only one line (`A`) serves this stop in the live data, consistent with it being an airport stop.
- `orden` is an integer (15); `color` is a `#RRGGBB` hex string; no `color_texto` field here (present only in `TRANSPORTE_LINEAS_*`, see 3.5) — confirms this action's schema is a strict subset, not identical, to the line-catalog schema.

### 3.4 `TRANSPORTE-ESTIMACION-PARADA` (arrivals) — verified from `id=90&ttl=5`

Request: `?tipo=TRANSPORTE-ESTIMACION-PARADA&ttl=5&id=90`. Response (280 bytes):
```json
{"parada":[{"latitud":42.225956918,"longitud":-8.632864690,"stop_vitrasa":90,"nombre":"Aeroporto de Peinador"}],"estimaciones":[{"minutos":21,"ruta":"\"1\" P.E.FADRIQUE por TORRECED","linea":"A","metros":8846},{"minutos":60,"ruta":"REMATA EN FRAGOSO","linea":"A","metros":13298}]}
```
- Top-level shape is a **JSON object** (not array), with two keys: `parada` (array, one element observed) and `estimaciones` (array).
- `parada[0]` uses **different field names** than `TRANSPORTE_PARADA_ID`: `latitud`/`longitud` (not `lat`/`lon`) and **`stop_vitrasa` (integer, value `90`)** — this equals the queried `id` (90, the *source/arrivals* identifier), **not** the municipal `stop_id` (2789) returned by `TRANSPORTE_PARADA_ID`. This is a concrete, verified resolution of the "coordinate names differ" (`lat/lon` vs `latitud/longitud`) discrepancy flagged by QA in `gate-g1-direct-jsp-amendment-review.md`: **both are real, but they belong to different actions** — `TRANSPORTE_PARADA_ID` uses `lat`/`lon`/`id`/`stop_id`; `TRANSPORTE-ESTIMACION-PARADA` uses `latitud`/`longitud`/`stop_vitrasa`, and `stop_vitrasa` is numerically equal to the former's `id`, not its `stop_id`.
- `estimaciones[]` fields: `minutos` (integer, minutes), `linea` (string line code, e.g. `"A"`), `metros` (integer, distance in metres — confirmed present and populated with real values 8846/13298 in this live sample, resolving the "unverified distance fields" caution for this specific tested stop/time), `ruta` (string, free-text destination/route description; observed to contain **embedded escaped double quotes**, e.g. `"\"1\" P.E.FADRIQUE por TORRECED"` — any JSON-consuming client must handle this as ordinary string content, not markup).
- `otrosf` (the APK-derived grouping field) is **confirmed absent** from the raw response in this live sample, consistent with `spec.md:36`'s note that it is client-derived, not server-provided.
- Only 2 arrival rows were returned for stop 90 at probe time — both line `A`; this is a live snapshot, not a contract guarantee on cardinality (0, 1, or many rows are all plausible).

### 3.5 Line/service catalogs — verified locale effect

- `TRANSPORTE_LINEAS_ES` and `TRANSPORTE_LINEAS_GA` (8,359 bytes each): array of objects with `descripcion`, `color`, `color_texto`, `imagen`, `orden` (int), `linea`. Two **optional/nullable fields observed**: `destino` and `origen` are present on some entries (e.g. line `C3d`: `"destino":"Encarnación (por G. Barbón)"`, `"origen":"Bouzas/Coia"`) and **absent** on others (e.g. line `C1`: no `destino`/`origen` keys at all, not even `null`) — confirms these two fields are genuinely optional/sparse in the schema, not always-present-with-null.
- `TRANSPORTE_LINEAS_SERVICIOS_ES`/`_GA` (10,864 / 10,867 bytes): array of objects with `descripcion`, `tipo`, `color`, `imagen`, `subtipo`, `linea`. Confirmed locale effect on content: for line `A`, ES gives `"subtipo":"Aeropuerto"` while GA gives `"subtipo":"Aeroporto"` — i.e. the GA/ES `tipo` action choice genuinely changes returned string content (not only which action is called), reinforcing the "selected catalog locale is observable to the provider" note in `spec.md:19`.
- Byte-size difference between ES (8359) and GA (8359, same) / SERVICIOS ES (10864) vs GA (10867) shows the two localized payloads are structurally parallel but not byte-identical, as expected for translated strings.

### 3.6 `TRANSPORTE_LINEA_HORARIOS_EXTEND` — schedule/shape/trip linkage and the `id=A` → C3 anomaly, CONFIRMED and characterized

Request: `?tipo=TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A&dia=1` (and `dia=2`, `dia=3`). Response is a JSON **array of 13 trip objects** (full array parsed from the saved raw bytes of the `dia=1` response; `dia=2`/`dia=3` were verified only on their first array element due to the probe's print truncation — see Gaps).

Full `dia=1` array (13 entries), fields per entry: `date` (string `YYYY-MM-DD`), `num_paradas` (int), `trip_id` (string), `inicio_s` (string, origin stop name), `direccion` (string, destination/direction label), `longitud_metros` (float, route length in **metres**), `dir` (int, `0` or `1` — direction flag), `fin_s` (string, destination stop name), `horarios` (string: comma-separated `HH:MM` departure times, e.g. `"05:56, 07:05, ..."`), `tiempo_s` (string duration label, e.g. `"38min"`), `shape_id` (string, e.g. `"Route_1003"`), `activo` (int, `0` or `1`).

| # | `trip_id` | `shape_id` | `dir` | `activo` |
|---|---|---|---|---|
| 0 | `C3 04LP102_003004_3` | `Route_1003` | 1 | 0 |
| 1 | `20105L0114_201005_2` | `Route_1004` | 1 | 0 |
| 2 | `C3 04LP102_003004_2` | `Route_1005` | 0 | 0 |
| 3 | `A  02LP000_008002_4` | `Route_1005` | 0 | 1 |
| 4 | `A  03LP000_008003_2` | `Route_1006` | 0 | 0 |
| 5 | `L2301LP401_023001_3` | `Route_1006` | 0 | 0 |
| 6 | `A  04LP001_008004_6` | `Route_1007` | 0 | 0 |
| 7 | `REF07LP101_150007_2` | `Route_1014` | 0 | 0 |
| 8 | `REF03LP110_150003_7` | `Route_1020` | 1 | 0 |
| 9 | `A  02LP000_008002_15` | `Route_1156` | 1 | 0 |
| 10 | `A  01LP001_008001_4` | `Route_998` | 1 | 1 |
| 11 | `A  02LP000_008002_3` | `Route_998` | 1 | 0 |
| 12 | `A  03LP000_008003_3` | `Route_999` | 1 | 0 |

**This directly confirms the previously-flagged anomaly is real and reproducible**: `id=A&dia=1` returns array element `[0]` with `trip_id` prefixed `"C3 ..."`, matching `gate-g1-direct-jsp-amendment-review.md:36`'s "the exploratory request with `id=A` returned a first trip for C3." It is now additionally characterized: **the response is not filtered to line A at all** — only 7 of the 13 returned trips have a `trip_id` beginning with `"A"` (padded to a fixed-width 3-char line-code prefix, e.g. `"A  "` with two trailing spaces vs `"C3 "` with one); the remaining 6 belong to lines `C3`, `20105L` (an internal schedule/route code not matching any public `linea` catalog code seen in 3.5), `L2301`, and `REF07`/`REF03` (likely "refuerzo"/reinforcement services). **Working hypothesis, not confirmed**: `id=A` may select trips passing through/near a specific hub or shared corridor (the airport) rather than acting as a strict per-line filter, since `inicio_s`/`fin_s` for every entry in this sample involve airport-adjacent stops. This hypothesis is **not verified against decompiled APK logic** (APK absent, §1) and should be treated as an open question for the normalized contract, not an assumption.

- **Shape/trip linkage order observed**: `shape_id` is **not unique per trip and not unique per line** — it is shared across trips of *different* lines when they traverse the same physical path segment (e.g. `Route_1005` is shared by a `C3` trip `[2]` and an `A` trip `[3]`; `Route_1006` is shared by an `A` trip `[4]` and an `L2301` trip `[5]`; `Route_998` is shared by two different `A` trips `[10]`,`[11]`). This confirms `spec.md:16,40`'s call-chain claim that `shape_id`/`trip_id` are read from the schedule/`info_linea`-equivalent result and used to drive the map (`TRANSPORTE_LINEA_GEOJSON`/`TRANSPORTE_PARADAS_TRIP`), and additionally establishes that **`shape_id` identifies a route geometry/pattern, not a line**, so a normalized schema must model shape as a many-to-many relationship to trips/lines, not 1:1.
- **`dia` parameter semantics — partially characterized, not fully resolved**: `dia=1` and `dia=2` both returned `"date":"2026-10-27"` (the live request date) with byte-identical response size (4028 bytes read, identical first-entry content); `dia=3` returned `"date":"2026-10-21"` (6 days earlier) with the same first-entry `trip_id`/`shape_id`/schedule content, only the `date` field differing in the observed prefix. This suggests `dia` may select a day-type bucket (e.g. weekday/Saturday/Sunday-or-holiday) that the server resolves to the nearest matching calendar date rather than accepting an arbitrary date — but the full array for `dia=2`/`dia=3` was **not re-parsed** in this session (only the first element was inspected via the probe's truncated print), so it is **not fully verified** whether all 13 trips/times are identical across `dia` values or only the sampled first entry. **This remains a partial finding, not full weekday/Saturday/Sunday-holiday parity verification.**
- `tiempo_s`/`horarios` are free-text strings, not machine durations — any contract consuming them needs explicit parsing, they are not ISO 8601.
- `activo` (0/1) meaning is **not independently confirmed** in this session — plausibly "currently operating" given time-of-day, but this is an inference, not a verified server-documented semantic.

## 4. Explicit release blockers / missing evidence (do not treat as resolved)

1. **Decompiled APK/base is unavailable in this environment.** All call-chain claims in `spec.md`/`gate-g1-...md` attributed to static APK analysis (exact request-construction class/method, exact handling of `shape_id`/`trip_id` to drive `TRANSPORTE_LINEA_GEOJSON`/`TRANSPORTE_PARADAS_TRIP`, and any client-side interpretation of `min`/`ttl`) could not be re-verified against source in this session. No file path, hash, or package artifact for the APK was found to even attempt extraction. This is a hard gap, not merely "unverified" — there was literally nothing app-specific to inspect.
2. **`TRANSPORTE_LINEA_GEOJSON`, `TRANSPORTE_PARADAS_TRIP`, and `TRANSPORTE_LINEA_INFO_PARADA` were NOT probed in this session.** The 20-request bounded budget was spent entirely on the other 8 of the 11 actions plus the 3 schedule `dia` variants to directly confirm/characterize the previously flagged `id=A`→C3 schedule anomaly (judged higher-value given it was the standing release blocker). As a direct consequence:
   - **Route/trip geometry CRS is unverified.** Only point-stop coordinates (`TRANSPORTE_PARADA_ID`, §3.2) were confirmed as WGS84-plausible decimal degrees; `TRANSPORTE_LINEA_GEOJSON`'s actual coordinate reference system, axis order, and whether it is valid GeoJSON (RFC 7946, which mandates WGS84/CRS84) remain **unconfirmed**.
   - **`TRANSPORTE_PARADAS_TRIP` ordered-stops schema/order is unverified** (field names, whether `orden`/sequence is 0- or 1-based, whether it returns stop records in the same shape as `TRANSPORTE_PARADA_ID` or a distinct shape).
   - **`TRANSPORTE_LINEA_INFO_PARADA`'s `min` parameter unit/meaning is unverified** — it was never called, so whether `min` is minutes, a minimum-results count, or something else is still only a naming inference, not evidence.
   - CORS headers for these three specific actions are documented elsewhere (`gate-g1-...md:111`, "13 action/parameter cases") as previously tested as HTTP 200 / wildcard CORS, but that prior record is **CORS-only** evidence, not the field/schema/semantic evidence this task required and this session could not add to it for these 3 actions.
3. **`dia` day-type/weekday-Saturday-Sunday-holiday parity is only partially characterized** (see §3.6) — full-array comparison across `dia=1/2/3` was not completed in this session due to the probe's truncated preview output; only the first of 13 entries was compared across `dia` values.
4. **`activo` field semantics are inferred, not confirmed.**
5. **The `20105L0114_...` schedule-internal line code (array entry `[1]`) does not match any `linea` code observed in the `TRANSPORTE_LINEAS_ES/GA`/`_SERVICIOS_*` catalogs probed in §3.5** (which showed codes like `A`, `C1`, `C3d`, `10`, `15B`). Whether this is an internal-only service code, a different line's real code not sampled in the catalog response, or evidence that `TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A` genuinely returns cross-line hub traffic is **unresolved** and should be treated as an open semantic question, not assumed benign.
6. **Request budget is exhausted for this bounded investigation** (20/20 live requests used). Any further live verification (the 3 unprobed actions, full multi-`dia` array diffing, repeat calls to check `activo`/time-of-day sensitivity, or probing additional stop/line IDs for broader nullability coverage) requires a new, separately-authorized bounded session.

## 5. Summary of what IS now verified (safe to cite in contracts/fixtures)

- Base URL, all 11 `tipo` action names, and GET query-parameter construction (`tipo`, `id`, `dia`, `ttl`, `stop_id`, `linea`, `min` — though `min`'s own action was unprobed) are live and real for the 8 actions actually called.
- Response encoding is real ISO-8859-1 (Latin-1) bytes; decode as ISO-8859-1 before JSON parsing to avoid mojibake (§3.1).
- `TRANSPORTE_PARADA_ID` schema: array of `{id:int, stop_id:string, nombre:string, lat:float, lon:float}` (§3.2).
- `TRANSPORTE_LINEAS_PARADA` schema: array of `{linea, descripcion, imagen, orden:int, color}` (§3.3).
- `TRANSPORTE-ESTIMACION-PARADA` schema: `{parada:[{latitud:float, longitud:float, stop_vitrasa:int, nombre:string}], estimaciones:[{minutos:int, ruta:string, linea:string, metros:int}]}`; `stop_vitrasa` equals the queried arrivals `id`, not the municipal `stop_id` (§3.4).
- `TRANSPORTE_LINEAS_ES/GA` and `_SERVICIOS_ES/GA` schemas, with `destino`/`origen` confirmed optional/sparse and GA/ES content genuinely diverging (§3.5).
- `TRANSPORTE_LINEA_HORARIOS_EXTEND` schema (12 fields per trip, table in §3.6); `shape_id` confirmed shared across trips/lines (many-to-many, not 1:1); the `id=A`→C3-first-entry anomaly is confirmed real and is **not** strict per-line filtering (§3.6).

**Overall status**: Partial verification achieved for 8 of 11 actions plus the standing schedule anomaly; 3 actions (`TRANSPORTE_LINEA_GEOJSON`, `TRANSPORTE_PARADAS_TRIP`, `TRANSPORTE_LINEA_INFO_PARADA`) remain unverified for field/schema/semantics in this session; the decompiled APK call-chain source itself remains unavailable for inspection. **These are explicit release blockers**, consistent with the still-open items recorded in `gate-g2-spec-review.md` and the G1 ratification conditions in `gate-g1-direct-jsp-amendment-review.md`.

---

## 6. Addendum: follow-up bounded probes for the 3 previously-unprobed actions (new session, 3 new GET requests, budget exhausted)

**Date/time of this addendum's probes**: 2026-10-27 19:44:17–19:44:20 UTC (2026-10-27 20:44:17–20:44:20 CET), from this workstation. Constraints honored: read-only GET only, no credentials/cookies, sequential ~1/sec, 5 s socket timeout, 256 KiB response cap, plain Python `urllib.request` + `urllib.parse.urlencode` (default `quote_via=quote_plus`, which matches JS `URLSearchParams.toString()` encoding — space → `+`, not `%20`). All three identifiers used (`id=Route_1005`, trip `id="A  02LP000_008002_4"`, `stop_id=2789`/`linea=A`/`min=0`) were taken verbatim from already-recorded evidence in §3.6/§3.2/§3.3 above — no new/brute-forced identifiers. **Total new live HTTP requests issued in this addendum: 3 (budget cap reached).**

**Correction to prior overstatements in §3.6/§4 of this document**: the presence of a `"metros"` field name (§3.4) does **not** by itself establish the unit/meaning of any `min` parameter on a different, unrelated action (`TRANSPORTE_LINEA_INFO_PARADA`) — these are unrelated fields on unrelated actions and must not be conflated. The observation that `shape_id` values are shared across trip records returned by one action (§3.6) does **not** prove any specific internal call chain (i.e., it does not prove that a client app actually calls `TRANSPORTE_LINEA_GEOJSON`/`TRANSPORTE_PARADAS_TRIP` with that `shape_id`/`trip_id` at runtime) — it only shows the identifiers are consistent and joinable across live server responses observed in this session. Separately, the absence of a decompiled APK on this machine (§1) is evidence of **non-availability in this environment/session only** — it does **not** prove that no APK, decompiled source, or prior extraction ever existed; the call-chain claims in `spec.md`/`gate-g1-...md` remain merely **unverified against source in this session**, not refuted.

### 6.1 `TRANSPORTE_LINEA_GEOJSON` id=Route_1005

- Request: `GET https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_LINEA_GEOJSON&id=Route_1005`
- `HTTP 200`, `Content-Type: application/json;charset=ISO-8859-1`, `Access-Control-Allow-Origin: *`.
- Full response body: **34,607 bytes** (not truncated at the 256 KiB cap). `SHA256(raw bytes) = 5fea3f41c7d3a6c8c0df9f7970831f671400e63f3328788fd557298e4ffe7d8f`.
- The full body decodes as ISO-8859-1 and the **entire** decoded text parses successfully as JSON (`json.loads` on the complete 34,607-byte body succeeded without error) — this confirms syntactic JSON validity end-to-end, not just on a truncated preview.
- **Envelope shape, as directly observed in the parsed structure's start**: a **JSON array** whose first (only directly inspected) element is an object with key `"st_asgeojson"`, whose **value is itself a JSON-encoded string** (escaped quotes, e.g. `"st_asgeojson": "{\"type\":\"LineString\",\"coordinates\":[[-8.688419154,42.167978452],...]}"`) — i.e. **double-encoded JSON**: the outer document is JSON, and one of its string field values is, in turn, a serialized GeoJSON `LineString` geometry that a client must parse a second time (`JSON.parse` twice, or equivalent) to obtain actual coordinate arrays. This is a concrete, verified schema fact not previously recorded anywhere in this document.
- **Coordinate format observed** (from the un-escaped inner value): `"type":"LineString"` (a bare GeoJSON **Geometry** object, not a `Feature`/`FeatureCollection` — no `properties` or `geometry` wrapper key present in the visible content), `"coordinates"` is an array of `[lon, lat]` pairs — **2-element** tuples only (no third/elevation value observed in any sampled pair), with longitude first and latitude second, consistent with GeoJSON/RFC 7946 axis order (`[x, y]` = `[lon, lat]`) and with the decimal-degree ranges already established for point stops in §3.2 (sampled values e.g. `[-8.688419154, 42.167978452]`, `[-8.688433173, 42.167978275]`, ... through at least the first ~55 coordinate pairs visible in the 2000-character preview captured).
- **No `"crs"` member was observed** in the visible (first ~2000-character) portion of the inner GeoJSON object, and RFC 7946 GeoJSON treats the coordinate reference system as **implicitly WGS84/CRS84 unless a non-standard `crs` member is present**. **This session did NOT re-inspect the full 34,607-byte decoded value end-to-end for a trailing `"crs"` key, for how many total coordinate pairs the LineString contains, or for whether any additional sibling keys exist alongside `"st_asgeojson"` in the outer object** (the full text was proven to be valid JSON by `json.loads` succeeding on the complete byte stream, but only the first ~2000 characters of the pretty-printed structure were visually captured in this session's console output, and the raw bytes were not persisted to a file for later re-inspection, per instructions not to write extra artifact files and per the 3-request budget cap preventing a repeat fetch). **Therefore: CRS is plausible-but-not-formally-declared (RFC 7946-style implicit WGS84), and this is recorded as still only "decimal-degree-plausible," not a confirmed explicit CRS declaration** — the same caveat already applied to point-stop coordinates in §3.2 is extended here, not resolved beyond that.
- **Relation to trip/shape**: this probe used the literal `shape_id` value `Route_1005` sourced directly from §3.6's schedule table (shared by trip `[2]` `C3 04LP102_003004_2` and trip `[3]` `A  02LP000_008002_4`) — the request succeeded and returned geometry, confirming `shape_id` (not `trip_id`) is the correct/accepted key parameter for this action, and that the identifier format from the schedule response is directly usable here without transformation. This does **not** prove any specific client ever performs this exact call in sequence from the schedule response (see correction above) — it only proves the identifier is valid input to this action.

### 6.2 `TRANSPORTE_PARADAS_TRIP` id="A  02LP000_008002_4" (exact trip_id from §3.6, with internal double space preserved and percent/plus-encoded)

- Request: `GET https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_PARADAS_TRIP&id=A++02LP000_008002_4` (the two literal spaces inside the trip_id were encoded as `++`, i.e. two `+` characters, by `urlencode`'s default `quote_plus`, matching JS `URLSearchParams` behavior exactly — this was verified by inspecting the constructed URL string before the request was sent).
- `HTTP 200`, `Content-Type: application/json;charset=ISO-8859-1`, `Access-Control-Allow-Origin: *`.
- Full response body: **10,023 bytes** (not truncated). `SHA256(raw bytes) = 4d3c72a114c747ac8e8e7844cb9c2a5c435cd896cba0316748b28d85d8797b8a`. Full decoded body parsed successfully as JSON end-to-end.
- **Envelope shape**: a flat **JSON array of stop objects** (not wrapped in any outer keyed object, and not double-encoded like §6.1) — this is a **distinct envelope shape** from both `TRANSPORTE_PARADA_ID` (§3.2, also a flat array but with different field names) and `TRANSPORTE_LINEA_GEOJSON` (§6.1, a singly-keyed-then-double-encoded object).
- **Fields per ordered stop entry** (from the directly observed prefix, first 7+ of what appears to be many entries): `lineas` (string, comma-+-space-separated list of line codes serving that stop, e.g. `"15C, A, U1, U2"` — a denormalized/joined field, not an array), `stop_id` (**JSON string**, e.g. `"3682"` — matches the string-typed `stop_id` convention already established in §3.2, consistent across actions), `lon` (float, negative, decimal degrees), `orden` (**JSON integer, observed starting at 1 and incrementing by 1 per entry**: `1, 2, 3, 4, 5, 6, 7, 8, ...` for the visible prefix — this is a **1-based**, not 0-based, sequence index, and it directly answers the previously-flagged open question in §4 item 2 about ordered-stop sequencing), `id` (integer — this is the same style of numeric "source/arrivals" identifier seen as `id` in `TRANSPORTE_PARADA_ID`, e.g. `8700`, `8740`, `8720`; **not verified in this session whether these numeric `id` values independently resolve via `TRANSPORTE_PARADA_ID`** — that would require a 4th live call, outside budget), `nombre` (string, stop name, e.g. `"Enxeñeiros (CUVI)"`, `"Telecomunicacións (CUVI)"` — correctly-accented Galician text, consistent with ISO-8859-1 decoding per §3.1), `lat` (float, positive, decimal degrees).
- **Field-name note**: this action uses `lat`/`lon` (not `latitud`/`longitud`), matching `TRANSPORTE_PARADA_ID`'s convention (§3.2), **not** the `TRANSPORTE-ESTIMACION-PARADA` arrivals convention (§3.4) — reinforcing that the `lat/lon` vs `latitud/longitud` split is per-action, not a single global inconsistency.
- **Relation to trip**: the request's `id` parameter accepted the literal `trip_id` string (with internal spaces, `+`-encoded) directly as sourced from §3.6 and returned a plausible, ordered (via `orden`), multi-stop list for that specific trip, each stop carrying its own `lineas` membership list — this is consistent with (but does not independently prove) the spec's claim that `trip_id` drives this action to render a stop-by-stop itinerary. **Total stop count for this trip and whether `orden` is contiguous/gapless through the end of the list were NOT verified** — only the first ~13 entries were visible in the captured preview; the full 10,023-byte body was confirmed to be valid JSON overall (via successful full-body `json.loads`) but was not fully re-printed/counted in this session.
- Coordinate values in the visible prefix (e.g. `lat=42.167963445, lon=-8.688421342` for "Enxeñeiros (CUVI)") are plausible real-world Vigo-area (Campus Universitario/CUVI) decimal-degree WGS84-style coordinates, consistent with §3.2's established pattern — again, **no explicit CRS declaration is present in this action's response** (no `crs` key, no projection metadata of any kind observed).

### 6.3 `TRANSPORTE_LINEA_INFO_PARADA` stop_id=2789, linea=A, min=0 (exploratory — `min`'s unit/meaning was unverified before this probe)

- Request: `GET https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_LINEA_INFO_PARADA&stop_id=2789&linea=A&min=0`
- `HTTP 200`, `Content-Type: application/json;charset=ISO-8859-1`, `Access-Control-Allow-Origin: *`.
- Full response body: **774 bytes** (not truncated). `SHA256(raw bytes) = da512440e9189617f8d63e9140bf1dcae08f8b3d4c5dd9cb6cd1f484b9e551cd`. Full body parsed successfully as JSON.
- **Envelope shape**: a flat **JSON array containing exactly one object** in this sample.
- **Fields observed**: `trip_id` (string, e.g. `"A  03LP000_008003_14"` — same 3-char-padded-line-code naming convention as §3.6), `horarios` (string, comma-separated `HH:MM` list — a **long** list of 69 timestamps was returned, e.g. `"19:44, 19:44, 19:48, ..., 20:57, 20:59"`, all for today, 2026-10-27, trailing ≥ the live request's local wall-clock time), `hora_programada` (string `HH:MM:SS`, `"20:59:00"` — matches the **last** entry in the `horarios` list, suggesting this is the scheduled time of the *next upcoming or final relevant* departure, not a single fixed value independent of `horarios`), `sentido` (integer, `0` — likely analogous to the `dir` field in §3.6), `nombre_linea` (string, `"Universidade - Aeroporto"` — matches the line description already seen for stop 2789/line A in §3.3), `shape_id` (string, `"Route_1005"` — **this is the exact same `shape_id` used in §6.1's `TRANSPORTE_LINEA_GEOJSON` probe**, obtained independently via this different action/parameter combination, which cross-confirms `Route_1005` is a real, server-recognized, line-A-associated geometry identifier, not a value only valid as a coincidental schedule-table artifact), `stop_id` (**string**, `"2789"` — echoes the queried `stop_id` back, string-typed, consistent with §3.2), `direccion` (string, `"PEINADOR - AEROPORTO"`), `color_fondo`/`color_front` (hex color strings, `"#77298F"`/`"#FFFFFF"` — `color_fondo` matches the `color` field already seen for line A in §3.3; `color_front` is a new field name not seen in any previously-probed action), `stop_name` (string, `"Aeroporto de Peinador"` — matches §3.2's `nombre` for `id=90`/`stop_id=2789`).
- **`min` parameter meaning: still NOT resolved by this single probe.** With `min=0`, the response returned a **non-empty**, 69-entry `horarios` list and a single trip/object — this is consistent with several un-ruled-out hypotheses: (a) `min` could be a minimum-elapsed-minutes filter that, at `0`, imposes no filtering (showing "all remaining departures today"); (b) `min` could be ignored/a no-op for this stop/line/time combination; (c) `min` could control something else entirely not reflected in this response shape (e.g., a results-count cap that happens not to bind here). **A differential probe (e.g. repeating with `min=30` or `min=120` and diffing the `horarios` list length/content) would be required to discriminate between these hypotheses, and that is outside this addendum's 3-request budget.** This remains an **open, unresolved parameter semantic**, now with one concrete data point (not zero), but not characterized.
- **CORS**: wildcard `Access-Control-Allow-Origin: *` observed directly on this request/response pair in this session (not merely cited from a prior document), consistent with the other two actions probed in this addendum and with all actions previously probed in §3.

### 6.4 Addendum summary of remaining gaps (still release-blocking)

1. **GeoJSON CRS remains not formally declared** — no `crs` member was observed in the visible portion of `TRANSPORTE_LINEA_GEOJSON`'s inner geometry object; RFC 7946 default (WGS84/CRS84) is *plausible* given the coordinate value ranges match known Vigo-area WGS84 decimal degrees, but this is still an **inference from coordinate magnitude**, not an explicit server-declared CRS. The full 34,607-byte body was not fully re-inspected byte-by-byte for a trailing `crs` key due to the exhausted request budget and the instruction not to persist extra working files for later re-reads.
2. **`TRANSPORTE_LINEA_GEOJSON`'s double-JSON-encoding (`st_asgeojson` as a JSON-string-of-JSON) is now a confirmed, novel schema fact** that must be reflected in any client/contract (`JSON.parse` must be applied twice), but the **total coordinate count and whether any outer sibling keys exist** are unverified past the captured preview.
3. **`TRANSPORTE_PARADAS_TRIP`'s ordered-stop schema is now substantially characterized** (flat array, `orden` 1-based integer sequence, `lat`/`lon` float pair, string `stop_id`, integer `id`, `nombre`, `lineas` as a denormalized string list) but the **full stop count for the sampled trip, and whether numeric `id` cross-resolves via `TRANSPORTE_PARADA_ID`, are unverified**.
4. **`TRANSPORTE_LINEA_INFO_PARADA`'s `min` parameter unit/meaning remains unresolved** — only a single `min=0` data point was captured; discriminating probes (varying `min`) are required and are out of this addendum's budget.
5. **Decompiled APK/source remains unavailable in this environment/session** (§1, unchanged) — this addendum did not search for it again per instructions, and its continued absence in this session **is not evidence that it never existed or doesn't exist elsewhere**; the call-chain claims in `spec.md`/`gate-g1-...md` remain **unverified against source**, not refuted, and this is unchanged by any schema/field finding in this addendum (shared/joinable identifiers across live responses, e.g. `Route_1005` appearing in both §6.1 and §6.3, demonstrate identifier consistency across actions — they do **not** demonstrate or prove that any specific client application's call chain invokes these actions in the sequence claimed).
6. **New live-request budget for this addendum is now exhausted (3/3 used).** Any further live verification (full-body re-inspection of §6.1/§6.2, `min` differential probes, numeric `id` cross-resolution) requires a new, separately-authorized bounded session.

**Overall status after this addendum**: 11 of 11 `tipo` actions have now been live-probed at least once across the two sessions combined (8 in the original session + 3 in this addendum). Field/schema facts are now recorded for all 11. **Release blockers remain**: (a) decompiled APK/call-chain source is still unavailable and unverified in any session to date; (b) GeoJSON CRS is still not explicitly/formally declared by the server (inferred-plausible only); (c) the `min` parameter's unit/meaning is still unresolved (one data point only); (d) full-body/total-count verification for §6.1 and §6.2 beyond the captured previews was not completed. This document still does **not** constitute a green light to drop these items from `gate-g2-spec-review.md`'s open-items list.

## 7. G5 follow-up browser observations for the four gated actions

**Date/time**: 2026-10-28 08:13 UTC (09:13 local, Europe/Madrid), from
headless Chromium on the production-profile artifact served at the configured
GitHub Pages base path. These were seven sequential, read-only browser GETs
with `credentials: "omit"`, no retries, and at least one second between
requests. The existing public identifiers from this document were reused; no
identifier enumeration was performed. All requests completed with HTTP 200,
declared `application/json;charset=ISO-8859-1`, and were readable through the
browser CORS path. This is new observational evidence only, not a provider
contract or actor approval.

| Action / parameters | Bytes | Full-response observation |
| --- | ---: | --- |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A&dia=1` | 4,028 | 13 rows; one response date `2026-11-04`; includes A, C3, 20105L, L2301, REF07 and REF03 trip prefixes |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A&dia=2` | 4,028 | 13 rows; one response date `2026-11-03`; same ordered trip IDs and same `horarios`, `shape_id`, and `dir` values as `dia=1` |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND&id=A&dia=3` | 4,028 | 13 rows; one response date `2026-11-04`; same ordered trip IDs and same `horarios`, `shape_id`, and `dir` values as `dia=1` |
| `TRANSPORTE_LINEA_GEOJSON&id=Route_1005` | 34,607 | Outer array with one `st_asgeojson` field; nested `LineString`, 1,243 positions; inner keys are only `type` and `coordinates`; no `crs` member; coordinate bounds `[-8.735707523,42.166468486]` to `[-8.632607307,42.240366088]` |
| `TRANSPORTE_PARADAS_TRIP&id=A++02LP000_008002_4` | 10,023 | 69 stop rows; keys `id`, `lat`, `lineas`, `lon`, `nombre`, `orden`, `stop_id`; `orden` is unique, contiguous, and 1-based from 1 through 69 |
| `TRANSPORTE_LINEA_INFO_PARADA&stop_id=2789&linea=A&min=0` | 535 | One row; `shape_id=Route_1003`; 34 comma-delimited `horarios` values; returns `hora_programada`, `sentido`, stop/line labels and colors |
| `TRANSPORTE_LINEA_INFO_PARADA&stop_id=2789&linea=A&min=30` | 758 | One row; `shape_id=Route_998`; 67 comma-delimited `horarios` values; returned record and times differ from `min=0` |

### G5 interpretation and remaining blockers

- The complete schedule arrays for `dia=1/2/3` have matching trip IDs,
  departure strings, shapes, and direction flags, while their `date` values
  differ. The `dia=1` and `dia=3` dates (`2026-11-04`) are later than the
  observation date (`2026-10-28`). This does **not** establish
  weekday/Saturday/Sunday-holiday meanings or reliable effective dates; it
  shows these three codes cannot currently be mapped to the application's day
  types based on the observed output. Also, `id=A` returns trips associated
  with multiple line prefixes, so it is not safe to treat it as a line-A-only
  schedule ID or publish the rows as one line's timetable.
- Geometry is now fully counted and its complete nested response has no `crs`
  member. Vigo-like coordinate bounds do not prove a coordinate reference
  system; geometry must remain unavailable until authoritative CRS/conformance
  evidence is obtained.
- The sampled trip's full response confirms a 69-stop contiguous 1-based
  sequence. It does not by itself establish the line/day association for every
  row, resolve every municipal stop identity to the application's canonical
  stop record, or prove full-network coverage.
- `min=0` and `min=30` return different trips, shapes and lists, so the parameter
  affects the result. These two observations do not define its unit or selection
  semantics; line-stop detail must remain unavailable.
- This smoke does not verify provider usage policy, rate limits, valid-empty or
  error behavior, 20-stop/10-line identity parity, schedule parity, or actor
  acceptance. It does not authorize enabling any of the four actions.

## 8. Product-owner-authorized provisional assumptions (2026-10-28)

The following are implementation assumptions authorized for fixture-only
evaluation, not additional source evidence. They must be labeled provisional
and cannot be used for local-live or production requests:

- Schedule: treat the public line code as the source `id`; map `dia=1/2/3` to
  weekday/Saturday/Sunday-holiday; keep only rows with an exact matching
  leading trip-code token.
- Geometry: assume OGC:CRS84 for the observed GeoJSON LineString without a
  `crs` member; this does not establish that the provider conforms to RFC 7946.
- Trip stops: treat the requested value as the exact `trip_id`, `orden` as a
  contiguous one-based sequence, and `stop_id` as an exact municipal-code key;
  reject any unknown or line-mismatched stop.
- Line-stop detail: use exact municipal stop/public line identifiers and only
  `min=0`, provisionally interpreted as a minutes threshold. This does not
  establish the parameter's unit or selection behavior.

These assumptions are specified in FR-025, FR-026, FR-031, and FR-032. At the
time of the limited G5 closure, these candidate operations were not enabled in
production. The later exact-scope product-owner authorization is recorded below
and does not close the independent source-evidence gaps.

## 2026-10-28 stakeholder-reported Postman validation

The stakeholder subsequently reported validating the following in Postman:

- Schedule `id=A` belongs to public line A, and `dia=1/2/3` means
  weekday/Saturday/Sunday-holiday.
- GeoJSON `Route_1005` has the confirmed CRS and association with the line/trip.
- Trip `A  02LP000_008002_4` has the confirmed line/day identity and ordered
  stop sequence.
- The `min` parameter is measured in minutes.

This is a user-reported validation, not a captured provider observation. No
Postman collection export, raw response bodies, response headers, timestamps,
or hashes were attached to the report. It does not independently establish
complete response schemas, policy/rate limits, browser CORS for these four
actions, broader line/stop parity, or production readiness. At the time of this
report it supported a strict local-live-only mapping; the later production
authorization is limited to the exact same mappings and is not new evidence:

The stakeholder also reports that CORS works for the candidate actions. No
browser HAR, response headers, origin, or reproducible test record accompanied
that statement. Treat it as user-reported information, not browser CORS
evidence. Previously recorded browser observations remain limited to the
specific actions and runs cited above.

| Action | Local-live scope |
| --- | --- |
| Schedule | `id=A`, `dia=1/2/3`; application filters mixed rows by exact leading A token |
| Geometry | `id=Route_1005`; app records the stakeholder-reported CRS as `OGC:CRS84` |
| Trip stops | `id=A  02LP000_008002_4`; weekday mapping only; municipal stops must resolve in the bundled catalog and match line A |
| Line-stop detail | `stop_id=2789`, `linea=A`, fixed request constant `min=0`; application does not expose a configurable threshold |

The schedule row above records the then-understood codes and is superseded by
the APK day-code correction below (`dia=1/6/0`).

All other candidate parameters are denied before network access. The earlier
paragraphs in this file preserve the original source observations and release
gaps; this addendum records only the later stakeholder report and does not
supersede those gaps as independent evidence. The product owner accepted a
limited G5 closure for the seven supported production actions on 2026-10-28;
the four candidate actions remain production-disabled. This scope decision
records the decision at that time and does not convert the stakeholder report
into independent source evidence. A subsequent explicit product-owner
authorization enables only the exact mappings listed in the 2026-10-28
production-scope amendment below.

## 2026-10-28 APK day-code correction

The user provided the decompiled application source under
`.github/apk/base/assets/www/`. In
`62537.ba7106b52525546f.js`, the schedule selector labels `L`, `S`, and `F` as
laborable, Saturday, and holiday, then maps them in `getDataHorarios` to
`dia=1`, `dia=6`, and `dia=0` before calling
`getVitrasaHorariosLinea(lineaID, dia)`. The request builder in
`main.f6c6fb8dff62506e.js` passes those values as the `dia` parameter of
`TRANSPORTE_LINEA_HORARIOS_EXTEND`.

This directly establishes the APK's intended request-code mapping and
supersedes prior interpretations of `dia=1/2/3` as day types. Bounded live
GETs for `id=A` and `dia=0/1/6` also returned HTTP 200 arrays, but those
responses include mixed trip prefixes and do not establish provider
line-to-schedule identity or complete semantic parity. The schedule mapping is
enabled in production only for the exact `id=A` and `dia=1/6/0` values by the
subsequent product-owner scope amendment; this source inspection is not actor
approval or independent provider evidence.

## 2026-10-28 exact production-scope amendment

The product owner explicitly authorized the following four candidate mappings
for production, without requiring the deferred independent evidence or actor
reviews to be represented as complete:

| Action | Exact production parameters |
| --- | --- |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND` | `id=A`, `dia=1`, `dia=6`, or `dia=0` |
| `TRANSPORTE_LINEA_GEOJSON` | `id=Route_1005` |
| `TRANSPORTE_PARADAS_TRIP` | `id=A  02LP000_008002_4` |
| `TRANSPORTE_LINEA_INFO_PARADA` | `stop_id=2789`, `linea=A`, fixed `min=0` |

This authorization changes the application's allowlist, not the evidence
status: the mappings are not broadly generalized, remaining candidate
parameters stay blocked before network access, and the general stop search and
route summaries continue to use the packaged discovery catalog.
