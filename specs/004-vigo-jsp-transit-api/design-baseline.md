# Feature 004 — UX Design Baseline

**Date**: 2026-10-27
**Status**: G3 design approved by UX and agreed by Frontend; see `gate-g3-plan-review.md`. Not implementation authorization or delivered WCAG evidence.

## 1. Authority, inheritance, and scope

- Governing requirements: [feature specification and appended UX acceptance baseline](spec.md), [constitution v2.1.0](../../.specify/memory/constitution.md), and [harness charter](../../docs/harness-charter.md). G1 reference: `fdde5b1`.
- Inherit feature 003's [UI design contract](../003-improve-frontend-design/contracts/ui-design-contract.md): Map/Search/Lines/Saved navigation, current stop-favorite creation, recent history, language control, fixed light appearance, map alternatives, panel behavior, and attribution. Preserve any already-saved legacy/imported line favorites as well as stops; do not introduce a new line-favorite creation control. This document changes source-related presentation, not the navigation or privacy model.
- Do not inherit feature 003's Worker routing, edge freshness metadata, server validation, hosting restriction, or v4 source-boundary assumptions. Feature 004 uses normalized v5.0.0 models and direct browser GET to the fixed municipal JSP, with credentials omitted. No Worker or alternate upstream fallback. Automated tests use deterministic fixtures; local development and production use the supported direct-JSP action set.
- No new privacy page, theme control, profile collection, or rider-facing request-routing explanation. Snapshot source attribution is necessary data provenance, not an explanation of internal routing.
- Frontend agreement, Architect feasibility and affected reviews are recorded in `gate-g3-plan-review.md`. Contract fields below express semantic needs aligned with the v5 planning contract. Numeric resource/cache budgets are defined in the plan.

## 2. Journeys and information hierarchy

| Journey | Ordered information and actions | Acceptance reference |
| --- | --- | --- |
| Open a stop from Map, Search, Saved, or a line | Stop name/public code; favorite and Close; receipt/offline status; ordered arrivals (line, destination, estimated minutes); Try again after failure when online; lines serving stop | US1; FR-003, FR-013–014 |
| Search/browse catalogs | Search/Lines heading and existing controls; source/cache identification where applicable; named results; no-results or unavailable message; Retry | US2; FR-021, FR-028–029 |
| Open line/day service | Public line code/name; day selector; service provenance/status; published timetable/service; ordered trip stops; supplementary route map | US2; FR-024–027 |
| Recover after failure/offline | Retain selected stop/line/day and local favorites; show reason category and original receipt age; offer retry without source switching | FR-007–009, FR-013–014, FR-029 |

Use readable public names/codes, never opaque schedule, shape, or trip identifiers as headings. Municipal and Vitrasa IDs are not interchangeable. No arrival call for a stop without a verified arrivals identifier. Missing optional destination text becomes “Destination unavailable,” not raw payload or an invented destination. Invalid or mismatched required data is unavailable, not valid-empty.

English copy below is intent for localized `es`/`gl`/`en` strings. Preserve language selection. Municipal catalog/service names use GA for Galego, ES for Castellano/English; do not pretend source names have an English translation.

## 3. Reviewable layouts and responsive behavior

```text
320 × 700 CSS px                  768 × 1024 CSS px
+---------------------------+    +----------------------------------+
| App             Language  |    | App                     Language |
| Offline banner, if needed |    | Offline banner, if needed        |
+---------------------------+    +----------------------------------+
| Map / active destination  |    | Map / active destination         |
|                           |    |                                  |
+---------------------------+    +----------------------------------+
| Stop or line heading [X]  |    | Stop or line heading    [X]     |
| Received ... / provenance |    | Received ... / provenance        |
| Arrivals OR service/day   |    | Arrivals OR service/day          |
| Text stops / actions      |    | Text stops / actions             |
+---------------------------+    +----------------------------------+
| Map Search Lines Saved    |    | Map   Search   Lines   Saved     |
+---------------------------+    +----------------------------------+

1280 × 900 CSS px
+------------------------------------------------------------------+
| App                                        Language              |
| Offline banner, if needed                                        |
+----------+--------------------------+----------------------------+
| Nav rail | Context panel, 360 px     | Map / active destination   |
| icon +   | Stop or line heading [X] |                            |
| label    | Status/provenance        | Supplementary route only   |
|          | Arrivals OR day/service  | when verified geometry     |
|          | Ordered stops / actions  | is available               |
+----------+--------------------------+----------------------------+
```

