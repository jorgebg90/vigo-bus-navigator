# Quickstart: Repository Cleanup and Normalization

**Date**: 2026-10-28
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js 22 and npm, matching the CI runtime.
- A clean checkout of the `007-repository-cleanup` branch.
- No municipal credentials, live transit source, or deployment access is needed
  for the standard verification workflow.

## Verify the Maintained Repository

From the repository root:

```bash
npm ci
git ls-files
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run lint:openapi
npm run validate:municipal-api-contract
npm run build
npm run validate:production-artifact
npm run size
npm run snapshot:generate
npm run test:e2e
```

Install the browsers required by Playwright when running the end-to-end suite
for the first time:

```bash
npx playwright install chromium webkit
npm run test:e2e
```

The pre-cleanup command set and results are recorded in
[`inventory.md`](./inventory.md) as historical baseline evidence. Worker-only
contract/load commands were removed after their supported municipal contract
checks were retained in the frontend and CI workflows.

## Required Cleanup Scenarios

1. **Artifact classification**: inspect tracked files, dependencies, scripts,
   workflows, generated data, and documentation; every in-scope artifact has a
   purpose and lifecycle status or is recorded as unresolved.
2. **Candidate removal**: for each deletion or dependency removal, verify
   imports and dynamic references, package/workspace configuration, tests,
   CI/deployment, scripts and generated outputs, documentation links, and
   governance/history references.
3. **Retired runtime verification**: confirm no maintained package, CI,
   deployment, application, or generation workflow references the removed
   Worker workspace; retain historical specifications and migration evidence.
4. **History preservation**: verify completed specifications, accepted
   decisions, license/attribution notices, and material gate evidence remain
   accessible; validate links affected by any consolidation.
5. **Contributor workflow**: from a clean checkout, follow the canonical setup,
   development, test, and build instructions and verify every referenced
   command and path exists.
6. **Behavior and production artifact**: run the full relevant suite and
   production artifact checks; verify the static frontend build remains the
   only production deployment output and application behavior has not changed.

## Expected Outcomes

- All required validation commands pass, or any unrelated pre-existing failure
  is explicitly documented with evidence.
- The application build, public contracts, privacy boundaries, and deployment
  remain unchanged.
- Removed or consolidated artifacts have evidence-based rationales and no
  unintended broken references.
- Historical specs and unique decisions remain available and clearly
  distinguished from current guidance.
- Unresolved candidates remain in the repository and are listed for maintainer
  review rather than being deleted speculatively.

## Optional External Checks

`npm run smoke:municipal-live` is an explicit live-source check and is not part
of routine cleanup validation. It must not be run as a substitute for
deterministic fixtures or without the required explicit environment and network
conditions.
