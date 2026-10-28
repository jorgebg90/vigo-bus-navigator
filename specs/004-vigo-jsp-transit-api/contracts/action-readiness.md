# Action Readiness and Validation Matrix

Original date: 2026-10-27. Implementation amendment: 2026-10-28.
“Fixture” means deterministic test coverage and not provider-observation proof.
The 2026-10-28 G5 browser follow-up adds bounded observations for the four
actions below. The stakeholder subsequently reported validating the listed
line-A mappings and semantics in Postman. This report is not an attached raw
capture or independent provider evidence. On 2026-10-28, the product owner
explicitly approved these exact parameters for production; it does not approve
arbitrary IDs or broader mappings.

## Profile and release policy

- All eleven action names below have deterministic fixture validators and
  parameter tests.
- Local development and production directly call the eight general supported actions
  (the seven original actions plus `TRANSPORTE_PARADAS`).
  The application uses GET, the fixed host, omitted credentials, bounded
  responses, and action-specific validation.
- Arrivals are enabled for live profiles. `ttl=5` remains a required request
  parameter, not a verified cache guarantee; client freshness remains
  independent of its source-side effect.
- Schedule/geometry/trip stops use the online catalog for every line in
  local-live and production (see the online catalog amendment). Line-stop
  detail is enabled only for the exact stakeholder-reported mapping below;
  other stops, lines and parameters return `mapping-unverified` before network
  access.
- Fixture mode may exercise the four candidate actions with the spec's explicit
  inferred mappings. Any normalized output must carry provisional provenance
  and be visibly labeled as unverified. These fixture calls use synthetic or
  recorded bytes only; they never make municipal network requests.
- Product-owner direction on 2026-10-28 enables the seven general actions and
  the four exact line-A candidate mappings below in production. This is a
  narrow scope amendment based on the APK request mapping and stakeholder-
  reported Postman validation, not independent provider evidence or broad
  readiness approval.
- Enablement is an explicit checked-in action capability table, independent of
  “local-live” selection. Selecting a profile never bypasses capability checks.
- The HTTP client enforces this capability table again at the transport
  boundary; a direct adapter/client call cannot schedule a disabled action in a
  live profile. Fixture mode alone allows all contract actions for deterministic
  tests.
- The seven general actions are enabled in local-live and production. Both live
  profiles additionally permit only the four exact candidate mappings below.
- A disabled or out-of-scope action may use synthetic byte fixtures to build/test
  validators. Fixture success is not provider semantic approval or permission to
  enable live.

## Online catalog amendment (2026-10-28)

On 2026-10-28 the product owner directed the application to use the online
municipal catalog instead of the bundled discovery catalog, for every line.
The request mapping mirrors the official Vigo app bundled in `.github/apk`:

