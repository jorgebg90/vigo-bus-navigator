import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalArrivalsAdapter } from '../../../src/infrastructure/municipal/arrivals-adapter';

const stop: NetworkStop = {
  id: 'application-stop-90',
  code: 'display-90',
  municipalCode: '2789',
  vitrasaId: '90',
  name: 'Synthetic stop',
  lat: 42.23,
  lon: -8.62,
  lineIds: []
};
const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

describe('municipal arrivals identity boundary', () => {
  it('uses the Vitrasa ID for the request and preserves the application stop ID in the receipt', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        parada: [{ stop_vitrasa: 90, nombre: 'Synthetic stop' }],
        estimaciones: []
      })
    };
    const adapter = new MunicipalArrivalsAdapter(client, clock, 'fixture');
    const result = await adapter.getArrivals(stop);

    expect(client.get).toHaveBeenCalledWith('TRANSPORTE-ESTIMACION-PARADA', { id: '90' });
    expect(client.get).not.toHaveBeenCalledWith(expect.anything(), { id: '2789' }, expect.anything());
    expect(client.get).not.toHaveBeenCalledWith(expect.anything(), { id: 'display-90' }, expect.anything());
    expect(result).toMatchObject({
      kind: 'success',
      value: {
        stopId: 'application-stop-90',
        vitrasaId: '90',
        fetchedAt: '2026-10-27T12:00:00.000Z',
        provenance: { fetchedAt: '2026-10-27T12:00:00.000Z' }
      }
    });
  });

  it('does not request arrivals when no verified Vitrasa ID exists', async () => {
    const client = { get: vi.fn() };
    const adapter = new MunicipalArrivalsAdapter(client, clock, 'fixture');
    const result = await adapter.getArrivals({ ...stop, vitrasaId: null });

    expect(client.get).not.toHaveBeenCalled();
    expect(result).toEqual({ kind: 'unavailable', reason: 'identity-unverified' });
  });

  it('requests local-live arrivals using only the verified Vitrasa identifier', async () => {
    const client = {
      get: vi.fn(async () => ({
        parada: [{ stop_vitrasa: 90 }],
        estimaciones: []
      }))
    };
    const adapter = new MunicipalArrivalsAdapter(client, clock, 'local-live');
    await expect(adapter.getArrivals(stop)).resolves.toMatchObject({
      kind: 'success',
      value: { arrivals: [] }
    });
    expect(client.get).toHaveBeenCalledWith(
      'TRANSPORTE-ESTIMACION-PARADA',
      { id: '90' }
    );
  });
});
