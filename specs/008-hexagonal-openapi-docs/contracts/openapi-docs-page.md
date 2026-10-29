# OpenAPI Documentation Page Contract

## Purpose and Boundary

The project provides a browser-readable static document for the canonical
municipal transit contract. This is documentation, not a new application API,
transit endpoint, proxy, or backend service.

## Source and Address

- Canonical source:
  `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`
- Application-relative path: `/docs/openapi/`
- Published path:
  `<application-origin><configured-base-path>/docs/openapi/`
- The static build output contains an actual `docs/openapi/index.html`; a
  navigation fallback to the PWA shell does not satisfy direct access.
- The page is generated into a git-ignored public intermediate before Vite
  copies assets and Workbox builds its precache. The generated intermediate is
  removed before a new validation attempt so invalid input cannot leave a stale
  successful-looking source file.
- The PWA navigation fallback excludes the docs route. Direct navigation while
  the active service worker controls the browser must still return the
  documentation page at root and non-root base paths.
- The current deployment uses the `/vigo-bus-navigator/` base path. Root
  hosting uses `/`. Vite, assets, PWA configuration, and validation use the
  same configured base.
- The README links to the current deployed static page and identifies the local
  route for preview builds.
- Current deployment link:
  `https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/`. Update this
  origin-dependent link when the repository's configured static host changes;
  the application-relative path remains `/docs/openapi/`.

## Rendered Content

The page visibly represents the current contract's:

- path and HTTP method for every operation;
- operation identifiers and defined summaries/descriptions;
- each parameter's name, location, required status, and schema;
- request-body media types and schemas when present;
- response status codes, media types, and schemas when present;
- all component schemas and local references;
- contract extension fields and descriptions.

No operation or schema not present in the canonical contract is presented as
supported. Rendered elements retain stable pointers to source fields so tests
can compare source coverage with output. Contract-derived text and attributes
are HTML-escaped.

## Source-and-Preview Workspace

- On wide screens, the page presents the canonical YAML source in a read-only
  code pane beside the rendered contract documentation.
- The source pane is labeled as YAML and read-only; it is not editable,
  submitted, or executed. The source text is escaped and selectable.
- The rendered documentation remains complete and generated from the same
  validated source as the adjacent YAML.
- On narrow screens, the source and rendered documentation stack vertically.
  The source pane has bounded height and remains scrollable; the contract
  content remains directly reachable without page-level horizontal overflow.
- The visual treatment may take inspiration from Swagger Editor's editor and
  preview layout, but must not use its branded assets or suggest this is an
  interactive API or editor.

## Build and Failure Behavior

- The page is generated deterministically during the static build.
- A valid build emits a non-empty `dist/docs/openapi/index.html`.
- Missing/unreadable contract input, invalid YAML/OpenAPI structure,
  unresolved local references, or renderer errors cause a nonzero build result.
- Before validation, the generator removes any prior docs page from both the
  public intermediate and `dist`. For each failure, the diagnostic identifies
  the canonical source path, failure category, and corrective guidance. If
  stale files were seeded at both output locations, both are absent after
  failure; the failed build does not reach static artifact upload/deployment.
- The new page is written to the public intermediate only after validation
  succeeds; Vite then copies it into `dist` before Workbox builds its precache.
- The page has no runtime YAML fetch, CDN, remote script/font, transit request,
  runtime contract renderer, or user data collection. Parse, validation, and
  rendering failures occur during the build, produce actionable maintainer
  diagnostics, and block publication. No reader-facing runtime rendering
  failure state is required.

## Accessibility and Responsive Behavior

- Use semantic document landmarks, ordered headings, meaningful link names, and
  keyboard-operable native controls with visible, unobscured focus.
- Give the source pane an accessible name and `pre`/`code` structure; preserve
  selectable source text and readable access on narrow screens.
- Every rendered operation and schema must be reachable through the document
  structure and assistive technology; controls must expose accessible names and
  state.
- At 320 CSS pixels and at 200% zoom, content remains available without
  page-level horizontal overflow or loss of functionality.
- Meet applicable WCAG 2.2 AA criteria for semantic structure (1.3.1, 1.3.2),
  text/non-text contrast (1.4.3, 1.4.11), text enlargement and reflow (1.4.4,
  1.4.10, 1.4.12), keyboard operation/focus (2.1.1, 2.4.3, 2.4.7, 2.4.11),
  link purpose (2.4.4), target size (2.5.8), and control names/state (4.1.2).
  Interactive page controls provide at least 44 CSS-pixel touch targets under
  the project constitution. The page uses no motion; if motion is later added,
  it honors reduced-motion preferences.
- Automated scans supplement, but do not replace, G5 manual WCAG 2.2 AA review
  for keyboard use, focus, contrast, screen-reader access, responsive reflow,
  and control target size.

README links use descriptive native Markdown text and retain the renderer's
standard visible focus treatment rather than relying on custom focus styling.
Inline README text links use the applicable WCAG 2.2 SC 2.5.8 target-size
exception.

## Verification

Test generator determinism and all failure cases; compare rendered source
pointers with contract traversal; assert built output and direct-route response
under root and non-root base paths; verify the response is the docs page and not
the SPA shell; Run automated and manual accessibility checks. Validate generator/build error
diagnostics separately; the static page has no runtime rendering error UI.
