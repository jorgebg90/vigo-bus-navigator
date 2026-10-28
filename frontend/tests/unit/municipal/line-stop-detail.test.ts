import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalLineStopAdapter } from '../../../src/infrastructure/municipal/line-stop-adapter';
import { buildMunicipalRequest } from '../../../src/infrastructure/municipal/request-builder';

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

describe('municipal line-stop detail gate', () => {
  const stop: NetworkStop = {
    id: 'app-stop-90',
    code: '90',
    municipalCode: '2789',
    vitrasaId: '90',
    name: 'Synthetic stop',
    lat: 42.23,
    lon: -8.62,
    lineIds: ['A']
  };

  it('uses exact stop/line IDs and fixed min=0 in fixture evaluation with provisional provenance', async () => {
    const client = {
      get: vi.fn(async () => [{
        trip_id: 'A  02LP000_008002_4',
        shape_id: 'Route_1003',
        stop_id: '2789',
        horarios: '08:00,08:15',
        hora_programada: '08:15:00',
        sentido: 0,
        direccion: 'PEINADOR - AEROPORTO'
      }])
    };
    const adapter = new MunicipalLineStopAdapter(client, clock, 'fixture', {
      '2789:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'provisional',
        evidenceRef: 'spec.md#FR-026'
      }
    });

    await expect(adapter.getLineStopDetail(stop, 'A')).resolves.toMatchObject({
      kind: 'success',
      value: {
        municipalCode: '2789',
        lineCode: 'A',
        patterns: [{
          tripId: 'A  02LP000_008002_4',
          shapeId: 'Route_1003',
          direction: 'PEINADOR - AEROPORTO',
          departureTimes: ['08:00', '08:15']
        }],
        provenance: {
          kind: 'provisional-fixture',
          sourceName: expect.stringContaining('provisional'),
          evidenceRef: 'spec.md#FR-026'
        }
      }
    });
    expect(client.get).toHaveBeenCalledWith('TRANSPORTE_LINEA_INFO_PARADA', {
      stop_id: '2789',
      linea: 'A'
    });
  });

  it('keeps the operation unavailable without an explicit fixture assumption and in live profiles', async () => {
    const client = { get: vi.fn() };
    const fixtureAdapter = new MunicipalLineStopAdapter(client, clock, 'fixture');
    const liveAdapter = new MunicipalLineStopAdapter(client, clock, 'production', {
      '2789:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'provisional',
        evidenceRef: 'spec.md#FR-026'
      }
    });

    await expect(fixtureAdapter.getLineStopDetail(stop, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    await expect(liveAdapter.getLineStopDetail(stop, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric municipal stop ID without throwing or making a request', async () => {
    const client = { get: vi.fn() };
    const adapter = new MunicipalLineStopAdapter(client, clock, 'local-live', {
      'stop-90:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'stakeholder-attested',
        evidenceRef: 'stakeholder-postman-validation-2026-10-28'
      }
    });

    await expect(adapter.getLineStopDetail({
      ...stop,
      municipalCode: 'stop-90'
    }, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('rejects rows with a mismatched municipal stop identity', async () => {
    const adapter = new MunicipalLineStopAdapter({
      get: vi.fn(async () => [{
        trip_id: 'A trip',
        shape_id: 'Route_1003',
        stop_id: '2790',
        horarios: '08:00',
        hora_programada: '08:00:00',
        sentido: 0,
        direccion: 'A'
      }])
    }, clock, 'fixture', {
      '2789:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'provisional',
        evidenceRef: 'spec.md#FR-026'
      }
    });

    await expect(adapter.getLineStopDetail(stop, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('rejects line-stop rows whose leading trip token conflicts with the requested line', async () => {
    const adapter = new MunicipalLineStopAdapter({
      get: vi.fn(async () => [{
        trip_id: 'C  02LP000_008002_4',
        shape_id: 'Route_1003',
        stop_id: '2789',
        horarios: '08:00',
        hora_programada: '08:00:00',
        sentido: 0,
        direccion: 'A'
      }])
    }, clock, 'fixture', {
      '2789:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'provisional',
        evidenceRef: 'spec.md#FR-026'
      }
    });

    await expect(adapter.getLineStopDetail(stop, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('keeps the request-builder fixed at min=0 and does not substitute Vitrasa ID', async () => {
    const request = buildMunicipalRequest('TRANSPORTE_LINEA_INFO_PARADA', {
      stop_id: stop.municipalCode,
      linea: 'A'
    });
    expect(request.searchParams.get('stop_id')).toBe('2789');
    expect(request.searchParams.get('linea')).toBe('A');
    expect(request.searchParams.get('min')).toBe('0');
    expect(request.searchParams.get('stop_id')).not.toBe(stop.vitrasaId);
    expect(() => buildMunicipalRequest('TRANSPORTE_LINEA_INFO_PARADA', {
      stop_id: stop.municipalCode,
      linea: 'L4A',
      min: '30'
    })).toThrow('Unknown municipal parameter');
  });

  it('uses the confirmed municipal stop and line in local-live and rejects mismatched trip identity', async () => {
    const client = { get: vi.fn(async () => [{
      trip_id: 'A  02LP000_008002_4',
      shape_id: 'Route_1005',
      stop_id: '2789',
      horarios: '08:00,08:15',
      hora_programada: '08:15:00',
      sentido: 0,
      direccion: 'PEINADOR - AEROPORTO'
    }]) };
    const adapter = new MunicipalLineStopAdapter(client, clock, 'local-live', {
      '2789:A': {
        min: 0,
        expectedTripIdPrefix: 'A',
        verification: 'stakeholder-attested',
        evidenceRef: 'stakeholder-postman-validation-2026-10-28'
      }
    });

    await expect(adapter.getLineStopDetail(stop, 'A')).resolves.toMatchObject({
      kind: 'success',
      value: {
        municipalCode: '2789',
        lineCode: 'A',
        provenance: {
          kind: 'municipal',
          evidenceRef: 'stakeholder-postman-validation-2026-10-28'
        }
      }
    });
    expect(client.get).toHaveBeenCalledWith('TRANSPORTE_LINEA_INFO_PARADA', {
      stop_id: '2789',
      linea: 'A'
    });

    client.get.mockResolvedValueOnce([{
      trip_id: 'C3  02LP000_008002_4',
      shape_id: 'Route_1005',
      stop_id: '2789',
      horarios: '08:00',
      hora_programada: '08:00:00',
      sentido: 0,
      direccion: 'OTHER'
    }]);
    await expect(adapter.getLineStopDetail(stop, 'A')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });
});
