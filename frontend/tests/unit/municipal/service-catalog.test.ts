import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import {
  joinServiceMetadata,
  MunicipalServiceCatalogAdapter,
  normalizeServiceCatalog,
  serviceCatalogActionFor
} from '../../../src/infrastructure/municipal/service-catalog-adapter';
import { normalizeLineCatalog } from '../../../src/infrastructure/municipal/line-catalog-adapter';
import type { MunicipalAction } from '../../../src/infrastructure/municipal/request-builder';

const readFixture = (name: string): unknown => JSON.parse(
  readFileSync(resolve(process.cwd(), `frontend/tests/fixtures/municipal/${name}`), 'utf8')
);
const fetchedAt = '2026-10-27T12:00:00.000Z';

describe('municipal service catalog adapter', () => {
  it('maps Galician to GA and Spanish/English to ES without a locale parameter', () => {
    expect(serviceCatalogActionFor('gl')).toBe('TRANSPORTE_LINEAS_SERVICIOS_GA');
    expect(serviceCatalogActionFor('es')).toBe('TRANSPORTE_LINEAS_SERVICIOS_ES');
    expect(serviceCatalogActionFor('en')).toBe('TRANSPORTE_LINEAS_SERVICIOS_ES');
  });

  it('normalizes service metadata without manufacturing timetables', () => {
    const catalog = normalizeServiceCatalog(readFixture('services-es.json'), fetchedAt, 'fixture');

    expect(catalog).toEqual({
      lines: [{
        id: 'A',
        code: 'A',
        name: 'Synthetic service A',
        color: '#007FFF',
        serviceType: 'Synthetic',
        serviceSubtype: 'Example'
      }],
      provenance: {
        kind: 'fixture',
        sourceName: 'Synthetic municipal-contract fixture',
        fetchedAt
      }
    });
    expect(catalog.lines[0]).not.toHaveProperty('timetable');
  });

  it('joins service metadata only by exact linea while retaining the line catalog', () => {
    const lines = normalizeLineCatalog([
      { linea: 'A', descripcion: 'Line A', color: '#000000' },
      { linea: 'B', descripcion: 'Line B', color: '#FFFFFF' }
    ], fetchedAt);
    const services = normalizeServiceCatalog([
      { linea: 'B', descripcion: 'Service B', tipo: 'Urban', subtipo: 'Night' }
    ], fetchedAt);
    const joined = joinServiceMetadata(lines, services);

    expect(joined.lines).toHaveLength(2);
    expect(joined.lines[0]).toMatchObject({ code: 'A', name: 'Line A' });
    expect(joined.lines[0]).not.toHaveProperty('serviceType');
    expect(joined.lines[1]).toMatchObject({
      code: 'B',
      name: 'Line B',
      serviceType: 'Urban',
      serviceSubtype: 'Night'
    });
    expect(joined.lines[1]).not.toHaveProperty('timetable');
  });

  it('rejects duplicate service codes and malformed required fields', () => {
    expect(() => normalizeServiceCatalog([
      { linea: 'A', descripcion: 'First' },
      { linea: 'A', descripcion: 'Duplicate' }
    ], fetchedAt)).toThrow(expect.objectContaining({ reason: 'invalid' }));
    expect(() => normalizeServiceCatalog([{ linea: 'A' }], fetchedAt))
      .toThrow(expect.objectContaining({ reason: 'invalid' }));
  });

  it('requests the fixed locale action in fixture and production profiles', async () => {
    const get = vi.fn(async (_action: MunicipalAction) => readFixture('services-ga.json'));
    const clock: ClockPort = { now: () => new Date(fetchedAt), onDateChange: () => () => undefined };
    const allowed = new MunicipalServiceCatalogAdapter({ get }, clock, 'fixture');
    await expect(allowed.getCatalog('gl')).resolves.toMatchObject({
      kind: 'success',
      value: { lines: [{ code: 'A' }], provenance: { kind: 'fixture', fetchedAt } }
    });
    expect(get).toHaveBeenCalledWith('TRANSPORTE_LINEAS_SERVICIOS_GA', {}, undefined);

    const productionGet = vi.fn(async (_action: MunicipalAction) => []);
    const production = new MunicipalServiceCatalogAdapter({ get: productionGet }, clock, 'production');
    await expect(production.getCatalog('en')).resolves.toMatchObject({
      kind: 'success',
      value: { lines: [], provenance: { kind: 'municipal' } }
    });
    expect(productionGet).toHaveBeenCalledWith('TRANSPORTE_LINEAS_SERVICIOS_ES', {}, undefined);
  });
});
