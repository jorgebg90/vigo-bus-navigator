# Vigo Bus Navigator

> Check bus frequencies and live arrivals in Vigo, Spain — offline-friendly.
> The static PWA is hosted on GitHub Pages; live arrival lookups send the
> selected public stop ID through the Worker to Vitrasa.

## What is this?

**Vigo Bus Navigator** is a static web application to consult urban bus
frequencies in Vigo. Find your line, see frequencies by day type
(weekday / Saturday / Sunday & holidays), save your favorite lines and
stops, and pick up where you left off — favorites and settings remain in your
browser's `localStorage`. No accounts or application-level activity tracking.

- 🚌 **Bus frequencies** by line, stop, and day type.
- 📱 **Mobile-first**, accessible UI for people on the move.
- 🔒 **No user profiles**: favorites and settings stay in `localStorage`; live lookups disclose only the selected public stop ID.
- ⚡ **Static PWA**: GitHub Pages frontend with the existing Cloudflare Worker as the sole live-data bridge.

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
specs/              Feature specifications, plans, tasks, and actor verdicts
```

## Local validation

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run size
npm run lint:openapi
npm run test:contract
npm run test:load
```

The frontend always obtains lines, stops, schedule metadata, available
timetables, and arrivals through the Worker API; it does not bundle schedule
fixtures or fetch schedule JSON directly. The local Worker serves deterministic
schedule and HTML fixtures by default, so local validation makes no external
requests. Run `npm run build` before `npm run size`; the latter enforces both
existing per-file caps and aggregate gzip limits.

## Real-time arrivals service (Worker)

Live stop arrivals are served by a Cloudflare Worker that reads the fixed public
Vitrasa InfoBus stop page and normalizes its paginated HTML according to the
source response contract. The page contains the line, destination, and estimated
wait minutes; the Worker follows its WebForms pagination and keeps transient
session fields/cookies private to one lookup.

```bash
# Fixture mode: deterministic responses, no network needed (CI-friendly)
npm run dev:worker
npm run dev                         # frontend calls the Worker API

# Explicit live development override against the fixed Vitrasa InfoBus page
npm run dev:worker:live
```

The Worker listens on `http://localhost:8787` and serves:

- `GET /lines` for official line summaries and schedule metadata.
- `GET /lines/{lineCode}` for ordered GTFS route patterns, their stops, and an optional published timetable.
- `GET /stops` for the full stop list, including municipal and Vitrasa IDs.
- `GET /stops/{stopCode}/arrivals` for live arrivals at a stop.
- `GET /health` for liveness.

Regenerate the official network snapshot with `npm run catalog:generate`. It
joins Vigo's `paradas.json`, GTFS feed, and `lineas.geojson` using the municipal
GTFS stop ID. The catalog keeps that ID separate from the Vitrasa stop ID;
`/stops/{stopCode}/arrivals` expects the stop's Vitrasa ID from `/stops`. The
GTFS patterns describe stop order, not real-time waits or frequency estimates.
This is the v3.0.0 API contract; see
[`specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml`](specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml).

The selected live-arrivals source is the Vitrasa InfoBus HTML page; this source
selection does not imply that the earlier JSON source is broken. The Worker
uses only the fixed HTTPS URL, follows at most 10 sequential pages under one
8-second deadline, and rejects redirects, partial results, oversized bodies,
more than 100 rows, line codes over 32 characters, or destinations over 256
characters. No user load test contacts Vitrasa: `npm run test:load` runs 600
fixture-only requests at 10 requests/second and reports p95 latency.

Profiles are selected explicitly:

| Profile | Source behavior | Frontend configuration |
| --- | --- | --- |
| `local` / `development` | Worker serves catalog and schedule snapshots plus deterministic arrivals by default; live Vitrasa only with the explicit override above | `VITE_PROFILE=local`; frontend always calls the Worker at `http://localhost:8787` by default |
| `preview` | Fixed Vitrasa source; fixtures rejected | `VITE_PROFILE=preview` and `VITE_ARRIVALS_BASE_URL` |
| `production` | Fixed Vitrasa source; fixtures rejected | `VITE_PROFILE=production` and `VITE_ARRIVALS_BASE_URL` |

Deploy the named preview Worker, then build the frontend against that URL:

```bash
npx wrangler deploy --cwd worker --env preview
VITE_PROFILE=preview VITE_ARRIVALS_BASE_URL='https://<preview-worker>.<account>.workers.dev' npm run build
npm run preview
```

Production Worker deployment uses `npx wrangler deploy --cwd worker --env production`.
The GitHub Actions deploy workflow uses that named production environment.

Environment variables:

| Variable | Where | Purpose |
| --- | --- | --- |
| `DEPLOYMENT_ENV` | Worker / `wrangler.toml` | `development`, `preview`, or `production`; unknown profiles fail closed |
| `UPSTREAM_FIXTURES` | Worker / `wrangler.toml` | Development only; defaults to `true`, and preview/production reject `true` |
| `UPSTREAM_FIXTURE_FAULT` | Worker env | Development test injection: `timeout`, `error`, `429`, or source-specific fixture cases |
| `VITE_PROFILE` | frontend build | `local`, `preview`, or `production`; unknown values fail configuration |
| `VITE_ARRIVALS_BASE_URL` | frontend build | Worker URL; required for preview and production |

No secrets are required. The browser sends only the selected public stop ID to
the Worker; the Worker sends it and transient WebForms fields/cookies to the
fixed Vitrasa source. Those fields are never logged, cached, persisted, or
returned. Cloudflare and Vitrasa may process connection metadata such as client
IP and request time; the project does not claim anonymity or control provider
retention. A stop without a `vitrasaId` sends no request and shows the localized
unavailable state. In fixture mode, stop `2000` returns an empty result and
`999999` is not found; other numeric IDs return deterministic arrivals. The
fixture set also contains a three-page 5/5/2 sample for stop `2790`. The frontend
pauses polling while hidden and resumes while visible; changed arrivals views
are covered by keyboard, live-region, contrast, and 44×44 target checks.

The optional G5 EdgeCache check requires Cloudflare credentials, uses a
temporary remote development Worker with deterministic injected responses, and
never contacts Vitrasa or production. Its implementation and evidence are still
pending; no remote cache result is claimed by this release.

Troubleshooting: if the frontend shows arrivals unavailable locally, check that
the Worker is running on port 8787; if production shows configuration errors,
verify `VITE_ARRIVALS_BASE_URL` is set for the Pages build.

## License and service status

This community open-source project is licensed under Apache-2.0; see
[LICENSE](LICENSE). It is not an official service of the public transport
operator of the city of Vigo (Vitrasa).

## Status

The implementation includes Node, DOM, Workers-runtime, fixture-only load, and
Playwright accessibility coverage. Browser matrix validation requires the
Playwright browsers to be installed locally with `npx playwright install`.

## License

Apache-2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
