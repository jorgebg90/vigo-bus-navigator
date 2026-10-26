import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');

describe('VigoBusAPI provenance (FR-016/FR-017)', () => {
  it('ships a NOTICE file based on the code of VigoBusAPI with Apache-2.0 and copyright', () => {
    const noticePath = resolve(root, 'NOTICE');
    expect(existsSync(noticePath)).toBe(true);
    const notice = readFileSync(noticePath, 'utf8');
    expect(notice).toContain('based on the code of VigoBusAPI');
    expect(notice).toContain('https://github.com/David-Lor/VigoBusAPI');
    expect(notice).toContain('Copyright 2021-2023 David Lorenzo');
    expect(notice).toContain('Apache License, Version 2.0');
    expect(notice).toContain('not endorsed by');
  });

  it('carries the attribution header in ported worker modules', () => {
    const normalize = readFileSync(resolve(root, 'worker/src/normalize.ts'), 'utf8');
    expect(normalize).toContain('based on the code of VigoBusAPI');
    expect(normalize).toContain('Copyright 2021-2023 David Lorenzo');
    expect(normalize).toContain('Apache License 2.0');
  });

  it('documents provenance and the non-affiliation disclaimer in the README', () => {
    const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
    expect(readme).toContain('github.com/David-Lor/VigoBusAPI');
    expect(readme).toContain('Apache-2.0');
  });

  it('retains the Apache-2.0 license text in LICENSE', () => {
    const license = readFileSync(resolve(root, 'LICENSE'), 'utf8');
    expect(license).toContain('Apache License');
    expect(license).toContain('Version 2.0');
  });
});
