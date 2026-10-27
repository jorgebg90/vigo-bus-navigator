# Phase 0 Research: Improve Frontend Design

**Date**: 2026-10-26
**Feature**: [spec.md](spec.md)

## Summary

Feature 003 is a frontend composition and interaction redesign. Keep the existing Cloudflare Worker as the sole server-side boundary and preserve API-only access. Make the map the initial view, centralize stop selection and arrivals in the application flow, and use MapLibre GeoJSON clustering with an accessible chooser for dense stops. Because the approved spec requires stops with missing coordinates to remain searchable, publish those stops with nullable coordinates through a versioned v4 `/stops` contract. Do not change the arrivals response or add an endpoint.

## Decisions

### D1: Map-first responsive application shell

**Decision**: Make the map the initial view and provide persistent navigation to Map, Search, Lines, and Saved. Saved contains Favorites and Recent. Use contextual details panels that adapt to phone, tablet portrait/landscape, and desktop. The header globe exposes language selection only; appearance is fixed light; there is no privacy destination or link.

**Rationale**: The P1 journey is finding a stop and its next bus. The current app opens on lines and only mounts a map from line details; a map-first shell makes the primary journey direct while non-map views remain first-class.

**Alternatives considered**: Keep the line-catalog-first shell and append a map; rejected because it keeps the map secondary and duplicates selection/navigation. A separate route for each stop entry point was rejected because it would duplicate arrivals and focus behavior.

### D2: MapLibre native stop clusters and chooser

**Decision**: Use the existing MapLibre GL JS GeoJSON source clustering (`cluster`, `clusterRadius`, `clusterMaxZoom`). Clicking a cluster zooms to its expansion zoom; if locations still coincide or remain too dense, show an accessible chooser with one 44 by 44 CSS pixel target per stop. Selecting an individual stop opens the shared stop-details flow. Do not add a clustering dependency.

**Rationale**: The official MapLibre `GeoJSONSource` supports clustered sources, cluster expansion zoom, and retrieval of individual cluster leaves. Native clustering avoids a second screen-space grouping implementation. The chooser covers coincident coordinates that zooming cannot separate.

**Alternatives considered**: deck.gl screen-space clustering; rejected as duplicate rendering and interaction logic. A third-party clustering package; rejected because MapLibre already provides the required mechanism. Shrinking markers or listing every stop as map chrome; rejected because targets would fail the agreed size/accessibility criteria and the list would not scale.

**Reference**: [MapLibre GeoJSONSource API](https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/).

### D3: Shared stop-selection and arrivals flow

**Decision**: All entry points invoke the application use case `selectStop(stopId: string)`. It resolves the catalog stop, owns the one active stop ID, arrivals lookup, refresh lifecycle, freshness/status state, and retry. It discards results whose stop ID no longer matches the active selection. The map adapter emits only the catalog stop ID; it does not fetch arrivals or render a second details panel. If the selected stop has no `vitrasaId`, the shared details view shows arrivals unavailable without making a request.

**Rationale**: The current `MapPort` can emit `onStopSelected`, but the renderer does not connect that callback to `main.ts`; the map adapter instead renders its own stop summary. A single flow preserves consistent behavior and existing `ArrivalsGateway` semantics.

**Alternatives considered**: Let each view fetch and render arrivals; rejected because it duplicates refresh, status, focus, and stale-response handling.

### D4: API v4 nullable stop coordinates

**Decision**: Keep each stop in `/stops` even when source coordinates are absent or invalid; normalize an invalid pair to `lat: null, lon: null`. Preserve the current v3 Vigo coordinate bounds (`42.10 <= lat <= 42.32`, `-8.85 <= lon <= -8.60`) so the only breaking schema change is nullability. Require both fields to be numbers within those bounds or both to be null. Keep every stop searchable. Once the Worker enforces the versioned contract, remove the duplicate hard-coded frontend bounding-box filter and trust the catalog's validated coordinates.

**Rationale**: The approved spec explicitly requires an unlocated stop to remain searchable. API v3 requires numeric `lat` and `lon` within Vigo-specific bounds, so allowing null is a breaking schema change and must be versioned. The v4 proposal preserves those bounds and changes only nullability. The catalog remains the sole source for stop identity, names, and coordinates.

