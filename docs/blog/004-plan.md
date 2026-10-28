# Building Vigo Bus Navigator: Feature 004 Plan

The G3 plan for Feature 004 is deliberately a plan for a constrained browser
integration—not an implementation report. It closes the design and planning
review, while leaving source semantics and production acceptance open.

The plan gate closed APPROVED on 2026-10-27 after the responsible actors
reviewed the fixes to their initial findings. No runtime code was changed, no
tasks were created, and no full application test suite was run in this
planning workflow.

## Keep the boundary boring—and real

The approved architecture has one transit source: the fixed Vigo municipal
JSP endpoint. The browser adapter will make GET requests with credentials
omitted and an allowlist of action-specific parameters. Infrastructure owns
request construction, byte decoding, source validation, and normalization.
Application and domain code own selection, freshness, and state. UI components
consume normalized models rather than JSP fields.

That boundary follows the ratified constitution. There is no new Worker, proxy,
alternate upstream, or hosted REST v5. The OpenAPI 3.1.0 v5 contract describes
the municipal GET and the frontend's in-process ports and models. It is not a
server API. The target remains permanently zero-cost static HTTPS hosting;
GitHub Pages is one supported host, not a requirement.

Deterministic fixtures are the default for local development and tests.
`local-live` is opt-in and still capability-gated per action. Production is
disabled for all eleven actions: the accepted feature scope does not permit a
partial release by leaving difficult actions switched off. Passing a schema
compiler or a synthetic rejection fixture cannot authorize a live operation.

## Research that narrowed the design, not the uncertainty

The bounded research session made 23 CLI GETs. It observed actual Latin-1
accented catalog bytes and a double-encoded route geometry shape. It correlated
one stop's distinct Vitrasa and municipal identifiers and saw schedule rows
with cross-line ambiguity. These are useful observations for designing
normalizers and fixtures, but the CLI calls do not prove browser CORS behavior
or provider semantics.

The referenced app APK was not available for inspection in that session. The
plan therefore does not claim an independently verified request-builder or
schedule-selection call chain. Specific release questions remain: schedule ID
to public-line mapping, weekday/Saturday/Sunday-holiday codes, `min` and `ttl`
behavior, geometry CRS, complete trip/shape relationships, source policy, and
parity across supported lines and service days. Source observations are
partial; plausible coordinates or one successful response are not universal
guarantees.

The per-action readiness matrix makes the distinction operational. All
eleven actions need deterministic fixture coverage. Only six may be considered
for local-live after their individual conditions are met; unresolved arrivals
and schedule/geometry/trip/line-stop operations remain disabled. All eleven
must pass the required browser and semantic evidence before production. If a
required check fails, the release is blocked and architecture returns to G1;
the answer is not a Worker fallback.

## A plan corrected by inspection

The most important G3 discovery came from reading existing persistence
behavior, not from probing the provider. The current v1 favorites loader drops
line favorites, and existing tests encode that destructive behavior. Simply
reusing it would contradict the promise to preserve saved data.

The plan now requires a lossless v2 migration for stops and legacy line
favorites. It retains IDs, order, unresolved entries, and original v1 bytes
until a validated v2 write succeeds. Saved items that cannot be mapped remain
saved but unavailable; they are not replaced with a plausible-looking
different stop or line. The design also specifies accessible warnings when
malformed data or storage quota/access failures mean that persistence is
unconfirmed.

Other specific fixes closed review findings: `ArrivalReceipt.stopId` is the
selected application stop identity, and its canonical `fetchedAt` must equal
the provenance timestamp. Published times accept only 00:00–23:59 until
extended-hour semantics are verified. The capability matrix separates fixture,
local-live, and production readiness. These constraints prevent a technically
valid model from implying stronger provider knowledge than the evidence
supports.

The plan also preserves useful trust boundaries: public response caches are
bounded and in memory; user favorites and preferences remain in `localStorage`;
arrival age is based on successful client receipt, not an unverified provider
generation timestamp. Existing packaged schedules remain explicitly labeled
offline/migration material, not a silent substitute for failed live requests.

## What the planning checks do—and do not—say

The recorded contract checks found zero Spectral errors and nine
`oas3-unused-component` warnings. Those normalized schemas are referenced by
in-process browser-port extensions rather than HTTP response `$ref`s; the
warnings were documented, not silenced by inventing server endpoints.

Ajv 2020 compiled 41 components, with 17 structural positive/negative cases
recorded. This validates schema structure and selected structural rules; it
does not validate format assertions or provider semantics. Nor do these
contract checks prove that all responses from the provider fit the proposal.
The quickstart lists future implementation checks, clearly marked as not
available commands for this documentation-only plan.

The actual G3 record includes initial CHANGES REQUESTED findings and explicit
re-reviews after fixes. Architect, Backend Developer, UX Designer, Frontend
Developer, and the additional breaking-contract QA review ultimately approved
the bounded plan. The UX warning change received its own targeted approval.
Their approvals cover plan, boundaries, and design documents—not delivered
WCAG 2.2 AA conformance, runtime behavior, G4 tasks, G5 acceptance, or release.

## Terms for readers new to SDD

- **G3 / Plan gate:** review that the proposed architecture, boundaries, design,
  and evidence plan are coherent enough to plan the work.
- **Capability matrix:** per-action rules describing whether fixture,
  local-live, and production use is permitted. Choosing a profile cannot bypass
  a disabled capability.
- **Provider observation:** evidence collected from the actual source under
  stated conditions. A CLI observation is not a browser CORS result.
- **Synthetic fixture:** controlled input used to test how a client handles
  valid or invalid data; it does not prove the provider sends that data.
- **Lossless migration:** changing a storage format without silently deleting
  identities or records that cannot yet be resolved.
- **Receipt freshness:** age measured from the client's successful receipt of
  validated data, not a claim about when the provider generated it.

## What's next

The next SDD phase is tasks and analysis (G4), which has not been produced or
approved for this feature. The [Feature 004 specification](004-specification.md)
records the requirements behind this plan. See also the project-wide
[constitution](01-constitution.md), [specification](02-specification.md), and
[plan](03-plan.md) chapters. G3 approval is not implementation or production
authorization; source evidence, G4, G5, and release checks remain ahead.