- Inherit breakpoints: phone `<600`; tablet `600–1023` with bottom navigation in portrait; rail at `>=1024` (including inherited 1024×768 review). At 1280, use a 360 px context panel within inherited 340–400 px range; map takes remaining space.
- At 320, stop/line details are a non-modal bottom `aside`; peek is a minimum 96 px, not a clipping limit. Expanded sheet is at most 85% of available content height. At 768 portrait it occupies at most 50%; scroll panel content internally. Keep header, bottom navigation, Close, and focused controls reachable.
- Offline banner consumes layout space; it does not overlay controls. Sticky areas must not obscure focused content. Let long provenance and localized status text wrap. Do not truncate dates, day labels, or freshness qualifiers.
- Use 16 px content padding, 8 px minimum gaps, and single-column actions at narrow widths. Day tabs and navigation labels wrap; controls grow in height. No fixed row height that clips enlarged text.
- At 200% zoom use effective CSS width to select layout; a desktop may become the phone layout. At 320 CSS px and 200% text resizing, no page-level horizontal overflow, clipped status text, or inaccessible action. Timetables use simple day/time tables or stacked groups rather than a wide multi-day grid.
- Search, Lines, and Saved remain full content views, not compulsory map overlays. Route/map failure cannot displace valid service or stop text.

## 4. Inherited design tokens

Reuse feature 003 tokens; do not introduce a new visual theme.

| Token | Value / usage |
| --- | --- |
| Canvas / soft surface | `#FFFFFF` / `#F8E6E3` |
| Primary / secondary text | `#332321` / `#5A4947` |
| Accent / on-accent | `#9B2F3B` / `#FFFFFF` |
| Border / focus | `#8A6F6B` / `#7D2230` |
| Recently received foreground/background | `#14532D` / `#E3F4E8` |
| Stale foreground/background | `#6B4300` / `#FFF0D2` |
| Error foreground/background | `#8A1B2B` / `#FDE6E9` |
| Offline foreground/background | `#3B4658` / `#E7ECF3` |
| Disabled foreground/background | `#6E5F5C` / `#F2ECEB` |
| Type | System UI; base 16/24, small 14/20, h1 24/32, h2 20/28, minutes 28/32 bold; rem units |
| Spacing / radius | 4, 8, 12, 16, 24, 32 px; controls 8 px, sheet 16 px, chips pill |
| Focus / targets | 3 px solid focus outline, 2 px offset; every action at least 44×44 CSS px |
| Motion | Inherited 200 ms transitions; instant changes/static placeholders with reduced motion |

Inherited contrast calculations are design references, not new implementation evidence. Required rendered ratios: normal text ≥4.5:1, large text ≥3:1, meaningful UI boundaries/focus ≥3:1. Source line colors must use a verified accessible text pair or the accent/on-accent fallback. Status always has text plus an icon; color alone carries no meaning. Map markers retain a white halo and selected ring; inspect actual tiles and attribution at G5.

## 5. Component states and receipt-age policy

Receipt time means the client received and fully validated that response. It is not provider generation time. Store and reuse the original receipt time; a cache read, refresh start, reopen, or connectivity change must not reset it. Do not use “Updated,” “Live now,” or a provider-freshness guarantee for these states.

| State / trigger | Visible content and action | Accessible status behavior |
| --- | --- | --- |
| Initial loading | “Loading arrivals” or “Loading service”; static/skeleton placeholders, existing Close/navigation usable | Mark only changing content busy; polite “Still loading” once at 3 s if pending |
| Received, age <30 s | “Received N seconds ago — provider update time unknown”; validated estimates in ascending wait order | First successful load summarized once; unchanged periodic refresh not announced |
| Refresh pending, previous receipt age ≥30 s | “Refreshing — previous response received N seconds ago”; prior rows explicitly qualified, not labeled current or failed | No repeated announcement or focus movement |
| Refresh failure, age 30–<300 s | “Could not refresh. Last response received N seconds ago”; last-known estimates, Try again | Polite once on entering stale; never announce each age tick |
| Failure while receipt age <30 s | Keep receipt-age wording and add “Could not refresh”; do not assert provider freshness | Announce failure once; stale age band begins at 30 s if failure persists |
| Age ≥300 s | “Arrivals unavailable right now”; do not show expired estimates as usable upcoming arrivals; Try again | Polite once; age can remain as history metadata, not current estimates |
| Valid-empty response | “No upcoming buses were returned for this stop”; receipt-age qualifier and serving-lines action | Polite once; same age limits as populated responses |
| Empty result after failed refresh | “Last response contained no arrivals; could not refresh. Received N seconds ago” within allowed age | Do not assert there are currently no buses; expire at 300 s |
| No usable response / timeout / malformed / oversized / partial / mismatched response | “Arrivals unavailable right now” or “Service unavailable for this day”; Try again | Textual polite status once, not empty; no raw JSP/error payload |
| Stop has no verified live identifier | “Live arrivals are not available for this stop”; link to line service | No request, no substitute ID; announce once |
| Offline with bounded cached arrivals | “You are offline. Cached response received N seconds ago”; eligible last-known rows only, subject to receipt-age limits | Offline once; never “live”; expired rows removed |
| Offline without usable data | “You are offline. No saved arrivals are available”; retain navigation/favorites and available labeled catalog | Polite once; Retry unavailable offline; connectivity recovery uses normal refresh, no alternate source |
| Catalog unavailable / no search matches | “Could not load lines/stops” + Retry versus “No stops match …” + Clear | Failure and zero matching results are distinct; inherited search count region only |
| Geometry unavailable | “Route map unavailable”; retain valid service and ordered stops | Polite once if selected map request fails; no fabricated segments |

