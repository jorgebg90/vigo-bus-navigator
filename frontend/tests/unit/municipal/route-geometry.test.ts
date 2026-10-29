import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import { MunicipalRouteShapeAdapter, normalizeRouteGeometry } from '../../../src/infrastructure/municipal/route-shape-adapter';

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

describe('municipal route geometry', () => {
  it('requires an explicitly verified shape and CRS before requesting geometry', async () => {
    const client = { get: vi.fn() };
    const adapter = new MunicipalRouteShapeAdapter(client, clock, 'fixture');
    const unknownShape = await adapter.getRouteShape('L4A');
    const unknownCrs = new MunicipalRouteShapeAdapter(client, clock, 'fixture', {
      L4A: { shapeId: 'shape-1', crs: 'unknown', evidenceRef: 'evidence-1' }
    });

    await expect(unknownCrs.getRouteShape('L4A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(unknownShape).toEqual({ kind: 'unavailable', reason: 'mapping-unverified' });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('decodes the nested JSON string and preserves coordinate order', async () => {
    const payload = [{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23], [-8.65, 42.21], [-8.63, 42.24]]
      })
    }];
    const client = { get: vi.fn(async () => payload) };
    const adapter = new MunicipalRouteShapeAdapter(client, clock, 'fixture', {
      L4A: { shapeId: 'shape-1', crs: 'EPSG:4326', evidenceRef: 'shape-proof' }
    });

    await expect(adapter.getRouteShape('L4A')).resolves.toMatchObject({
      kind: 'success',
      value: {
        lineCode: 'L4A',
        shapeId: 'shape-1',
        geometry: {
          type: 'LineString',
          coordinates: [[-8.62, 42.23], [-8.65, 42.21], [-8.63, 42.24]]
        },
        provenance: { kind: 'fixture', evidenceRef: 'shape-proof' }
      }
    });
    expect(client.get).toHaveBeenCalledWith('TRANSPORTE_LINEA_GEOJSON', { id: 'shape-1' });
  });

  it('labels assumed OGC:CRS84 as provisional and returns it in the normalized model', async () => {
    const payload = [{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23], [-8.65, 42.21]]
      })
    }];
    const client = { get: vi.fn(async () => payload) };
    const adapter = new MunicipalRouteShapeAdapter(client, clock, 'fixture', {
      A: {
        shapeId: 'Route_1005',
        crs: 'OGC:CRS84',
        evidenceRef: 'spec.md#FR-025',
        verification: 'provisional'
      }
    });

    await expect(adapter.getRouteShape('A')).resolves.toMatchObject({
      kind: 'success',
      value: {
        lineCode: 'A',
        shapeId: 'Route_1005',
        crs: 'OGC:CRS84',
        provenance: {
          kind: 'provisional-fixture',
          sourceName: expect.stringContaining('provisional'),
          evidenceRef: 'spec.md#FR-025'
        }
      }
    });
  });

  it('uses the confirmed shape and CRS for the local live profile', async () => {
    const payload = [{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23], [-8.65, 42.21]]
      })
    }];
    const client = { get: vi.fn(async () => payload) };
    const adapter = new MunicipalRouteShapeAdapter(client, clock, 'local-live', {
      A: {
        shapeId: 'Route_1005',
        crs: 'OGC:CRS84',
        evidenceRef: 'stakeholder-postman-validation-2026-10-28',
        verification: 'stakeholder-attested'
      }
    });

    await expect(adapter.getRouteShape('A')).resolves.toMatchObject({
      kind: 'success',
      value: {
        shapeId: 'Route_1005',
        crs: 'OGC:CRS84',
        provenance: {
          kind: 'municipal',
          evidenceRef: 'stakeholder-postman-validation-2026-10-28'
        }
      }
    });
    expect(client.get).toHaveBeenCalledWith('TRANSPORTE_LINEA_GEOJSON', { id: 'Route_1005' });
  });

  it('rejects invalid envelopes, nested JSON, and malformed coordinate tails', () => {
    expect(normalizeRouteGeometry({ st_asgeojson: '{}' })).toBeUndefined();
    expect(normalizeRouteGeometry([{ st_asgeojson: '{invalid' }])).toBeUndefined();
    expect(normalizeRouteGeometry([{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23], [-8.63, 42.24], ['invalid', 42.2]]
      })
    }])).toBeUndefined();
  });

  it('accepts only the observed LineString keys and valid two-dimensional coordinates', () => {
    expect(normalizeRouteGeometry([{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23], [-8.63, 42.24]],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
      })
    }])).toBeUndefined();
    expect(normalizeRouteGeometry([{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[-8.62, 42.23, 0], [-8.63, 42.24]]
      })
    }])).toBeUndefined();
    expect(normalizeRouteGeometry([{
      st_asgeojson: JSON.stringify({
        type: 'LineString',
        coordinates: [[181, 42.23], [-8.63, 42.24]]
      })
    }])).toBeUndefined();
  });

  it('does not use Vigo-like coordinate bounds as evidence of CRS', async () => {
    const globalCoordinates = [[-73.98, 40.75], [-73.97, 40.76]];
    expect(normalizeRouteGeometry([{
      st_asgeojson: JSON.stringify({ type: 'LineString', coordinates: globalCoordinates })
    }])).toEqual({ type: 'LineString', coordinates: globalCoordinates });

    const client = { get: vi.fn() };
    const adapter = new MunicipalRouteShapeAdapter(client, clock, 'production', {
      L4A: { shapeId: 'shape-1', crs: 'unknown', evidenceRef: 'shape-proof' }
    });
    await expect(adapter.getRouteShape('L4A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(client.get).not.toHaveBeenCalled();
  });
});
