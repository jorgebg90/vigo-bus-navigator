# Quickstart: GitHub Pages Publishing Validation

This guide validates the release workflow and static artifact without requiring
deployment credentials. The final public-route smoke check requires a successful
GitHub Pages deployment.

## Prerequisites

- Node.js 22 and npm
- Dependencies installed with `npm ci`
- GitHub Pages configured to publish from GitHub Actions for the live release

## Validate Existing Contracts and Build

```bash
npm ci
npm run lint:openapi
npm run validate:feature004-contract
VITE_PROFILE=production \
VITE_MUNICIPAL_PROFILE=production \
VITE_BASE_PATH=/vigo-bus-navigator/ \
npm run build
npm run validate:production-artifact
```

Expected results:

- OpenAPI lint and the feature contract guard pass.
- The production build generates the documentation before bundling the site.
- Production-artifact validation passes.
- Both `dist/index.html` and `dist/docs/openapi/index.html` exist.

```bash
test -s dist/index.html
test -s dist/docs/openapi/index.html
```

## Check the Project-Site Routes Locally

In one terminal:

```bash
npm run preview -- --host 127.0.0.1
```

In another terminal:

```bash
curl -fsS http://127.0.0.1:4173/vigo-bus-navigator/ >/dev/null
curl -fsS http://127.0.0.1:4173/vigo-bus-navigator/docs/openapi/ >/dev/null
```

Both requests must return successfully. The OpenAPI URL must serve the generated
documentation page rather than an application fallback.

## Validate the Workflow Contract

After implementing its focused workflow tests, run:

```bash
npm test -- scripts/deploy-workflow.test.ts scripts/pages-smoke-check.test.ts
```

The focused tests must confirm the `main`-only trigger, artifact-before-deploy
dependency, required build/contract checks before artifact upload, scoped
permissions, serialized Pages concurrency, URL output wiring, bounded
post-deployment route checks, route-specific failure details, and absence of a
success-condition bypass for artifact upload or deployment after a failed
build.

The existing generator failure tests should also remain green:

```bash
npm test -- scripts/generate-openapi-docs-failures.test.ts
```

The route checker can also be run against the deployed URL by setting
`PAGES_SITE_URL` to the URL returned by `actions/deploy-pages`:

```bash
PAGES_SITE_URL=https://jorgebg90.github.io/vigo-bus-navigator/ npx tsx scripts/pages-smoke-check.ts
```

## Verify a Live Main-Branch Publication

After merge to `main`:

1. Open the **Deploy** workflow run for the merge commit and confirm its source
   SHA matches the revision on `main`.
2. Confirm contract validation, the production build, and artifact validation
   pass before the Pages deployment job begins.
3. Confirm the deployment environment provides a link to the public site and
   both route checks pass.
4. Open the homepage and `/docs/openapi/` route from the URL in
   [the deployment contract](./contracts/pages-deployment.md).
5. If a pre-deployment check fails, confirm no Pages deployment job runs. If a
   post-deployment route check fails, report it as an availability-verification
   failure; the site may already contain the new artifact.
