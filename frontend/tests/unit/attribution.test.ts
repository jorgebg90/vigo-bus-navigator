import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../..');

describe('project license and service status', () => {
  it('retains the Apache-2.0 license text for this project', () => {
    const license = readFileSync(resolve(root, 'LICENSE'), 'utf8');
    expect(license).toContain('Apache License');
    expect(license).toContain('Version 2.0');
  });

  it('states that the community project is not an official transport service', () => {
    const notice = readFileSync(resolve(root, 'NOTICE'), 'utf8');
    expect(notice).toContain('not an official service');
  });
});