Each source operation reaches a validated outcome or unavailable state within the specification's 5-second total deadline, including body and validation. Independent valid service/stop data may remain when geometry fails; a partially validated arrivals response must not be presented as complete.

Preserve automatic refresh every 30 seconds while visible; no new manual Refresh
control. Try again is a stable button for failed stale/unavailable states when
online. Keep focus on it throughout asynchronous updates; use
`aria-disabled="true"` and coalesce activation while pending without replacing
the node. Hide no focused node during completion; announce completion once
politely. Retry is unavailable offline; connectivity recovery uses the same
refresh path. Keep age text outside live regions. Summarize changed first-arrival
information politely, not every countdown tick. Resume from background using
original receipt age; do not flash expired rows as current. Numeric poll/cache
budgets are defined in `plan.md`/`research.md` as client limits, not provider policy.

Internal transport/timeout/rate/HTTP/invalid/oversized/mapping failure causes stay
distinct for tests and sanitized diagnostics. Rider copy remains localized and
safe; no raw source errors. At age 30–<300 s without a completed failure, show
refresh-due/updating, not stale-after-failure. At >=300 s suppress actionable
estimates regardless of connectivity, pending requests or cached provenance.

Saved migration: each saved stop or existing legacy line keeps its localStorage
identity. A verified saved line opens the existing line/day detail view through
its verified mapping. An unresolved saved item remains named in Saved with
“Saved item unavailable” and the existing remove action; opening must not
substitute another entity or delete it. Retain the last known readable label
when available, not a raw source ID. If no label survives, use “Saved stop
unavailable” or “Saved line unavailable.” Do not create a new favorite-line flow.

### Saved migration and persistence-warning states

Reuse the inherited textual storage-warning banner inside Saved, directly after
the h1 and before recovered items; if the inherited shell banner is already
showing the same warning, do not duplicate it. Associate the warning with the
Saved list using `aria-describedby`. It wraps at 320 CSS px, uses the inherited
error/status tokens with required contrast and a text/icon cue, and is readable
by keyboard/screen reader without an interactive control. Use one polite
`role="status"` announcement when entering/changing the state, not per item or
per repeated storage attempt. Do not steal focus or block list/remove/navigation
actions. Never expose raw storage bytes, keys, IDs or provider errors.

| Condition | Rider-facing intent (localize es/gl/en) | Available data and behavior |
| --- | --- | --- |
| Malformed/unknown-version migration with recoverable entries | “Some saved items could not be read. Original saved data was kept. Recovered items are available in this tab; saving changes has not been confirmed.” | Show valid recovered items in memory with normal verified/unresolved labels. Preserve original bytes. Do not report a successful migration or write over malformed data. |
| Quota/access failure during migration or subsequent persistence | “Could not save changes on this device. Last confirmed saved data was kept. Items and changes in this tab may be lost when it closes.” | Keep recovered/current in-memory items, IDs and order. `persisted:false`; removing/reordering affects this tab only while persistence is unavailable. Do not imply those edits survived reload. |
| Successful fully validated migration/write | No failure banner; optional one-time polite “Saved items are available.” | Only report saved after the complete v2 write succeeds. Still retain original v1 bytes per migration policy. |

These are storage states, separate from transit offline/unavailable and arrival
Retry. They do not add a new retry/control/recovery workflow or trigger network
access. Do not silently auto-rewrite corrupt originals; a future explicit
recovery flow would require UX review. At G5 test malformed/unknown-version and
quota/access states with recovered stop/line/unresolved records, repeated renders,
focus retention, one announcement, narrow reflow and no false “saved” message.

## 6. Timetable and catalog provenance

