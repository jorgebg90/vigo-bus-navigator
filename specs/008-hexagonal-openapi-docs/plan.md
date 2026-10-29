# Implementation Plan: Hexagonal Architecture and OpenAPI Documentation

**Branch**: `008-hexagonal-openapi-docs` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Status**: G2, G3, G4, and G6 approved; ready for cross-artifact analysis — 2026-10-28

**Input**: Feature specification from `specs/008-hexagonal-openapi-docs/spec.md`

## Summary

Bring every maintained production runtime module under `frontend/src` into an
explicit, testable hexagonal architecture; add deterministic build-time HTML
documentation generated from the existing municipal OpenAPI contract; and
reorganize the README without losing current operational or privacy constraints.
The application remains a static browser PWA. No server API, transit proxy, new
runtime documentation bundle, or paid dependency is introduced.

The design uses an exhaustive runtime-module classification and import graph
validation built on the existing TypeScript compiler and Vitest test suite. A
build-time generator parses the canonical OpenAPI YAML, validates it, and writes
a temporary public HTML input before Vite starts; Vite copies it to the
directly addressable `dist/docs/openapi/index.html` and includes it in Workbox's
precache. The standard `npm run build` command invokes generation before Vite.
Vite's base path will be resolved from the existing `VITE_BASE_PATH` setting so
the app and documentation are served consistently at root and non-root paths.

## Technical Context

**Language/Version**: TypeScript 5.8; Node.js 22 in CI and deployment

**Primary Dependencies**: Vite 7, TypeScript, Vitest, Playwright, `yaml`,
`@axe-core/playwright`; use existing packages only

**Storage**: No new application storage. Source contract, architecture
classification, generated build output, and documentation are repository/build
artifacts.

**Testing**: Vitest unit and architecture tests; TypeScript typecheck; OpenAPI
contract validation; Vite production builds at root and non-root base paths;
Playwright direct-route, responsive, keyboard and Axe checks; manual WCAG 2.2 AA
review at G5.

**Target Platform**: Zero-cost static HTTPS hosting and modern browsers;
Node.js 22 build/CI environment; root and configured non-root deployment paths

**Project Type**: Static, browser-only TypeScript PWA with generated static
documentation

**Performance Goals**: Do not add documentation JavaScript or remote assets to
the application runtime bundle; the documentation page must not introduce
external network requests. Existing application payload budgets remain
unchanged.

**Constraints**: Preserve direct browser requests to the fixed municipal source,
fixture-default automated tests, zero-cost static hosting, data privacy,
existing feature behavior, and accurate source limitations. The canonical
OpenAPI source is `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`.
Generated documentation must fail closed on invalid input and must not be a
separately maintained HTML copy.

**Scale/Scope**: All maintained executable production modules under
`frontend/src` (currently approximately 75 source modules), every domain rule
and application use case, one canonical OpenAPI contract, the static build
artifact, and the repository README. Tests, fixtures, build tooling,
configuration, generated output, and non-executable assets are not classified
as runtime modules.

## Constitution Check

### Pre-Research Gate

- **I. Browser-first frontend**: PASS. The OpenAPI page is static output; transit
  requests remain direct browser requests to the fixed municipal source.
- **II. Modular hexagonal architecture**: PASS. The plan makes the existing
  constitution-mandated inward dependency rule exhaustive across the runtime
  source inventory.
- **III. Test-first unit coverage**: PASS. Domain/use-case isolation and
  architecture checks are covered by Node-based tests; new behavior is tested
  before or alongside implementation.
- **IV. Local testability and profiles**: PASS. Validation uses existing local
  scripts and deterministic fixtures; no deployment credentials or external
  service are required.
- **V. Contract-first OpenAPI**: PASS. The existing OpenAPI contract remains
  canonical; the HTML page is a representation, not a new transit API.
- **VI. Zero-cost and privacy by design**: PASS. No backend, account, paid
  dependency, tracking, credentials, or new transit request is added.
- **VII. Simplicity and English documentation**: PASS. Reuse TypeScript, YAML,
  Vite, Vitest, Playwright, and Axe already in the repository; write artifacts
  in English.
