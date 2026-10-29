# Quickstart — Vigo Bus Frequency PWA

Runnable validation scenarios that prove the feature works end-to-end.
Everything runs locally with zero credentials (constitution Principle IV).

## Prerequisites

- Node.js LTS (≥ 22) and npm
- No Cloudflare account, no credentials, no external services needed locally

## Setup

```bash
npm install
```

## Run locally (profile: local)

```bash
npm run dev        # Vite dev server, local profile: fixtures, SW disabled
```

Open the printed URL. Expected: line catalog loads from bundled fixtures;
stop arrivals come from fixture data (including simulated degradation cases).

## Run the test suites

```bash
npm test                 # Vitest: domain/application (node env) + adapters (happy-dom)
npm run test:coverage    # v8 coverage report
npm run test:e2e         # Playwright: single offline smoke test (real browser)
npm run lint:openapi     # Spectral lint of contracts/stop-arrivals.openapi.yaml
npm run test:contract    # Worker contract tests (miniflare) against the OpenAPI schema
```

Expected: all suites green; coverage never regresses for domain/application.

## Validation scenarios (map to spec acceptance)

### VS1 — Frequencies by day type (US1, FR-001..004, FR-011)

1. Launch `npm run dev`; the home screen lists all fixture lines.
2. Type a line code in the search box → list filters as you type.
3. Select the line → frequency table shows today's auto-detected day type
   (first/last departure + interval per band) and the dataset version/date.
4. Switch day type manually → table updates. Select a no-service day type →
   clear message with a link to the nearest served day type.

### VS2 — Live stop arrivals (US2, FR-016/017/018)

1. From a line view, open a stop (fixtures include live data).
2. Arrivals list shows per-line destination and minutes; it refreshes
   automatically while visible.
3. Switch browser tab → refresh pauses; return → refresh resumes.
4. Enable the "proxy down" fixture flag → the view degrades to scheduled
   times with a "live data unavailable" notice.

### VS3 — Map (US3, FR-005/006)

1. From a line view, open the map → all stops of the line appear, viewport
   fitted.
2. Tap a stop → popup shows name, code, and serving lines.
3. Toggle theme (or system dark mode) → base layer switches
   Positron/Dark Matter.

### VS4 — Favorites and persistence (US4, FR-007/008/012)

1. Star a line and a stop → they appear in the home favorites section.
2. Reload the page → favorites restored exactly.
3. In devtools, corrupt the `vbn:v1:favorites` value → reload → app recovers
   to defaults (raw value backed up under a `.corrupt` key), no crash.
4. Fill storage beyond quota (devtools) → app switches to session-only mode
   with a subtle notice; everything else keeps working.

### VS5 — Offline (US5, FR-009)

1. Build and preview the production bundle: `npm run build && npm run preview`.
2. Load the app once (SW installs), then go offline (devtools).
3. Reload → shell, catalog, and favorites render; a staleness notice shows.

### VS6 — Languages (US6, FR-014)

1. Settings → switch Español/Galego/English → all labels update immediately
   and `document.documentElement.lang` changes.
2. Reload → the chosen language persists.

## Production deploy (reference)

Push to `main` → GitHub Actions: build frontend → deploy `dist/` to GitHub
Pages; deploy `worker/` to Cloudflare (requires repo secrets, not needed for
any local workflow).