**Alternatives considered**: Drop stops with bad coordinates in the Worker; rejected because that violates the approved search acceptance. Return NaN/infinity or omit fields; rejected because JSON cannot serialize these values consistently. Keep v3 and silently send null; rejected because it violates the v3 schema. Widen the coordinate range to all WGS84; rejected because this feature needs nullable coordinates, not a broader definition of the Vigo network catalog.

**Contract impact**: API v4.0.0 changes only `/stops` coordinate nullability and preserves the v3 Vigo bounds. The change also reaches the `NetworkStop` objects embedded in `GET /lines/{lineCode}` patterns. `contracts/realtime-api-v4.openapi.yaml` is the complete standalone v4 contract, derived from v3 with only that schema changed (strict pair rule via `oneOf`). Worker and frontend implementation is blocked until Architect and Backend record review of that artifact and the lint/regression scripts cover it; approving the direction alone does not unblock it. If rejected, reopen the spec/G2 rather than silently weaken the acceptance criterion.

**Catalog generation work**: `scripts/catalog/generate.ts` currently drops stops with non-finite coordinates, coerces empty values to 0 through `Number(...)`, and applies no Vigo bounds. It must retain such stops, treat empty/null/NaN as null, normalize out-of-bounds pairs to `null/null`, and regenerate `worker/src/catalog-data.json`, with Worker tests for an unlocated stop in `/stops` and `/lines/{lineCode}`.

### D5: No new data source or Worker endpoint

**Decision**: Continue using `ApiScheduleRepository` for catalog, lines, and timetables; `HttpArrivalsGateway` for arrivals; and the existing Worker public API. The redesign adds no routes, analytics, accounts, geolocation, or upstream source.

**Rationale**: Existing contracts supply all needed stops, lines, schedules, and arrival estimates.

### D6: Technical data-minimization boundary

**Decision**: Store stop favorites, recent views, and language only in browser `localStorage`; appearance is fixed light. The browser sends only the selected public stop ID to the project Worker for an arrival lookup. The Worker may forward the ID and source-required transient WebForms state to the fixed Vitrasa source for one lookup; it does not forward profile data. Map tile requests disclose visible tile coordinates and ordinary network metadata to CARTO's tile service. Do not request device geolocation. By owner decision (2026-10-27), do not display a privacy page, privacy link, or internal request-flow explanation; retain technical network tests and provider attribution.

**Rationale**: This follows constitution Principle VI at the network boundary while respecting the owner's preference not to expose internal request paths in the rider interface.

**Alternatives considered**: Add analytics or geolocation for discovery/usability; rejected by constitution. Show provider/data-flow disclosures in the UI; rejected by the owner after implementation. The app keeps required basemap credits.

**Basemap attribution source (T059)**: CARTO's current attribution page requires visible, linked credits on every CARTO basemap. The exact text is `© OpenStreetMap contributors, © CARTO`, with OpenStreetMap linked to `https://www.openstreetmap.org/copyright` and CARTO linked to `https://carto.com/attribution/`. Source: https://carto.com/attribution/ (retrieved 2026-10-26).

### D7: Arrival freshness follows the existing Worker contract

**Decision**: Show current for data younger than 30 seconds; show stale only after upstream failure when last-known data is at least 30 and less than 300 seconds old; show unavailable at 300 seconds or more or when no eligible response exists. Refresh every 30 seconds only while the stop details are visible and the document is foregrounded. Display the Worker-provided `generatedAt`; do not relabel cached data with the client fetch time or call an estimate a schedule delay.

**Rationale**: The Worker already implements a <30-second fresh cache and a <300-second last-known cache. This requires frontend timestamp correctness, not an arrivals schema change.

### D8: White/soft-red light appearance with measured contrast

**Decision**: The single source of light-theme tokens, measured pairings (including status, border, focus, and map marker tokens), and the tile-contrast sampling plan is [contracts/ui-design-contract.md](contracts/ui-design-contract.md) section 3. This decision intentionally does not repeat the table. Normal text target is 4.5:1; large text, essential non-text graphics, and focus indicators target 3:1. All interactive targets, including map stops, are at least 44 by 44 CSS pixels. The owner later fixed the app to light-only.

**Rationale**: One table cannot drift from itself. Ratios were recomputed with the WCAG relative-luminance formula; flat-token ratios do not prove contrast over map tiles, so G5 samples real tiles.

### D9: Preserve payload budgets; keep deck.gl off the initial map path

