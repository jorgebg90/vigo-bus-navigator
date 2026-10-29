# GitHub Pages Deployment Contract

## Purpose and Scope

This contract defines the release boundary between the repository's `main`
branch, GitHub Actions, GitHub Pages, and visitors. It covers the static
frontend and generated OpenAPI page only. It does not define or change the
application's municipal transit requests.

## Trigger Contract

- A push that updates `main`, including a pull-request merge, starts one
  production workflow run for the resulting revision.
- A feature-branch push or an unmerged pull-request update does not publish to
  the production site.
- The workflow builds from the source revision recorded on its run.

## Validation and Artifact Contract

- OpenAPI lint, the existing feature contract validation, the production build,
  and production-artifact validation complete successfully before the Pages
  artifact can be uploaded.
- The artifact contains the static application and generated OpenAPI page from
  the same source revision.
- The artifact uses `/vigo-bus-navigator/` as the project-site base path.
- Upload and deployment steps do not run after an earlier required build or
  validation step fails.
- Failure before deployment is visible as a failed Actions run and does not
  publish a replacement artifact.

## Deployment Contract

- The deployment job runs only after its artifact-producing job succeeds.
- A single Pages concurrency group allows one active release and retains only
  the latest pending release; an active production deployment is not canceled.
- The `github-pages` environment receives the deployed URL from the
  `actions/deploy-pages` `page_url` output.
- The run/deployment record identifies the source commit and publication
  outcome.
- The workflow grants read-only repository access to jobs that check out source.
  The deploy job receives only that read permission plus Pages-write and OIDC
  token permissions.

## Public Routes

| Route | Expected result |
| --- | --- |
| `https://jorgebg90.github.io/vigo-bus-navigator/` | Static frontend responds successfully |
| `https://jorgebg90.github.io/vigo-bus-navigator/docs/openapi/` | Generated OpenAPI documentation responds successfully |

After deployment, the workflow retries HTTP checks for both routes within a
bounded window. If either check fails, the workflow reports availability
verification as failed. Because the deployment has already happened, this
failure does not claim that the previous site was restored.

## Out of Scope

- Backend or transit proxy deployments
- Application credentials, secrets, or authenticated transit requests
- Preview deployments for pull requests
- Automatic rollback after a post-deployment availability failure
- Changes to the public transit contract or client architecture
