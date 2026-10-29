# Data Model: GitHub Pages Publishing

This feature adds no application database or durable application records. The
following entities describe the release lifecycle recorded by GitHub Actions
and GitHub Pages.

## Main-Branch Revision

An immutable source state eligible for production publication.

| Field | Description | Validation |
| --- | --- | --- |
| `commit_sha` | Full commit SHA associated with the `main` push | Must identify the triggering workflow's source revision |
| `branch` | Source branch | Must be `main` |
| `event` | Triggering repository event | Must be a `push` to `main` |

## Deployment Run

One GitHub Actions run that validates and publishes a main-branch revision.

| Field | Description | Validation |
| --- | --- | --- |
| `run_id` | GitHub Actions run identifier | Assigned by GitHub |
| `commit_sha` | Revision being processed | Must match the workflow run's triggering SHA |
| `status` | Overall processing result | GitHub Actions success, failure, or cancellation |
| `phase` | Current or failed phase | Build/validation, artifact upload, deployment, or public-route verification |
| `site_url` | Public Pages address, when available | Supplied by `deploy-pages` after deployment |

**Lifecycle**: queued → build/validation → artifact upload → deployment →
public-route verification → complete. A failed pre-deployment phase prevents
artifact publication. A post-deployment verification failure is reported as a
failed release check but does not undo the already completed Pages deployment.

## Pages Artifact

The temporary static output uploaded by the workflow for one deployment run.

| Field | Description | Validation |
| --- | --- | --- |
| `source_revision` | Commit from which the artifact was built | Must match the deployment run's `commit_sha` |
| `contents` | Production frontend and generated OpenAPI HTML | Must be built together from the same checkout |
| `base_path` | Project-site URL prefix | Must match `/vigo-bus-navigator/` |
| `availability` | Whether the artifact was uploaded | Exists only after all required pre-upload checks pass |

## Published Site

The public static website exposed by GitHub Pages.

| Field | Description | Validation |
| --- | --- | --- |
| `site_url` | `https://jorgebg90.github.io/vigo-bus-navigator/` | Must be exposed on the deployment environment |
| `homepage_route` | Application entry page | Must be reachable at the site URL |
| `openapi_route` | Generated API documentation | Must be reachable at `/docs/openapi/` under the project base path |
| `deployed_revision` | Revision represented by the completed deployment record | Must be the run SHA associated with the Pages artifact |

## Relationships

- A main-branch revision may have one or more deployment runs due to retries.
- Each deployment run processes exactly one revision and can upload at most one
  Pages artifact.
- A Pages artifact is built from exactly one revision and contains both the
  application and its generated OpenAPI documentation.
- A successful Pages deployment exposes that artifact as one published site.
- The concurrency group serializes workflow runs. An active older run may
  complete before the latest pending revision is deployed; once a newer run
  completes, no older run can subsequently replace it.
