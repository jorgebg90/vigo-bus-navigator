import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalServingLinesAdapter } from '../../../src/infrastructure/municipal/serving-lines-adapter';
import { MunicipalStopDetailAdapter } from '../../../src/infrastructure/municipal/stop-detail-adapter';
import type { MunicipalAction } from '../../../src/infrastructure/municipal/request-builder';

const readFixture = (name: string): unknown => JSON.parse(
  readFileSync(resolve(process.cwd(), `frontend/tests/fixtures/municipal/${name}`), 'utf8')
);
const fetchedAt = '2026-10-27T12:00:00.000Z';
const clock: ClockPort = { now: () => new Date(fetchedAt), onDateChange: () => () => undefined };
const identity = {
  id: 'app-stop-90',
  code: 'airport-display',
  vitrasaId: '90',
  lineIds: ['line-A']
};
const stop: NetworkStop = {
  ...identity,
  municipalCode: '2789',
  name: 'Airport',
  lat: 42.23,
  lon: -8.62
};

describe('municipal stop and serving-lines adapters', () => {
  it('keeps application, Vitrasa, and municipal IDs distinct', async () => {
    const adapter = new MunicipalStopDetailAdapter({
      get: async () => readFixture('stop-detail.json')
    }, 'fixture');

    await expect(adapter.getStop(identity)).resolves.toMatchObject({
      kind: 'success',
      value: {
        id: 'app-stop-90',
        code: 'airport-display',
        vitrasaId: '90',
        municipalCode: '2789',
        name: 'Synthetic Stop'
      }
    });
  });

  it('rejects zero, multiple, and mismatched stop detail records', async () => {
    for (const payload of [
      [],
      [
        { id: 90, stop_id: '2789', nombre: 'Airport', lat: 42.23, lon: -8.62 },
        { id: 90, stop_id: '2789', nombre: 'Duplicate', lat: 42.23, lon: -8.62 }
      ],
      [{ id: 91, stop_id: '2789', nombre: 'Other stop', lat: 42.23, lon: -8.62 }]
    ]) {
      const adapter = new MunicipalStopDetailAdapter({ get: async () => payload }, 'fixture');
      await expect(adapter.getStop(identity)).resolves.toMatchObject({
        kind: 'unavailable',
        reason: 'identity-unverified'
      });
    }
  });

  it('accepts absent coordinates only as an atomic nullable pair', async () => {
    const absentPair = new MunicipalStopDetailAdapter({
      get: async () => [{ id: 90, stop_id: '2789', nombre: 'Airport' }]
    }, 'fixture');
    await expect(absentPair.getStop(identity)).resolves.toMatchObject({
      kind: 'success',
      value: { lat: null, lon: null }
    });

    const partialPair = new MunicipalStopDetailAdapter({
      get: async () => [{ id: 90, stop_id: '2789', nombre: 'Airport', lat: 42.23 }]
    }, 'fixture');
    await expect(partialPair.getStop(identity)).resolves.toMatchObject({
      kind: 'unavailable',
      reason: 'invalid'
    });
  });

  it('queries serving lines with municipalCode, never Vitrasa ID or display code', async () => {
    const get = vi.fn(async (_action: MunicipalAction, _parameters: Readonly<Record<string, unknown>>) => (
      readFixture('serving-lines.json')
    ));
    const adapter = new MunicipalServingLinesAdapter({ get }, clock, 'fixture');

    await expect(adapter.getServingLines(stop)).resolves.toMatchObject({
      kind: 'success',
      value: {
        municipalCode: '2789',
        lines: [{
          id: 'A',
          code: 'A',
          name: 'Synthetic line A',
          color: '#007FFF'
        }],
        provenance: { kind: 'fixture', fetchedAt }
      }
    });
    expect(get).toHaveBeenCalledWith('TRANSPORTE_LINEAS_PARADA', { id: '2789' }, undefined);
  });

  it('returns an empty serving-lines list only for a valid array response', async () => {
    const adapter = new MunicipalServingLinesAdapter({ get: async () => [] }, clock, 'fixture');
    await expect(adapter.getServingLines(stop)).resolves.toMatchObject({
      kind: 'success',
      value: { municipalCode: '2789', lines: [] }
    });
  });
});
