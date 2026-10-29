# Research — Direct Municipal JSP Integration

Date: 2026-10-27. Scope: planning only; no runtime changes.
G1: constitution v2.1.0, commit `fdde5b1`. G2: [closed](gate-g2-spec-review.md).

## Evidence and confidence

Primary session observations are in [source-evidence.md](source-evidence.md).
The research actor performed 20 bounded GETs, then a separate three-request
geometry/trip/line-stop follow-up. Those are CLI transport/schema observations,
**not new browser CORS tests**. Prior localhost/browser and 13 wildcard-header
cases are recorded in [spec.md](spec.md); they are historical observations, not
a complete reproducible semantic/release corpus.

The local POC constructs queries using `URLSearchParams`, targets the fixed JSP
and omits credentials. It exercises only stop and arrivals, and also contains an
exploratory POST path that production must not inherit. The referenced APK/base
was not located in this session. Its request-builder and schedule-selection
class/method chain therefore could not be independently inspected. Prior APK
claims remain attributed discovery, not newly verified facts. No proprietary
code is reproduced. Recovering a lawful local artifact/path/hash is an OPEN
evidence action; never fabricate the missing call chain.

### D1 — Direct transport, not another server API

- **Decision:** One browser infrastructure adapter calls
  `https://datos.vigo.org/vci_api_app/api2.jsp`, GET only, `credentials: 'omit'`,
  fixed action/parameter table. Default local/test profile uses the same
  normalizers with deterministic fixtures; local-live is opt-in. Production
  is disabled until release evidence is complete.
- **Rationale:** Constitution I/IV/V/VI. Wildcard CORS can be host independent;
  success does not establish payload correctness.
- **Alternatives:** Worker/proxy, arbitrary upstream URL, POST and automatic
  alternate sources rejected. Hosting is permanently zero-cost static HTTPS,
  not necessarily GitHub Pages.

### D2 — Decode bytes before parsing JSON

- **Decision:** Stream a bounded response, decode the declared, supported
  ISO-8859-1 encoding with browser `TextDecoder('iso-8859-1')`, then parse JSON.
  Do not use `response.json()`/`response.text()` for the observed Latin-1 source.
  WHATWG maps this decoder label to Windows-1252; add distinguishing 0x80–0x9F
  fixtures and reject/resolve control-byte ambiguities rather than claim full
  byte-for-byte provider encoding coverage. Permit UTF-8 only when declared and
  validated; unsupported or contradictory content type/charset is invalid.
- **Evidence:** Actual non-UTF-8 accented bytes in ES/GA catalog/service data;
  single-byte decoding recovered expected text. ASCII-only observations do not
  independently distinguish encodings. See source evidence §3.1/§6.
- **Alternatives:** UTF-8 default causes decode failure/replacement characters;
  post-hoc mojibake string replacement rejected.

### D3 — Action-specific stop identity

- **Decision:** Canonical IDs are strings, never interchangeable. Stop detail
  `id: 90` correlates with arrivals `parada[].stop_vitrasa: 90`; municipal
  `stop_id: "2789"` is used for lines-per-stop. Stop detail uses `lat/lon`;
  arrivals embeds `latitud/longitud`. Normalize only after identity checks.
- **Evidence:** Same public airport stop/name/coordinates and ID equality across
  responses. One-stop confirmation is not the SC-002 20-stop corpus.
- **Alternatives:** Guessing `stop_vitrasa` in stop-detail, substituting municipal
  ID in arrivals, or assuming matching numeric strings imply identity rejected.

### D4 — Schedule IDs and day semantics remain unresolved

- **Decision:** Keep public line code, source schedule ID, day code, trip ID and
  shape ID separate. A verified resolution table is required before schedule
  live operation is enabled. No prefix-based trip filtering or first-row choice.
- **Evidence:** `id=A&dia=1` returned 13 rows including C3 and A trip prefixes;
  shapes are shared across trip rows. Day codes `1/2/3` were queried, but
  weekday/Saturday/Sunday-holiday meanings and returned dates are not proven.
  No verified schedule-ID field was found in the catalog.
- **Alternatives:** Treat public `linea` as schedule ID, infer line from trip
  prefix, infer day semantics from parameter numbers, or invent an `info_linea`
  wrapper rejected. Observed schedule response is a top-level array.
- **Status:** The day-code meaning is superseded by the 2026-10-28 APK
  correction below. Schedule-ID association and mixed-row semantic verification
  remain unverified evidence gaps. The original production-disabled status was
  later superseded by the exact product-owner authorization recorded in
  `source-evidence.md`; no broader mapping is authorized.

### D5 — Geometry and ordered trip stops

- **Decision:** Source geometry is a JSON array containing `st_asgeojson`, itself
  a JSON string containing a LineString. Validate both layers. Preserve original
  coordinate order and values. Normalize only to a declared CRS policy; do not
  reproject or synthesize straight lines. Store trip stops in validated `orden`
  order, checking duplicate/gap/inconsistent identities before publishing.