| Action | Live parameters | Source of the mapping | Enforcement |
| --- | --- | --- | --- |
| `TRANSPORTE_PARADAS` | none | Official app stop list; 1,157 stops observed, `stop_id` = municipal code, `id` = Vitrasa ID, `lineas` = public line codes | Validate every row, Vigo coordinate bounds and unique identities; fall back to the bundled catalog with its notice when unavailable |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND` | `id=<public line code>`, `dia=1/6/0` | Official app passes the catalog `linea` code and renders every returned row | Keep all rows (block codes in `trip_id` are not line identity); group departures by `dir`/`direccion`; times split on `", "` |
| `TRANSPORTE_PARADAS_TRIP` | `id=<schedule trip_id>` | Official app resolves trip stops from schedule rows | One representative trip per direction (active first, then most departures); contiguous order and known municipal stops required |
| `TRANSPORTE_LINEA_GEOJSON` | `id=<schedule shape_id>` | Official app draws the schedule-row shape | Full LineString validation; `OGC:CRS84` recorded |

These three line actions accept any identifier that passes the request
builder in local-live and production. `TRANSPORTE_LINEA_INFO_PARADA` remains
limited to the exact mapping below. The fixture profile keeps the bundled
catalog and provisional exact mappings so automated tests stay deterministic.
The exact line-A rows below are superseded for schedule, geometry and trip
stops and are kept as history.

## Product-owner-approved exact candidate mappings

The stakeholder reported successful Postman validation of these associations:

| Action | Exact live parameters | Reported validation | Additional enforcement |
| --- | --- | --- | --- |
| `TRANSPORTE_LINEA_HORARIOS_EXTEND` | `id=A`, `dia=1/6/0` | APK maps codes 1/6/0 to weekday/Saturday/Sunday-holiday; scoped schedule mapping belongs to line A | Filter mixed rows by the exact leading public line token; reject malformed A rows; only these three requests are allowed |
| `TRANSPORTE_LINEA_GEOJSON` | `id=Route_1005` | CRS and association to the line/trip were confirmed | Application records `OGC:CRS84`; only this shape is enabled in production |
| `TRANSPORTE_PARADAS_TRIP` | `id=A  02LP000_008002_4` for weekday only | Line/day/trip identity and stop order were confirmed | Resolve municipal stop IDs against the bundled catalog; enforce line A membership and contiguous source order; do not reuse for weekend days |
| `TRANSPORTE_LINEA_INFO_PARADA` | `stop_id=2789`, `linea=A`, fixed request constant `min=0` | Stakeholder reports that `min` is measured in minutes | Only `min=0` is sent by the application; no configurable threshold behavior is claimed |

The report was supplied in conversation and no Postman export, raw response,
headers, or response hashes were attached. Treat it as stakeholder validation,
not independent provider evidence. The product owner explicitly approved the
exact mappings above for production on 2026-10-28; default fixture tests stay
synthetic, and no other candidate identifiers are enabled. G5's earlier
limited seven-action closure and waived evidence remain as recorded in its
review; this narrow production scope amendment is not retroactive actor
approval or a claim that deferred evidence passed.

## Per-action evidence and planned fixture coverage

All rows require: exact query builder/allowlist test (missing required keys,
unknown keys/action, malformed IDs, wrong namespace, controls/oversized values,
encoding), bounded read/decode/schema checks and failure-state mapping.
Production browser checks use the same path as local-live and omit credentials.
The 2026-10-28 browser smoke below is bounded evidence for the general supported set,
not a complete source-policy, empty/error, rate-limit, or parity corpus.

| Action | Planned deterministic validator/fixture checks | Current provider observation | Local-live | Production and remaining limitations |
| --- | --- | --- | --- | --- |
| TRANSPORTE_LINEAS_ES | Exact tipo only; Latin-1 accents; sparse metadata; duplicate IDs; invalid colors; full-array validation | Browser GET 200, 8,359 bytes, array of 44; single-byte accented bytes | Enabled | Enabled; full public-line completeness corpus remains open |
| TRANSPORTE_LINEAS_GA | Same plus gl→GA and es/en never→GA; catalog locale race | Browser GET 200, 8,359 bytes, array of 44 | Enabled | Enabled; full locale/line identity corpus remains open |
| TRANSPORTE_LINEAS_SERVICIOS_ES | Exact tipo only; join by linea; metadata not inferred timetable; sparse fields | Browser GET 200, 10,864 bytes, array of 72 | Enabled | Enabled; full joins/day-coverage expectations remain open |
| TRANSPORTE_LINEAS_SERVICIOS_GA | Same plus fixed gl mapping, no separate locale parameter | Browser GET 200, 10,867 bytes, array of 72; localized text differs | Enabled | Enabled; full locale joins remain open |
| TRANSPORTE_PARADA_ID | id in Vitrasa namespace; exact requested identity; cardinality zero/one/multiple; atomic coordinate nulls | Browser GET `id=90` 200, 99 bytes, array of 1; maps to municipal 2789 | Enabled | Enabled; 20-stop corpus remains open |
| TRANSPORTE_LINEAS_PARADA | id municipal only; full serving-line association, no arrival ID substitution | Browser GET `id=2789` 200, 119 bytes, array of 1, line A | Enabled | Enabled; broader stop-line membership corpus remains open |
| TRANSPORTE-ESTIMACION-PARADA | id Vitrasa, ttl exactly5; parada echo; required estimaciones; stable minutes sorting; valid-empty vs missing; canonical receipt equality | Browser GET `id=90&ttl=5` 200, 281 bytes; matching stop echo and two normalized estimates; ttl semantics unknown | Enabled | Enabled; client does not rely on ttl for freshness; empty/error corpus and 20-sample timing remain open |
| TRANSPORTE_LINEA_HORARIOS_EXTEND | Scoped mapping `id=A`, `dia=1/6/0` → weekday/Saturday/Sunday-holiday per APK selector and request code; retain exact leading trip-code matches only; reject malformed target rows and invalid times. Fixture remains provisional | APK call chain maps L/S/F to 1/6/0; live `id=A` requests returned mixed-line arrays for each code | **Exact line-A/day requests only** | Product-owner approved exact mapping in production; other IDs and day codes remain denied; full parity evidence deferred |
| TRANSPORTE_LINEA_GEOJSON | Stakeholder-reported `Route_1005`/line-A association and OGC:CRS84; decode outer and inner JSON, validate all positions, preserve order. Fixture remains provisional | Browser GET `Route_1005`: 34,607 bytes, 1,243 positions, nested LineString, no `crs` member | **Exact `Route_1005` only** | Product-owner approved exact mapping in production; all other shapes remain denied |
| TRANSPORTE_PARADAS_TRIP | Stakeholder-reported exact trip `A  02LP000_008002_4`; contiguous 1-based `orden`, exact municipal `stop_id` lookup, and line-A membership; reject any mismatch. Fixture remains provisional | Browser GET exact trip ID: 10,023 bytes, 69 rows, unique contiguous `orden` 1–69 | **Exact trip only** | Product-owner approved exact weekday mapping in production; full canonical-stop parity remains deferred |
| TRANSPORTE_LINEA_INFO_PARADA | Stakeholder reports `min` is measured in minutes; fixed `min=0`, exact stop `2789`/line A, and exact leading trip token. No configurable threshold; keep `shape_id` opaque. Fixture remains provisional | Browser GET `stop_id=2789&linea=A`, `min=0/30`: both one row; trip/shape/time lists differ | **Exact stop/line only** | Product-owner approved exact mapping in production; other stop/line pairs and `min` values remain denied |

## Evidence classes must not be conflated

### Provider observations (release proof)

Known public source requests, raw byte hashes and sanitized fixtures establish
observed field types/encoding, identifier relationships, day/schedule mappings,
CRS/order and documented source policy. A sample proves only its tested
conditions; it does not establish universal nullability, usage authorization or
limits. Browser CORS requires real browser fetch, not curl/urllib. Missing APK
source is not invented: recover a lawful path/hash or obtain equivalent auditable
provider evidence and affected review. This workflow did not inspect that source.

### Synthetic deterministic fixtures (rejection/behavior proof)

Construct malformed JSON/HTML, missing envelopes, wrong echoed IDs, wrong line/
day/shape/trip association, duplicate/gapped/reversed sequence, geometry malformed
tail/axis mismatch, unsupported charset, partial/oversized streams, delayed
reads, rate/error status and absent optional/null data. These prove the client
rejects or renders correctly; they do not prove the provider actually returns
those cases. Do not probe arbitrary IDs to manufacture errors.

Empty fixtures validate client handling only. A source empty observation is
separate evidence, with its valid envelope and requested context. Normalized
output tests additionally enforce timestamp equality, selected app-stop vs
transport ID, strict age thresholds, future/invalid clock behavior and
safe rider/internal error separation.

### Provisional evaluation and live-readiness rule

Unconstrained SourceLineStopRow properties and `st_asgeojson` string compilation
are **not semantic validators**. Fixture-only evaluation must use explicit
provisional mappings, strict decoded-body validators, negative relationship
tests, and provenance that the UI renders as provisional/unverified. Any actor
approval at the reopened G5 gate covers this evaluation implementation only.
The four exact stakeholder-reported mappings above are enabled by an explicit
product-owner scope amendment, not independent source evidence or broad
production approval. All other identifiers and parameters remain denied.
A normalized schema passing Ajv is necessary but not sufficient for any
additional production scope.
