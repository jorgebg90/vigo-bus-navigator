import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDocument } from 'yaml';

type WorkflowStep = {
  uses?: string;
  run?: string;
  if?: string;
  env?: Record<string, string>;
  with?: Record<string, string>;
};

type WorkflowJob = {
  needs?: string | string[];
  permissions?: Record<string, string>;
  steps?: WorkflowStep[];
};

type DeployWorkflow = {
  on?: {
    push?: {
      branches?: string[];
    };
  };
  concurrency?: {
    group?: string;
    'cancel-in-progress'?: boolean;
  };
  permissions?: Record<string, string>;
  jobs?: Record<string, WorkflowJob>;
};

const workflow = parseDocument(
  readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8')
).toJS() as DeployWorkflow;

describe('GitHub Pages deployment workflow', () => {
  it('only publishes changes pushed to main', () => {
    expect(workflow.on?.push?.branches).toEqual(['main']);
  });

  it('builds and validates the production artifact before uploading it', () => {
    const frontend = workflow.jobs?.frontend;
    const steps = frontend?.steps ?? [];
    const buildStep = steps.find((step) => step.run === 'npm run build');
    const validationCommands = [
      'npm run lint:openapi',
      'npm run validate:feature004-contract',
      'npm run validate:production-artifact'
    ];
    const validationIndexes = validationCommands.map((command) =>
      steps.findIndex((step) => step.run === command)
    );
    const buildIndex = steps.indexOf(buildStep as WorkflowStep);
    const uploadIndex = steps.findIndex((step) => step.uses === 'actions/upload-pages-artifact@v3');

    expect(validationIndexes.every((index) => index >= 0)).toBe(true);
    expect(validationIndexes[0]).toBeLessThan(buildIndex);
    expect(validationIndexes[1]).toBeLessThan(buildIndex);
    expect(buildIndex).toBeLessThan(validationIndexes[2]);
    expect(validationIndexes[2]).toBeLessThan(uploadIndex);
    expect(steps[uploadIndex]?.with?.path).toBe('dist');
    expect(buildStep?.env).toMatchObject({
      VITE_PROFILE: 'production',
      VITE_MUNICIPAL_PROFILE: 'production',
      VITE_BASE_PATH: '/vigo-bus-navigator/'
    });
  });

  it('deploys only after the frontend artifact job succeeds', () => {
    expect(workflow.jobs?.['deploy-pages']?.needs).toBe('frontend');
  });

  it('serializes releases and grants only the required workflow permissions', () => {
    expect(workflow.concurrency?.group).toBe('github-pages');
    expect(workflow.concurrency?.['cancel-in-progress']).toBe(false);
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.jobs?.['deploy-pages']?.permissions).toEqual({
      contents: 'read',
      pages: 'write',
      'id-token': 'write'
    });
  });

  it('exposes the deployed URL and verifies both public routes', () => {
    const deployJob = workflow.jobs?.['deploy-pages'];
    const steps = deployJob?.steps ?? [];
    const deploymentStep = steps.find((step) => step.uses === 'actions/deploy-pages@v4');
    const workflowText = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');

    expect(deploymentStep).toBeDefined();
    expect(workflowText).toContain('url: ${{ steps.deployment.outputs.page_url }}');
    expect(workflowText).toContain('GITHUB_SHA');
    expect(workflowText).toContain('GITHUB_STEP_SUMMARY');
    expect(workflowText).toContain("steps.deployment.outcome || 'not-run'");
    expect(workflowText).toContain("steps.verify-pages.outcome || 'not-run'");
    expect(steps.some((step) => step.run?.includes('pages-smoke-check.ts'))).toBe(true);
  });

  it('does not bypass default success conditions for artifact upload or deployment', () => {
    const frontendSteps = workflow.jobs?.frontend?.steps ?? [];
    const uploadStep = frontendSteps.find((step) => step.uses === 'actions/upload-pages-artifact@v3');
    const frontendSummary = frontendSteps.find((step) => step.run?.includes('GITHUB_STEP_SUMMARY'));
    const deploySteps = workflow.jobs?.['deploy-pages']?.steps ?? [];
    const deploymentStep = deploySteps.find((step) => step.uses === 'actions/deploy-pages@v4');

    expect(uploadStep).toBeDefined();
    expect(frontendSummary?.if).toBe('always()');
    expect(frontendSteps.indexOf(frontendSummary as WorkflowStep))
      .toBeGreaterThan(frontendSteps.indexOf(uploadStep as WorkflowStep));
    expect(deploymentStep).toBeDefined();
    expect(uploadStep).not.toHaveProperty('if');
    expect(deploymentStep).not.toHaveProperty('if');
  });
});
