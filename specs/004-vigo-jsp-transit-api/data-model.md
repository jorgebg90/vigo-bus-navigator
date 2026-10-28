# Data Model — Municipal Browser Boundary v5

Authority: [spec](spec.md), [research](research.md), machine-readable schemas in
[contracts/municipal-transit-v5.openapi.yaml](contracts/municipal-transit-v5.openapi.yaml).
No backend database or REST service is introduced.

## Identities and relationships

| Entity | Fields and rules | Relationships / provenance |
| --- | --- | --- |
| NetworkLineSummary | `id`, `code`, `name`, `color`; optional textColor/displayOrder/serviceType/serviceSubtype | `linea`→code; preserve existing app ID only through verified mapping. `descripcion`→name. Codes are opaque and case-sensitive. No image fetching from source paths. |
| NetworkStop | `id`, `code`, `municipalCode`, `vitrasaId`, `name`, atomic nullable `lat/lon`, `lineIds` | Preserve existing application `id`; `code` remains public display code, not transport key. Detail `stop_id`→municipalCode; `id`→vitrasaId only after verified cross-action correlation. All canonical IDs strings. |
| Arrival | `lineCode`, `destination`, `minutes` | `linea/ruta/minutos`, nonnegative integer minutes, stable ascending wait sort. No eta/provider time synthesized; no metros/otrosf retained. |
| ArrivalReceipt | `stopId`, `vitrasaId`, `fetchedAt`, `arrivals`, provenance | stopId is selected application NetworkStop.id, NOT municipalCode/Vitrasa ID. Fully validated response only; empty requires valid envelope and echoed transport identity. fetchedAt is canonical and provenance.fetchedAt must equal it exactly. Original receipt survives cache reads. |
| ArrivalView | status, ageSeconds, refreshFailed, online, receipt or null, reason | Pure derived view; expires regardless of connectivity. Domain never reads Date/localStorage/fetch directly. |
| LineService | lineCode, dayType, scheduleId, patterns, timetable, provenance | scheduleId is opaque in live profiles; fixture-only provisional evaluation may assume the public code and an explicit day-code mapping. |
| RoutePattern | tripId, nullable shapeId, direction label, departureTimes, providerDate | Source trip/shape references belong to verified line/day selection. Source `date` is service reference date, not data generation or capture time. |
| RouteShape | shapeId, crs, geometry | Source LineString unwrapped from `st_asgeojson`; positions `[lon,lat]`, unchanged. Fixture-only evaluation may assume OGC:CRS84 and must mark it provisional; live use requires source conformance evidence. One shape may serve multiple patterns. |
| TripStopSequence | tripId, stops with sequence and NetworkStop | Validate full array, unique positive `orden`, exact municipal-code lookup, and line membership; fixture evaluation may use the explicit assumptions in FR-032. |
| LineStopDetail | municipalCode, lineCode, patterns, provenance | Fixture-only evaluation uses exact stop/line IDs and fixed `min=0` under the provisional minute-threshold assumption; live use requires verified `min` behavior. |
| Provenance | kind, fetchedAt?, sourceName, evidenceRef?, snapshotDate?, dateKind? | `provisional-fixture` marks synthetic/recorded fixture output based on unverified assumptions; it is never equivalent to municipal verification. Receipt timestamps describe browser receipt only. |
| Favorite | current stop records; preserve any existing line records | Browser localStorage only; stable targetId retained through catalog migration. Unresolved target remains saved/unavailable. No new line-favorite creation flow. |

## Port contracts and ownership

- `ScheduleRepository` evolves to accept a `dayType` for `getLineDetails`,
  expose normalized lines/stops and explicit discovery provenance. Existing
  bundled `DatasetManifest` remains an offline manifest, never manufactured for
  JSP. Static discovery does not claim exhaustive live stop enumeration.
- `ArrivalsGateway.getArrivals(vitrasaId)` returns validated receipt or typed
  failure; `selectStop` owns selected app ID, tokens, polling, view derivation.
  No UI can issue JSP requests or use `stop.code` as a transport fallback.
- Separate `MunicipalTransitPort` methods for catalogs, services, stop detail,
  serving lines, schedule, shape, trip and line-stop context. OpenAPI
  `x-browser-ports` provides operation inputs/outputs. No hosted endpoints.
- `ClockPort`, visibility/connectivity injection, cache port and existing
  `StoragePort` keep domain/application tests independent of browser and network.
- Only infrastructure knows action names, source bytes/envelopes and query
  encoding. Parameter builders preserve interior trip spaces and slashes and use
  URLSearchParams, not concatenation. Disallow controls, unexpected keys/hosts,
  empty/oversized IDs and nonfinite numeric values before network.

## Validation and nullability

- Source observation is not universal schema truth. Source shapes document
  observed fields; optional source metadata is ignored if absent. Missing
  required envelope/identity/minutes is invalid, not silently dropped.
- Fixture-only evaluation may apply the explicit assumptions in spec FR-025,
  FR-026, FR-031, and FR-032. Every dependent result uses
  `provisional-fixture` provenance and a visible warning. The same mappings
  cannot be used by local-live or production.