- **Accessibility**: PASS for planning. G5 still requires automated and manual
  WCAG 2.2 AA validation; G2 approval is not an accessibility conformance claim.
- **Harness gates**: The G2 clarification re-review is approved by the
  Stakeholder, QA Tester, UX Designer, and Frontend Developer; the G3 plan is
  approved by the Software Architect, Backend Developer, UX Designer, and
  Frontend Developer. See [G2](./gate-g2-spec-review.md) and
  [G3](./gate-g3-plan-review.md), and
  [G6](./gate-g6-story-review.md). These approvals close planning and allow task
  generation; they do not represent implementation or G5 accessibility sign-off.

No constitutional violation or exception is proposed.

### Post-Design Gate

- Architecture inventory and dependency rules preserve strict inward
  dependencies; composition is limited to object construction and wiring.
- Documentation is generated into the static build output and does not add a
  server route, transit endpoint, runtime library, or outbound browser request.
  The generated artifact is present before Vite copies public assets and before
  Workbox creates its precache; its URL is excluded from the SPA navigation
  fallback and is tested while the active service worker controls the page.
- The base path is one build-time value for Vite assets and direct documentation
  route verification; root and non-root builds are both validated.
- All source-contract rendering is escaped and deterministic; invalid
  contracts, unresolved local references, or generation failures stop the
  build before publication.
- The generator removes prior docs artifacts from both the public intermediate
  and `dist` before validation. Its diagnostics identify the canonical source,
  failure category, and corrective guidance; a failed `npm run build` does not
  reach Vite or the deployment upload step.
- README changes retain the documented hosting, privacy, security, and source
  limitations and link to the public documentation page.

**Post-design result**: PASS. No exception or complexity justification needed.

## Research Decisions

The decisions and alternatives are recorded in [research.md](./research.md).
The main decisions are to extend the existing Vitest architecture guard with
TypeScript AST-based inventory and dependency analysis, and generate static
contract HTML at build time using the existing YAML parser rather than adding a
browser documentation runtime.

## Project Structure

### Documentation and Design (this feature)

```text
specs/008-hexagonal-openapi-docs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── design-baseline.md          # G3 UX baseline
├── checklists/
│   └── requirements.md
├── gate-g2-spec-review.md
├── gate-g3-plan-review.md      # G3 verdicts
├── gate-g6-story-review.md     # G6 Communicator verdict
└── contracts/
    └── openapi-docs-page.md
```

### Runtime and Validation Structure

```text
frontend/
├── src/
│   ├── domain/                 # Pure transit rules and domain types
│   ├── application/            # Use cases and inward-facing ports
│   ├── infrastructure/         # Outbound adapters and platform capabilities
│   ├── ui/                     # Inbound presentation adapters
│   ├── i18n/                   # Presentation localization and browser binding
│   ├── sw/                     # Maintained source behavior used by the PWA
│   └── main.ts                 # Composition root; wires adapters and use cases
├── public/docs/openapi/
│   └── index.html              # Generated, git-ignored input copied into dist
└── tests/
    ├── unit/architecture.test.ts
    └── architecture/
        └── modules.json        # Exhaustive source classification and test map

scripts/
└── generate-openapi-docs.ts    # Validates contract and emits static HTML

docs/
└── architecture.md             # Human-readable boundaries and module inventory

dist/
└── docs/openapi/index.html     # Generated output; not checked-in source
```

**Structure Decision**: Retain the existing single frontend project and layer
directories. The OpenAPI page is generated into the git-ignored public
intermediate before Vite copies assets and Workbox builds the precache. Do not
force test fixtures, development configuration, generated documentation, or
static assets into runtime layers. Treat `main.ts` as a
composition root; require all other runtime responsibilities to be classified
and validate every discovered executable module, including currently
unreachable files. Keep the manifest and architecture test under `frontend/tests`
and the human-facing architecture explanation under `docs/`.

## Implementation Approach

