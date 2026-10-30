# Repository Cleanup Inventory

**Feature**: [Repository Cleanup and Normalization](./spec.md)
**Branch**: `007-repository-cleanup` (based on `origin/develop`)
**Baseline date**: 2026-10-28
**Baseline tracked files**: 368
**Status**: Implemented; final Playwright E2E passed with 2 workers (104 passed, 7 skipped)

## Initial Baseline Validation

| Command | Initial baseline result |
| --- | --- |
| `npm test` | PASS — 74 files, 363 tests |
| `npm run typecheck` | PASS — frontend and Worker TypeScript |
| `npm run lint:openapi` | PASS — 0 errors, 9 pre-existing unused-component warnings |
| `npm run test:contract` | PASS — 5 files, 56 tests |
| `npm run test:load` | PASS — 600 fixture-only requests at 10 requests/second; p95 0 ms |
| `npm run test:coverage` | PASS — 74 files, 363 tests; total statements 87.28%, branches 84.76%, functions 95.12% |
| `npm run build` | PASS — static frontend build; existing MapLibre chunk warning |
| `npm run validate:production-artifact` | PASS — fixed source, credential-free requests, and action/mapping checks |
| `npm run size` | PASS — JS 373.4 KiB gzip, CSS 13.6 KiB gzip, first-map graph 384.2 KiB / 500 KiB |
| `npm run snapshot:generate` | PASS — generated outputs match tracked baseline |
| `npm run test:e2e` | Initially blocked because `http://127.0.0.1:4173` was occupied. After the baseline, the identified listener was stopped and the final run passed with 2 workers; see Final Validation. |
| `npm ci` | NOT RUN — dependencies are already installed; no manifest changes were made at baseline |

## Baseline Repository Areas and Lifecycle Classification

The path ledger below lists every tracked file from the baseline. Classification
is based on repository role and observed consumers. File-specific remove or
consolidate decisions require explicit evidence in the change or final decision
register; unresolved files remain retained.

| Area | Baseline files | Lifecycle | Purpose and evidence |
| --- | ---: | --- | --- |
| Root configuration, manifests, license, and README | 13 | Active | Contributor entry points, dependency graph, build/test configuration, legal notices, and repository policy |
| `.github/` | 20 | Active | CI/deploy workflows, harness agents, Spec Kit skills, and repository configuration |
| `.specify/` | 20 | Active | Spec Kit scripts/templates and current constitution |
| `docs/` | 10 | Mixed active/historical | Harness and quality guidance are current; blog drafts and reference material are preserved as project records |
| `frontend/` | 186 | Active | Static PWA implementation, production assets, and unit/DOM/E2E tests |
| `scripts/` | 18 | Active | Catalog/snapshot generation, provenance, contract, production-artifact, payload, and geometry validation |
| `specs/` | 74 | Historical/current | Numbered feature specifications, contracts, implementation plans, tasks, decisions, and gate evidence; preserve |
| `worker/` | 26 | Legacy source with active tooling/data consumers | No production deploy use; root CI, typecheck, unit/contract/load tests, frontend catalog import, and generation scripts still reference this workspace at baseline |
| `postman/` | 1 | Active | Manual direct municipal JSP request collection; it does not call the retired Worker and does not validate browser CORS |

## Supported Workflow Dependency Map

| Workflow/artifact | Consumers at baseline | Decision |
| --- | --- | --- |
| Static Pages deployment | `.github/workflows/deploy.yml`, `npm run build`, `dist/` | Retain unchanged |
| Frontend unit/DOM/E2E checks | root scripts, `frontend/tests/`, `playwright.config.ts` | Retain unchanged |
| Worker TypeScript check | `package.json` `typecheck` references `worker/tsconfig.json` | Replace with supported frontend/script checks before retiring Worker config |
| Worker pure unit tests | Root `npm test` discovers `worker/unit/` | Review whether these test only retired Worker runtime or generic logic before retirement |
| Worker contract/load tests | CI and `test:contract` / `test:load` scripts | Retire only after preserving needed OpenAPI and frontend/municipal contract checks |
| Bundled discovery catalog | Frontend import from `worker/src/catalog-data.json`; `scripts/catalog/generate.ts` writes there | Move generated/source data to frontend-owned path, update import/generator/tests |
| Timetable snapshot generation | `scripts/snapshot/generate.ts` writes under `worker/src/schedule-data/`; CI runs generator | Preserve source snapshots and generation validation; move output before removing Worker workspace |
| OpenAPI contracts | `lint:openapi`, OpenAPI regression and production-contract scripts | Preserve all current contracts and validation |
| Historical feature/decision documents | `specs/001`–`specs/006`, constitution records | Preserve; not current workflow duplicates |
| `postman/` | Feature 004 quickstart links it; collection calls the fixed municipal JSP directly and explicitly says it does not test browser CORS | Retain and rename to remove the obsolete Worker name while preserving the manual source-inspection workflow |

