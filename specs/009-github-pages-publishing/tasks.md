# Tasks: GitHub Pages Publishing

**Input**: Design documents from
`specs/009-github-pages-publishing/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/pages-deployment.md`, and `quickstart.md`

**Tests**: Focused workflow-contract tests are included because the plan
explicitly requires them. Existing build and contract checks remain part of the
deployment workflow.

**Organization**: Tasks are grouped by user story so publication and
maintainer-facing failure/status behavior can be implemented and validated as
incremental outcomes.

## Phase 1: Setup

**Purpose**: No repository initialization is needed; the Node.js project,
Vitest setup, GitHub Actions workflow, and Pages artifact flow already exist.

## Phase 2: Foundational

**Purpose**: No additional shared infrastructure blocks the stories. Reuse the
current deployment workflow, existing npm validation commands, and Vitest.

---

## Phase 3: User Story 1 - Publish approved changes automatically (Priority: P1) 🎯 MVP

**Goal**: A push to `main` builds and validates the frontend and generated
OpenAPI page from one revision, then publishes them together to the configured
GitHub Pages project path.

**Independent Test**: Verify the workflow contract restricts publication to
`main`, runs the OpenAPI and production artifact checks before upload, waits
for the artifact job before deployment, and preserves the configured base path.
After a successful main-branch run, verify the homepage and OpenAPI route serve
the same build.

### Tests for User Story 1

- [X] T001 [P] [US1] Add workflow-contract tests for the `main`-only push trigger, production profile and `/vigo-bus-navigator/` base path, pre-upload OpenAPI/contract/build/artifact validation order, and Pages artifact path in `scripts/deploy-workflow.test.ts`

### Implementation for User Story 1

- [X] T002 [US1] After T001, update the `frontend` job to run `npm run lint:openapi` and `npm run validate:feature004-contract` before `npm run build`, then run `npm run validate:production-artifact` before uploading `dist` in `.github/workflows/deploy.yml`
- [X] T003 [US1] After T002, make the `deploy-pages` job depend on the artifact-producing `frontend` job and preserve its `github-pages` environment in `.github/workflows/deploy.yml` (existing dependency retained and covered by tests)

**Checkpoint**: A successful `main` run cannot deploy until its static app and
generated OpenAPI artifact pass the existing contract and production checks.

---

## Phase 4: User Story 2 - Identify deployment outcome and recover safely (Priority: P2)

**Goal**: Failed builds cannot publish; deployments are serialized; maintainers
can identify the deployed revision, URL, and reachability of both public routes.

**Independent Test**: Cause one required pre-deployment check to fail and
confirm artifact upload and deployment are skipped. Inspect the workflow
contract for one Pages concurrency group with `cancel-in-progress: false`,
minimum job permissions, the deployment URL output and source SHA summary, and
bounded checks of the homepage and OpenAPI routes after deployment.

### Tests for User Story 2

- [X] T004 [US2] After T001, extend the workflow-contract coverage to assert that failed frontend validation/build prevents artifact upload and deployment, the Pages concurrency group does not cancel an active deployment, build/deploy permissions are scoped, and the deployment URL and source SHA are surfaced in `scripts/deploy-workflow.test.ts`
- [X] T005 [P] [US2] Add focused tests for successful and failing homepage/OpenAPI route checks, bounded retries, and clear route-specific failure output in `scripts/pages-smoke-check.test.ts`

### Implementation for User Story 2

- [X] T006 [P] [US2] After T004-T005, add a workflow-level Pages concurrency group with `cancel-in-progress: false`, grant `contents: read` to jobs that check out source, and grant the deployment job only the additional `pages: write` and `id-token: write` permissions in `.github/workflows/deploy.yml`
- [X] T007 [P] [US2] After T005, implement the reusable bounded HTTP route check with injectable fetch, per-route diagnostics, and explicit failure in `scripts/pages-smoke-check.ts`
- [X] T008 [US2] After T006, give the `actions/deploy-pages@v4` step the `deployment` ID and set the `github-pages` environment URL from `steps.deployment.outputs.page_url` in `.github/workflows/deploy.yml`
- [X] T009 [US2] After T007-T008, add a post-deployment step that writes the triggering commit SHA and deployed URL to the Actions run summary and invokes the bounded homepage and `/docs/openapi/` checks in `.github/workflows/deploy.yml`

