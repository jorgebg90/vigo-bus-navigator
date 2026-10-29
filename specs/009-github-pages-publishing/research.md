# Research: GitHub Pages Publishing

**Feature**: [spec.md](./spec.md)
**Date**: 2026-10-29

## Decisions

### Use a push to `main` as the release event

- **Decision**: Keep the existing `push` trigger filtered to `main`; do not add
  a separate merge event or deploy from pull requests.
- **Rationale**: GitHub Actions supports branch filters on `push`, and a merge
  that updates `main` produces that branch update. The repository's current
  workflow already uses this trigger. A feature-branch or unmerged PR update
  therefore cannot publish to the production site.
- **Alternatives considered**: Deploy on `pull_request` (would publish
  unmerged changes); add `workflow_dispatch` (unneeded manual release path);
  add a second workflow (duplicates release behavior).
- **Source**: [GitHub Actions events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
  and [workflow syntax: branch filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

### Make artifact availability an explicit job dependency

- **Decision**: Declare the deployment job dependent on the job that builds
  and uploads the Pages artifact.
- **Rationale**: GitHub's Pages guidance says the deploy job must use `needs`
  with the build job ID; without it, deployment can run independently and wait
  for an artifact that has not been produced. The current workflow has separate
  jobs but does not declare this dependency.
- **Alternatives considered**: Combine build and deploy in one job (less
  separation and no benefit for this existing workflow); rely on scheduling
  order (not guaranteed).
- **Source**: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
  and [actions/deploy-pages usage](https://github.com/actions/deploy-pages).

### Keep production deployment permissions minimal

- **Decision**: Grant read-only repository contents permission to the build
  workflow and deployment job. Grant the deployment job the additional
  `pages: write` and `id-token: write` permissions needed to publish.
- **Rationale**: The Pages deployment action requires `pages: write` to create
  the deployment and `id-token: write` for its OIDC token. Both jobs check out
  source, so they need read access; neither needs repository write access.
- **Alternatives considered**: Rely on repository-level default token
  permissions (may grant more than necessary and vary by repository
  configuration); grant broad write access to all jobs (unnecessary).
- **Source**: [actions/deploy-pages usage and permissions](https://github.com/actions/deploy-pages)
  and [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Serialize Pages runs without canceling an active publication

- **Decision**: Use one workflow-level concurrency group for Pages with
  `cancel-in-progress: false`.
- **Rationale**: GitHub Actions allows at most one running member of a
  concurrency group; while it runs, a new pending member replaces an older
  pending member. Keeping the active deployment alive and retaining only the
  newest pending run makes closely spaced `main` updates converge to the latest
  revision without allowing an earlier queued run to publish afterward.
- **Alternatives considered**: No concurrency control (permits overlapping
  deploy jobs); cancel the active deployment (unnecessarily interrupts a
  production side effect); concurrency on a job that excludes build time
  (does not serialize each complete release run).
- **Source**: [Control the concurrency of workflows and jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
  and the official [GitHub Pages static workflow template](https://raw.githubusercontent.com/actions/starter-workflows/main/pages/static.yml).

### Surface the public Pages URL in the deployment record

- **Decision**: Assign an ID to the `deploy-pages` step and set the
  `github-pages` environment URL from that step's `page_url` output. Include
  the source SHA and site URL in the workflow summary.
- **Rationale**: The action exposes the deployed site URL as `page_url`; the
  official workflow pattern connects it to the environment so maintainers can
  open the deployed site directly from the deployment record. The Actions run
  identifies the source revision.
- **Alternatives considered**: Hard-code the URL in the workflow (can become
  stale if Pages configuration changes); require maintainers to find it in
  build logs (not discoverable enough).
- **Source**: [actions/deploy-pages outputs and usage](https://github.com/actions/deploy-pages)
  and the official [GitHub Pages static workflow template](https://raw.githubusercontent.com/actions/starter-workflows/main/pages/static.yml).

### Verify the public routes after publication

- **Decision**: Perform bounded, retrying HTTP checks of the homepage and
  OpenAPI documentation URL after the deployment job succeeds.
- **Rationale**: A successful artifact upload or deployment action alone does
  not verify that both public routes are currently reachable. A short retry
  window accommodates host propagation. The deployment is already a live
  side effect, so failed post-deployment verification must be reported
  distinctly and must not imply rollback.
- **Alternatives considered**: Rely only on local artifact checks (cannot prove
  public reachability); fail without retries (can report transient propagation
  delays as permanent failures); promise automatic rollback (not provided by
  the current Pages workflow and outside scope).
- **Source**: The public routes and expected base path are defined in the
  feature specification. GitHub's Pages action documents the deployed URL
  output but does not promise that an independent HTTP probe is unnecessary.

## Repository Findings

- `.github/workflows/deploy.yml` already triggers on pushes to `main`, builds
  with Node.js 22, sets the production profiles and project-site base path,
  uploads `dist`, and uses the recommended `github-pages` environment and
  Pages/OIDC deployment permissions. Its deploy job already depends on the
  artifact-producing `frontend` job.
- The workflow did not run OpenAPI lint, feature-contract validation, or
  production-artifact validation before uploading the artifact; this feature
  adds these gates around the existing production build.
- The deployment step currently has no ID and the environment has no URL
  expression, so the `page_url` is not surfaced.
- There is no workflow-level concurrency group.
- The production build runs OpenAPI generation through `npm run build`.
  Existing relevant gates are `npm run lint:openapi`,
  `npm run validate:feature004-contract`, and
  `npm run validate:production-artifact`.
- Repository Pages publishing-source settings and availability of the public
  URL cannot be proven from the checked-in workflow; they remain live
  implementation validation items.

## Risks and Limitations

- GitHub concurrency order is not a general FIFO guarantee; the plan relies on
  the documented one-running/one-pending behavior where newer pending runs
  replace older pending runs.
- A post-deploy route check can fail after Pages has already accepted the new
  artifact. The run must make that phase clear; it cannot safely promise that
  the old site was restored.
- `page_url` is available only after the deployment action runs. A build or
  validation failure should still be diagnosable from the failed job and run
  record, even when no new deployment URL is produced.
- The GitHub Pages repository setting must select GitHub Actions as the
  publishing source for the custom workflow to publish successfully.
