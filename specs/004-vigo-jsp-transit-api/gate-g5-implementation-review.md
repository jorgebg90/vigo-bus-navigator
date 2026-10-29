# G5 Implementation Review — Direct Vigo Municipal Transit

**Date**: 2026-10-28
**Status**: G5 CLOSED WITH PRODUCT-OWNER-ACCEPTED EXCEPTIONS — eight general production actions, online line catalog for every line, and exact line-stop detail scope
**Deferred evidence**: Full browser matrix, accessibility/performance evidence, source/parity checks and saved-item migration remain deferred to future specs
**Live readiness**: Eight general production actions plus online schedule, trip-stop and geometry actions using validated identifiers; line-stop detail remains limited to the exact approved mapping
**Branch**: `004-vigo-jsp-transit-api`
**Scope**: Existing seven production-supported actions plus the four candidate
actions `TRANSPORTE_LINEA_HORARIOS_EXTEND`, `TRANSPORTE_LINEA_GEOJSON`,
`TRANSPORTE_PARADAS_TRIP`, and `TRANSPORTE_LINEA_INFO_PARADA`.

G5 distinguishes fixture-only implementation review from production
readiness. The seven previously supported actions remain enabled under the
product owner's scoped direction. The stakeholder reported validating the
four candidate associations in Postman; the product owner later authorized
their exact mappings for production as documented below. This report is not an
attached raw capture or independent provider evidence. The original 2026-10-28
G5 closure applied only to the existing seven-action production scope and
accepted the documented exceptions below; the subsequent allowlist amendment
does not certify full-feature readiness or imply actor approvals not recorded
here. No Worker or alternate upstream may be used.

## Evidence captured

### Existing supported action smoke

