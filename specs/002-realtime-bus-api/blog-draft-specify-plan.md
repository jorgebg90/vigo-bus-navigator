# Blog Draft — Feature 002: Specify + Plan

> Draft for the public SDD-experiment log. Covers the original Specify and Plan
> reviews and the approved G2–G4 reviews for the owner-selected Vitrasa
> source change in `002-realtime-bus-api`; the current Communicator G6 review
> remains pending.
> Source artifacts: [spec.md](spec.md), [research.md](research.md),
> [data-model.md](data-model.md), [gate-g2-spec-review.md](gate-g2-spec-review.md),
> [gate-g3-plan-review.md](gate-g3-plan-review.md).

## Real-time data gets its own spec

Feature 001 shipped a bus app that works entirely from a static snapshot:
stop catalog, line geometry, frequencies — all precomputed, all offline. That
was the right call for a pure-frontend PWA, but it has a hard ceiling. A
snapshot can tell you when the bus *should* come. It cannot tell you when the
bus *is coming*.

So feature 002 exists: real-time arrivals. The tempting move would have been
a few extra requirements stapled onto the 001 spec. We deliberately did not
do that, and the spec explains why by its shape alone. Real-time data changes
the *failure model* of the whole application. Static data is either there or
the build failed. Live data can be slow, rate-limited, malformed, gone — and
worst of all, it can be *old without looking old*. A person standing at a
stop in Vigo who sees a stale arrival labeled as current will make a wrong
decision. That is a worse outcome than showing nothing.

That is why the spec's central entity is not `Arrival` but `Data Status`: a
controlled vocabulary — `current`, `stale`, `empty`, `unavailable`, `loading`
— that the service must never lie about. FR-010 states it flatly: the service
"MUST NOT present stale data as current." Once freshness became a contractual
value instead of a UI nicety, everything else in the design fell out of it.

## Standing on VigoBusAPI's code, honestly

The user's input to the spec was unusually direct: "Base the implementation
on… https://github.com/David-Lor/VigoBusAPI. State in the license that this
work is based on its code."

VigoBusAPI is an existing open-source project (Apache-2.0) that already
solved the ugly part of this problem: talking to Vigo's transport data
sources and cleaning up what comes back. Years of upstream quirks live in
that code — mojibake repairs for UTF-8 served as Latin-1 (`Ã` → `Á`),
line-letter splitting so routes don't carry line suffixes, duplicate
filtering, sort orders. Reimplementing that from scratch would be
re-learning every lesson the hard way.

The original research decision D2 ported the minimum viable normalization
subset into TypeScript: mojibake repair, line-letter splitting, sorting, and
deduplication — about six pure functions with no network access. The new page
source already separates line from destination, so the selected adapter keeps
the attribution and reusable text/sort behavior but deliberately does not apply
the JSON-specific line-letter split. Not a copy of the repository (explicitly
out of scope), not a dependency, a *port*.

"Based on the code of" is a legal phrase, not a marketing one. Apache-2.0 §4
requires retaining copyright and license notices and marking modifications.
Research D8 turns that into mechanics:

- A `NOTICE` file at the repo root naming VigoBusAPI, its author, the
  repository URL, and the Apache-2.0 license — with the phrase "based on the
  code of" stated verbatim.
- The full Apache-2.0 text in `LICENSE`, with the original copyright
  retained.
- An attribution header in every ported file.
- A README provenance section with a non-affiliation disclaimer (FR-017),
  mirroring the upstream project's own disclaimer: this app is not endorsed
  by the transport operator or by VigoBusAPI.

The spec even makes attribution *testable*: SC-006 says a reviewer must be
able to find the attribution, license text, disclaimer, and setup
instructions in under two minutes. Provenance as a measurable outcome.

## Revisiting the arrivals source

The first design selected the open-data JSON endpoint recommended by
VigoBusAPI. That remains a valid prior decision; this change does not claim
that the endpoint is broken. The owner later supplied the public Vitrasa
InfoBus page because it visibly presents the desired stop-level result:
complete line, destination, and estimated wait minutes.

The page is not a JSON API. It renders an ASP.NET WebForms table with five
rows per observed page. Pager links submit `__VIEWSTATE` and
`__EVENTVALIDATION` through `__doPostBack`, and the request sequence uses a
session cookie. Stop 2790 returned three pages and twelve rows in one observed
1.485-second lookup. The response does not include
`Access-Control-Allow-Origin`, so the browser cannot fetch it directly.

