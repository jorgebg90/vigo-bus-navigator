import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { BundledDiscoveryCatalog } from '../../../src/infrastructure/municipal/bundled-discovery-catalog';
import { MunicipalLineCatalogAdapter } from '../../../src/infrastructure/municipal/line-catalog-adapter';
import { MunicipalServingLinesAdapter } from '../../../src/infrastructure/municipal/serving-lines-adapter';
import { MunicipalServiceCatalogAdapter } from '../../../src/infrastructure/municipal/service-catalog-adapter';
import { MunicipalStopDetailAdapter } from '../../../src/infrastructure/municipal/stop-detail-adapter';
import { MunicipalScheduleRepository } from '../../../src/infrastructure/schedule/municipal-schedule-repository';

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

describe('municipal schedule repository', () => {
  it('preserves bundled application line IDs and labels service metadata independently', async () => {
    const discovery = await new BundledDiscoveryCatalog().getCatalog();
    const bundledLine = discovery.lines[0];
    expect(bundledLine).toBeDefined();
    const lineClient = {
      get: vi.fn(async () => [{
        linea: bundledLine?.code,
        descripcion: 'Municipal line name'
      }])
    };
    const serviceClient = {
      get: vi.fn(async () => [{
        linea: bundledLine?.code,
        descripcion: 'Municipal service description',
        tipo: 'bus',
        subtipo: 'urban'
      }])
    };
    const repository = new MunicipalScheduleRepository(
      new MunicipalLineCatalogAdapter(lineClient, clock, 'fixture'),
      new MunicipalServiceCatalogAdapter(serviceClient, clock, 'fixture'),
      new MunicipalStopDetailAdapter(lineClient, 'fixture'),
      new MunicipalServingLinesAdapter(lineClient, clock, 'fixture'),
      { getLineSchedule: vi.fn() },
      new BundledDiscoveryCatalog()
    );

    const result = await repository.getMunicipalLineCatalog('en');

    expect(result).toMatchObject({
      kind: 'success',
      value: {
        lines: [{
          id: bundledLine?.id,
          code: bundledLine?.code,
          serviceType: 'bus',
          serviceSubtype: 'urban'
        }],
        serviceMetadata: {
          kind: 'available',
          provenance: { kind: 'fixture' }
        }
      }
    });
  });

  it('uses the municipal identity for serving-line lookup and restores known app line IDs', async () => {
    const discovery = await new BundledDiscoveryCatalog().getCatalog();
    const bundledLine = discovery.lines[0];
    expect(bundledLine).toBeDefined();
    const servingLinesClient = {
      get: vi.fn(async () => [{
        linea: bundledLine?.code,
        descripcion: 'Line'
      }])
    };
    const stop: NetworkStop = {
      id: 'app-stop-90',
      code: '90',
      municipalCode: '2789',
      vitrasaId: '90',
      name: 'Synthetic stop',
      lat: 42.23,
      lon: -8.62,
      lineIds: []
    };
    const repository = new MunicipalScheduleRepository(
      new MunicipalLineCatalogAdapter(servingLinesClient, clock, 'fixture'),
      new MunicipalServiceCatalogAdapter(servingLinesClient, clock, 'fixture'),
      new MunicipalStopDetailAdapter(servingLinesClient, 'fixture'),
      new MunicipalServingLinesAdapter(servingLinesClient, clock, 'fixture'),
      { getLineSchedule: vi.fn() },
      new BundledDiscoveryCatalog()
    );

    const result = await repository.getMunicipalServingLines(stop);

    expect(servingLinesClient.get).toHaveBeenCalledWith(
      'TRANSPORTE_LINEAS_PARADA',
      { id: '2789' },
      undefined
    );
    expect(result).toMatchObject({
      kind: 'success',
      value: {
        lines: [{ id: bundledLine?.id, code: bundledLine?.code }],
        provenance: { kind: 'fixture' }
      }
    });
  });

});
