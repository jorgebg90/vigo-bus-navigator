# Research: Hexagonal Architecture and OpenAPI Documentation

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Runtime Architecture Inventory and Dependency Validation

**Decision**: Extend the existing Vitest architecture guard with an exhaustive
runtime-module manifest and TypeScript Compiler API parsing/resolution. Use
TypeScript, Vitest, and Node capabilities already present in the repository.
Discover executable source modules independently of application entry-point
reachability; fail when source and manifest differ, a dependency cannot be
resolved or classified, or a prohibited dependency direction is found. Retain
isolated domain/use-case tests and add AST-based checks for core access to
browser, network, storage, and other ambient I/O facilities.

**Rationale**: `frontend/tests/unit/architecture.test.ts` already tests selected
domain/application boundaries, but currently scans only those layers and uses
limited import/global patterns. The package already includes TypeScript,
Vitest, and `tsx`; CI runs the unit suite. AST resolution handles aliases,
re-exports, literal dynamic imports, and type-only imports more reliably than
expanding regular expressions, without adding a separate lint stack.

**Alternatives considered**:

- Expanding the current regex: small but insufficient for exhaustive discovery,
  resolution, transitive edges, and reliable classification.
- `dependency-cruiser`, ESLint architecture plugins, or Madge: capable options
  if a dedicated dependency graph tool is justified later, but add dependencies
  or a new lint framework and still do not provide module responsibility or
  isolated-test mapping by themselves.
- Entry-point/bundle graph or manual-only inventory: can omit unreachable
  maintained modules and does not enforce architecture continuously.

**Classification notes**:

- Inventory all maintained executable modules under `frontend/src`, including
  UI, `i18n`, configuration, and `sw/offline.ts`; generated service-worker
  output is not maintained source.
- Keep composition wiring narrowly identified; it must not become a general
  business-logic exemption.
- Classify i18n browser bindings as presentation/inbound behavior. Do not let
  domain or application import them.
- Treat CSS, JSON, Vite virtual modules, and explicitly imported fixture data as
  known edge types rather than silently ignoring all non-TypeScript imports.
- Review semantic UI responsibilities and platform-specific types in ports as
  well as import edges; static graph validation cannot determine whether a
  presentation module has absorbed a use case.

## OpenAPI HTML Documentation

**Decision**: Generate a deterministic static HTML page before Vite runs from
`specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml`.
Parse using the existing `yaml` package, reuse current contract validation
where applicable, and write a git-ignored intermediate at
`frontend/public/docs/openapi/index.html` only after all validation and
rendering succeeds. Vite copies it to `dist/docs/openapi/index.html` before
Workbox generates its precache manifest. Render with semantic HTML and no
external scripts, fonts, CDN, runtime YAML request, or transit API request.

**Rationale**: The repository already uses Vite, `yaml`, AJV, TypeScript, and
contract validators. Vite builds to `dist`, and CI deploys that directory to
GitHub Pages with `VITE_BASE_PATH=/vigo-bus-navigator/`. A real directory-index
file supports direct static hosting requests independently of the SPA fallback.
Build-time generation cannot display a stale committed HTML copy and keeps
documentation code out of the application's JavaScript payload.

Before validation, the generator removes any prior page from both the public
intermediate and `dist`. It then validates and writes the new public page only
on success, so a failed generation cannot leave a success-shaped stale page in
either location. The standard
`npm run build` command must chain the generator before Vite; on failure Vite
does not run, the process exits nonzero, and the deployment workflow does not
upload the build. Configure the PWA navigation fallback to exclude the
documentation route so navigation cannot return the PWA shell instead of the
contract page. Test both direct static responses and navigation while
controlled by the active service worker at root and non-root base paths.

Each build-failure test should seed stale files in both generated locations and
assert a nonzero result, source path/category/corrective diagnostics, absence of
both generated files, and no deployment upload after failure.

The generator must preserve every required operation, description, parameter,
request-body content/schema, response code/content/schema, component schema,
reference, and contract extension. Use stable source-pointer attributes on
visible content to compare generated representation with the parsed contract.
Escape all contract-derived strings. Fail with the input path and useful
diagnostics for missing/unreadable input, parse or structural validation
errors, unresolved local references, and rendering errors. Do not leave or
publish previous output after failure.

**Alternatives considered**:

- Swagger UI/Redoc or another browser documentation bundle: mature UI but adds a
  runtime bundle and may rely on remote resources or more payload.
- Browser-side fetching/rendering of YAML: adds a runtime failure state, source
  fetch behavior, and stale/success-shaped failure risks.
- A separately maintained HTML copy: can drift from the canonical contract.
- Relying on SPA fallback: does not prove a direct nested static URL serves the
  documentation page and can return the app shell even if a docs asset exists.

The README update must also reconcile the current actor/gate summary with
`docs/harness-charter.md`; the current README omits UX Designer and Frontend
Developer from its actor table and presents different G2/G3/G4/G5 reviewer
assignments. Either update the summary to match the charter or link to the
charter as the authoritative source.

## Static Base Path and Direct Navigation

**Decision**: Make Vite's base path derive from the existing `VITE_BASE_PATH`
build setting, defaulting to `/`, and keep asset and PWA URL configuration
consistent with it. Validate direct requests to the built docs route at root and
at `/vigo-bus-navigator/docs/openapi/`.

**Rationale**: The current deployment workflow supplies
`VITE_BASE_PATH=/vigo-bus-navigator/`, while Vite currently sets its `base`
independently by mode. The runtime config already accepts `VITE_BASE_PATH`;
using one source avoids divergent app and docs paths. A direct static file at
`dist/docs/openapi/index.html` avoids relying on the SPA fallback.

The current deployment workflow publishes the repository to GitHub Pages with
the `/vigo-bus-navigator/` base, so the README's published link is
`https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/`. Keep the
application-relative route as the stable contract; update the README's
deployment-origin link if the configured published host changes.

**Alternatives considered**:

- Hard-code a GitHub Pages prefix: conflicts with the constitution's support for
  other static HTTPS hosts and root deployments.
- Keep Vite and runtime base configuration separate: preserves the current
  mismatch and makes route behavior harder to verify.
- Add a server-side route: violates the browser-first, static-hosting
  constitution and is unnecessary for a static document.

## Accessibility and README Validation

**Decision**: Use existing Playwright and Axe facilities for automated page
checks; supplement them with documented manual keyboard, screen-reader,
contrast, zoom/reflow, and target-size validation at G5. Test generation/build
failure diagnostics separately; they are not a reader-facing page state.
Reorganize existing
README content without deleting privacy, security, source, hosting, or setup
caveats. Include a README-only timed findability check with five uninvolved
readers.

**Rationale**: Existing E2E accessibility checks already use Playwright and
`@axe-core/playwright`. Automated scans do not establish WCAG conformance for
keyboard operation or screen-reader behavior; the constitution and spec require
manual review. README reorganization is a documentation surface, not a reason to
weaken the project's public data and privacy disclosures.

**Alternatives considered**:

- Axe-only accessibility validation: does not provide required manual review.
- Add a new accessibility automation stack: unnecessary while existing tools
  cover the automated checks.
- Replace README detail with a short summary: risks hiding source limitations,
  hosting assumptions, and privacy boundaries.

The accessibility baseline maps applicable WCAG 2.2 AA criteria directly,
requires 44 CSS-pixel page controls under the constitution, relies on the
Markdown host's focus treatment for README links, and uses no motion. Because
the delivered page is static HTML with no runtime renderer, rendering errors
are pre-publication build failures with maintainer diagnostics, not reader UI
states.