The prior bounded production-profile browser smoke exercised catalog, service,
stop identity, serving lines and arrivals from the Pages base path with real
browser GETs, omitted credentials and successful CORS responses. It is recorded
in [source-evidence.md](source-evidence.md#01-production-github-pages-path-browser-smoke-2026-10-28).
The production artifact passed the configured base-path build; 258 unit/DOM
tests, typecheck, and OpenAPI contract validation passed in that validation
run. These results do not cover the four newly scoped actions or close G5.

### Four-action browser follow-up

On 2026-10-28 at 08:13 UTC, a bounded headless Chromium session issued seven
sequential GETs using already-documented public identifiers, `credentials:
"omit"`, no retries, and at least one second between requests. Every response
was HTTP 200 with declared `application/json;charset=ISO-8859-1` and readable
through browser CORS. Full observations and limitations are in
[source-evidence.md](source-evidence.md#7-g5-follow-up-browser-observations-for-the-four-gated-actions).

| Action | Observation | G5 conclusion |
| --- | --- | --- |
| Schedule (`id=A`, `dia=1/2/3`) | Each response had 13 mixed-line trips. The three arrays had matching trip IDs, departures, shapes and direction flags, with different `date` values. | Do not map the action to one public line or application day type. |
| Route GeoJSON (`id=Route_1005`) | Nested LineString, 1,243 positions; the complete inner object had no CRS member. | Do not render geometry based only on plausible Vigo bounds. |
| Trip stops (`id=A  02LP000_008002_4`) | 69 rows, unique contiguous 1-based `orden` 1–69. | Sequence shape is observed; line/day and canonical-stop identity correlation remain unverified. |
| Line-stop (`stop_id=2789`, `linea=A`, `min=0/30`) | The two responses differed in trip, shape and time list. | `min` affects output, but its unit/selection semantics remain unknown. |

### Stakeholder-reported Postman validation

After those observations, the stakeholder reported that Postman validation
confirmed: (1) `id=A` and `dia=1/2/3` map to line A and
weekday/Saturday/Sunday-holiday; (2) `Route_1005` geometry's CRS and
line/trip association; (3) the line/day/trip identity and ordering for
`A  02LP000_008002_4`; and (4) `min` is measured in minutes. This is recorded
as stakeholder-reported validation, not a provider capture: no collection
export, raw response, headers, or response hashes were attached. The local-live
implementation uses only those exact identifiers, filters mixed schedule rows
to line A, resolves trip stop IDs against the bundled catalog, and sends only
fixed `min=0`. The trip mapping is used for weekday only. Production remains
blocked pending independent evidence, cross-browser checks, and required G5
reviews. Full details and limitations are in
[source-evidence.md](source-evidence.md#2026-10-28-stakeholder-reported-postman-validation).

These are observations, not a provider specification. They do not prove
usage policy, rate limits, valid-empty/error semantics, complete line/stop
parity, or source guarantees.

### Current implementation checks (2026-10-28)

**Day-code correction (2026-10-28):** A subsequent inspection of the
user-provided APK source found that the app maps laborable/Saturday/holiday to
`dia=1/6/0`, not `1/2/3`. The earlier table and stakeholder-reported mapping
below preserve what was recorded at the time and are superseded for current
implementation behavior. The correction is documented in
[research.md](research.md#2026-10-28-apk-day-code-correction) and
[source-evidence.md](source-evidence.md#2026-10-28-apk-day-code-correction).
At the time of this review, the schedule action remained disabled in production;
the later exact-scope authorization is recorded at the end of this file and
does not add provider or actor approval.

After implementation of the explicitly provisional fixture evaluation and
the scoped local-live mapping:

| Check | Result |
| --- | --- |
| `npm test -- frontend/tests/unit/municipal frontend/tests/unit/request-version.test.ts frontend/tests/dom/us1-line-frequency.test.ts` | PASS — 27 files, 142 tests |
| `npm run typecheck` | PASS |
| `npm run validate:feature004-contract` | PASS — OpenAPI 3.1.0, v5.0.0, 41 schemas; seven general live actions, four exact local-live mappings, seven production actions |
| Postman collection parse/count | PASS — 7 supported actions and 4 stakeholder-validated sample requests |
| `git diff --check` | PASS |
| `npm run build` | PASS — production build generated; existing MapLibre chunk exceeds Vite's 500 kB minified-chunk warning threshold |
| Chromium E2E: `npx playwright test --config=playwright.tmp.config.ts --project=chromium-desktop --workers=1` | PASS — all 24 tests; temporary config used port 4174 because port 4173 was occupied, then removed |
| Candidate regression E2E after fixture-transport guard | PASS — 5 tests across line service, catalog, privacy/network and keyboard line search; temporary config removed |

The E2E suite used the fixture profile; the candidate journey asserts no
municipal requests. The earlier live browser observations above were bounded
HTTP/CORS observations only. This historical validation is not the full three-browser matrix, deployed
Pages smoke, in-scope accessibility sign-off, production-artifact guard, or
approval to enable candidate actions in production.

## Implementation and validation status

- Schedule, route-shape, trip-stop, and line-stop adapters support synthetic
  provisional fixtures and the exact stakeholder-reported mappings in
  local-live. The attestation is not independently verified provider evidence.
- At the time of this review, readiness was enforced at both adapters and the
  HTTP client boundary for line A/day codes 1–3, `Route_1005`, the exact weekday
  trip ID, and stop 2789/line A in local-live. T080 later corrected the day
  codes to 1/6/0 and separately authorized these exact mappings in production;
  all other IDs fail before fetch.
- The source evidence, browser CORS, and full response/line/stop parity work is
  still open. In particular, `min` unit is stakeholder-reported; the app sends
  fixed `min=0` only and makes no threshold behavior configurable.
- Provisional schedules use neutral “Departures” wording and explicit fixture
  provenance. Route/trip/line-stop results expose their own source labels;
  unlinked provisional geometry is hidden from the accessibility tree and
  accompanied by a visible no-verified-description notice. Day tabs support
  ArrowLeft/ArrowRight/Home/End and preserve focus through activation. The line
  journey has viewport-specific axe/overflow checks at 320, 768, 1024, and 1280
  CSS px.
- The Backend Developer approved the focused validator hardening and tests;
  that verdict is recorded in [tasks](tasks.md). It is implementation review,
  not a substitute for any of the five required G5 actor verdicts below.
- T036–T039 and T047–T051 are implemented and marked complete in
  [tasks](tasks.md). This completes fixture evaluation only; source evidence,
  production-artifact guard, the full browser matrix, in-scope accessibility
  evidence, and full-feature production readiness are deferred under T063–T072.
  The limited G5 closure is recorded by T073. T075
  implements the stakeholder-reported local-live-only mapping and its
  HTTP-boundary checks.
- T041 now verifies that offline snapshots are selected only by exact line,
  direction, and day, carry a named source/evidence/date label, and fail closed
  for untrusted provenance. Online failures do not trigger this fallback. The
  legacy Worker timetable assets lack the source, direction association, and
  trustworthy dated provenance required for rider use, so production currently
  has no eligible snapshot entries and correctly shows unavailable offline.
- The earlier live smoke confirms HTTP/CORS/decoding for its sampled requests;
  it does not establish candidate-action CORS or independently verify the new
  associations.

## Current scoped local-live review round — 2026-10-28

These are reviews of the exact stakeholder-reported local-live scope and its
implementation. They are not full G5 or production approvals.

| Actor | Current verdict | Scope and remaining limitation |
| --- | --- | --- |
| QA Tester | APPROVED | Code-level review only; not full evidence or G5 closure |
| Stakeholder | APPROVED | Exact local-live mapping scope and documentation only |
| UX Designer | CHANGES REQUESTED | Candidate local-live UI/accessibility evidence outstanding; manual VoiceOver/Safari and NVDA/Firefox checks were deferred from this spec by the product owner on 2026-10-28 and require UX re-review against the updated scope |
| Frontend Developer | APPROVED | Scoped frontend integration, late-result guard, and local receipt-time display; deferred-response UI E2E is recommended |
| Software Architect | APPROVED | Scoped local-live architecture only; production evidence and G5 remain open |
| Backend Developer | APPROVED | Adapter correctness only, after municipal stop ID validation fix |
| Project Lead | KEEP OPEN (prior verdict) | The verdict predates the product-owner's limited-scope closure; deferred evidence remains incomplete |

The product owner decided on 2026-10-28 that T061 (provider raw-byte fixture
capture for all actions) and T062 (APK call-chain recovery and independent
`ttl`/`min` verification) are not required for this feature's G5. The product
owner subsequently accepted a broader limited-scope closure on 2026-10-28:
T053, T055, T056, T058, T060, T063–T070, T072 and T074 are deferred/N/A for
this release, not complete. T073 records the actual actor verdicts and this
scope decision; it does not convert deferred work into evidence or approval.

The stakeholder also reports that CORS works for the candidate actions. This
remains user-reported, not independently recorded browser CORS evidence. The
Frontend Developer's scoped approval is based on source inspection and focused
tests, not a local-live UI browser run. The UX Designer did not perform manual
Assistive-technology checks; those checks are now deferred to a future spec.
The product owner accepted the limited-scope G5 closure without a new UX
approval; the current CHANGES REQUESTED verdict remains accurately recorded.

## Prior fixture-scope actor verdicts

The following table preserves the earlier fixture-only verdicts and is not the
current local-live review result.

## Required actor verdicts

The prior reopened fixture-scope review required verdicts from QA, Stakeholder,
UX, Frontend, and Software Architect. The table below records only that earlier
fixture review; current scoped local-live verdicts are recorded above.

| Actor | Required review | Verdict |
| --- | --- | --- |
| QA Tester | Rejection coverage, fixture/live separation, zero-request fixture behavior | APPROVED — fixture-only; line-stop trip-token mismatch finding resolved |
| Stakeholder | Truthful labels and provisional source attribution | APPROVED — fixture-only; misleading published-departure wording resolved |
| UX Designer | Accessible route treatment, keyboard tabs, provenance, responsive journey and manual AT evidence | CHANGES REQUESTED at the time — code findings resolved; this historical verdict predates the 2026-10-28 product-owner decision deferring manual AT tests to a future spec |
| Frontend Developer | Repository/view integration, day selection, and profile isolation | APPROVED — fixture-only |
| Software Architect | Action allowlists, HTTP-boundary guard, and profile invariants | APPROVED — fixture-only; implicit default network fetch removed for fixture clients |

The line-stop row requires an explicit leading trip-token mapping in fixtures
and in the exact local-live mapping, and rejects mismatched line context. Departure language is neutral,
route/trip/line-stop sources are individually labeled, the unlinked provisional
shape is decorative with a visible unavailable-description notice, and day tabs
implement keyboard navigation with focus retention. Axe and overflow checks
cover the line journey at four viewports. The historical UX approval remains
CHANGES REQUESTED; the product owner accepted the limited release without
changing that verdict and deferred remaining accessibility checks to a future
spec.

The Backend Developer's separate implementation verdict is recorded in
[tasks](tasks.md). It is not one of the five G5 sign-offs.
The stakeholder's later Postman report is recorded separately as a scoped
local-live validation; it does not retroactively change the actor verdicts in
this fixture-only table or complete the required G5 review.
The Software Architect noted that the injected fixture fetcher is not
type-restricted to synthetic transports; application composition currently
injects `MunicipalFixtureTransport`, and a default global-fetch fallback is
forbidden. This remains a non-blocking caller-discipline boundary, not a live
action allowance.

## Deferred source-evidence criteria

The following criteria remained open at the limited seven-action G5 closure.
They remain deferred evidence gaps and are not represented as satisfied by the
later exact-scope product-owner authorization:

The later authorization changes only the exact runtime allowlist. Every
candidate request outside that allowlist remains blocked:

1. The schedule ID and all `dia` meanings are verified against the selected
   public line/day, with mixed and mismatched row rejection evidence.
2. Geometry CRS/conformance and shape-to-service/trip identity are evidenced.
3. Full trip-stop identity and ordering are checked against canonical stops.
4. The `min` behavior and complete line-stop response contract are verified.
5. Candidate-action source/evidence tasks, a separate readiness decision, and
   any applicable reviews are complete.

The seven already supported actions do not inherit these evidence gaps.

## Closure decision — 2026-10-28

**G5 CLOSED WITH PRODUCT-OWNER-ACCEPTED EXCEPTIONS — LIMITED SCOPE.** Closure
applied only to the seven supported actions already enabled in production. At
that time, the four candidate actions were disabled and deferred to a future
spec. This historical
closure does not certify full feature completion, timetable coverage,
all-eleven-action readiness, WCAG conformance, or independent provider
verification. T053, T055, T056, T058, T060, T063–T070, T072 and T074 are recorded as
N/A/deferred in [tasks](tasks.md), not complete. T061–T062 were previously
waived. Actual actor verdicts are preserved above: UX remains CHANGES
REQUESTED and the Project Lead's prior KEEP OPEN is not rewritten as an
approval; the product owner explicitly overrides those closure requirements
for this limited scope. No reproducible browser evidence, accessibility result,
parity result, or production-artifact guard is inferred from this decision.
No Worker service or fallback is part of the target architecture.

## Exact production-scope authorization — 2026-10-28

After the limited G5 closure, the product owner explicitly directed that the
four candidate actions be enabled in production because their exact mappings
had been validated in Postman. T080 implements that decision without claiming
the deferred evidence or outstanding actor reviews as complete.

| Action | Exact production allowlist |
| --- | --- |
| Schedule | `id=A`, `dia=1/6/0` (weekday/Saturday/Sunday-holiday) |
| Geometry | `id=Route_1005` |
| Trip stops | `id=A  02LP000_008002_4` (weekday only) |
| Line-stop detail | `stop_id=2789`, `linea=A`, fixed `min=0` |

All other candidate parameters remain denied before network access. The earlier
limited G5 closure, deferred independent evidence, UX CHANGES REQUESTED verdict,
and prior Project Lead KEEP OPEN verdict remain unchanged. The packaged
discovery catalog still supplies general stop search and route summaries.
