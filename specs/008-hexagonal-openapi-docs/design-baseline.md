# G3 UX Design Baseline — Feature 008

**Date**: 2026-10-28
**Status**: Revised visual baseline — static source-and-preview workspace
**Scope**: Static HTML OpenAPI documentation page and README information
hierarchy. This is a reviewable experience specification, not implementation
code.

## Design inputs and boundaries

- [Approved feature specification](./spec.md)
- [Implementation plan](./plan.md)
- [OpenAPI documentation page contract](./contracts/openapi-docs-page.md)
- Existing frontend visual conventions in `frontend/src/ui/styles.css`

The page documents the canonical contract at
`specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`.
It is a static, build-generated document, not a transit API, application
endpoint, proxy, or separately hosted service. It must not imply operations or
capabilities absent from that contract. It has no runtime YAML fetch, transit
request, remote script, font, CDN, tracking, or user-data collection.

## Experience goals

1. Let a developer understand the contract's scope, locate an operation or
   schema, and inspect its documented fields without first reading YAML.
2. Keep the complete contract navigable with keyboard and assistive technology,
   including long descriptions and nested schemas.
3. Make the static documentation directly addressable at root and at the
   configured application base path.
4. Make the README's purpose, architecture, setup, validation, and OpenAPI
   entry point scannable without dropping its data, privacy, hosting, or source
   limitations.

## HTML OpenAPI page

### Information hierarchy and page outline

Use one document title and one visible `h1`. On wide screens, present a
Swagger Editor-inspired split workspace: a read-only canonical YAML source pane
on the left and the rendered contract documentation on the right. This is a
visual reference only; do not copy the editor's branded assets or imply that
the source can be edited or submitted. At narrow widths, stack the source pane
above the rendered documentation and constrain its height so it does not
displace the contract content.

```text
Skip to rendered documentation
Header: Vigo Bus Navigator / OpenAPI Editor
Workspace
  Read-only source pane
    Canonical OpenAPI YAML
  Rendered documentation pane
    h1: Municipal transit API contract
    Intro: canonical contract, purpose, and no-backend boundary
    Contract metadata, when defined by the source
    On this page
      Operations
        links to contract-defined operation entries
      Schemas
        links to contract-defined component schemas
    Operations
      operation entry for each source operation
    Schemas
      component schema entry for each source component
    Footer: canonical source reference and project link
```

Label the source pane **“YAML · read only”**. Render the canonical source as
escaped text in a selectable, wrapping monospace code block; never use an
editable control or execute/submit source from the page. The source panel and
rendered documentation are independently scrollable on wide screens. On small
screens, source text remains available without trapping keyboard focus or
causing page-level horizontal overflow.

The intro identifies this as documentation of the currently supported
municipal transit contract. Show contract-derived title/version or other
metadata only when defined; do not fabricate metadata. Preserve source
descriptions and extension fields, with clear labels where an extension needs
context. Source-derived content is escaped and visibly distinguished from
navigation labels.

Headings are sequential and descriptive: `h1` for the page, `h2` for major
sections, and `h3` for operation and schema entries. Use a short operation
heading containing the method and path; show the operation ID and source
summary/description as secondary content when defined. Do not use headings
solely to style text.

### Operations and schemas

- Provide an operation index that links to every rendered operation. Group by
  path, or by source-defined tags where tags exist and that grouping remains
  unambiguous. Do not add a tag taxonomy not present in the contract.
- Each operation entry begins with the HTTP method and exact path, then its
  operation ID and source summary/description when present. Method must be
  spelled out in text; color or a badge alone never conveys it.
- Present parameters as individually labeled, readable records (name,
  location, required/optional, and schema). A narrow viewport must not force a
  wide parameter table; if a table is used at larger widths, it must retain
  clear headers and reflow without page-level horizontal scrolling.
- Present request-body media types and schemas only where the source defines
  them. Present each response status code, media type, schema, and description
  where defined. Keep status and media type text explicit and adjacent to the
  schema they qualify.
