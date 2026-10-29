# Vigo Bus Navigator

> Explore Vigo bus lines, stops, published schedules, and arrivals in a static,
> offline-friendly web app. The browser reads public municipal data directly.

## Purpose and boundaries

Vigo Bus Navigator is a community-built, browser-first PWA for urban transit in
Vigo, Spain. It supports line and stop discovery, service by weekday/Saturday/
Sunday and holidays, arrivals where available, and locally saved favorites.

The project is static and client-only: it has no application backend, transit
proxy, account system, or application-level activity tracking. When a live
profile is enabled, the browser makes fixed, credential-free GET requests to
the municipal service. This is not an official Vitrasa service.

## Architecture

Runtime code follows hexagonal boundaries: domain and application modules own
rules and use cases; browser, municipal, storage, and mapping integrations are
adapters; [the composition root](./frontend/src/main.ts) wires them together.
The maintained source inventory and dependency rules are checked in tests.

- [Runtime architecture and local checks](./docs/architecture.md)
- [Architecture inventory and isolated-test mappings](./frontend/tests/architecture/modules.json)
- [Harness Charter](./docs/harness-charter.md), authoritative for project agents
  and required review gates

## OpenAPI documentation

Read the [municipal transit OpenAPI contract](https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/).
The page is generated at build time from the canonical
[OpenAPI YAML contract](./specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml).
For a local preview, run `npm run build` and `npm run preview`, then open
[`/docs/openapi/`](http://127.0.0.1:4173/docs/openapi/). It is static contract
documentation—not a hosted API, backend, or transit proxy.

## Get started

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

`npm run dev` uses the `local-live` municipal profile configured in
`frontend/.env.development`; it calls the fixed municipal source directly from
the browser. Set `VITE_MUNICIPAL_PROFILE=fixture` to use synthetic responses
without municipal network traffic.

## Validation

```bash
npm run typecheck
npm test
npm run test:coverage
npm run test:e2e
npm run lint:openapi
npm run validate:feature004-contract
npm run build
npm run size
```

The test and browser profiles use fixtures and do not call the municipal
service. Run `npm run build` before `npm run size`; the latter enforces the
first-map and per-file budgets. For base-path checks, use
`VITE_BASE_PATH=/ npm run build` or
`VITE_BASE_PATH=/vigo-bus-navigator/ npm run build`. The deployed GitHub Pages
build uses the latter path.

## Data sources and availability

The municipal integration lives in
[`frontend/src/infrastructure/municipal`](./frontend/src/infrastructure/municipal)
and is coordinated by the frontend schedule repository. It owns the fixed
action allowlist, bounded GET transport, source normalization, identity checks,
provenance, and local cache behavior. It is browser code, not a Cloudflare
Worker, serverless function, or separately hosted API.

| Municipal profile | Behavior |
| --- | --- |
| `fixture` | Deterministic synthetic responses; no municipal traffic. |
| `local-live` | Fixed-origin browser GETs with credentials omitted. |
| `production` | Direct browser GETs for the supported municipal action allowlist. |

Tests and E2E builds select `fixture` explicitly. `VITE_PROFILE=production` and
`VITE_MUNICIPAL_PROFILE=production` select the static-host build profile. No
separately hosted transit URL is accepted by configuration.

The bundled open-data/GTFS catalog is a dated, non-exhaustive discovery seed
for stops and ordered textual route alternatives; it is not represented as a
live municipal response. Live municipal line/service catalogs, serving lines,
and arrivals show source provenance. Fixture timetables are synthetic and
labeled as such. In live profiles, real timetables remain unavailable until a
source schedule-ID/day-code mapping exists; the app does not infer them from
service metadata. Route geometry, trip sequencing, and detailed stop data also
remain unavailable until their respective mappings are implemented. Failed
source requests or invalid source semantics produce unavailable states rather
than an unverified timetable fallback.

## Privacy and security

Favorites and settings stay in browser `localStorage`; there are no user
profiles, credentials, or accounts. The app does not send precise location or
user activity to its transit source. In `local-live` and `production`, the
municipal service receives the browser's network request and public transit
identifiers. Vigo and the static hosting provider may process connection
metadata under their own policies.

The service worker caches static frontend assets and the generated OpenAPI
document, not municipal API responses. No secrets or backend URL are required.

## Project workflow

The repository uses Spec-Driven Development with GitHub Spec Kit, plus a
project-agent harness that reviews design, implementation, accessibility, and
acceptance at defined gates. The charter is the source of truth for all eight
agents and gate assignments; use it rather than an abbreviated actor list.

The Spec Kit command flow is:

```text
/speckit-constitution → /speckit-specify → /speckit-clarify (optional)
→ /speckit-plan → /speckit-tasks → /speckit-analyze (optional)
→ /speckit-implement → /speckit-converge
```

The charter assigns G1 to all actors; G2 to Stakeholder, QA Tester, UX
Designer, and Frontend Developer; G3 to Software Architect, Backend Developer,
UX Designer, and Frontend Developer; G4 to QA Tester, UX Designer, and
Frontend Developer; and G5 to QA Tester, Stakeholder, UX Designer, Frontend
Developer, and Software Architect. G6 is the Communicator review of each
phase's blog documentation, not a phase assigned to `/speckit-converge`.

Feature specifications, plans, tasks, and gate verdicts live under `specs/`;
custom agents and skills are in `.github/agents/` and `.github/skills/`.
Operational details and review ownership are documented in the
[Harness Charter](./docs/harness-charter.md).

## Repository layout

```text
.specify/           Spec Kit templates, scripts, and constitution
.github/agents/     Project custom agents
.github/skills/     Spec Kit workflows
docs/               Architecture, harness charter, and blog series
frontend/           Static browser application and tests
scripts/            Contract checks, generators, and build tooling
postman/            Manual municipal-source request collection
specs/              Feature specs, plans, tasks, and verdicts
```

## Status

Automated coverage includes Node unit tests, DOM tests, fixture-based
integration, Playwright browser checks, and accessibility scans. Install
Playwright browsers with `npx playwright install` when they are not already
available.

## License

Apache-2.0 — see [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