The owner chose this source for the visible arrival information. The existing
Cloudflare Worker is the only permitted bridge. Under ratified v1.3.0 and the
approved source-change G2–G4 gates, the browser sends only the selected
public stop ID to the Worker, which would send that ID plus source-required
transient WebForms state and a session cookie to the fixed Vitrasa URL. The
planned adapter would discard that state after the lookup and would not log,
persist, cache, or return it. This is not anonymous: Cloudflare and Vitrasa
process connection metadata, and the project cannot control provider
retention. No account, favorites, history, settings, or user-activity profile
would be sent.

The exception is bounded, not permission for a generic scraper: fixed
HTTPS host and path, validated stop ID, exact rendered stop identity, redirects
rejected, at most ten pages, one eight-second aggregate deadline, 128 KiB per
page and 1 MiB per lookup, and no partial result on any failed page. Route
count and field lengths would also be bounded; exceeding any limit would fail
closed. The migration is planned to preserve the outward API v3.0.0 response
and change only the Worker source adapter. The earlier JSON source remains a
documented alternative, not a failed service.

## Why one cache entry cannot serve stale

The resilience requirement sounds simple: if the upstream fails, show the
last good answer, marked as stale. The architect's G3 review found the trap.

The planned design uses the Cloudflare Cache API (`caches.default`) — no KV,
no Durable Objects, per the zero-infrastructure constitution. But the Cache
API honors `max-age` on `cache.match`: an entry stored with a 30-second TTL is
*evicted* at 30 seconds, and there is no override. So a single cache entry
faces an impossible choice:

- Store with `max-age=30` → fresh data, but nothing survives to serve as
  stale on failure.
- Store with a longer TTL → `cache.match` will happily serve it as "fresh"
  long after it stopped being current. Stale data labeled current — the one
  thing FR-010 forbids.

Research D4's proposed answer is **two entries per stop**, distinguished by
cache key:

1. **Fresh entry** (`?stop_id=N`): stored with `Cache-Control: public,
   max-age=30` plus an `x-edge-stored-at` header. Served only while fresh;
   the platform evicts it at the TTL, so it can never lie.
2. **Last-known entry** (`?stop_id=N&lk=1`, internal, not in the public
   contract): stored with `max-age=300` — a five-minute *maximum staleness
   bound*. On upstream timeout, error, 5xx, or 429, it is served with
   `dataStatus: "stale"`, its original `generatedAt`, `Cache-Control:
   no-store`, and an `Age` header so recovery is visible within one poll
  interval.

When no in-bound last-known entry is available, the planned behavior is
`503 STALE_UNAVAILABLE`, or `429 RATE_LIMITED` for an upstream rate limit. The
300 s limit is the intended maximum staleness, not yet a verified EdgeCache
runtime guarantee; a credentialed source-change G5 smoke is planned, but has
not run.
The alternative considered — Workers KV for last-known storage — was rejected:
a paid storage dependency to solve a five-minute problem.

## Contract-first, second time around

Constitution Principle V requires the OpenAPI contract before the
implementation, and this time the contract had to carry the freshness model.
The current public contract is `contracts/realtime-arrivals.openapi.yaml`,
version **3.0.0**. The Vitrasa source-selection plan preserves that
browser-facing request, response schema, and freshness model while changing
only the Worker's upstream adapter, so no contract version bump is proposed.
The earlier v2 change added `dataStatus` while retaining
`stopId`, `generatedAt`, and `arrivals[]`; v3 made the official network catalog
canonical alongside the resource-oriented arrivals path.

The contract also pins per-status cache headers (a G3 architect finding —
an unconditional `Cache-Control` on the 200 response would have
contradicted the stale path), documents the `Age` header, and defines eight
error codes from `VALIDATION_ERROR` to `UPSTREAM_TIMEOUT`.

## What the harness gates caught

This is the part of the story that justifies the harness. Two gates, four
actors, and every single one of them caught something a solo pass would have
shipped.

**Original G2 — JSON-backed design (Stakeholder + QA Tester).** Two change rounds:

- **CORS vs the constitution.** The draft spec waffled on CORS policy. The
  constitution (Principle VI) already mandates
  `Access-Control-Allow-Origin: *` on every response including errors, with
  no origin allowlist. QA forced FR-008 to say exactly that, plus an
  acceptance scenario so it is testable, not aspirational.
- **"May return" is not a requirement.** The draft FR-010 made last-known
  retention optional — while SC-007 simultaneously required it. A "may" that
  a success criterion depends on is non-falsifiable: no test can fail it.
  Retention became MUST-level in both the requirement and the scenario.