- Provide a separate schema index and an entry for every component schema.
  Preserve nested properties, types, constraints, descriptions, extension
  fields, and local references from the source. A reference is a meaningful
  link to the referenced local definition when resolvable; it must also retain
  its textual target so the relationship is clear to non-visual users.
- Render nested schema structure as indented, labeled content rather than
  color-only syntax. Monospaced styling may identify literal names, values,
  paths, and schema fragments, but must not reduce readability. Long
  identifiers, URLs, descriptions, and schema expressions wrap at arbitrary
  opportunities instead of widening the page. Preserve whitespace only where
  meaningful; do not truncate contract content.
- If an operation or schema uses a disclosure to manage page length, use a
  native keyboard-operable disclosure with an informative summary that
  includes the operation path/method or schema name. Required contract content
  is available on expansion, and expanded/collapsed state is exposed natively.
  Avoid custom controls, hover-only information, and unlabeled icon buttons.
  In the absence of a demonstrated need for disclosures, keep content visible.

### Controls and navigation

- Include a first-focusable “Skip to rendered documentation” link, visible on
  focus.
- Use a semantic `nav` with a programmatic label for the in-page index. Links
  have concise, unique names derived from the operation path/method or schema
  name and target stable section headings.
- Use native anchors and, if needed, native disclosure elements. There is no
  search, filtering, sorting, live API “try it” control, or copy-to-clipboard
  interaction in this baseline; none is required by the contract and these
  would add behavior without established user need.
- Keep keyboard focus in document order. Activating an index link follows the
  anchor and leaves the destination heading/content understandable; do not
  move focus into a hidden or unrelated region. If target headings are made
  programmatically focusable for anchor behavior, focus indication remains
  visible and keyboard order is not disrupted.
- The home/project link and any internal asset or documentation links resolve
  relative to the configured application base. No root-absolute link may
  accidentally escape a non-root deployment.

### Responsive layout and reflow

Use a responsive two-pane workspace on wide screens, with the source taking
approximately 45% of the width and the rendered documentation 55%. Each pane
has a visible heading, and both remain independently scrollable. Keep operation
cards compact, method labels explicit in text, and content measure readable.

At narrow widths, stack the source pane first and rendered contract second.
Bound the source pane's height while keeping its content scrollable. Use fluid
gutters and `min-width: 0` behavior for all content regions. Tables, if
retained, must reflow or become individually scrollable without creating
page-level horizontal scrolling or hiding data; prefer stacked labeled
records for parameter and response details. Code and schema content wraps and
remains selectable. No information or control is available only by hover.

At 320 CSS pixels and at 200% text zoom, all content and controls remain
available without page-level horizontal overflow or loss of functionality.
The design also tolerates user text-spacing overrides without clipped or
overlapping content. Do not lock text sizing or viewport scaling.

### Visual tokens and readability

Reuse the established frontend light palette and spacing conventions:

| Role | Baseline |
| --- | --- |
| Page canvas / primary text | `--canvas` (`#FFFFFF`) / `--text` (`#332321`) |
| Secondary text | `--text-secondary` (`#5A4947`) |
| Accent / links | `--accent` (`#9B2F3B`); links are underlined in body text |
| Borders / separators | `--border` (`#8A6F6B`), with visible labels or spacing in addition to color |
| Keyboard focus | `--focus` (`#7D2230`), 3px outline with 2px offset, consistent with `:focus-visible`; must remain visible and unobscured |
| Spacing | Existing 4, 8, 12, 16, 24, and 32px spacing scale |
| Body text | Existing 16px / 24px sans-serif baseline; allow browser/user enlargement |
| Code and schema | Readable system monospace, at least body-relative sizing, normal contrast and wrapping |

These are reuse targets, not a conformance claim. Validate actual foreground,
background, link, border, focus, and component-state combinations against WCAG
2.2 AA: normal text contrast is at least 4.5:1 (1.4.3); large text is at least
3:1 (1.4.3); and necessary non-text control/focus cues are at least 3:1 against
adjacent colors (1.4.11). Do not use color as the only distinction between
HTTP methods, required status, links, or schema relationships. Keep line
length, line height, and whitespace suitable for scanning dense contract
content. The page uses no motion; if motion is later introduced, it must honor
`prefers-reduced-motion`.

