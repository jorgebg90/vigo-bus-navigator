# Vigo Bus Navigator

> Check bus frequencies and live arrivals in Vigo, Spain — offline-friendly.
> A static, client-only PWA; the browser reads public municipal data directly.

## What is this?

**Vigo Bus Navigator** is a static web application to browse urban bus lines,
stops, verified published schedules, and arrivals in Vigo. Find your line, see
available service by day type
(weekday / Saturday / Sunday & holidays), save your favorite lines and
stops, and pick up where you left off — favorites and settings remain in your
browser's `localStorage`. No accounts or application-level activity tracking.

- 🚌 **Bus frequencies** by line, stop, and day type.
- 📱 **Mobile-first**, accessible UI for people on the move.
- 🔒 **No user profiles**: favorites and settings stay in `localStorage`; live lookups disclose only the selected public stop ID.
- ⚡ **Client-only BFF**: data adapters and orchestration run as frontend modules; no separately hosted backend is required.
- 🚌 **Direct public source**: the browser sends fixed, credential-free GET requests to Vigo's municipal JSP when an explicit live profile is enabled.

## How it is built: Spec-Driven Development + Harness Paradigm

This repository is an experiment in **Spec-Driven Development (SDD)** with
[GitHub Spec Kit](https://github.com/github/spec-kit): specifications come
first, and code is generated from reviewed, versioned specs.

On top of SDD, the project applies the **harness paradigm**: a fixed cast of
AI actors validates every phase through explicit quality gates.

| Actor | Validates |
| --- | --- |
| 🧭 Project Lead | Orchestration and gate discipline |
| 🏛️ Software Architect | Design, boundaries, pure-frontend architecture |
| 🔌 Backend Developer | Data contracts and `localStorage` persistence |
| 🧪 QA Tester | Testability, coverage, quality gates |
| 🧑‍🤝‍🧑 Stakeholder | User value, scope, acceptance sign-off |
| ✍️ Communicator | Blog-ready documentation of the whole journey |

Read the full setup in the [Harness Charter](docs/harness-charter.md).

## SDD workflow

The project follows the Spec Kit cycle, each step guarded by a harness gate:

```text
/speckit-constitution   → G1: all actors ratify
/speckit-specify        → G2: Stakeholder + QA
/speckit-clarify        → (optional) de-risk ambiguities
/speckit-plan           → G3: Architect + Backend Developer
/speckit-tasks          → G4: QA testability review
/speckit-analyze        → (optional) cross-artifact consistency
/speckit-implement      → G5: QA quality + Stakeholder acceptance
/speckit-converge       → G6: Communicator story gate
```

## Repository layout

```text
.specify/           Spec Kit engine: templates, scripts, memory (constitution)
.github/agents/     Harness actors as VS Code custom agents
.github/skills/     Spec Kit skills (/speckit-* commands)
docs/               Harness charter and the blog series (docs/blog/)
frontend/           Static browser application and tests
scripts/            Contract checks and data-generation tooling
postman/            Manual municipal-source request collection
specs/              Feature specifications, plans, tasks, and actor verdicts
```

## Local validation

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run size
npm run lint:openapi
```

The default test profile is `fixture`, which routes synthetic bytes through the
same browser decoders and normalizers used by live requests without municipal
network traffic. `npm run dev` uses `local-live` and calls the municipal JSP
directly from the browser. Run `npm run build` before `npm run size`; the latter
enforces the first-map and per-file budgets.

## Browser-side transit integration

The municipal integration is implemented in
[`frontend/src/infrastructure/municipal`](frontend/src/infrastructure/municipal)
and coordinated by the frontend schedule repository. These modules own the
fixed municipal action allowlist, bounded GET transport, source normalization,
identity checks, provenance, and local cache behavior. They run in the browser;
they are not a Cloudflare Worker, serverless function, or separately hosted API.

Profiles:

| Profile | Behavior |
| --- | --- |
| `fixture` | Explicit deterministic synthetic responses; no municipal traffic |
| `local-live` | Local development default; fixed-origin browser GETs with credentials omitted |
| `production` | Direct browser GETs for the supported municipal action allowlist |

`frontend/.env.development` selects `local-live` for `npm run dev`. Set
`VITE_MUNICIPAL_PROFILE=fixture` to use synthetic data locally. Tests and E2E
builds select `fixture` explicitly. `VITE_PROFILE=production` and
`VITE_MUNICIPAL_PROFILE=production` select the static-host build profile. The
same fixed-host GET allowlist is used in local development and production; no
credentials are sent. A separately hosted transit URL is rejected by
configuration.

The bundled open-data/GTFS catalog is a dated, non-exhaustive discovery seed for
stops and ordered textual route alternatives. It is not labeled as a live JSP
response. Municipal line/service catalogs, serving lines for a selected stop,
and arrivals appear with municipal provenance in `local-live` and `production`.
The fixture profile may show a deliberately synthetic sample timetable, labeled
as such and never presented as municipal data. In `local-live` and `production`,
real timetables remain unavailable unless a source schedule-ID and day-code
mapping is available; the UI does not infer a timetable from service metadata.
Route geometry, trip sequencing, and detailed stop data also remain
unavailable until their respective mappings are implemented.

The application is a static, browser-only PWA. No transit Worker or application
backend is deployed or called by the frontend. The browser service worker caches
frontend assets only. User favorites and settings remain in browser
`localStorage`; no account or application-level activity tracking is
introduced.

Environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_PROFILE` | Static frontend build profile: `local`, `preview`, or `production` |
| `VITE_MUNICIPAL_PROFILE` | Transit boundary profile: `fixture`, `local-live`, or `production` |
| `VITE_BASE_PATH` | Optional static-host base path |

No secrets or backend URL are required. In `local-live`, Vigo's municipal
service receives the browser's network request and public transit identifiers;
the application does not send user profiles, credentials, or precise location.
Vigo and the hosting provider may process connection metadata under their own
policies. If source semantics or the browser request fails, the UI shows an
unavailable state rather than silently switching to unverified timetable data.

## License and service status

This community open-source project is licensed under Apache-2.0; see
[LICENSE](LICENSE). It is not an official service of the public transport
operator of the city of Vigo (Vitrasa).

## Status

The implementation includes Node, DOM, fixture, and Playwright accessibility
coverage. Browser matrix validation requires the
Playwright browsers to be installed locally with `npx playwright install`.

## License

Apache-2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
