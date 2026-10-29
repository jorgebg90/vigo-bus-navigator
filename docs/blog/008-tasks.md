# Building Vigo Bus Navigator: Tasks

The task phase turns Feature 008’s approved plan into 23 ordered, file-specific
tasks. The breakdown follows the three user stories rather than implementation
layers alone: first make the application’s architecture independently
maintainable, then publish the OpenAPI contract as a page, and finally make
the README easier to navigate. That order reflects the spec’s priorities:
architecture is the P1 foundation, the contract page is P2, and README
discovery is P3. The task list also gives concrete verification clauses to
important changes, so architectural rules, generated output, links, builds,
and reader checks have explicit evidence rather than relying on description
alone.

The first story is deliberately the MVP. After setup and shared base-path work,
it inventories every production runtime module, checks permitted dependency
directions, and maps each domain rule and application use case to an isolated
Node test. The aim is not merely to draw layer names: validation must catch
unclassified or stale modules, unresolved imports, prohibited edges, and
missing test mappings with useful diagnostics. The tasks also make the
verification concrete: targeted architecture tests exercise discovery,
alias/unresolved-edge and prohibited-edge/global fixtures; every manifest
test-map entry must resolve to a test; and the isolated unit suite must pass.
The user story’s independent test gives this slice a meaningful stopping
point before the page and README work begins.

Tests lead the implementation where they define failure behavior. For the
architecture checker, regression cases and the module manifest establish what
the guard must recognize before it is extended and violations are refactored.
For the documentation page, template and generator tests cover semantic
output, deterministic generation, completeness, escaping, and failure
behavior; separate failure-oracle, route, and accessibility tests cover
publication safety and browser behavior. These tests are prepared before
implementation. The implementation sequence is intentionally specific:
build the HTML template and verify it with its unit tests first, have the
generator call that template second, then pass the generator/failure tests and
compare integrated output with the canonical contract. Build and
Vite/Workbox routing integration follow. Route and accessibility tests remain
separate because they exercise different concerns and files; their test
preparation can run in parallel, but implementation dependencies still apply.

Dependencies are explicit where one result is needed by another. Setup adds
only the generated HTML path to `.gitignore`; foundational work then aligns
the Vite/Workbox base behavior and documentation route. The two main stories
can proceed in parallel afterward because their architecture-checking and
OpenAPI-generation work use separate files. The README can be drafted in that
period too, but final links and findability checks wait for the architecture
guide and docs route. Parallel markers are reserved for tasks that can really
run concurrently without editing the same files or relying on incomplete
prerequisites.

The other major trade-off is to generate the contract page at build time with
existing tooling instead of adding a browser renderer, backend, or dependency.
That keeps the application’s static, browser-first boundary intact, but puts
more responsibility on the build: invalid or unrenderable input must fail
closed, remove stale output, and prevent publication. The tasks therefore
require explicit failure tests and verify that failed builds cannot upload.
They also check root and non-root direct routes before and under service-worker
control, then require a direct offline navigation after the page is precached.
The target is the cached documentation response, not the SPA shell. This adds
a real offline-routing check rather than assuming that a precache entry alone
proves navigation works.

Accessibility coverage is similarly explicit: tests include the first
focusable skip link, keyboard traversal and activation of index links and
their destinations, named controls and state, native disclosure behavior if
used, visible focus, Axe checks on the ready and applicable empty-section
states, 320 CSS-pixel reflow, and a reproducible 200%-text-size state using
Playwright’s `html { font-size: 200% !important; }` override. At both
responsive sizes, checks require no page-level overflow and continued access
to operations and schemas. The page template must also meet its specified
44 CSS-pixel page-control target, visible/unobscured focus, and no-motion
requirements. At G5, manual review extends to screen-reader access, contrast,
user text-spacing overrides, actual 200% text zoom, offline availability,
and README structure/content and link behavior. It also evaluates whether
the README’s inline documentation link qualifies for the WCAG 2.2 SC 2.5.8
text-link exception. Screen-reader checks cover the page title and landmarks,
heading outline, link purpose, disclosure names and state if present,
operation/parameter/response relationships, schema nesting and references,
and empty-section behavior. The review requires at least one desktop
screen-reader/browser pairing, such as NVDA with Firefox on Windows or
VoiceOver with Safari on macOS. G5 evidence must record the exact combination
alongside tested URLs/states, tools, criteria, results, and limitations; the
README structure and link purpose are assessed too. Automated tests and
planned manual review provide evidence; neither is represented here as
already completed.

The README reader check is deliberately constrained to measure findability:
five people unfamiliar with the repository and uninvolved in the feature
receive only the README, cannot search the repository or other project
documentation, and each must find all five specified items. The target is at
least four people completing that task within 60 seconds. This is more
reproducible than a general claim that the README is “clear.”

The measurable checkpoints make “done” observable: every runtime module is
classified; every domain rule and use case has an isolated test; all contract
fields are represented without extra operations or schemas; root and
`/vigo-bus-navigator/` routes serve the generated page online and offline
under service-worker control; invalid input fails with actionable diagnostics
and no stale page; and at least four of five unfamiliar readers find all five
README targets within 60 seconds. Final validation runs typecheck, unit and
coverage tests, contract checks, builds at both base paths, route/service
worker tests, and end-to-end tests before manual accessibility review and G5
verdicts. The quickstart supplies the corresponding commands and offline
navigation procedure, distinguishes the automated text-size override from
manual actual-zoom review, names the inline-link exception assessment, and
lists the screen-reader topics and evidence to record, including the tested
browser/screen-reader combination and requirement for at least one desktop
pairing. These are planned checks, not results already achieved.

## What's next

The [approved plan](008-plan.md) led to these
[Feature 008 tasks](../../specs/008-hexagonal-openapi-docs/tasks.md). Next,
QA, UX, and Frontend review the task coverage at G4, as set out in the
[Harness Charter](../harness-charter.md). Task generation and this story do
not claim G4 approval or implementation; G5 remains the later implementation
acceptance gate.
