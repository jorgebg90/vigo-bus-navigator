import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProductionArtifact } from '../../../../scripts/validate-production-artifact';

const temporaryDirectories: string[] = [];

function createArtifact(script: string): string {
  const root = mkdtempSync(join(tmpdir(), 'vigo-production-artifact-'));
  temporaryDirectories.push(root);
  mkdirSync(join(root, 'assets'));
  writeFileSync(join(root, 'index.html'), '<html><script src="/assets/app.js"></script></html>');
  writeFileSync(join(root, 'assets', 'app.js'), script);
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('production artifact guard', () => {
  it('accepts a fixed municipal endpoint and credential-free supported action bundle', () => {
    const root = createArtifact(
      'const endpoint="https://datos.vigo.org/vci_api_app/api2.jsp"; fetch(endpoint,{credentials:"omit"});'
    );

    expect(() => validateProductionArtifact(root)).not.toThrow();
  });

  it.each([
    ['legacy Worker URL', 'fetch("https://vigo-bus-proxy.workers.dev/api/v4")'],
    ['credentialed fetch', 'fetch(endpoint,{credentials:"include"})'],
    ['same-origin credentials', 'fetch(endpoint,{credentials:"same-origin"})']
  ])('rejects %s', (_description, script) => {
    const root = createArtifact(
      `const endpoint="https://datos.vigo.org/vci_api_app/api2.jsp";${script}`
    );

    expect(() => validateProductionArtifact(root)).toThrow();
  });

  it('rejects missing build output', () => {
    const root = mkdtempSync(join(tmpdir(), 'vigo-empty-artifact-'));
    temporaryDirectories.push(root);
    expect(() => validateProductionArtifact(root)).toThrow(/No production assets found/);
  });
});