Applicable AA design and verification criteria include WCAG 2.2 SC 1.3.1,
1.3.2, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.2, 2.4.3,
2.4.4, 2.4.6, 2.4.7, 2.4.11, 2.5.3, 2.5.8, and 4.1.2 as applicable to
implemented content and controls. Interactive page controls provide at least
44 CSS-pixel touch targets under the project constitution, exceeding the
WCAG 2.5.8 minimum where it applies.

### Loading, empty, error, and offline states

- **Loading**: The delivered document is static HTML and has no runtime
  contract-loading phase. Do not show a fabricated spinner or indefinite
  loading state. The browser's normal page-load behavior is sufficient.
- **Empty contract section**: If a valid source has no entries for a section,
  show a brief, visible explanation such as “No operations are defined in this
  contract” or “No component schemas are defined.” Omit the corresponding
  index group when empty. Do not present an empty section as evidence of
  undocumented support. A contract that violates validation remains a build
  failure, not a successful empty page.
- **Build/generation error**: Missing, invalid, unresolved, or unrenderable
  source prevents successful output/publication; do not retain or present
  stale generated HTML as current. Report useful diagnostics to the maintainer.
- **Build/generation error**: The output is generated HTML with no runtime
  contract renderer. Missing/invalid input, unresolved references, or
  rendering errors therefore occur during the build. The generator removes
  prior page files from both its public intermediate and `dist`, then reports
  the canonical source path, failure category, and corrective guidance and
  exits unsuccessfully. The failed build cannot reach deployment upload. There
  is no reader-facing runtime rendering error page or UI state to design or
  test. If a later scope introduces client-side rendering, its accessible
  unavailable state requires a spec/design revision before implementation.
- **Offline**: The page makes no runtime request for contract data or remote
  assets. If its static HTML is available, the same content and navigation
  work offline. If the browser cannot retrieve the static document and it is
  not cached, do not claim the application can supply an offline copy; the
  browser/host unavailable response is outside the page's rendering state.

### Root and configured non-root base paths

The route is application-relative `/docs/openapi/`. At root deployment the
direct URL is `<origin>/docs/openapi/`; with a configured base such as
`/vigo-bus-navigator/`, it is
`<origin>/vigo-bus-navigator/docs/openapi/`. The page works by direct entry,
refresh, and in-page navigation in both cases. Links, home navigation, and
asset references must use the same configured base as the application; do not
hard-code the current GitHub Pages prefix or assume the site is hosted at `/`.
The URL serves the real static documentation file, not the SPA shell.

## README information hierarchy and link affordance

Reorganize the README into short sections with descriptive headings in this
order:

1. **Project name and purpose** — one-line static, client-only product
   description and core user value.
2. **Architecture at a glance** — browser-first/hexagonal overview, inward
   dependency direction, and a link to the maintained runtime-module inventory
   or architecture documentation.
3. **OpenAPI documentation** — prominent, descriptive link to “Municipal
   transit OpenAPI documentation,” plus one sentence that this is a static
   representation of the canonical contract, not a transit backend. Include
   the local preview route `/docs/openapi/` and explain that deployment adds
   the configured base path.
4. **Quick start** — prerequisites and concise setup steps; state that no
   backend or credentials are required.
5. **Validation** — scannable command block and any necessary build/size
   ordering or browser-install caveat.
6. **Data, privacy, and service limitations** — retain direct municipal
   browser requests, profile behavior, local storage, privacy/security limits,
   service-worker scope, availability/provenance caveats, and the absence of a
   separately hosted transit backend.
7. **Repository layout and project workflow** — concise navigation to specs,
   tests, tools, and harness material. Reconcile the README's actor and gate
   summaries with `docs/harness-charter.md`, or link directly to the charter as
   the authoritative source; do not retain the current incomplete actor list
   or outdated gate assignments.