**Checkpoint**: Maintainers can distinguish a failed pre-deployment build from
a failed post-deployment availability check, and can trace each deployment to
its source revision and public URL.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete publication flow and keep the contributor
guide aligned with implementation.

- [X] T010 [P] Update the workflow validation commands, expected route results, and live deployment checklist to match the implemented workflow in `specs/009-github-pages-publishing/quickstart.md`
- [X] T011 Run `npm test -- scripts/deploy-workflow.test.ts scripts/pages-smoke-check.test.ts scripts/generate-openapi-docs-failures.test.ts` and fix failures in `scripts/deploy-workflow.test.ts`, `scripts/pages-smoke-check.test.ts`, and `scripts/generate-openapi-docs-failures.test.ts`
- [X] T012 Run `npm run lint:openapi`, `npm run validate:feature004-contract`, `VITE_PROFILE=production VITE_MUNICIPAL_PROFILE=production VITE_BASE_PATH=/vigo-bus-navigator/ npm run build`, and `npm run validate:production-artifact`; verify `dist/index.html` and `dist/docs/openapi/index.html` using `scripts/validate-production-artifact.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No tasks; project and workflow infrastructure already
  exist.
- **Foundational (Phase 2)**: No tasks; existing scripts and test runner are
  sufficient.
- **User Story 1 (Phase 3)**: Starts immediately; the `main`-only Pages
  workflow is already present.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it hardens and
  adds status/verification behavior to the same deployment workflow.
- **Polish (Phase 5)**: Depends on both stories.

### User Story Dependencies

- **User Story 1 (P1)**: No user-story dependencies. Delivers a validated,
  artifact-ordered publication flow as the MVP; the existing `needs: frontend`
  dependency is retained.
- **User Story 2 (P2)**: Depends on User Story 1's artifact and deployment
  sequence; adds serialization, least-privilege permissions, release metadata,
  and public-route verification.

### Within Each User Story

- Add the workflow contract tests before changing workflow behavior.
- Keep all build, OpenAPI, and production-artifact checks before artifact
  upload.
- Keep the Pages deployment job dependent on the artifact-producing job.
- Add the post-deployment route check only after the deployment step exposes
  its site URL.

### Parallel Opportunities

- **User Story 1**: T001 can be written independently before workflow changes;
  T002 and T003 edit the same workflow and should be done sequentially.
- **User Story 2**: T005 (smoke-check unit tests) is independent of T004
  (workflow-contract test updates), but both should be complete before their
  implementations. After T004-T005, T006 (workflow concurrency/permissions)
  and T007 (route-check script) touch separate files and can proceed in
  parallel. T008-T009 update the workflow and should follow T006; T009 also
  requires T007.
- **Polish**: T010 can proceed independently after the workflow contract is
  stable; T011 and T012 run after implementation.

### Parallel Example: User Story 2

```text
# After T001-T003 and T004, these tests can be authored independently:
Task: T004 - Extend workflow contract coverage in scripts/deploy-workflow.test.ts
Task: T005 - Test route verification in scripts/pages-smoke-check.test.ts

# After T005, the route checker and workflow hardening can progress separately:
Task: T006 - Add concurrency and scoped permissions in .github/workflows/deploy.yml
Task: T007 - Implement route checks in scripts/pages-smoke-check.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add the contract tests in T001.
2. Add pre-upload validation and explicit artifact-to-deployment ordering in
   T002-T003.
3. Run the focused contract test and verify the configured base-path build.
4. Stop and validate that a successful main-branch release publishes the
   homepage and OpenAPI documentation from the same artifact.

### Incremental Delivery

1. Complete User Story 1 and validate the safe, automatic publication path.
2. Add User Story 2's failure handling, concurrency, scoped permissions,
   revision/URL visibility, and public-route checks.
3. Run the focused workflow and smoke-check tests, then the documented
   production validation commands.
4. Confirm the live deployment environment and public URLs after merge to
   `main`.

## Notes

- `[P]` tasks operate on separate files and have no dependency on incomplete
  tasks.
- `[US1]` and `[US2]` map to the stories in `spec.md`.
- The existing workflow already has the production trigger; do not add a
  duplicate Pages workflow.
- A post-deployment HTTP failure is an availability-verification failure, not
  an automatic rollback; the Pages deployment may already be live.
