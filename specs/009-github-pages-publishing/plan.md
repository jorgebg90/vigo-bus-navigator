# Implementation Plan: GitHub Pages Publishing

**Branch**: `009-github-pages-publishing` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-github-pages-publishing/spec.md`

## Summary

Make the existing GitHub Pages workflow a reliable release path for the static
site on `main`: validate the generated OpenAPI documentation and production
artifact before upload, explicitly order the artifact and deployment jobs,
serialize deployments so an older run cannot finish after a newer one, expose
the public URL and source revision in the GitHub deployment record, and verify
the deployed homepage and OpenAPI route. A push to `main` already triggers the
workflow; this plan fixes the missing safeguards rather than adding a second
workflow.

## Technical Context

**Language/Version**: TypeScript 5.8; Node.js 22 for local build and GitHub Actions

**Primary Dependencies**: Existing Vite 7 build, OpenAPI generator and validators,
Vitest, GitHub Actions `upload-pages-artifact@v3` and `deploy-pages@v4`; no new
runtime or development dependencies

**Storage**: No application persistence. GitHub Actions artifacts are
short-lived release inputs; GitHub Pages hosts the published static files.

**Testing**: Existing OpenAPI and production-artifact validators; Vitest
workflow-contract tests; root and project-base-path production builds; local
preview checks; post-deployment HTTP smoke checks for the homepage and
`/docs/openapi/`

**Target Platform**: GitHub Actions on Ubuntu and zero-cost static HTTPS hosting
at `https://jorgebg90.github.io/vigo-bus-navigator/`

**Project Type**: Static browser PWA with a GitHub Actions publication workflow

**Performance Goals**: Do not add runtime code, requests, or payload to the
frontend. The post-deployment route check should complete within a bounded
retry window.

**Constraints**: Publish only pushes to `main`; preserve the project-site base
path; fail before artifact upload when validation/build fails; serialize
deployments without canceling a production deployment in progress; use least
privilege; add no backend, transit credentials, paid services, or new
infrastructure. The deployment job needs read-only contents access to check out
the route-verification script. A post-deployment availability-check failure is
reported separately: GitHub Pages deployment is already a live side effect and
this plan does not promise automatic rollback.

**Scale/Scope**: One static site and its generated OpenAPI documentation;
changes are limited to `.github/workflows/deploy.yml`, focused workflow and
smoke-check tests, the route-verification script, and feature documentation.

## Constitution Check

### Pre-Research Gate

- **I. Browser-first frontend**: PASS. Publication serves static assets only;
  municipal requests remain direct browser requests and are not changed.
- **II. Modular hexagonal architecture**: PASS. No application runtime module
  or dependency boundary changes.
- **III. Test-first with unit coverage**: PASS. Add focused tests for the
  deployment workflow contract and retain the existing build/generator tests.
- **IV. Local testability and profiles**: PASS. Build and artifact checks run
  locally without deployment credentials; only the final Pages smoke check
  requires the published site.
- **V. Contract-first OpenAPI**: PASS. Validate and publish the existing
  canonical contract's generated documentation; do not create or alter a
  transit API.
- **VI. Zero-cost and privacy by design**: PASS. Use existing GitHub Actions and
  GitHub Pages; no accounts, application secrets, tracking, paid services, or
  transit proxy are introduced.
- **VII. Simplicity and English documentation**: PASS. Extend the existing
  workflow and scripts; no duplicate deployment system or new dependency.

No constitutional exception is required.

### Post-Design Gate

- **I. Browser-first frontend**: PASS. The published output remains a static
  site with no server-side transit path.
- **II. Modular hexagonal architecture**: PASS. The plan changes workflow and
  validation boundaries only, not runtime modules or dependency direction.
- **III. Test-first with unit coverage**: PASS. The workflow contract and
  fail-closed artifact sequence have focused automated checks.
- **IV. Local testability and profiles**: PASS. Local validation does not need
  GitHub secrets or a Pages deployment.
- **V. Contract-first OpenAPI**: PASS. The existing canonical contract remains
  the source for generated documentation and is checked before upload.
- **VI. Zero-cost and privacy by design**: PASS. No new hosting, runtime
  dependency, application secret, or transit data flow is introduced.
- **VII. Simplicity and English documentation**: PASS. The implementation
  extends one existing workflow and uses existing scripts and dependencies.

The design introduces no constitutional violation.

## Research Decisions

- Keep `push` to `main` as the production trigger. Merging a pull request
  creates the main-branch push; unmerged branches remain outside production.
- Keep the existing build and deploy jobs, but make the deploy job explicitly
  dependent on the artifact-producing job. The existing workflow already has
  `needs: frontend`; retain this dependency.
- Run the existing OpenAPI lint, feature-contract validation, production
  build, and production-artifact validation before uploading the Pages
  artifact. A failing validation/build must prevent both upload and deployment.
- Use a workflow-level `github-pages` concurrency group with
  `cancel-in-progress: false`. Let the active publication finish, and let
  GitHub retain only the latest pending run. An active older run may complete
  while a newer commit is pending, but it cannot finish after that newer run;
  the newest pending revision takes the next deployment slot.
- Keep permissions narrow: grant `contents: read` to build and deploy jobs for
  checkout; grant the deploy job only the additional Pages deployment and OIDC
  permissions it needs.
- Give the deploy step an ID and bind its `page_url` output to the
  `github-pages` environment URL. Include the run's source SHA and public URL
  in an easy-to-find deployment summary.
- After successful publication, retry HTTP checks for the configured homepage
  and `/docs/openapi/` route to allow for Pages propagation. A failed
  availability check marks verification as failed but cannot undo a deployment
  that has already occurred.
- Keep the existing action versions. Upgrading unrelated workflow actions is
  not necessary to satisfy the spec.

See [research.md](./research.md) for cited source material,
[data-model.md](./data-model.md) for release entities,
[design-baseline.md](./design-baseline.md) for the maintainer-facing status
experience, [quickstart.md](./quickstart.md) for validation steps, and
[contracts/pages-deployment.md](./contracts/pages-deployment.md) for the
workflow and publication contract.

## Project Structure

### Documentation (this feature)

```text
specs/009-github-pages-publishing/
├── plan.md
├── research.md
├── data-model.md
├── design-baseline.md
├── quickstart.md
└── contracts/
    └── pages-deployment.md
```

### Source and tests (repository root)

```text
.github/
└── workflows/
    └── deploy.yml                     # Production Pages workflow

scripts/
├── generate-openapi-docs.ts           # Build-time documentation generation
├── validate-production-artifact.ts    # Built-artifact guard
├── pages-smoke-check.ts               # Post-deployment public-route checks
├── deploy-workflow.test.ts            # Workflow-contract tests
└── pages-smoke-check.test.ts          # Route-check tests

frontend/
└── tests/
    └── unit/                           # Existing application tests
```

**Structure Decision**: Keep publication configuration in the existing
`.github/workflows/deploy.yml`. Add focused tests alongside the repository's
existing Vitest script tests and reuse the OpenAPI/build validators. Keep the
post-deployment HTTP checks in a small standalone script so they can be tested
without contacting the live site. No frontend runtime modules or additional
deployment workflows are needed.

## Complexity Tracking

No constitution violations or additional architectural complexity.
