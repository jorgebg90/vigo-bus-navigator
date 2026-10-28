import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = resolve(__dirname, '../../src');
const forbidden = /from\s+['"](?:[^'"]*\/)?(?:infrastructure|ui)(?:\/[^'"]*)?['"]|from\s+['"](?:maplibre-gl|@deck\.gl\/[^'"]+)['"]|\bdocument\.|\bwindow\./;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
  });
}

describe('hexagonal boundaries', () => {
  it.each(['application', 'domain'])('%s does not depend on adapters, map libraries, or the DOM', (layer) => {
    for (const file of files(join(src, layer))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(forbidden);
    }
  });

  it('has the planned application and domain modules', () => {
    expect(existsSync(join(src, 'application/select-stop.ts'))).toBe(true);
    expect(existsSync(join(src, 'domain/map-stops.ts'))).toBe(true);
  });
});
