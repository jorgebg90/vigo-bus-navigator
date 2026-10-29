# Specification Quality Checklist: Vigo Municipal Live Transit API

**Purpose**: Validate that the source replacement, environment behavior, and architectural decision are specified clearly before planning.
**Created**: 2026-10-27
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Focused on rider and contributor value while keeping the implementation decision evidence-based
- [x] Written in English for the project artifacts
- [x] Mandatory user, requirements, data, success, and assumption sections are complete
- [x] Scope excludes unrelated municipal app services

## Requirement Completeness

- [x] Source actions and their known parameters are identified as APK-analysis/POC findings, not treated as guaranteed contracts
- [x] The local browser POC distinguishes the malformed curl parameter from the valid `tipo` field and records successful GET/POST responses for stops and arrivals plus GET catalog/service actions
- [x] New JSP fields are mapped to canonical OpenAPI fields with source-versus-derived provenance
- [x] Line-map route geometry (`shape_id`) and ordered trip stops (`trip_id`) are specified as distinct source resources
- [x] Line-stop detail (`TRANSPORTE_LINEA_INFO_PARADA`) and its identifier/minute parameters are included for plan-stage schema verification
- [x] Stop municipal IDs and Vitrasa IDs are explicitly distinct
- [x] Real arrivals, stops, line catalogs, line-service data, route shapes, trip stops, and failure states have acceptance coverage
- [x] The v4.0.0 Worker contract is identified as legacy and the breaking v5.0.0 normalized contract is specified without implying a new REST server
- [x] Local fixtures remain default; live local testing is explicit and opt-in
- [x] The proposed production path is direct browser access only, with wildcard CORS checks independent of hosting or a configured-origin check when the source restricts origins
- [x] Worker and alternate-upstream fallback are explicitly prohibited; failed production gates block release and return architecture review to G1
- [x] The `GA`/`ES` source locale mapping, source action/parameter allowlist, and omitted-credentials rule are explicit
- [x] Arrival freshness is based on client receipt time, with explicit current/stale/unavailable thresholds and no unsupported source timestamp claim
- [x] Weekday, Saturday, and Sunday/holiday schedule parity plus route/trip payload verification are release blockers
- [x] OpenAPI compatibility and versioning requirements are testable
- [x] Error, empty, stale, timeout, rate-limit, malformed payload, and outage cases are covered
- [x] Success criteria are measurable and do not assume unverified upstream behavior
- [x] Assumptions distinguish observed APK behavior from verified service behavior

## Feature Readiness

- [x] User stories can be tested independently with fixtures and an opt-in live smoke test
- [x] Every functional requirement has an observable outcome
- [x] The static snapshot fallback is not removed before service coverage is verified
- [x] No secrets, user profile data, or unrelated fields are required for calls
- [x] The spec identifies the G1, plan, and production-release evidence gates without leaving production architecture selection open

## Notes

- Browser fetches from localhost succeeded for all 13 tested action/parameter cases with credentials omitted; a separate response-header check returned `Access-Control-Allow-Origin: *` for all 13. This supports origin-independent CORS, not semantic schedule mapping or production-release readiness.
- No `[NEEDS CLARIFICATION]` markers remain. Constitution v2.1.0 was ratified at G1. Wildcard CORS was observed for 13 tested cases; the unexpected line-A/schedule-to-C3 response and other semantic source checks remain release blockers.
- Checklist items describe spec quality and readiness, not implementation completion.
