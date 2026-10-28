# G2 Specification Gate — Feature 004

Status: **CLOSED — APPROVED**, 2026-10-27. The verdicts below were returned by
the named harness tools, not inferred by the Project Lead. Initial findings are
retained; the subsequent explicit re-approvals supersede them. This gate permits
planning only, not implementation acceptance or production release.

### Frontend Developer Verdict - G2 - 2026-10-27
- Verdict: CHANGES REQUESTED
- Design alignment: Reviewed `spec.md`, including the appended Planning Clarifications and UX Acceptance Baseline, against constitution v2.1.0 and the harness charter. No visual design baseline exists yet; its review belongs to G3. This verdict does not approve UX design or WCAG conformance.
- Verification: Read the feature specification and relevant constitution/charter sections. Inspected existing frontend ports, arrivals application and view modules, line-frequency view, and related unit/DOM/E2E tests. No tests or source requests were run; this was a bounded G2 planning review. The stated unresolved source semantics remain production blockers and are not treated as verified assumptions.
- Findings:
  - Frontend feasibility is good: the existing ports-and-adapters structure can host the direct-source adapter without coupling UI components to JSP payloads; fixture-backed tests and accessibility/responsive test coverage already exist.
  - The user-visible precedence of freshness and provenance is not fully testable. FR-014 defines arrival age thresholds, FR-029 requires distinct cached/offline provenance, and the UX baseline lists cached/offline states, but does not state how those combine when offline or when refresh fails. The current `select-stop.ts` leaves the `offline` state outside its age-based freshness mapping, and `get-stop-arrivals.ts` can return cached arrivals in that state. Acceptance criteria should explicitly prevent old cached arrivals from appearing current and define the 30-second/300-second boundaries for offline and failed-refresh results.
  - The refresh interaction is underspecified: the existing frontend refreshes automatically every 30 seconds and exposes Retry only for stale/unavailable results. The baseline says refresh retains focus on its trigger, but does not establish whether riders have a manual refresh action or whether this refers only to Retry. Nor does it define the visible/busy behavior for repeated or in-flight retry requests.
  - FR-013 requires distinct normalized states for timeout, rate limit, invalid payload, source error, and empty results, while the rider-facing criteria use a generic unavailable state. Clarify whether source causes are distinct internally but intentionally share safe rider copy, and define the expected retry and announcement behavior without exposing raw source errors.
- Required actions:
  - Clarify the G2 acceptance criteria with a testable arrivals state/provenance precedence table covering initial load, valid empty, online success, failed refresh, offline cache, and cache ages at the 30-second and 300-second boundaries.
  - State whether manual refresh exists; define Retry availability and behavior while a request is pending, including the focus expectation.
  - Define the mapping from normalized failure reasons to rider-visible messages and retry behavior; preserve a non-sensitive generic message where appropriate.

### Stakeholder Verdict — G2 Specify — 2026-10-27
- Verdict: CHANGES REQUESTED
- User value assessment: Useful arrival, catalog and day-service journeys, with appropriate privacy and release blockers.
- Findings: Favorite stops/lines preservation was stated but not observable in an acceptance scenario.
- Required actions: Add a testable favorite migration scenario, localStorage-only persistence, and no favorites in requests.

### QA Tester Verdict — G2 — 2026-10-27
- Verdict: APPROVED
- Coverage: 3/3 user stories, 30/30 functional requirements, 13/13 success criteria and all planning/UX baseline areas reviewed.
- Findings: Requirements are testable enough to enter planning. Unknown schedule IDs, charset, geometry/trip semantics and parity are explicit blockers, not verified claims. Fixture isolation, action allowlist and UX criteria are measurable.
- Required actions: none.

### UX Designer Verdict — G2 — 2026-10-27
- Verdict: APPROVED
- Design baseline: `spec.md` and proposed `design-baseline.md`, inheriting feature 003 conventions.
- Accessibility evidence: Document review only; measurable responsive, keyboard, focus, contrast, target, announcement, reduced-motion and textual-map criteria. No delivered WCAG claim.
- Findings: Explicit loading/empty/unavailable/stale/offline states, client-receipt freshness and trustworthy exact-day snapshot provenance.
- Required actions: none for G2; source and production blockers remain.

### Stakeholder Verdict — G2 Re-review — 2026-10-27
- Verdict: APPROVED
- User value assessment: Added criteria preserve saved stops/lines, keep unresolved identities unavailable rather than substitute, and prohibit sending favorites.
- Findings: Design baseline must also cover saved lines, not merely inherited stop favorites.
- Required actions: Align the G3 baseline for opening verified saved lines and displaying unresolved ones; this is not a G2 blocker.

### Frontend Developer Verdict — G2 Re-review — 2026-10-27
- Verdict: APPROVED
- Design alignment: Appended specification resolves prior findings without architecture changes.
- Verification: Read specification fixes and constitution; no implementation checks or tests.
- Findings: State table defines strict 30/300-second boundaries and offline precedence. Automatic refresh versus Retry, request coalescing, focus retention and polite completion are explicit. Internal failure reasons remain distinct with safe rider copy.
- Required actions: none for prior G2 findings. Separate design, implementation and production gates remain open.
