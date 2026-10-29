# Design Baseline: Deployment Status and Public-Site Verification

**Feature**: [spec.md](./spec.md)
**Phase**: G3 plan
**Audience**: Repository maintainers reviewing a production publication

## Scope

This feature does not change the visitor-facing application interface. Its
maintainer-facing experience is the GitHub Actions run and the `github-pages`
deployment environment. The public homepage and generated OpenAPI page are
existing static routes whose availability is verified after publication.

## Information Hierarchy

1. **Release identity**: source commit SHA and the `main` branch.
2. **Outcome**: overall workflow/deployment status, with a clear distinction
   between pre-deployment failure and post-deployment route-verification
   failure.
3. **Published destination**: a direct environment link to the public site URL.
4. **Route verification**: visible results for the homepage and OpenAPI page.
5. **Failure location**: the failed validation, build, deployment, or route
   check is identified by its named Actions step/job.

The workflow run and environment remain the source of truth; the run summary
should provide the release identity and site link without requiring maintainers
to search logs. Detailed diagnostics remain in the failing step.

## States and Interactions

| State | Maintainer-facing information | Expected action |
| --- | --- | --- |
| Queued/building | Run is associated with its source SHA; build and validation steps are visible | Wait for required checks |
| Pre-deployment failure | Failed check/build step and source SHA; deploy job is skipped | Inspect the failing step, correct the source, and merge a fix |
| Deploying | `github-pages` environment shows deployment in progress | Wait for the deployment result |
| Route verification failed | Deployment result and site URL are available; failed public route is named | Investigate Pages availability; do not assume automatic rollback |
| Successful | Source SHA, success status, public URL, and both route-check results are visible | Open the site or documentation link |

No separate manual release action is part of the production flow.

## Accessibility and Responsive Behavior

- The workflow introduces no application UI or custom web interface.
- Use GitHub Actions job and step names that describe their purpose; do not
  communicate success or failure by color alone.
- The public pages remain subject to the existing WCAG 2.2 AA requirements.
  This plan changes no layout, typography, interaction, or responsive behavior
  in the application or OpenAPI documentation.
- Use ordinary hyperlinks to the published URL so the destination is available
  to keyboard, screen-reader, and mobile users through the GitHub environment
  interface.

## G5 Validation Evidence

- Inspect the successful and pre-deployment-failure workflow summaries for
  source SHA, status, and URL visibility.
- Confirm each public route check is independently named and reports its own
  result.
- Confirm a route-check failure is not presented as an automatic rollback.
- Confirm the deployed homepage and OpenAPI page retain their existing
  responsive and accessible behavior; no new application UI is introduced.
