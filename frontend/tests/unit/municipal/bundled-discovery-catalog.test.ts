import { describe, expect, it } from 'vitest';
import { BundledDiscoveryCatalog, normalizeBundledCatalog } from '../../../src/infrastructure/municipal/bundled-discovery-catalog';

describe('bundled discovery catalog', () => {
  it('labels the packaged catalog as a dated, non-exhaustive discovery seed', async () => {
    const repository = new BundledDiscoveryCatalog();
    const first = await repository.getCatalog();

    expect(first.completeness).toBe('bundled-seed');
    expect(first.provenance).toMatchObject({
      kind: 'bundled-catalog',
      sourceName: 'Vigo open-data and GTFS bundled discovery catalog',
      evidenceRef: 'vigo-open-data-2026-10-26',
      snapshotDate: '2026-10-26',
      dateKind: 'capture'
    });
    expect(first.lines.length).toBeGreaterThan(0);
    expect(first.stops.length).toBeGreaterThan(0);

    first.stops.pop();
    const second = await repository.getCatalog();
    expect(second.stops.length).toBe(first.stops.length + 1);
  });

  it('rejects invalid metadata, duplicate identities, broken memberships, and partial coordinates', () => {
    const data = {
      datasetVersion: 'seed-v1',
      generatedAt: '2026-10-26T19:08:04.197Z',
      lines: [{ id: 'line-1', code: '1', name: 'Line 1', color: null }],
      stops: [{
        id: 'stop-1',
        code: '90',
        municipalCode: '2789',
        vitrasaId: '90',
        name: 'Synthetic stop',
        lat: 42.23,
        lon: null,
        lineIds: ['line-1']
      }]
    };

    expect(() => normalizeBundledCatalog(data)).toThrow(/atomic pair/);
    expect(() => normalizeBundledCatalog({
      ...data,
      stops: [{ ...data.stops[0], lat: null, lon: null, lineIds: ['unknown-line'] }]
    })).toThrow(/line membership/);
    expect(() => normalizeBundledCatalog({
      ...data,
      lines: [data.lines[0], data.lines[0]]
    })).toThrow(/duplicate line IDs/);
  });
});