Display provenance immediately below the selected line/day heading and before timetable values, in the same accessible reading order. Never hide it only in a tooltip, legend, color, or map.

| Data origin | Required display |
| --- | --- |
| Validated municipal service | “Municipal service response — received [local date/time with timezone]”; if no verified provider date, “Provider update time unknown” |
| Previously received catalog/service cache | “Cached municipal data — received [original date/time with timezone]”; offline/failure qualifier when applicable |
| Bundled discovery/offline catalog | “Bundled catalog — [documented source and trustworthy date, if known]”; state when its date is unknown and do not call it current |
| Eligible migration/offline timetable snapshot | “Bundled timetable — [source name] — [date type and trustworthy date] — [public line/direction], [selected day type]. Not live municipal data” |
| No trustworthy matching timetable | “Timetable unavailable for [line], [day type]”; retain other valid information and retry where meaningful |

Snapshot eligibility is exact: verified selected line, direction/service variant where relevant, and selected weekday, Saturday, or Sunday/holiday combination. Do not borrow another day or infer holiday coverage, line identity, missing times, shape, or trip.

A trustworthy snapshot date requires an auditable provenance record tied to that data artifact: named source, evidence reference, date value and what it denotes (publication, effective date/range, or documented capture), and confirmed line/day association. A build date, file modification time, application release date, or today's cache read is not a substitute. A documented capture date is labeled as capture, not publication or guaranteed current validity. If date/source/association cannot be established, suppress the timetable and show unavailable. Do not invent a date for existing assets.

Switching day updates the selected-day label and provenance together, clears incompatible previous values, and discards late results for the prior selection. Use an accessible tablist with arrow/Home/End navigation; activate with Enter/Space when activation fetches data. Distinguish loading, unavailable, and a validated “No published service returned for this day.”

No automatic alternate network source. A permitted bundled snapshot is an explicit labeled local migration/offline presentation, never a successful JSP response. Retain the snapshot until recorded weekday/Saturday/Sunday-holiday coverage and parity checks permit retirement; this design does not establish parity.

## 7. Textual route/trip alternative and focus

- A route section always offers service text and, when a verified relationship exists, an ordered semantic `ol` of trip stops. Identify line, day, destination/direction when verified. Each stop has a readable name/public code and a separate Open stop action and favorite toggle where applicable.
- A provisional geometry without a verified linked stop sequence is decorative (`aria-hidden`) and accompanied by visible text stating that no verified stop-by-stop description is available. Do not present an independently sourced trip sequence as the equivalent of that geometry. When a verified relationship exists, the ordered text is the equivalent to route geometry and must not depend on map loading or pointer interaction.
- Missing positions do not remove verified stops from the text list. Missing trip sequence shows “Stop sequence unavailable,” not a synthesized order. No invented straight-line route.
- Preserve inherited Map “Stops in view,” Search, and Lines keyboard alternatives; do not rely on canvas accessibility. Map controls and attribution remain reachable, visible, and named.
- Landmarks: header, Main navigation, main with one destination h1, context aside labeled by h2. Tables have captions and headers. Status and provenance are readable text associated with the relevant section.
- Destination navigation focuses the destination h1; opening details focuses its h2. Close/Escape returns focus to opener, or destination h1/Map “Stops in view” when opener no longer exists. Changing stop explicitly focuses the new heading and drops late prior-stop results.
- Non-modal sheets/panels do not trap focus. Chooser dialogs contain focus and restore it on close. Language-menu keyboard behavior remains inherited. A keyboard user can enter and leave every interactive region.
- Expand/Collapse and Close are visible 44×44 controls; dragging is optional. Logical inherited focus order is header, panel, main content, navigation. Offscreen/inactive content is inert; focus never lands behind a sheet or sticky banner. Provide a visible-on-focus skip link to main.
- Background refresh, connectivity, receipt-age changes, and service updates do not steal focus or reset panel scroll. Use the existing polite panel status region and search-count region; avoid duplicate per-row announcements.

## 8. Required validation plan — not completed evidence

Use fixture scenarios by default. No tests were run for this design review; no browser, keyboard, screen-reader, zoom, contrast, or automated-scan result is claimed here.