- **Evidence:** Follow-up for `Route_1005` and exact trip
  `A  02LP000_008002_4`: plausible Vigo `[longitude, latitude]` coordinates, no
  explicit `crs` observed; stop array includes `orden`, municipal `stop_id`,
  source `id`, name, lat/lon and denormalized `lineas`.
- **Limits:** Full geometry/trip structural counts were not retained as fixtures;
  CRS is plausible, not verified by range alone. RFC 7946 defines implicit WGS84
  for conforming GeoJSON; provider conformance still needs evidence. No
  first-element-only validation is acceptable in implementation.
- **Alternatives:** Swap axes heuristically, sort stops geographically or treat a
  shape as a unique line rejected.

### D6 — Optional source values and unproven semantics

- **Decision:** `metros` remains raw-only; do not expose `distanceMeters` until
  units and meaning are independently verified. Do not retain APK-style `otrosf`;
  keep individual estimates sorted stably by minutes. Optional typed
  `followingMinutes` is unnecessary. `ttl=5` is a fixed compatibility parameter,
  never a guarantee of five-second freshness. `min` on line-stop requests is
  provisional; block live line-stop use until its meaning/unit is established.
- **Evidence:** `metros` is numeric and populated, which alone proves neither
  distance origin nor units. Line-stop `min=0` returned a schedule array and
  shape/trip references, but a single sample cannot establish filtering semantics.
  Catalog origin/destination are sparse; absence is observed, universal
  nullability is not. Service metadata is not itself a timetable.
- **Alternatives:** Derive provider ETA/generation timestamps, use raw HTML/image
  paths or blindly interpret field names rejected.

### D7 — Browser receipt freshness and local public cache

- **Decision:** `fetchedAt` is receipt after successful body/schema/identity
  validation. Store that original timestamp. Derive age and status through an
  injected clock; no clock skew can make negative age current. Current <30 s;
  refresh-due at 30 s; stale only after failed refresh in [30,300); unavailable
  >=300 s. Successful empty has the same aging policy. Offline is a provenance/
  connectivity qualifier, never an age bypass.
- **Rationale:** FR-014 and G2 precedence table; no verified provider timestamp.
- **Alternatives:** Worker headers/`generatedAt`, reset-on-read timestamps and
  indefinite offline arrivals rejected.

### D8 — Bounded work and performance budgets

- **Decision:** 5 s total operation deadline (including body read, decoding and
  validation); 256 KiB source body cap per action; 10,000 rows and 10,000 geometry
  positions maximum within that byte cap; 2,048 characters per textual field
  (128 per identifier). These are **client safety limits**, not known source
  limits. Stream/count bytes even without Content-Length and cancel excess.
  JSON/geometry synchronous validation must also stay within the deadline.
- One in-flight arrivals request per stop, selected stop only, 30 s foreground
  refresh, no background fetch, no automatic retries, global maximum two
  concurrent source requests and at least 1 s between request starts. Coalesce
  duplicate action/parameter keys. Local-live smoke max 20 sequential samples,
  one/second, never in CI. Respect Retry-After with no retry during its window.
- Arrivals cache: memory-only LRU, 20 stops, 512 KiB serialized UTF-8 maximum,
  expiry at 300 s. Reopening cached results preserves receipt. Catalog/service
  public cache: max 4 MiB, 100 entries, LRU, 24-hour retention; old data remains
  labeled cached and is not a provider-validity claim. Do not persist these
  caches or arrival requests as an activity history.
- Offline uses existing packaged public assets with explicit provenance.
  Only user preferences/favorites/history go through localStorage storage port;
  never persist cookies or raw provider payloads.
- Preserve existing size-limit gates and first-map-ready JS+CSS <=500 KiB gzip;
  no new runtime dependency. Loading feedback within 1 s; terminal operation
  <=5 s; healthy live sample target >=19/20 valid arrival lookups <=5 s.
- **Alternatives:** Poll all stops, unrestricted prefetch, retry storms and
  unbounded browser persistence rejected. Unknown municipal usage/rate policy
  remains a release review item; client limits do not establish authorization.

### D9 — Compatibility, discovery, snapshots and favorites

- **Decision:** Preserve v3/v4 historical files byte-for-byte. V5 describes
  actual JSP HTTP plus in-browser schemas/ports, not `/api/v5`. Keep compatible
  line/stop/arrival fields where truthful; remove synthetic provider metadata.
  [Compatibility matrix](contracts/README.md) records breaks.
- Approved actions do not enumerate all stops. Keep existing bundled discovery
  index as a visibly labeled seed, hydrate selected stops and verified trips
  through JSP; do not scan arbitrary IDs or invent a new enumeration action.
  Release must establish catalog completeness/search parity, not merely one stop.
- Keep snapshot files; show a timetable only for the exact verified line/day/
  direction with named source and trustworthy dated evidence. A build date is
  insufficient. Otherwise unavailable. No retirement before three-day parity.
- Preserve existing favorite keys/identities and unresolved records. Current
  domain only creates stop favorites; preserving legacy/imported line favorites
  is compatibility support, not authorization for a new favorite-line feature.