## Decision Register

| Candidate | Checked references | Decision | Replacement / rationale |
| --- | --- | --- | --- |
| `worker/src/catalog-data.json` | Imported by frontend; generated by `scripts/catalog/generate.ts`; covered by catalog tests | Relocate, do not delete data | Frontend-owned data directory; update import and generator target |
| `worker/src/schedule-data/` | Generated by `scripts/snapshot/generate.ts`; committed outputs; snapshot retention requirement | Relocate and retain data | Non-Worker generated location; preserve snapshot source and parity/coverage gate |
| Worker contract/load runtime and source | package scripts, CI, Worker-specific Vitest configs | Remove only after supported replacement decision and CI updates | Worker is not production runtime; preserve current municipal contracts and the browser-side validation suite |
| Worker-era frontend API repository/use case/port and test helper | Search across frontend source and tests found only reciprocal references and definitions; no active callers | Remove | The municipal v5 repository and current browser adapters remain the sole maintained integration |
| Temporary browser JSP POC (`frontend/poc-vigo-jsp.html` and `.js`) | Only historical source-evidence documentation referenced the files; no app, build, or CI consumer | Remove after preserving findings | The documented experiments are historical evidence; current municipal adapters and contract tests cover supported behavior |
| Empty directories left by removed sources (`frontend/tests/unit/helpers`, `frontend/public`, `frontend/public/data`, `frontend/public/data/lines`, `frontend/src/infrastructure/fixtures`, `frontend/src/infrastructure/arrivals`) | Empty on disk and no current source/configuration references | Remove local empty directories | No tracked contents or runtime behavior depended on them |
| Worker package/type/config | npm workspace, root typecheck, tests | Conditional removal after consumers are migrated | No remaining references may exist before deletion |
| Feature specifications and accepted decisions | Current constitution and historical feature evidence | Retain | Protected history; unique decisions and provenance remain accessible |
| `postman/` collection | Feature 004 quickstart and manual source checks; collection targets the fixed municipal JSP and does not test browser CORS | Retain and rename | Keep the useful manual workflow while removing the stale Worker name from its path |

## Per-File Baseline Ledger

Lifecycle at baseline is inherited from the verified area above; a path listed
in a mixed/unresolved area retains that conservative status until its dedicated
decision is recorded. Generated or historical paths are not deleted solely
because they are not imported by the application.

