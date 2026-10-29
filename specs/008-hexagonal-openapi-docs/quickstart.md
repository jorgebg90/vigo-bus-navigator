# Quickstart: Feature 008 Validation

This guide validates the planned architecture and OpenAPI documentation
behavior. It assumes the implementation tasks have been completed.

## Prerequisites

- Node.js 22 and npm
- Repository dependencies installed with `npm ci`
- Playwright browsers installed for browser-matrix validation:
  `npx playwright install`

## Validate Architecture and Contracts

```bash
npm run typecheck
npm test
npm run lint:openapi
npm run validate:feature004-contract
```

Expected results:

- Every executable module under `frontend/src` has exactly one current
  classification in the architecture inventory.
- Invalid dependency directions, unknown source files, unresolved code
  dependencies, and missing domain/use-case test mappings fail the architecture
  tests with file and edge diagnostics.
- Isolated domain and application tests pass in Node without browser, network,
  or browser persistence.
- The canonical transit contract remains valid.

## Validate the Static Documentation Build

Root-host build:

```bash
VITE_BASE_PATH=/ npm run build
test -s dist/docs/openapi/index.html
npm run preview -- --host 127.0.0.1
```

In another terminal, open `http://127.0.0.1:4173/docs/openapi/`.
The response must be the contract documentation page, not the application shell.
Repeat the check after the active service worker controls the page; the worker
must not rewrite the docs navigation to the PWA shell.

Non-root-host build:

```bash
VITE_BASE_PATH=/vigo-bus-navigator/ npm run build
test -s dist/docs/openapi/index.html
VITE_BASE_PATH=/vigo-bus-navigator/ npm run test:e2e -- --grep OpenAPI
```

The focused browser run rebuilds in test mode and serves the artifact with the
configured repository prefix, as a project-site static host does. Direct
navigation to `/vigo-bus-navigator/docs/openapi/` must render the same canonical
contract page, including while controlled by the active service worker.

For both base paths, wait until the service worker controls the page, disable
network access, then navigate directly to the same trailing-slash URL again.
The precached documentation page must still load, rather than the PWA shell or
an unavailable response.

## Validate Failure and Completeness Cases

Run the generator tests and documentation completeness checks:

```bash
npm test -- scripts/openapi-docs-template.test.ts scripts/generate-openapi-docs.test.ts scripts/generate-openapi-docs-failures.test.ts
```

Expected results:

- Repeated generation from the same input produces identical output.
- The generated page shows the exact canonical YAML in a read-only source pane
  beside the rendered contract on wide screens, and stacks both panes on narrow
  screens.
- For missing/unreadable input, invalid YAML/OpenAPI, unresolved references, and
  rendering errors, seed stale output in both the intermediate and `dist`,
  invoke the generator/build, and assert a nonzero result, a diagnostic naming
  the contract path and failure category with corrective guidance, and absence
  of both stale docs files. The failed build must not reach the deployment
  artifact-upload step.
- A build-time generation error reports actionable diagnostics; the static page
  has no runtime renderer and therefore no runtime unavailable-page state.
- Every operation, defined description, parameter, request-body/response
  element, schema, reference, and extension in the canonical contract has a
  visible rendered counterpart; uncontracted operations are absent.

## Validate Accessibility and README Findability

```bash
VITE_BASE_PATH=/ npm run test:e2e -- --grep OpenAPI
VITE_BASE_PATH=/vigo-bus-navigator/ npm run test:e2e -- --grep OpenAPI
```

Expected automated checks include Axe, keyboard navigation, direct route
availability, and responsive overflow at 320 CSS pixels and with a reproducible
200%-text-size override (`html { font-size: 200% !important; }`) in Playwright.
At G5, supplement these checks with manual keyboard/focus-not-obscured,
contrast, user text-spacing, target-size, actual 200% zoom, and WCAG 2.2 AA
review, including whether the README inline documentation link meets the
applicable WCAG 2.2 SC 2.5.8 text-link exception. For screen-reader review,
check the page title and landmarks, heading outline, link purpose, disclosure
names/state if present, operation/parameter/response relationships, schema
nesting/references, and empty-section behavior. Also assess README structure and
link purpose using at least one desktop combination (for example NVDA with
Firefox on Windows or VoiceOver with Safari on macOS). Record the exact
browser/screen-reader combination, tested URLs and states, tools, criteria,
results, and limitations in the G5 review. The documentation is static and has
no runtime renderer; validate generator/build diagnostics separately rather
than expecting a reader-facing unavailable-page state.

Conduct the README findability task individually with five people unfamiliar
with the repository and uninvolved in the feature. Give each person only the
README; allow no repository search or other project documentation. Start the
timer when they begin reading. At least four people must locate all five
specified items within 60 seconds.