| Coverage | Planned methods and applicable WCAG 2.2 criteria |
| --- | --- |
| Map, Search, Lines, Saved; stop and line panels; dialogs and language menu | Manual keyboard Tab/Shift+Tab/Enter/Space/arrows/Home/End/Escape, Back, skip link, focus return and no trap; 2.1.1, 2.1.2, 2.4.1, 2.4.3, 2.4.7, 2.4.11 |
| Names, roles, day tabs, tables, ordered stops, favorite state | Automated accessible-name/role assertions and inspect accessibility tree; 1.3.1, 1.3.2, 2.4.6, 2.5.3, 4.1.2 |
| Loading → success/empty/error; delayed load; retry; freshness boundaries | Fixture-controlled transitions; automated live-region semantics and silence on age ticks; stable focus and preserved scroll; 4.1.3, 2.4.3 |
| Offline/cache/no cache, failures at <30/30/299/300 s, empty-cache aging, background resume | Fake-clock automated assertions plus manual boundary/state review; check original receipt time and absence of false freshness claims |
| Responsive and enlarged text | Screenshots/manual checks at 320×700, 768×1024, 1280×900, plus inherited 1024×768; 200% browser zoom and 200% text resizing, 320 CSS-pixel reflow; long es/gl/en labels and provenance; 1.4.4, 1.4.10, 1.4.12 |
| Light tokens, status, focus, source badges, map attribution | Rendered contrast analyzer and manual inspection, including hover/pressed/disabled and actual map tiles; 1.4.1, 1.4.3, 1.4.11 |
| Targets, sheet alternatives, map controls, reduced motion | Measure ≥44×44 CSS px (project criterion stronger than 2.5.8 minimum); no drag-only action (2.5.7); OS reduced-motion setting with static placeholders and instant map/sheet transitions |
| Snapshot provenance and textual alternative | Fixture exact-line/day and wrong-line/day/direction cases; missing/untrusted date; cached source; unavailable geometry/trip; manually verify visible date meaning and equivalent ordered text |

QA coordination: add Playwright/axe checks of each destination and representative panel states at all three requested widths, accessible-name/role assertions, zero default municipal requests, and deterministic malformed/timeout/oversized/mismatched responses. Automation supplements, not replaces, in-scope manual keyboard, reflow, focus, and contrast checks.

Product-owner scope decision (2026-10-28): all outstanding validation listed in T069, including axe, keyboard, screen-reader, reflow, focus, target-size, map-text and contrast checks, is deferred to a future spec. This limited G5 closure does not claim the deferred checks passed or establish WCAG conformance.

Each current-scope evidence entry must record commit/build, tested page/journey/state, fixture/profile, viewport/zoom/text scale, relevant success criteria, steps, expected/observed result, pass/fail, evidence location, tester/date, and limitations. Record OS/browser and assistive-technology versions when applicable; their absence is not a G5 gap for the deferred screen-reader tests. Unresolved applicable accessibility failures or missing in-scope evidence block UX G5 approval.

## 9. Pending review boundaries

- Frontend Developer: review feasibility and agreement with layouts, focus preservation, announcements, and localized provenance.
- Software Architect with contract owners: verify normalized models can carry original receipt time, source distinction, exact service-day identity, trusted snapshot metadata, validated geometry, and ordered trip stops.
- QA/Stakeholder retain their own G2 decisions. Final planning artifacts and resource budgets require a separate later review. This proposal grants no other actor approval and closes neither G3 nor G4.

### UX Designer Verdict - G2 - 2026-10-27
- Verdict: APPROVED
- Design baseline: [feature 004 specification including appended UX acceptance baseline](spec.md); inherited [feature 003 UI design contract](../003-improve-frontend-design/contracts/ui-design-contract.md). This document is a proposed G3 elaboration only.
- Accessibility evidence: Document review only. The appended baseline supplies measurable 320/768/1280 CSS-pixel and 200% zoom checks, keyboard/focus behavior, polite announcements, ≥44×44 targets, contrast thresholds, reduced motion, and semantic map alternatives. FR-014/FR-029 and SC-012 distinguish client receipt age from provider generation time; FR-021/FR-027 and SC-013 require exact-line/day dated snapshot provenance. Automated and in-scope manual G5 evidence is required; VoiceOver/Safari and NVDA/Firefox manual testing is deferred by the product-owner decision dated 2026-10-28. No delivered WCAG conformance or executed check is claimed.
- Findings:
  - Stop arrivals, catalog/service browsing, and fixture/local-live journeys have observable loading, valid-empty, unavailable, stale, and offline outcomes without automatic network-source switching.
  - Navigation, favorites, fixed light appearance, and locale behavior inherit feature 003; valid textual service/stop information survives geometry failure.
  - The seven supported actions have bounded browser verification recorded in `source-evidence.md`; schedule mapping/parity, four unavailable actions, and delivered WCAG evidence remain unverified and are deferred from this limited G5 closure. G2 approval does not resolve those items.
- Required actions: none for UX G2. Obtain remaining actors' independent verdicts and separate G3 review after planning artifacts exist.
