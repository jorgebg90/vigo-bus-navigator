# Feature Specification: Publish the Site to GitHub Pages on Main Merge

**Feature Branch**: `009-github-pages-publishing`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Automatically publish the static site to GitHub Pages after changes are merged into main, with visible deployment status and fail-safe build behavior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish approved changes automatically (Priority: P1)

As a maintainer, I want changes merged into `main` to publish the current static
site to GitHub Pages automatically so that the public site follows the reviewed
production branch without a separate manual release step.

**Why this priority**: Publishing the reviewed application and generated
OpenAPI page is the primary purpose of the feature.

**Independent Test**: Merge a known-good change into `main`, observe one
deployment for the merge commit, and verify that the public site serves the
updated static application and OpenAPI documentation.

**Acceptance Scenarios**:

1. **Given** a pull request is merged into `main` and the production build
   succeeds, **When** the merge commit is processed, **Then** the static site
   is published to the configured GitHub Pages address without a manual
   deployment action.
2. **Given** a change is pushed to a feature branch or a pull request is
   updated but not merged, **When** repository automation runs, **Then** it
   does not publish that change to the production site.
3. **Given** the new deployment completes, **When** a visitor opens the site
   and its OpenAPI documentation URL, **Then** both serve the version built
   from the same merged revision.

### User Story 2 - Identify deployment outcome and recover safely (Priority: P2)

As a maintainer, I want an unambiguous deployment result and a safe failure
path so that I can diagnose a blocked release without replacing the currently
published site with an incomplete build.

**Why this priority**: A visible result and fail-safe behavior prevent silent
publication failures and reduce the risk of taking a working site offline.

**Independent Test**: Cause the production build to fail and confirm the
deployment is marked failed, no artifact is deployed, and the previous
published site remains available; then inspect a successful deployment's
status and source revision.

**Acceptance Scenarios**:

1. **Given** the production build fails, **When** the deployment workflow
   finishes, **Then** no deployment artifact is published and the failure is
   visible to maintainers.
2. **Given** a production deployment succeeds, **When** a maintainer inspects
   its status, **Then** the result identifies the source revision and provides
   the published site address.
3. **Given** two main-branch updates arrive close together, **When** the
   deployment system processes them, **Then** the site does not end in a state
   older than the latest successfully processed main revision.

### Edge Cases

- The build or generated documentation validation fails after a merge; the
  current published site remains intact and no failed artifact is deployed.
- The hosting platform rejects deployment permissions or the Pages environment
  is unavailable; the result is reported as failed rather than as a successful
  publication.
- A prior deployment is still running when a newer main revision is merged;
  completion of the older run must not leave the public site at an older
  revision.
- The deployment succeeds but the public site or OpenAPI documentation route
  is not reachable at its configured address; maintainers can detect the
  mismatch rather than treating artifact upload alone as proof of availability.
- A merge contains no deployable frontend changes; the deployment remains
  deterministic and does not create an inconsistent mix of application and
  documentation assets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The production site MUST be published automatically after a
  change is merged into the `main` branch.
- **FR-002**: Changes that have not been merged into `main` MUST NOT replace
  the production site.
- **FR-003**: A published release MUST contain the static frontend and its
  generated OpenAPI documentation from the same source revision.
- **FR-004**: The production build and required contract/document generation
  checks MUST succeed before a deployment artifact can be published.
- **FR-005**: When build or validation fails, the release MUST be reported as
  failed and MUST NOT replace the currently published site.
- **FR-006**: Maintainers MUST be able to identify the source revision,
  completion status, failure details when applicable, and public site address
  for each release.
- **FR-007**: If deployment runs overlap or are retried, the published site
  MUST converge to the latest successfully processed revision of `main`.
- **FR-008**: Deployment MUST use the repository's configured static-host base
  path and MUST NOT require application backend credentials or transit
  credentials.
- **FR-009**: The workflow MUST use only the permissions required to build,
  upload, and publish the static site.
- **FR-010**: The public site and the `/docs/openapi/` page MUST be directly
  reachable after a successful deployment, including under the configured
  project-site base path.

### Key Entities

- **Main-branch revision**: The reviewed source state selected for production,
  identified by its immutable revision and merge event.
- **Deployment run**: The processing record for one main-branch revision,
  including build, validation, publication outcome, and any failure details.
- **Published site**: The static application and generated documentation
  available at the configured public GitHub Pages address.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully merged, deployable revisions on `main`
  trigger an automatic production publication without a separate manual release
  step.
- **SC-002**: 100% of failed production builds result in no new production
  artifact being published.
- **SC-003**: For every successful release, the homepage and OpenAPI
  documentation page identify the same deployed revision through the release
  record and are reachable at their documented public addresses.
- **SC-004**: Maintainers can identify a deployment's status, source revision,
  and public address from its release record without searching build logs.
- **SC-005**: A newer successfully processed `main` revision is never
  overwritten by completion of an older deployment run.

## Assumptions

- GitHub Pages remains the selected static production host for this feature.
- A merge into `main` creates a push event for the resulting main-branch
  revision; unmerged pull-request changes are not production releases.
- The existing repository deployment workflow is the starting point. Planning
  will inspect it and extend or verify it rather than add a duplicate
  deployment workflow.
- The configured public project-site address remains
  `https://jorgebg90.github.io/vigo-bus-navigator/` unless the repository's
  Pages configuration changes.
- This feature only publishes the static frontend and documentation. It does
  not enable, proxy, or change municipal transit requests, and it does not
  introduce a backend or paid hosting dependency.
