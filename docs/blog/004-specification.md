# Building Vigo Bus Navigator: Feature 004 Specification

Feature 004 asks a focused but consequential question: can the app replace its
legacy transit Worker path with direct browser requests to Vigo's public
municipal JSP service, without weakening privacy or pretending uncertain source
data is understood?

The G2 specification gate turned that question into testable requirements
before any implementation work. The gate closed on 2026-10-27, after the
initial review findings were addressed and the relevant actors explicitly
approved the revised specification. That is approval to plan, not to ship.

## Governance before feature scope

The governing change was already ratified and committed as `fdde5b1`.
Constitution v2.1.0 requires transit requests to go directly from the browser
to the fixed municipal JSP, using allowlisted GET actions with credentials
omitted. A Worker or other server-side fallback is not permitted. Production
remains blocked until every required action passes the browser and semantic
release checks.

The same amendment removed a host-specific assumption: GitHub Pages remains
supported, but is not mandatory. The target is permanently zero-cost static
HTTPS hosting. Wildcard CORS can make verification host-independent only if
every required action actually returns `Access-Control-Allow-Origin: *`;
otherwise the configured production origin must be checked. This is a gate,
not a reason to route around a failed check.

The harness makes the decision visible across distinct review lenses. The
Stakeholder, QA Tester, UX Designer, and Frontend Developer each record a
verdict at G2. That separation surfaced different kinds of risk: rider value,
testability, interaction design, and fit with the existing frontend.

## Make the failures useful

The first G2 review did not pass cleanly. The Frontend Developer asked how
arrival freshness should combine with offline status, whether Retry behaved
clearly while another request was in flight, and how internal failure causes
should map to safe rider-facing messages. The Stakeholder found that preserving
favorites was promised but not observable in an acceptance scenario.

Those were specification gaps, not reasons to guess at implementation. The
revisions added a testable freshness and provenance precedence, with strict
30-second and 300-second boundaries; clarified automatic refresh versus Retry,
request coalescing, focus retention, and completion announcements; and kept
distinct normalized failures behind safe rider copy. Favorite stop and line
records must stay in browser `localStorage`, must not be sent in transit
requests, and must not be silently substituted when an identity cannot be
resolved.

The follow-up approvals matter: the original CHANGES REQUESTED findings remain
in the gate record, followed by explicit re-approvals. QA and UX also approved
their bounded G2 reviews. No source requests, implementation tests, or
accessibility conformance were established by this requirements review.

## A direct source is not a verified source contract

The proposal names the fixed municipal endpoint and a closed set of eleven
actions. The browser-facing models are versioned as OpenAPI 3.1.0 version
5.0.0. That version describes source requests and normalized in-browser
contracts; it is **not** a hosted REST API or a new `/api/v5` server.

The initial specification records some earlier local-browser observations,
including successful calls for a subset of actions and wildcard CORS headers
in tested cases. Those observations do not establish all action semantics or
production readiness. The later planning research is explicit about its own
limits: 23 bounded CLI GETs offered partial payload observations, but they
were not browser CORS tests. A local APK/decompilation for independent
inspection was not found during that research; this does not prove that no
such artifact exists elsewhere.

That research did confirm real single-byte accented catalog data, supporting
a decode-bytes-before-JSON design, and observed geometry wrapped as JSON
inside a JSON string. It also exposed why a few successful requests cannot
close the source contract. A schedule query using `id=A` returned mixed-line
trips; day-code meanings and the source schedule-ID mapping remain unresolved.
The meanings of `min` and `ttl`, geometry CRS and full trip/shape parity are
also open. The specification treats these as release blockers, not as
assumptions to be hidden in code.

## Terms for readers new to SDD

- **SDD (Spec-Driven Development):** agree on observable requirements before
  planning and implementation; use phase gates to record whether the evidence
  supports moving forward.
- **G2 / Specify gate:** the review of feature requirements. For this feature,
  it covered stakeholder value, QA testability, UX criteria, and frontend
  feasibility.
- **Harness actor:** a reviewer with an explicitly assigned quality
  responsibility who records a verdict in the project artifacts.
- **OpenAPI contract:** a machine-readable description of requests and data
  models. Here it documents browser-to-source calls and in-process models; it
  does not imply a deployed API.
- **Release blocker:** unresolved evidence that prevents production use, even
  when the specification or plan gate is approved.

## What's next

The specification is the input to the Feature 004 [G3 plan and design
baseline](004-plan.md). The project-wide SDD history is in
[01—Constitution](01-constitution.md), [02—Specification](02-specification.md),
and [03—Plan](03-plan.md). G3 approval permits planning to proceed; it does not
close the later tasks, implementation, accessibility, or release gates.