- Decimal integer source IDs become canonical strings without whitespace or
  numeric coercion that merges distinct IDs. Catalog/schedule/trip identifiers
  remain separate opaque namespaces. Public display code can differ from both.
- Coordinates are both valid numeric values in configured Vigo bounds, or both
  null in NetworkStop. Missing/unusable stop coordinates retain searchable text
  identity but exclude the stop from map placement. Mismatched stop identity
  invalidates the response, not merely coordinates.
- Geometry coordinates must be finite/ranged and validated under verified CRS
  semantics, not just “look near Vigo.” Missing/unverified geometry produces no
  RouteShape; other independently valid data can remain.
- Departure strings are published service times, not an inferred frequency band.
  Normalize only `00:00`–`23:59` under this contract. Reject `24:00`–`47:59` as
  unverified rather than coerce modulo 24; accepting extended hours requires
  provider evidence, a contract change and Architect/Backend/QA re-review. Do not fabricate
  DayService first/last/bands or holiday availability. Current snapshot bands
  stay available only under the provenance rule.
- Client limits: 256 KiB bytes/action, 10,000 rows/positions, 128 chars/ID,
  2,048 chars/text and 5 s total deadline. Limit violation rejects the whole
  operation; no partial arrivals published.

## Arrival state transitions

1. Select stop → resolve verified vitrasaId; absent ID → unavailable without GET.
2. No receipt + in-flight → loading. Validated response → receipt/valid-empty,
   timestamp only after complete validation.
3. Age <30 s → current or empty; offline adds cached/offline provenance.
4. Age >=30 s and <300 s → refreshing until failure; after refresh failure →
   stale (including stale-empty). Pending request cannot relabel old data current.
5. Age >=300 s → unavailable, suppress actionable rows, even offline/in-flight.
6. Success replaces receipt and clears failure. Failure never advances fetchedAt.
   At resume/reopen compute age before render; reject future/invalid timestamps.
7. New selection/day/locale invalidates prior result tokens; late results cannot
   overwrite current selection or produce wrong-language catalog associations.

Failure reasons: `transport` (browser cannot reliably separate CORS from network),
`timeout`, `rate-limited`, `http`, `invalid`, `oversized`, `identity-unverified`,
`mapping-unverified`, `offline`. Only sanitized categories reach developer
diagnostics; rider messages follow [design baseline](design-baseline.md).

## Snapshot selection and persistence migration

Online JSP failure does not become silent snapshot success. Exact selected
line/day/direction may show a separately labeled bundled timetable only with
trusted source/evidence/date. No trustworthy date → timetable unavailable.
Retain files until supported-line × weekday/Saturday/Sunday-holiday parity.

Do not reset or rewrite favorite identities on source migration. The existing
`vbn:v1:favorites` envelope is version 1 and its loader filters/deletes line
favorites; it **must be replaced for this migration**:

1. Define `SavedFavorite` as `{type:'stop'|'line', targetId:string,
   order:number, lastKnownLabel?:string}` and update StoragePort, domain and
   Saved view. Existing creation remains stop-only; lines are preserved legacy
   records. Identity namespace remains the application targetId, not a JSP ID.
2. Read `vbn:v2:favorites` `{v:2,data:SavedFavorite[]}` first if completely valid.
   Otherwise read original v1 bytes without calling the destructive old loader.
   Validate all entries before persistence. Preserve type/targetId/order exactly,
   including unresolved identities; add labels only when verified or already
   retained. Do not renumber or deduplicate away distinct records.
3. If all v1 entries are structurally valid stop/line records, write the full
   v2 envelope with one setItem. Leave v1 unchanged (including after success);
   no automatic legacy-key deletion in feature 004. Reopen reads v2, so migration
   is idempotent and subsequent user remove/reorder changes do not resurrect v1.
4. If any entry/type/envelope is malformed or an unknown future version, preserve
   its original bytes in place. Recover recognized records in memory with a
   persistence warning, but do not overwrite the source or an invalid existing
   v2 record. Explicit user recovery may be designed later; no silent data loss.
5. On quota/access failure, retain source keys and recovered in-memory records,
   report `persisted:false` and do not claim the migration saved. Corruption
   recovery never makes network calls or logs raw saved data.
6. Saved resolves verified stop and line IDs separately. Unknown valid identities
   stay available to remove, with lastKnownLabel if safe; otherwise “Saved stop
   unavailable”/“Saved line unavailable,” never raw IDs. No network request can
   include the saved collection. Preferences and recent-view keys remain unchanged.

Tests replace the old “discard legacy line favorites” expectation with lossless
mixed-stop/line migration, preserved order/IDs, idempotent reopen, mapped versus
unresolved navigation, malformed/unknown-version non-overwrite, quota/access
failure, safe labels, user removal after migration and zero profile leakage.
Public response memory caches are not user history; no new localStorage
arrival/activity cache is planned.

Migration corruption and quota/access states use the
`design-baseline.md` Saved persistence-warning table: original/last-confirmed
saved data retained, valid recovered items available in this tab, persistence
explicitly unconfirmed and changes possibly lost on close. A polite banner
never exposes raw data or falsely announces success.