1. Establish an exhaustive sorted module manifest for `frontend/src`, classifying
   each module as domain, application use case/port, inbound adapter, outbound
   adapter, or composition, with concise rationale for cross-cutting cases.
2. Extend the existing architecture test to discover source files independently
   of entry-point reachability, compare discovery against the manifest in both
   directions, resolve TypeScript aliases/re-exports/type-only/static and literal
   dynamic imports, and report illegal dependencies with source locations and
   dependency paths.
3. Keep architecture categories narrow: no universal shared-layer escape hatch.
   Treat external packages, CSS, JSON, Vite virtual imports, and test fixtures
   explicitly. Review semantic UI-to-use-case boundaries and platform types in
   ports in addition to automated graph checks.
4. Add isolated Node tests for every domain rule and application use case,
   using injected ports for external behavior. Refactor behavior that bypasses
   application use cases or imports platform facilities into the core.
5. Add a deterministic contract-to-HTML generator using `yaml` and existing
   contract-validation facilities. Render all required OpenAPI operations,
   parameters, request bodies, responses, component schemas, references,
   descriptions, and extensions as escaped, semantic HTML; mark visible source
   fields with stable pointers for completeness tests.
6. Make the standard `npm run build` script run
   `scripts/generate-openapi-docs.ts` before the Vite production build. The
   generator removes prior generated pages from both
   `frontend/public/docs/openapi/index.html` and
   `dist/docs/openapi/index.html` before validating; add the exact public
   intermediate to `.gitignore`. For missing/unreadable source, invalid YAML
   or OpenAPI structure, unresolved local references, or rendering errors, exit
   nonzero and report the canonical source path, failure category, and
   corrective guidance. Write the new public file only after all validation
   and rendering succeed. Because the npm script chains generation before Vite,
   Vite does not run on generation failure; the deployment workflow must not
   upload or deploy a failed build. On success Vite copies the public file to
   `dist/docs/openapi/index.html` before Workbox creates its precache manifest.
7. Resolve Vite's base from `VITE_BASE_PATH` (default `/`) and use it
   consistently for assets, PWA configuration, deployed paths, and tests.
   Exclude the base-aware docs navigation URL from the SPA navigation fallback.
   Confirm direct requests to `/docs/openapi/` and
   `/vigo-bus-navigator/docs/openapi/` return the documentation file rather
   than the application shell, both without a service worker and while
   controlled by the active worker.
8. Reorganize `README.md` around purpose, architecture, OpenAPI documentation,
   setup/validation, data/privacy constraints, and status/license. Preserve all
   operationally relevant facts and link to the currently deployed GitHub Pages
   route, `https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/`; update
   that link if the configured published host changes. Reconcile its harness
   actor and gate summary with `docs/harness-charter.md` and use descriptive
   link text for the OpenAPI page.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| An import regex misses aliases, re-exports, dynamic loads, or orphaned source files | Use TypeScript AST and module resolution; enumerate the entire source tree independently from entry points; fail on unknown or unresolved code edges |
| Valid composition or adapter collaboration is mistaken for a layer violation | Define a narrow policy for inbound/outbound adapters and a composition root; add documented semantic review rather than blanket exemptions |
| Graph checks do not detect bare browser or network API use in the core | Add AST-based purity assertions and isolated Node tests for each domain rule and use case |
| Contract fields are omitted or rendered as markup | Compare rendered source pointers to the parsed contract and escape all contract-derived text and attributes |
| Invalid input leaves a successful-looking stale page | Remove generated docs from both public intermediate and `dist` before validation; make `npm run build` fail before Vite and require CI not to publish failed builds |
| The static host returns the SPA shell for a nested docs URL | Emit a real directory-index HTML artifact and test direct trailing-slash requests in root and non-root preview builds |
| Workbox navigation fallback serves the app shell at the docs URL | Generate before Vite public asset copying/precache generation, exclude the docs route from SPA fallback, and test while the active worker controls the page |
| README editing drops important privacy or source caveats | Use the current README as a content inventory and verify every security, hosting, data-flow, and source-limitation statement is retained |

## Complexity Tracking

No constitutional exceptions or new framework/dependency layers are required.
