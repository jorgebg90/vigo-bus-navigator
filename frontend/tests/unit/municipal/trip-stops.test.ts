import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalTripStopAdapter, type TripMapping } from '../../../src/infrastructure/municipal/trip-stop-adapter';

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

function stop(id: string, municipalCode: string, lat: number): NetworkStop {
  return {
    id,
    code: municipalCode,
    municipalCode,
    vitrasaId: municipalCode,
    name: `Stop ${id}`,
    lat,
    lon: -8.62,
    lineIds: ['A']
  };
}

const mapping: TripMapping = {
  lineCode: 'L4A',
  dayType: 'weekday',
  tripId: 'Trip 42 outbound',
  evidenceRef: 'trip-evidence',
  stopsByMunicipalCode: {
    '2789': stop('stop-90', '2789', 42.23),
    '2790': stop('stop-91', '2790', 42.21),
    '2791': stop('stop-92', '2791', 42.22)
  }
};

describe('municipal trip stop sequence', () => {
  it('keeps opaque trip IDs with interior spaces and preserves observed 1-based row order', async () => {
    const payload = [
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62, lineas: 'A' },
      { id: 2, stop_id: '2790', nombre: 'Second', orden: 2, lat: 42.21, lon: -8.62, lineas: 'A' },
      { id: 3, stop_id: '2791', nombre: 'Third', orden: 3, lat: 42.22, lon: -8.62, lineas: 'A' }
    ];
    const client = { get: vi.fn(async () => payload) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture', [mapping]);

    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: {
        tripId: 'Trip 42 outbound',
        stops: [
          { sequence: 1, stop: { id: 'stop-90', municipalCode: '2789' } },
          { sequence: 2, stop: { id: 'stop-91', municipalCode: '2790' } },
          { sequence: 3, stop: { id: 'stop-92', municipalCode: '2791' } }
        ],
        provenance: { kind: 'fixture', evidenceRef: 'trip-evidence' }
      }
    });

    expect(client.get).toHaveBeenCalledWith('TRANSPORTE_PARADAS_TRIP', { id: 'Trip 42 outbound' });
  });

  it('labels assumed trip and stop mappings provisional and rejects a conflicting line membership', async () => {
    const provisionalMapping: TripMapping = {
      ...mapping,
      lineCode: 'A',
      lineId: 'A',
      verification: 'provisional',
      evidenceRef: 'spec.md#FR-032'
    };
    const client = { get: vi.fn(async () => [
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62, lineas: 'A' },
      { id: 2, stop_id: '2790', nombre: 'Second', orden: 2, lat: 42.21, lon: -8.62, lineas: 'A' }
    ]) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture', [provisionalMapping]);

    await expect(adapter.getTripStops('A', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: {
        provenance: {
          kind: 'provisional-fixture',
          sourceName: expect.stringContaining('provisional'),
          evidenceRef: 'spec.md#FR-032'
        }
      }
    });
    await expect(adapter.getTripStops('A', 'saturday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(client.get).toHaveBeenCalledTimes(1);

    client.get.mockResolvedValueOnce([
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62, lineas: 'C3' }
    ]);
    await expect(adapter.getTripStops('A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('uses the validated trip in local-live and enforces both public and catalog line membership', async () => {
    const validatedMapping: TripMapping = {
      lineCode: 'A',
      lineId: 'line-a',
      dayType: 'weekday',
      tripId: 'A  02LP000_008002_4',
      evidenceRef: 'stakeholder-postman-validation-2026-10-28',
      stopsByMunicipalCode: {
        '2789': { ...stop('stop-90', '2789', 42.23), lineIds: ['line-a'] }
      },
      verification: 'stakeholder-attested'
    };
    const client = { get: vi.fn(async () => [
      { id: 1, stop_id: '2789', nombre: 'Airport', orden: 1, lat: 42.23, lon: -8.62, lineas: 'A' }
    ]) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'local-live', [validatedMapping]);

    await expect(adapter.getTripStops('A', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: {
        tripId: 'A  02LP000_008002_4',
        stops: [{ sequence: 1, stop: { municipalCode: '2789' } }],
        provenance: {
          kind: 'municipal',
          evidenceRef: 'stakeholder-postman-validation-2026-10-28'
        }
      }
    });

    client.get.mockResolvedValueOnce([
      { id: 1, stop_id: '2789', nombre: 'Airport', orden: 1, lat: 42.23, lon: -8.62, lineas: 'C3' }
    ]);
    await expect(adapter.getTripStops('A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('does not request trip stops until line/day/trip and stop identity mappings are verified', async () => {
    const client = { get: vi.fn() };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture');

    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('rejects duplicate or invalid sequence values and unresolved municipal stop identities', async () => {
    const duplicateSequence = [
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62, lineas: 'A' },
      { id: 2, stop_id: '2790', nombre: 'Second', orden: 1, lat: 42.21, lon: -8.62, lineas: 'A' }
    ];
    const client = { get: vi.fn(async () => duplicateSequence) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture', [mapping]);

    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });

    client.get.mockResolvedValueOnce([
      { id: 1, stop_id: '9999', nombre: 'Unknown', orden: 1, lat: 42.2, lon: -8.6, lineas: 'A' }
    ]);
    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('rejects a gapped, reordered, or incomplete observed row sequence', async () => {
    const client = { get: vi.fn(async (): Promise<unknown> => [
      { id: 2, stop_id: '2790', nombre: 'Second', orden: 2, lat: 42.21, lon: -8.62, lineas: 'A' },
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62, lineas: 'A' }
    ]) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture', [mapping]);

    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });

    client.get.mockResolvedValueOnce([
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: -8.62 }
    ]);
    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('rejects invalid and half-null source coordinates', async () => {
    const client = { get: vi.fn(async () => [
      { id: 1, stop_id: '2789', nombre: 'First', orden: 1, lat: 42.23, lon: null, lineas: 'A' }
    ]) };
    const adapter = new MunicipalTripStopAdapter(client, clock, 'fixture', [mapping]);

    await expect(adapter.getTripStops('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });
});