- G3 inspection found the current v1 loader destroys non-stop favorites; the
  migration must replace it with a lossless v2 reader/writer, retain original
  bytes, and update domain/ports/Saved rendering. See `data-model.md`.
- **Alternatives:** Delete saved data, infer identifiers, silently replace online
  failures with snapshots, or claim a generated bundle date proves timetable
  validity rejected.

## OPEN release evidence register

| ID | Missing verified evidence | Owner / gate |
| --- | --- | --- |
| R1 | Not required for this feature's G5: APK artifact/path/hash and request-builder/schedule-selection chain, plus independent `ttl`/`min` verification, waived by product-owner decision (2026-10-28). Their unverified status remains historical context, not a release blocker. | Waived for this feature's G5 |
| R2 | Schedule-ID/public-line association and all three day-code meanings; reject cross-line rows — evidence deferred by product-owner scope amendment (2026-10-28); the exact mappings are separately authorized for production, not generalized | Future spec |
| R3 | Full-body geometry schema/CRS and trip identity/order corpus — evidence deferred by product-owner scope amendment (2026-10-28); the exact mappings are separately authorized for production, not generalized | Future spec |
| R4 | Sanitized raw byte fixtures + hashes across actions, empty/error/oversize/null variants and charset edge bytes — deferred by product-owner scope amendment (2026-10-28) | Future spec |
| R5 | Browser fetch record for all actions/classes tied to commit/time/runtime/size/schema/CORS — deferred by product-owner scope amendment (2026-10-28); only observations explicitly captured above are evidence | Future spec |
| R6 | 20-stop/10-line identity/catalog corpus; supported-line × 3-day snapshot parity and trustworthy snapshot dates — deferred by product-owner scope amendment (2026-10-28); catalog remains non-exhaustive and no unverified timetable fallback is shown | Future spec |
| R7 | Source usage policy/limits, error/rate behavior and healthy 20-sample timing — deferred by product-owner scope amendment (2026-10-28); no provider guarantees are claimed | Future spec |
| R8 | Manual WCAG/design fidelity and profile/network isolation evidence — deferred by product-owner scope amendment (2026-10-28); no full WCAG-conformance claim | Future spec |

These remain explicit unresolved historical questions. The product owner
accepted them as exceptions for the limited seven-action G5 closure; they are
not silently resolved, verified, or converted into provider guarantees.

## G3 review clarifications

- [action-readiness.md](contracts/action-readiness.md) separates deterministic
  validation/rejection tests from provider-observed semantics. The product owner
  enabled the seven supported actions as a scoped production set; the four
  candidate actions remain unavailable in live profiles.
- Canonical receipt `ArrivalReceipt.fetchedAt` must equal provenance.fetchedAt;
  stopId is selected application identity. Enforce those semantic equalities in
  normalizer/application tests, not merely JSON Schema compilation.
- Published normalized times are limited to 00:00–23:59 until extended-hour
  semantics are verified and the contract is re-reviewed.

## 2026-10-28 provisional-evaluation amendment

The product owner authorized explicit extrapolations for deterministic
fixture-only evaluation, with visible provisional labeling and a reopened G5
review before any candidate action is enabled in a live profile. These are
product assumptions, not research findings:

- Schedule evaluation assumes `id` is the public line code, `dia=1/2/3` means
  weekday/Saturday/Sunday-holiday, and only rows whose exact leading trip-code
  token matches the requested line are retained.
- Geometry evaluation assumes OGC:CRS84 for the observed GeoJSON LineString
  without a `crs` member; this does not establish provider conformance.
- Trip-stop evaluation assumes the requested `id` is the exact trip ID,
  `orden` is a contiguous one-based sequence, and `stop_id` maps by exact
  equality to a known municipal stop code, subject to line-membership checks.
- Line-stop evaluation assumes fixed `min=0` is a minute threshold and uses
  exact municipal-stop/public-line identifiers. No other `min` value is
  evaluated.

Fixture evaluation cannot make network requests or promote these assumptions
to provider facts. R1–R3 and R7 remain live-readiness blockers. Reopened G5 may
approve only the fixture implementation/labels; separate verified evidence and
an explicit readiness decision are required before local-live or production
enablement.

## 2026-10-28 APK day-code correction

The user-provided decompiled application source is available under
`.github/apk/base/assets/www/`. Its timetable selector labels are
`TRANSPORTE-LABORABLE`, `TRANSPORTE-SABADO`, and `TRANSPORTE-FESTIVO`; the
schedule component maps its internal `L`, `S`, and `F` values to request codes
`1`, `6`, and `0`, respectively, before calling
`getVitrasaHorariosLinea(id, dia)`. This supersedes the earlier provisional
`1/2/3` day-type assumption. It resolves the APK's intended code mapping, but
does not independently prove source-provider semantics, the public line to
schedule-ID relation, or production readiness. The later exact production
authorization is a separate product-owner scope decision documented in
`source-evidence.md`; it does not change this evidence status.