| Lifecycle | Tracked path | Purpose / initial evidence |
| --- | --- | --- |
| Active | `.env.example` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `.github/agents/backend-developer.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/communicator.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/frontend-developer.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/project-lead.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/qa-tester.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/software-architect.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/stakeholder.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/agents/ux-designer.agent.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-analyze/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-checklist/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-clarify/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-constitution/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-converge/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-implement/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-plan/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-specify/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-tasks/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/skills/speckit-taskstoissues/SKILL.md` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/workflows/ci.yml` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.github/workflows/deploy.yml` | Harness, Spec Kit, CI, deployment, or repository automation. |
| Active | `.gitignore` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `.size-limit.json` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `.specify/.gitignore` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/init-options.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/integration.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/integrations/copilot.manifest.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/integrations/speckit.manifest.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/memory/.constitution-template.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/memory/constitution.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/check-prerequisites.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/common.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/create-new-feature.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/resolve-template.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/setup-plan.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/scripts/bash/setup-tasks.sh` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/templates/checklist-template.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/templates/constitution-template.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/templates/plan-template.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/templates/spec-template.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/templates/tasks-template.md` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/workflows/speckit/workflow.yml` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.specify/workflows/workflow-registry.json` | Spec Kit configuration, template, script, or current governance source. |
| Active | `.spectral.yaml` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `LICENSE` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `NOTICE` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `README.md` | Repository entry point or shared configuration; verify consumers before changing. |
| Historical | `docs/blog/004-plan.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/004-specification.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/01-constitution.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/02-specification.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/03-plan.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/04-tasks.md` | Project history or non-normative reference; preserve unique evidence. |
| Historical | `docs/blog/05-implementation.md` | Project history or non-normative reference; preserve unique evidence. |
| Active | `docs/harness-charter.md` | Current contributor/harness guidance. |
| Active | `docs/quality.md` | Current contributor/harness guidance. |
| Historical | `docs/reference/spec-000-architecture-example.md` | Project history or non-normative reference; preserve unique evidence. |
| Active | `frontend/.env.development` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/index.html` | Maintained static PWA source, production assets, or frontend validation. |
| Removed | `frontend/poc-vigo-jsp.html` | Temporary browser POC; findings preserved in feature 004 source evidence. |
| Removed | `frontend/poc-vigo-jsp.js` | Temporary browser POC; findings preserved in feature 004 source evidence. |
| Active | `frontend/src/application/get-bundled-schedule-fallback.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/get-line-frequency.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/get-stop-arrivals.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/ports.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/request-version.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/select-stop.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/application/toggle-favorite.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/arrival-state.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/day-type.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/favorites.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/frequency.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/freshness.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/map-stops.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/municipal-contract.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/municipal-failures.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/domain/types.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/i18n/en.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/i18n/es.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/i18n/gl.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/i18n/index.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/config.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/map/map-port.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/action-readiness.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/arrival-cache.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/arrivals-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/arrivals-normalizer.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/bundled-discovery-catalog.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/default-fixture-client.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/fixture-transport.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/http-client.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/line-catalog-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/line-id.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/line-schedule-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/line-stop-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/online-stop-catalog.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/public-response-cache.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/request-builder.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/request-scheduler.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/request-validation.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/response-decoder.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/route-shape-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/service-catalog-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/serving-lines-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/stop-detail-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/municipal/trip-stop-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/schedule/api-schedule-repository.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/schedule/bundled-schedule-snapshot.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/schedule/municipal-schedule-repository.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/storage/local-storage-adapter.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/system/browser-geolocation.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/system/clock.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/infrastructure/system/visibility.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/main.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/sw/offline.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/favorite-toggle.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/home/favorites.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/i18n-renderer.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/icons.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/line-badge.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/line/frequency-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/line/lines-list.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/map/location-status.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/map/map-toolbar.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/map/map-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/map/stop-chooser.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/offline-status.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/panel/sheet.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/privacy/privacy-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/search/stop-search.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/settings/settings-menu.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/settings/storage-notice.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/shell.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/stop/serving-lines-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/stop/stop-arrivals-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/stop/stop-view.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/styles.css` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/ui/theme.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/src/vite-env.d.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/focus-history.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/lines-list.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/location-status.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/map-adapter.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/map-toolbar.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/municipal-serving-lines-view.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/privacy-view.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/settings-menu.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/sheet.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/shell.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/stop-search.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/stop-view.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/us1-line-frequency.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/us2-stop-arrivals.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/us3-map.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/us4-favorites.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/dom/us6-language.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/a11y-states.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/acceptance.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/arrivals-accessibility.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/favorites.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/helpers/municipal-profile.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/helpers/open-stop-from-search.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/keyboard-map.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/map-position.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/mobile-location.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/municipal-arrivals.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/municipal-catalog.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/municipal-line-service.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/municipal-profile-isolation.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/offline.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/performance-network.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/privacy-network.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/reduced-motion.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/responsive.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/e2e/search-lines.spec.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/README.md` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/arrivals.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/line-catalog-es.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/line-catalog-ga.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/line-stop-detail.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/manifest.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/route-geometry.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/schedule.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/services-es.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/services-ga.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/serving-lines.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/stop-catalog.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/stop-detail.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/municipal/trip-stops.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/fixtures/schedule-snapshots.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/i18n/key-parity.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/architecture.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/attribution.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/browser-geolocation.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/config.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/day-type.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/favorites.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/frequency.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/freshness-labels.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/get-bundled-schedule-fallback.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/get-stop-arrivals.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/helpers/ports.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/i18n.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/map-stops.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/map-view.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/action-readiness.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/arrival-receipt.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/arrivals-adapter.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/arrivals-identity.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/arrivals-normalizer.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/bounded-response.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/bundled-discovery-catalog.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/default-fixture-client.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/fixture-manifest.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/fixture-transport.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/line-catalog.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/line-schedule-adapter.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/line-stop-detail.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/municipal-schedule-repository.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/normalized-contract.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/online-catalog.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/production-artifact.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/profiles.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/public-response-cache.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/request-builder.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/request-scheduler.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/request-validation.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/response-decoder.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/route-geometry.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/service-catalog.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/stop-catalog.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/municipal/trip-stops.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/offline.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/request-version.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/schedule-repository.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/schedule/bundled-schedule-snapshot.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/select-stop.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/stop-view.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/storage-adapter.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/toggle-favorite.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tests/unit/token-contrast.test.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/tsconfig.json` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `frontend/vite.config.ts` | Maintained static PWA source, production assets, or frontend validation. |
| Active | `lighthouserc.json` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `package-lock.json` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `package.json` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `playwright.config.ts` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `postman/vigo-bus-navigator-worker.postman_collection.json` | Baseline path for the retained manual municipal JSP collection; renamed to `postman/vigo-bus-navigator-municipal.postman_collection.json`. |
| Active | `scripts/catalog/generate.test.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/catalog/generate.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/catalog/stop-coordinates.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/check-payload-budget.test.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/check-payload-budget.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/openapi-regression.test.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/provenance.test.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/smoke-municipal-live.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/README.md` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/generate.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/geo.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/source/lines/l4a.json` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/source/lines/l7.json` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/source/manifest.json` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/source/stops.json` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/snapshot/test/geo-validation.test.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/validate-municipal-api-contract.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Active | `scripts/validate-production-artifact.ts` | Maintained generation, validation, provenance, or supporting test utility. |
| Historical | `specs/000-constitution/gate-g1-ratification.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/contracts/internal-ports.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/contracts/stop-arrivals.openapi.yaml` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/gate-g2-spec-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/gate-g3-plan-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/gate-g4-tasks-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/001-bus-frequency-pwa/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/blog-draft-specify-plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/checklists/g2-source-change.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/gate-g2-spec-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/gate-g3-plan-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/gate-g4-tasks-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/gate-g5-implementation-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/002-realtime-bus-api/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/contracts/realtime-api-v4.openapi.yaml` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/contracts/ui-design-contract.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/gate-g2-spec-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/gate-g3-plan-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/gate-g4-tasks-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/rider-study-template.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/003-improve-frontend-design/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/contracts/README.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/contracts/action-readiness.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/contracts/municipal-transit-v5.openapi.yaml` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/design-baseline.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g1-direct-jsp-amendment-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g2-spec-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g3-plan-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g4-task-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g5-implementation-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/gate-g6-story-review.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/source-evidence.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/004-vigo-jsp-transit-api/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/contracts/line-route-map.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/005-line-route-map/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/checklists/requirements.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/contracts/mobile-location-map.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/data-model.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/plan.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/quickstart.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/research.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/spec.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Historical | `specs/006-mobile-location/tasks.md` | Completed feature, accepted decision, contract, or gate evidence; preserve. |
| Active | `tsconfig.json` | Repository entry point or shared configuration; verify consumers before changing. |
| Active | `vitest.config.ts` | Repository entry point or shared configuration; verify consumers before changing. |
| Legacy | `worker/package.json` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/cache.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Active | `worker/src/catalog-data.json` | Bundled catalog currently imported by frontend and emitted by generator. |
| Legacy | `worker/src/catalog.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/env.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/fixtures.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/index.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/normalize.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Generated | `worker/src/schedule-data/lines/l4a.json` | Generated snapshot data; preserve until explicit parity/coverage decision. |
| Generated | `worker/src/schedule-data/lines/l7.json` | Generated snapshot data; preserve until explicit parity/coverage decision. |
| Generated | `worker/src/schedule-data/manifest.json` | Generated snapshot data; preserve until explicit parity/coverage decision. |
| Legacy | `worker/src/source-html.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/types.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/src/upstream.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/arrivals-source.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/contract.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/load.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/resilience.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/stale.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/test/upstream.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/tsconfig.json` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/unit/cache.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/unit/normalize.test.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/vitest.config.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/vitest.load.config.ts` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |
| Legacy | `worker/wrangler.toml` | Migration-era Worker source/tooling; consumed by baseline tests/typecheck/CI or awaiting usage audit. |

## Final Validation and Disposition

**Final working-tree files**: 348 (including the new feature-007 design
artifacts); **tracked Worker paths**: 0. No unresolved removal candidate
remains.

### Final Dispositions

| Candidate | Final disposition | Evidence / replacement |
| --- | --- | --- |
| Worker catalog and timetable snapshots | Moved and retained | Catalog now lives under `frontend/src/infrastructure/municipal/data/`; dated snapshots live under `scripts/snapshot/generated/`; generator tests and parity validation pass |
| Worker runtime, source, workspace, typecheck, and deployment configuration | Removed (22 baseline Worker files) | No Worker deploy existed; root workspace/scripts, CI, typecheck and test discovery were migrated; no tracked Worker path remains |
| Local ignored Worker cache and `node_modules` remnants | Removed | The retired `worker/.wrangler` cache (20 MB) and its unused `worker/node_modules` directory were local-only and had no remaining consumers |
| Worker-only contract/load and runtime unit tests | Removed | Replaced for maintained behavior by frontend tests, OpenAPI regression/lint, and `validate:municipal-api-contract` |
| Legacy `ApiScheduleRepository`, `getLineFrequency`, `ScheduleRepository`, `LineDetails`, and `DatasetManifest` | Removed | Full frontend source/test reference scan showed no callers after migration to the municipal v5 repository |
| `frontend/tests/unit/helpers/ports.ts` | Removed | Its fake classes had no imports or consumers |
| `frontend/poc-vigo-jsp.html` and `frontend/poc-vigo-jsp.js` | Removed | Temporary experiments had no application/build/CI consumers; relevant request and browser observations remain in feature 004 evidence |
| Six empty frontend directories | Removed locally | Empty after source moves/deletions and unused by current source/configuration |
| Postman municipal-source collection | Retained and renamed | `postman/vigo-bus-navigator-municipal.postman_collection.json`; calls the fixed JSP directly and documents that Postman does not validate browser CORS |
| Historical feature specifications, source provenance, snapshots, and legal notice | Retained | No unique decision, accepted gate evidence, protected snapshot input, or notice was removed |

### Final Validation

| Command / check | Result |
| --- | --- |
| `npm ci` | PASS — clean install, 779 packages added; npm reported 39 dependency audit findings (4 low, 21 moderate, 10 high, 4 critical); no audit fix was applied |
| `npm run typecheck` and `npm run lint` | PASS |
| `npm run test:coverage` | PASS — 71 files, 349 tests; statements/lines 93.58%, branches 85.33%, functions 97.50% |
| `npm run lint:openapi` | PASS — 0 errors; 9 pre-existing unused-component warnings |
| `npm run validate:municipal-api-contract` | PASS — OpenAPI 3.1.0, 43 schemas and supported municipal actions verified |
| `npm run build` | PASS — static frontend artifact; existing large MapLibre chunk warning |
| `npm run validate:production-artifact` | PASS — fixed source, credential-free requests, supported actions, exact detail mapping |
| `npm run size` | PASS — JS 373.4 KiB gzip, CSS 13.6 KiB gzip, first-map graph 384.2 KiB / 500 KiB |
| `npm run snapshot:generate` | PASS — generated outputs match maintained inputs |
| Postman collection and package lock JSON parse | PASS |
| `git diff --check` | PASS |
| Removed Worker references in package manifests, CI, scripts, frontend | PASS — no matches; no tracked Worker paths |
| `npm run test:e2e` | PASS after freeing the identified port-4173 listener and rerunning with 2 workers — 104 passed, 7 skipped; the initial 6-worker run had 7 failures/timeouts under contention |

The test and production checks preserve the static browser-only deployment and
the current product behavior. The full browser suite passes with 2 workers;
7 tests are skipped by the existing suite configuration.
