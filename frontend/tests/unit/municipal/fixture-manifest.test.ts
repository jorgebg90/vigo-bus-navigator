import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const fixturesDirectory = resolve(process.cwd(), 'frontend/tests/fixtures/municipal');
const actions = [
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE_PARADAS',
  'TRANSPORTE-ESTIMACION-PARADA',
  'TRANSPORTE_LINEA_HORARIOS_EXTEND',
  'TRANSPORTE_LINEA_GEOJSON',
  'TRANSPORTE_PARADAS_TRIP',
  'TRANSPORTE_LINEA_INFO_PARADA'
];

interface FixtureManifestEntry {
  action: string;
  classification: string;
  file: string;
  encoding: string;
  sha256: string;
  evidence: string;
}

describe('municipal fixture manifest', () => {
  it('covers every allowlisted action as synthetic data with matching byte hashes', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(fixturesDirectory, 'manifest.json'), 'utf8')
    ) as { fixtures: FixtureManifestEntry[] };

    expect(manifest.fixtures.map(({ action }) => action).sort()).toEqual([...actions].sort());

    for (const fixture of manifest.fixtures) {
      expect(fixture.classification).toBe('synthetic');
      expect(fixture.evidence).toBe('Synthetic contract-shaped example; not provider evidence.');
      expect(fixture.file).not.toContain('..');
      expect(fixture.encoding).toBe('UTF-8');

      const bytes = readFileSync(resolve(fixturesDirectory, fixture.file));
      const hash = createHash('sha256').update(bytes).digest('hex');
      expect(hash).toBe(fixture.sha256);
      expect(() => JSON.parse(bytes.toString('utf8'))).not.toThrow();
    }
  });
});
