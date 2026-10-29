import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeArrivalPayload } from '../../../src/infrastructure/municipal/arrivals-normalizer';

const syntheticArrival = JSON.parse(readFileSync(
  resolve(process.cwd(), 'frontend/tests/fixtures/municipal/arrivals.json'),
  'utf8'
)) as unknown;

describe('municipal arrival normalizer', () => {
  it('requires the requested stop identity and maps source estimate fields', () => {
    expect(normalizeArrivalPayload(syntheticArrival, '90')).toEqual([
      { lineCode: 'A', destination: 'Synthetic Destination', minutes: 5 }
    ]);
  });

  it('accepts a valid empty estimate array only with the identity envelope', () => {
    expect(normalizeArrivalPayload({
      parada: [{ stop_vitrasa: 90, nombre: 'Synthetic Stop' }],
      estimaciones: []
    }, '90')).toEqual([]);
    expect(() => normalizeArrivalPayload({ estimaciones: [] }, '90'))
      .toThrow(expect.objectContaining({ reason: 'invalid' }));
  });

  it('rejects a mismatched stop echo rather than returning valid-empty data', () => {
    expect(() => normalizeArrivalPayload({
      parada: [{ stop_vitrasa: 91, nombre: 'Other Stop' }],
      estimaciones: []
    }, '90')).toThrow(expect.objectContaining({ reason: 'identity-unverified' }));
  });

  it('rejects malformed rows and sorts valid estimates stably by nonnegative minutes', () => {
    const result = normalizeArrivalPayload({
      parada: [{ stop_vitrasa: 90, nombre: 'Synthetic Stop' }],
      estimaciones: [
        { linea: 'B', ruta: 'Second', minutos: 8 },
        { linea: 'A', ruta: 'First', minutos: 3 },
        { linea: 'C', ruta: 'Tie', minutos: 3 }
      ]
    }, '90');
    expect(result.map(({ lineCode }) => lineCode)).toEqual(['A', 'C', 'B']);
    expect(() => normalizeArrivalPayload({
      parada: [{ stop_vitrasa: 90, nombre: 'Synthetic Stop' }],
      estimaciones: [{ linea: 'A', ruta: 'Broken', minutos: -1 }]
    }, '90')).toThrow(expect.objectContaining({ reason: 'invalid' }));
  });
});
