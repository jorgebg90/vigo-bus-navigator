import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(import.meta.dirname, '../../src/ui/styles.css'), 'utf8');
const pairings: Array<[string, string, number]> = [
  ['text', 'canvas', 4.5],
  ['text', 'surface-soft', 4.5],
  ['text-secondary', 'surface-soft', 4.5],
  ['text-secondary', 'canvas', 4.5],
  ['accent', 'surface-soft', 4.5],
  ['on-accent', 'accent', 4.5],
  ['border', 'canvas', 3],
  ['border', 'surface-soft', 3],
  ['focus', 'canvas', 3],
  ['focus', 'surface-soft', 3],
  ['status-current-fg', 'status-current-bg', 4.5],
  ['status-stale-fg', 'status-stale-bg', 4.5],
  ['status-error-fg', 'status-error-bg', 4.5],
  ['status-offline-fg', 'status-offline-bg', 4.5],
  ['disabled-fg', 'disabled-bg', 4.5],
  ['map-stop', 'map-halo', 3],
  ['map-selection-ring', 'map-halo', 3]
];

function themeTokens(): Map<string, string> {
  const block = css.match(/:root\s*\{([^}]*)\}/);
  const tokens = new Map<string, string>();
  for (const match of block?.[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g) ?? []) tokens.set(match[1], match[2]);
  return tokens;
}

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('design token contrast', () => {
  it('meets every named pairing in light theme', () => {
    const tokens = themeTokens();
    for (const [foreground, background, minimum] of pairings) {
      const foregroundColor = tokens.get(foreground);
      const backgroundColor = tokens.get(background);
      expect(foregroundColor, `--${foreground}`).toBeTruthy();
      expect(backgroundColor, `--${background}`).toBeTruthy();
      expect(contrast(foregroundColor!, backgroundColor!), `--${foreground} on --${background}`).toBeGreaterThanOrEqual(minimum);
    }
  });
});
