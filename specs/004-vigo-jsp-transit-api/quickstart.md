# Quickstart — Validate Feature 004

`npm run dev` uses local-live and calls the JSP directly in the browser.
Automated tests and E2E builds select deterministic fixtures. The fixed-profile
resolver, request builder, byte decoder, bounded HTTP client, scheduler,
synthetic fixtures for all eleven contract actions, OpenAPI schema-validation
command, live arrival/catalog/serving-line adapters, selected-stop integration,
and bounded cache are implemented and covered by focused tests, including
browser verification against the public JSP. The browser-side logical BFF
loads municipal line/service catalogs, per-stop serving lines, and arrivals
into the existing views; stop discovery remains an explicitly dated,
non-exhaustive bundled seed. G5's original closure covered the seven-action
production scope with exceptions; the product owner separately approved four
exact line-A candidate mappings for production. This is not a claim that the
full timetable feature or all eleven source operations are production-ready.
The fixture profile demonstrates a visibly synthetic published
schedule. Offline timetable fallback requires exact
line/day/direction identity and named source, evidence reference,
and dated provenance; it is never used to hide an online JSP failure. The
legacy Worker timetable files do not meet those requirements, so no production
snapshot timetable is currently eligible and the offline view remains
unavailable. The test build supplies explicitly synthetic exact-day snapshots
to verify the fallback interaction only. Route-shape, trip-stop, and schedule
adapters support fixture-only provisional assumptions from the spec and label
every resulting model as provisional/unverified. The stakeholder reports
validating four exact line-A mappings in Postman. Local-live allows only
`id=A&dia=1/6/0`, `id=Route_1005`, `id=A  02LP000_008002_4`, and
`stop_id=2789&linea=A&min=0`; all other candidate parameters fail before
network access. The exact mappings are available in production by explicit
product-owner scope amendment, not independent provider evidence. The overall
stop-discovery index and route-pattern summaries still use the packaged,
non-exhaustive catalog; only the approved mapped schedule/geometry/trip details
are fetched from the API.
The packaged discovery seed retains capture provenance and is explicitly
non-exhaustive. Line-stop detail uses only fixed `min=0`; the stakeholder
reports the unit as minutes, but the application does not expose a configurable
threshold; only the approved stop/line pair is enabled in production.
Retry focus/disabled-state behavior is covered
in DOM tests, and fixture-backed catalog/timetable interactions are covered in
Playwright. Extended accessibility/performance evidence, verified live
schedule parity, saved-item migration, the complete browser matrix, and the
production-artifact CI guard are deferred to a future spec and were not claimed
as completed. Candidate operations outside the exact mappings remain
unavailable; the selected profile is enforced at the HTTP-client boundary as
well as by adapters. Do not
interpret legacy Worker scripts or historical browser POC as evidence that the
separately hosted transit runtime is part of the target architecture.

## Current runnable documentation checks

From the repository root, with the existing npm dependencies installed:

```sh
git branch --show-current
bash .specify/scripts/bash/check-prerequisites.sh --paths-only --json
npm run validate:feature004-contract
npm run lint:openapi
npm test -- --run frontend/tests/unit/municipal
npm run typecheck
git diff --check
```

Import [the Postman collection](../../postman/vigo-bus-navigator-municipal.postman_collection.json)
to call the municipal JSP directly. Seven general source actions are enabled
without candidate parameters; the four candidate actions are separately
restricted to exact product-owner-approved line-A samples in both live
profiles. Other candidate parameters fail before network access. Postman
requests do not validate browser CORS behavior.