**Decision**: Render the first map and stop clusters with MapLibre-native sources/layers. Extend the existing payload gate and Vite build manifest so `npm run size` measures the first-map-ready dependency graph: the app entry, its static imports, the MapLibre chunk required to show the map, and associated CSS, deduplicated by emitted file. deck.gl is removed from the map path now: the `@deck.gl/*` imports leave `loadMap`, and the synthetic `PathLayer` route is deleted. If a future overlay is approved it loads by dynamic import after `map.on('load')`. Enforce a maximum 500 KiB gzip for this graph while retaining the existing per-chunk limits (shell 150 KiB, MapLibre 350 KiB, deck 350 KiB, CSS 150 KiB) and aggregate limits (JS 850 KiB, CSS 150 KiB). Do not connect stop coordinates into a synthetic route.

**Rationale**: The existing aggregate gate reports 562.1 KiB gzip across all JS chunks, but does not measure the first-map-ready graph. Map-first requires MapLibre; deck.gl adds about 281 KiB gzip and must remain outside that critical graph unless UX/architecture approve a required overlay. A manifest-based check makes the new 500 KiB target reproducible rather than aspirational.

**Alternatives considered**: Eagerly import both renderers; rejected due to startup and metered-device cost. Keep only the existing aggregate check; rejected because it cannot enforce the plan-gate first-map budget. Keep deck.gl on the first-map path; rejected because native cluster and circle layers need none of it and it costs about 281 KiB gzip. The budget is size-only (no time metric); the baseline task records the current graph size and also records time to `map.on('load')` for information, without a gate.

### D10: Replace only active copied behavior, preserve historical evidence

**Decision**: Before removing current attribution, replace the character repair and quote/asterisk cleanup in `worker/src/normalize.ts` with independently authored, source-contract-driven text normalization, backed by characterization tests written first for the current visible outputs: repaired accents, quote and asterisk cleanup, arrival ordering, and deduplication. Record a provenance verification that the replacement was authored from the source contract and observed outputs, not from the copied table, before any attribution is removed. Remove the retired source name from current product code, legal notices, current docs/contracts/tests. Preserve feature-002 history and add a superseding correction that explains the alternative source and abandoned dependency; do not rewrite old approvals.

**Rationale**: The source for arrivals is Vitrasa, but the existing text-cleanup table is documented as copied from a previous project. The owner approved removing current references while preserving historical records. Legal notices must not be removed until the derived behavior is replaced and provenance is verified.

**Alternatives considered**: Delete attribution immediately; rejected because the active normalizer still contains copied logic. Rewrite historical specs; rejected by the owner’s clarification.

**Implementation provenance (T067, 2026-10-26)**: The replacement is authored from the observed Vitrasa response encoding contract and the characterization cases in `worker/unit/normalize.test.ts`. It recognizes UTF-8 two-byte sequences represented as legacy single-byte text using the platform `TextDecoder`/`TextEncoder`, without a source-specific character replacement table. Quote and asterisk normalization is expressed directly as output rules. Arrival ordering is retained as ascending minutes, then destination; exact duplicate tuples after normalization remain deduplicated stably. These choices preserve all characterized user-visible results and were not derived from another project's implementation.

### D11: Verification split between automation and manual UX evidence

**Decision**: Use Vitest for domain/DOM behavior, Playwright with fixture Worker for end-to-end, responsive, network, keyboard, grouped-stop, and state flows, existing axe integration for automated DOM checks, and `npm run size` for bundle budgets. Record manual UX evidence for screen-reader announcements, actual contrast over map tiles, target usability, browser zoom at 200%, and participant studies.

**Rationale**: Automation cannot substantiate screen-reader quality or contrast over rendered third-party map tiles.

**Alternatives considered**: Treat axe/Lighthouse as a complete WCAG proof; rejected because they cannot validate all required assistive-technology and visual states. Add a new test dependency before proving a gap; rejected by YAGNI.

## G3 Open Items

- Architect and Backend Developer approval of the v4 nullable-coordinate contract.
- UX Designer approval and Frontend Developer agreement with the detailed design baseline before implementation.
- Privacy implementation uses CARTO's exact attribution source recorded under D6; G5 must verify that the rendered map credit remains visible and links correctly.
- Closed at G3: deck.gl leaves the first-map path (D9); the UI contract is the design baseline awaiting UX approval and Frontend agreement.