8. **Status and license** — official-service disclaimer and license/notice
   links, without duplicating contradictory license statements.

The OpenAPI link must have visible, descriptive text, not a bare URL or “click
here.” Rely on and test the repository renderer's native visible keyboard-focus
treatment; README Markdown cannot define custom focus CSS. The deployed link is
`https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/`; update it if the
configured static host changes. For local preview, identify `/docs/openapi/`
separately so readers do not mistake a root-relative route for a deployed URL.
If a link opens a new context (not recommended), say so in its accessible name;
the baseline keeps normal same-context navigation. Inline README text links use
the applicable WCAG 2.2 SC 2.5.8 target-size exception. Preserve existing
accurate caveats while editing; section condensation must not remove them.

## Validation plan and G5 evidence required

Run automated checks on the built documentation page at root and configured
non-root paths, and on the README link affordance where testable:

- Playwright direct-route tests verify the response is the generated docs page,
  including trailing-slash navigation, not the SPA shell; verify links and
  anchor destinations at root and non-root base paths.
- Playwright responsive checks at 320 CSS pixels and 200% text zoom (or an
  equivalent reproducible viewport/zoom procedure) verify content availability
  and absence of page-level horizontal overflow.
- Run the repository's existing Axe/`@axe-core/playwright` scan against the
  documentation ready state and applicable empty-section state. Record
  tool/version, tested URL/base path, state, viewport, findings, and disposition.
- Automated scans supplement manual review and cannot by themselves establish
  WCAG conformance.

Manual WCAG 2.2 AA review is required before G5 approval:

- Keyboard-only traversal: skip link, index links, operation/schema links,
  native disclosures if present, no keyboard trap, logical focus order,
  visible focus, and focus not obscured (including WCAG 2.2 SC 2.4.7 and
  2.4.11 as applicable). Verify focus-indicator contrast under SC 1.4.11;
  WCAG 2.2 SC 2.4.13 Focus Appearance is AAA and may be used as a stricter
  design check, but is not an AA conformance requirement.
- Screen-reader checks with at least one desktop screen reader/browser
  combination: landmarks, page title, heading outline, link purpose, native
  disclosure names/state, operation/parameter/response relationships, schema
  nesting and references, and empty-section behavior. Record the
  actual combination; do not infer behavior from markup alone.
- Contrast measurement for text, links, focus indicator, borders and other
  necessary visual cues; verify information is not color-only.
- Reflow and enlargement at 320 CSS pixels and 200% text zoom, including
  long paths, identifiers, descriptions, nested schemas, and any tables.
- User text spacing (WCAG 1.4.12) and target size for any interactive controls
  (WCAG 2.5.8); page controls must meet the project 44 CSS-pixel touch-target
  rule. Verify no text clipping/overlap and adequate target spacing. Treat
  inline README text links using the WCAG target-size exception where
  applicable.
- Inspect ready, empty-section, and offline-available states. Test generator
  error diagnostics (source, category, corrective guidance), stale-file
  removal, and blocked publication separately from page accessibility:
  no runtime unavailable state exists in this static document. Verify no
  motion is present, or reduced-motion handling if future motion is added.

Applicable success criteria include WCAG 2.2 AA 1.3.1, 1.3.2, 1.4.3, 1.4.4,
1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.2, 2.4.3, 2.4.6, 2.4.7, 2.4.11,
2.5.3, 2.5.8, and 4.1.2, subject to implemented controls and page states.
G5 evidence must identify the pages, states, viewports, tools, criteria
checked, results, and remaining limitations. Missing manual evidence or an
unresolved applicable failure blocks approval; no test result is asserted by
this design baseline.

## Unresolved design constraints

- The canonical contract's specific tags, metadata, operation volume, and schema
  nesting determine the final index grouping and whether native disclosures
  are needed. Do not invent content; confirm the generated hierarchy against
  the actual contract during implementation review.
- The exact screen-reader/browser combinations and manual test environment are
  not evidenced yet. QA/UX must record available environments and any
  untested combinations during G5.
