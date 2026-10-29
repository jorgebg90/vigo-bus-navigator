# Contract v5 — Browser Adapter, Not a Hosted API

[municipal-transit-v5.openapi.yaml](municipal-transit-v5.openapi.yaml) is OpenAPI
3.1.0, `info.version: 5.0.0`. Its sole HTTP path is the actual municipal
`/vci_api_app/api2.jsp` GET. `x-source-actions` defines the action-dependent
query/response rules; OpenAPI query parameters alone cannot express cross-field
requirements. `x-browser-ports` references normalized in-process schemas, not
HTTP endpoints. There is no `/api/v5`, Worker, proxy or deployed normalization
server. No authentication scheme is required or permitted.

## Exact source request allowlist

No keys other than those listed are allowed. All actions require `tipo`.
Do not trim/alter opaque trip IDs; URL-encode them with URLSearchParams.

| tipo | Additional required keys | Identifier meaning / readiness |
| --- | --- | --- |
| TRANSPORTE_LINEAS_ES / TRANSPORTE_LINEAS_GA | none | es/en→ES, gl→GA; observed arrays |
| TRANSPORTE_LINEAS_SERVICIOS_ES / TRANSPORTE_LINEAS_SERVICIOS_GA | none | same locale mapping; metadata, not timetable |
| TRANSPORTE_PARADA_ID | id | verified arrivals/source ID, e.g. 90 |
| TRANSPORTE_LINEAS_PARADA | id | municipal stop_id, e.g. 2789 |
| TRANSPORTE-ESTIMACION-PARADA | id, ttl=5 | verified Vitrasa ID; ttl behavior unknown |
| TRANSPORTE_LINEA_HORARIOS_EXTEND | id, dia | **source schedule ID**; APK maps `dia=1/6/0` to weekday/Saturday/Sunday-holiday |
| TRANSPORTE_LINEA_GEOJSON | id | returned shape_id; double-encoded JSON, CRS verification open |
| TRANSPORTE_PARADAS_TRIP | id | returned trip_id with interior spaces; full ordering/identity corpus open |
| TRANSPORTE_LINEA_INFO_PARADA | stop_id, linea, min | municipal stop_id, public code; min meaning/unit unresolved |

All names are a closed design allowlist, not blanket production enablement.
The [action-readiness matrix](action-readiness.md) is normative for both live
profiles. By product-owner direction, the seven catalog, stop-identity,
serving-line, and arrivals actions are enabled generally. The four candidate
actions are enabled in local-live and production only for the exact line-A
parameters in the readiness matrix; every other candidate parameter fails
before network access. The production extension records the explicit
2026-10-28 product-owner approval and does not claim independent provider
evidence or broad action readiness. Fixture mode may evaluate candidates with
explicit spec assumptions and must expose `provisional-fixture` provenance.
This scoped production enablement does not close G5, establish full feature
readiness, or waive the remaining actor and evidence reviews.

## Compatibility matrix (v3/v4 historical artifacts unchanged)

| v4 surface | v5 disposition |
| --- | --- |
| Worker `/lines`, `/stops`, `/lines/{lineCode}`, `/stops/{stopCode}/arrivals`, `/health` | Removed HTTP facade. In-process ports normalize source GETs; no replacement hosted endpoints. |
| Worker-generated datasetVersion/generatedAt/scheduleMetadata | Not invented for JSP. Bundled manifests retain their own provenance; municipal receipts use fetchedAt. |
| X-Data-Status, edge Age/Cache-Control, Worker source status | Removed as normalization authority. Browser derives state from original receipt and refresh outcome. |
| NetworkStop nullable lat/lon | Preserve atomic nullable pair and searchable unlocated stop; add explicit municipalCode; vitrasaId remains separate/null when unresolved. |
| Line id/code/name/color | Preserve through verified identity mapping; optional service/textColor/order metadata added. |
| Arrival lineCode/destination/minutes | Preserve truthful fields, stable ascending minutes. Existing derived eta is removed: fetchedAt + minutes is not verified provider ETA. |
| Arrival fetchedAt | Now browser receipt **after validation**, not server generation; no provider timestamp guarantee. |
| Grouped otrosf/distance | Neither retained in normalized v5. Distance semantics unverified; separate arrival rows avoid derived grouping. |
| GTFS patterns/frequency bands/day service | Not inferred from schedule text. v5 represents published departure strings and verified trip/shape/day references; snapshot bands remain separate with provenance. |
| Global catalog enumeration | Approved JSP actions do not establish exhaustive stop list. Labeled bundled discovery index remains until live completeness is proven. |
| Server 4xx/5xx/ErrorResponse | HTTP status plus semantic body validation becomes typed in-process failure; HTTP200 may still be invalid. |
| Fixture/local-live/production | Same normalized schemas; fixture for tests, direct local-live and production calls for the seven supported actions. |

## Schema and evidence policy

Raw schemas capture observed shape/types and accept extra provider keys. They do
not promise universal nullability/error behavior from small samples. Normalized
schemas are closed, required fields explicit, and validated under Ajv 2020.
Unverified operations/schemas are labeled `x-verification: provisional`; no
fabricated provider guarantee. Invalid/incomplete identity-bearing responses are
not empty. Every response body, including nested geometry, is size/deadline bounded.

Freshness is strict: <30 s current/empty, [30,300) refreshing or stale only after
failure, >=300 unavailable, including offline. Reused data retains fetchedAt.
ArrivalReceipt.stopId means selected application NetworkStop.id, while
vitrasaId is transport identity. ArrivalReceipt.fetchedAt is canonical;
provenance.fetchedAt must equal it exactly (tested semantic invariant).
Normalized published times allow 00:00–23:59 only; reject extended hours pending
provider evidence and contract re-review.
Snapshot timetable requires named source, evidenceRef, trustworthy date/dateKind
and exact line/day/direction. Source `date` in schedule rows is not fetchedAt or
provider generation time.

Validate with the existing Spectral CLI and YAML/Ajv 2020 tooling; see
[quickstart](../quickstart.md). This planning workflow does not modify package
scripts or historical contracts. G3 actual reviews and unresolved blockers are
recorded separately; a schema-valid proposal is not release acceptance.