- SC-003 was restated measurably: five named UI states, an automated UI
  matrix, 100% coverage, no page reload.

**Original G3 — JSON-backed design (Software Architect + Backend Developer).**
Three more change rounds:

- The **single-cache-entry trap** described above — the architect caught
  that the Cache API's `max-age` eviction makes the original stale-retention
  sketch impossible, forcing the two-entry design.
- **The stop identifier caller bug.** The original JSON-backed plan passed
  the internal catalog id (`stop-1001`) to an endpoint requiring digits; the
  plan corrected that caller to public `Stop.code`. The Vitrasa migration
  supersedes that earlier mapping: it must use the distinct public
  `Stop.vitrasaId` and make no request when null. The migration is not yet
  implemented; the current frontend still passes `stop.code`.
- **The missing 429 case.** The design handled upstream errors but had no
  answer for rate limits. The backend developer's review added
  `429 RATE_LIMITED` across the contract, the data model, and the
  quickstart: an upstream 429 enters the same stale-on-failure path, and
  only with no in-bound last-known result does the Worker answer 429 itself.

Also caught at G3: unknown paths needed an explicit `404 NOT_FOUND`, OPTIONS
preflight needed to be in the contract, empty-destination arrivals needed a
drop rule, and local development needed the wrangler/vitest-pool-workers
wiring spelled out so `wrangler dev --local` with `UPSTREAM_FIXTURES=true`
is reproducible from the repo with zero credentials (constitution IV).

None of these are exotic. All of them are the kind of thing that surfaces at
2 a.m. in production when a single author writes the spec, the plan, and the
code. The harness's premise — that a spec isn't done when it's written but
when it survives review by actors with distinct quality dimensions — held up
in both gates.

**Vitrasa source-change G2–G4.** These are separate, fresh reviews, not an
extension of the JSON adapter's approvals. Stakeholder and QA first asked for
clearer announcements across all five arrivals states, an auditable
fixture-only load test, and an explicit distinction between planned aggregate
gzip limits and active per-file limits. After those changes, G2 approved.
Architect's G3 review then requested six concrete plan changes: an actual
Cloudflare Cache G5 smoke, a runnable preview path, fixture-only load
measurement and request-budget policy, a Worker/Node parser boundary,
accessibility and payload evidence, and accurate gate status. Architect and
Backend Developer approved after those were addressed. QA's G4 review then
improved test-first ordering, explicit source-protocol and privacy assertions,
test commands and dependencies, payload build ordering, and G5 result
recording; the final task review is approved. Runtime implementation remains
unstarted, and G5 will still need to prove the real EdgeCache behavior.

## Trade-offs, honestly

- **Porting vs depending.** We port six functions instead of depending on
  VigoBusAPI. That is code we now own and must maintain — accepted, because
  the upstream is Python and our Worker is TypeScript, and because the ported
  surface is small and pure.
- **Cache API vs real storage.** The proposed two-entry design would provide a
  300 s staleness bound without KV or Durable Objects, but the last-known entry
  is best-effort and EdgeCache runtime behavior is unverified. If the entry is
  absent, the planned failure is explicit `503 STALE_UNAVAILABLE`, not a
  falsely current result.
- **No live readiness probe.** `/health` is liveness only (D7). Probing the
  upstream on every health call would consume upstream requests. Fixture
  contract tests verify response behavior, not live production readiness.
- **Geography stays static.** Stop coordinates come from the snapshot
  catalog with bounding-box validation at build time (D3), not from the
  real-time service, which exposes no coordinates. Map correctness and
  arrivals freshness are separate problems with separate owners.

## What's next

The phase artifacts are [spec](spec.md), [research](research.md),
[plan](plan.md), [data model](data-model.md), and [tasks](tasks.md).

The original JSON-backed Worker implementation remains in place; no WebForms
runtime code has been written. G1 is closed: v1.3.0 was ratified from the last
evidenced v1.2.1 baseline, with the former unratified v1.2.2 wording folded
into the amendment. Stakeholder and QA approved the source-change spec, but
SC-014–SC-016 were added afterward and have now received fresh Stakeholder
and QA approval. The source-change G3 plan has now been approved by Architect
and Backend Developer after resolving the six required actions. QA's G4 task
review is complete. G1–G4 are closed, so implementation may proceed tests-first, followed
by QA and Stakeholder G5 review and a fresh Communicator G6 accuracy review.

---

*Blog status: draft, pending fresh Communicator review after the source-change
G2–G4 updates; source-change G1–G4 are closed.
The WebForms migration has not started.*
