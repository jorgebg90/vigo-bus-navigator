import { describe, expect, it } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop } from '../../../src/domain/types';
import { MunicipalArrivalsAdapter } from '../../../src/infrastructure/municipal/arrivals-adapter';
import { createDefaultFixtureMunicipalClient } from '../../../src/infrastructure/municipal/default-fixture-client';

const stop: NetworkStop = {
  id: 'app-stop-1234',
  code: 'display-1234',
  municipalCode: '2789',
  vitrasaId: '1234',
  name: 'Synthetic stop',
  lat: 42.23,
  lon: -8.62,
  lineIds: []
};

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

describe('default fixture municipal client', () => {
  it('uses the normal arrival adapter and marks the result as synthetic fixture data', async () => {
    const adapter = new MunicipalArrivalsAdapter(createDefaultFixtureMunicipalClient(), clock, 'fixture');
    const result = await adapter.getArrivals(stop);

    expect(result).toMatchObject({
      kind: 'success',
      value: {
        stopId: stop.id,
        vitrasaId: stop.vitrasaId,
        arrivals: [{ lineCode: 'A', destination: 'Synthetic Destination', minutes: 5 }],
        provenance: {
          kind: 'fixture',
          sourceName: 'Synthetic municipal-contract fixture',
          fetchedAt: clock.now().toISOString()
        }
      }
    });
  });
});