Expected branch `004-vigo-jsp-transit-api`; plan/spec paths match this folder.
Latest focused implementation validation: `npm test -- --run` passed 296 tests
across 68 files, `npm run typecheck` and
`npm run validate:feature004-contract` passed. The production build passed with
the existing MapLibre chunk-size warning. The focused Chromium offline
snapshot E2E passed 2/2, including untrusted-provenance rejection. Spectral
reported zero errors and nine known unused-component warnings in the earlier
contract lint. The production browser smoke made
successful credential-free CORS requests for all seven supported actions; see
[source evidence](source-evidence.md#0-2026-10-28-browser-implementation-smoke).
These results validate the current implementation slice, not all feature
stories or G5/actor sign-off. The current G5 decision and five actor verdicts
are recorded in [gate-g5-implementation-review.md](gate-g5-implementation-review.md).
The v5
contract must parse as OpenAPI `3.1.0`, `info.version: 5.0.0`, one municipal JSP
GET path and no Worker or synthetic REST server. Verify schema `$ref` resolution
and compile component schemas with the installed YAML/Ajv 2020 tools; generated
planning validation results are recorded in the gate artifact. No raw live
request is required for these checks.

Review [research](research.md), [data model](data-model.md),
[design baseline](design-baseline.md) and [compatibility](contracts/README.md).
Source-only schemas are observational/provisional; successful lint is not
provider or production verification.

## Remaining implementation scenarios

The implementation uses a fixed endpoint and configuration profiles without
requiring a caller-supplied URL:

| Profile | Required behavior |
| --- | --- |
| fixture | Fixture byte responses → same validators/normalizers → v5 schemas; zero municipal traffic |
| local-live | Development server default; browser → fixed JSP, GET, credentials omit, seven general actions plus the four exact stakeholder-reported candidate mappings in the readiness contract |
| production | Static HTTPS → browser-side BFF; same supported action allowlist, no Worker |

Use the existing test runners for the implemented slice:

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run size
```

The frontend does not call or deploy a transit Worker. Its browser-side BFF
orchestrates direct municipal adapters and bundled discovery data. The legacy
Worker workspace remains only as migration-era tooling/data-generation material
until a future cleanup. Candidate operations outside the exact scoped allowlist
remain unavailable. By a subsequent explicit product-owner decision, the four
candidate actions are enabled in production only for the exact mappings in the
readiness matrix; this does not broaden G5 closure or mark deferred evidence and
actor reviews as passed.

### Deterministic contract/UI proof

1. Validate every allowlisted action fixture including raw Latin-1 bytes and
   nested geometry JSON; validate all normalizer outputs against v5 schemas.
2. Select mapped stop 90/municipal 2789; verify IDs remain distinct, arrivals
   ascending and valid-empty versus malformed/mismatched response.
3. With injected clock/network, check 29,999/30,000/299,999/300,000 ms,
   refresh-due versus stale-after-failure, offline cache expiry and no timestamp
   reset. Repeated Retry coalesces, focus persists, one polite status announcement.
4. Verify no arrivals call for unknown vitrasaId; no public code substitution
   for scheduleId in live profiles; provisional fixture mappings are labeled,
   do not issue network requests, and do not invent geometry; no old-selection
   response overwrite.
5. Test gl→GA, es/en→ES without separate locale/profile fields. Capture all
   default-test network requests and assert zero `datos.vigo.org` requests.
6. Load existing saved stops and any legacy line records; mapped items open the
   right entity, unknown ones remain saved/unavailable. localStorage only.
7. Test exact line/day/direction snapshot selection with a named source,
   evidence reference, and trustworthy dated provenance. Missing or untrusted
   provenance shows unavailable; online failures never fall back silently.
8. Accessibility validation at 320/768/1280 and 200% zoom, including screen
   readers, is deferred to a future spec; no conformance claim is made.

### Opt-in live release proof

Do not repeat or expand live probing in ordinary CI. Recovery of the APK
request-builder chain and separate `ttl`/`min` verification are not required
for this feature's G5, per the product-owner decision dated 2026-10-28. For any
remaining authorized live evidence, probe known public identities only, use
bounded samples at no more than one request per second, and omit credentials.
The repeatable browser smoke tool is opt-in and does not run in CI:

```sh
npm run smoke:municipal-live -- --confirm-live
```

It issues 13 sequential read-only sample GETs, at least one second apart, with
a five-second timeout, a 256 KiB response cap, omitted credentials, and a
20-request hard cap. Do not run it without authorization to generate live
provider traffic. Its JSONL output records HTTP/CORS fetch outcome, content
type, byte count, duration, and JSON decoding/root-shape result only; it does
not validate full response contracts, provider semantics, normalization,
identity parity, or production readiness. The tool has not been run against
the provider for this release.
Record UTC time, origin, commit, browser/version, action and parameters,
HTTP/CORS/content type, bytes/hash, decoded schema/identity outcome and sanitized
empty/error result. Use actual browser GET path; CLI success is not CORS proof.
Capture headers through browser tooling rather than assume page JS can read ACAO.

The [open research register](research.md#open-release-evidence-register) lists
items deferred from this limited G5 scope; they are not silently resolved.
`id=A` returning mixed-line schedule rows is **not** a passing line mapping.
`min=0` returning data does not prove its unit. Plausible coordinate ranges do
not prove source CRS. No timestamp is provider generation time without evidence.

The seven explicitly supported actions may be used in production under the
product-owner's scoped direction and recorded browser evidence. This does not
make the four unresolved operations available or close G5. Keep snapshots until
supported-line × three-day coverage/parity is demonstrated. Any newly required
action must pass its own source and browser checks before enablement; never add a
Worker fallback. G3 planning approval alone does not close G5 or actor review.
