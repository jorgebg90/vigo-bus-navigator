import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const forbidden = ['Vigo', 'Bus', 'API'].join('');
const correction = /superseding correction/i;
const historicalAllowlist = [
  'specs/002-realtime-bus-api/spec.md',
  'specs/002-realtime-bus-api/plan.md',
  'specs/002-realtime-bus-api/research.md',
  'specs/002-realtime-bus-api/blog-draft-specify-plan.md',
  'specs/002-realtime-bus-api/contracts/realtime-arrivals.openapi.yaml',
  'specs/002-realtime-bus-api/quickstart.md',
  'specs/002-realtime-bus-api/tasks.md',
  'specs/002-realtime-bus-api/checklists/requirements.md'
];

function files(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return files(child);
    return /\.(ts|md|yaml|yml|json)$/.test(entry.name) ? [child] : [];
  });
}

describe('current provenance cleanup', () => {
  it('removes old source references from current code, notices, docs, contracts, and tests', () => {
    const currentPaths = [
      resolve(root, 'worker/src'), resolve(root, 'frontend/src'),
      resolve(root, 'worker/test'), resolve(root, 'worker/unit'),
      resolve(root, 'frontend/tests'), resolve(root, 'scripts'),
      resolve(root, 'NOTICE'), resolve(root, 'README.md'),
      resolve(root, 'docs/quality.md'), resolve(root, 'docs/harness-charter.md'),
      resolve(root, 'specs/003-improve-frontend-design/contracts')
    ];
    const matches = currentPaths.flatMap((path) => {
      const candidates = existsSync(path) && !statSync(path).isDirectory() ? [path] : files(path);
      return candidates.filter((file) => readFileSync(file, 'utf8').includes(forbidden)).map((file) => relative(root, file));
    });
    expect(matches).toEqual([]);
  });

  it('allows only historical feature-002 artifacts and requires a superseding correction in each', () => {
    for (const path of historicalAllowlist) {
      const absolute = resolve(root, path);
      if (!existsSync(absolute)) continue;
      const contents = readFileSync(absolute, 'utf8');
      expect(contents, path).toContain(forbidden);
      expect(contents, path).toMatch(correction);
      expect(contents, path).toMatch(/alternative sources|not adopted/i);
    }
  });
});
