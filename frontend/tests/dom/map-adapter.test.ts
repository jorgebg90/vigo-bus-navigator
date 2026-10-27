import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(import.meta.dirname, '../../src/infrastructure/map/map-port.ts'), 'utf8');

describe('BrowserMapPort', () => {
  it('uses the native clustered GeoJSON source and agreed clustering limits', () => {
    expect(source).toMatch(/cluster:\s*true/);
    expect(source).toMatch(/clusterRadius:\s*50/);
    expect(source).toMatch(/CLUSTER_MAX_ZOOM\s*=\s*16/);
    expect(source).toMatch(/clusterMaxZoom:\s*CLUSTER_MAX_ZOOM/);
    expect(source).toContain("type: 'geojson'");
  });

  it('emits only stop IDs, opens a chooser for coincident stops, and avoids DOM marker controls', () => {
    expect(source).toMatch(/onStopSelected/);
    expect(source).toMatch(/onChooserRequested/);
    expect(source).toMatch(/getClusterExpansionZoom/);
    expect(source).toMatch(/getClusterLeaves/);
    expect(source).toMatch(/stopId/);
    expect(source).not.toContain('@deck.gl');
    expect(source).not.toContain('PathLayer');
    expect(source).not.toContain('showStopDetails');
    expect(source).not.toMatch(/createElement\(['"]button['"]\).*map-stop-marker/);
  });

  it('uses a 44px feature query and jumps instantly for reduced motion', () => {
    expect(source).toMatch(/queryRenderedFeatures/);
    expect(source).toMatch(/22/);
    expect(source).toMatch(/jumpTo/);
    expect(source).toMatch(/prefers-reduced-motion/);
  });
});
