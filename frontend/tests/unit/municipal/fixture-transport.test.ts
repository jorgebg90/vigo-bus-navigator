import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';
import { MunicipalFixtureTransport } from '../../../src/infrastructure/municipal/fixture-transport';
import { MunicipalArrivalsAdapter } from '../../../src/infrastructure/municipal/arrivals-adapter';
import { createDefaultFixtureMunicipalClient } from '../../../src/infrastructure/municipal/default-fixture-client';
import { MUNICIPAL_ACTIONS, type MunicipalAction } from '../../../src/infrastructure/municipal/request-builder';
import type { NetworkStop } from '../../../src/domain/types';

describe('municipal synthetic fixture transport', () => {
  it('requires an injected fixture transport for the fixture profile', () => {
    expect(() => new MunicipalHttpClient('fixture')).toThrow(
      'Fixture municipal clients require an injected fixture transport'
    );
  });

  it('uses the same bounded decode pipeline as the browser HTTP client without network access', async () => {
    const bytes = new TextEncoder().encode('[{"linea":"A","descripcion":"Synthetic"}]');
    const transport = new MunicipalFixtureTransport({
      TRANSPORTE_LINEAS_ES: bytes
    });
    const client = new MunicipalHttpClient('fixture', transport.fetcher);

    await expect(client.get('TRANSPORTE_LINEAS_ES')).resolves.toEqual([
      { linea: 'A', descripcion: 'Synthetic' }
    ]);
  });

  it('fails explicitly when an action has no synthetic fixture', async () => {
    const transport = new MunicipalFixtureTransport({});
    const client = new MunicipalHttpClient('fixture', transport.fetcher);
    await expect(client.get('TRANSPORTE_LINEAS_ES')).rejects.toMatchObject({
      reason: 'invalid'
    });
  });

  it('provides a synthetic response for every contract action without network access', async () => {
    const parameters: Partial<Record<MunicipalAction, Readonly<Record<string, string>>>> = {
      TRANSPORTE_PARADA_ID: { id: '2789' },
      TRANSPORTE_LINEAS_PARADA: { id: '2789' },
      'TRANSPORTE-ESTIMACION-PARADA': { id: '2789' },
      TRANSPORTE_LINEA_HORARIOS_EXTEND: { id: 'L4A', dia: '1' },
      TRANSPORTE_LINEA_GEOJSON: { id: 'L4A' },
      TRANSPORTE_PARADAS_TRIP: { id: 'trip-1' },
      TRANSPORTE_LINEA_INFO_PARADA: { stop_id: '2789', linea: 'L4A' }
    };

    const responses = await Promise.all(
      MUNICIPAL_ACTIONS.map((action) => (
        createDefaultFixtureMunicipalClient().get(action, parameters[action])
      ))
    );

    expect(responses).toHaveLength(MUNICIPAL_ACTIONS.length);
    expect(responses.every((response) => response !== null)).toBe(true);
  });

  it('passes fixture bytes through decoding, payload validation, and arrival normalization', async () => {
    const bytes = readFileSync(resolve(process.cwd(), 'frontend/tests/fixtures/municipal/arrivals.json'));
    const transport = new MunicipalFixtureTransport({
      'TRANSPORTE-ESTIMACION-PARADA': new Uint8Array(bytes)
    });
    const client = new MunicipalHttpClient('fixture', transport.fetcher);
    const clock = {
      now: () => new Date('2026-10-27T12:00:00.000Z'),
      onDateChange: () => () => undefined
    };
    const stop: NetworkStop = {
      id: 'app-stop-90',
      code: 'display-90',
      municipalCode: '2789',
      vitrasaId: '90',
      name: 'Synthetic stop',
      lat: 42.23,
      lon: -8.62,
      lineIds: []
    };
    const adapter = new MunicipalArrivalsAdapter(client, clock, 'fixture');

    await expect(adapter.getArrivals(stop)).resolves.toMatchObject({
      kind: 'success',
      value: {
        stopId: 'app-stop-90',
        arrivals: [{ lineCode: 'A', destination: 'Synthetic Destination', minutes: 5 }],
        provenance: { kind: 'fixture', sourceName: 'Synthetic municipal-contract fixture' }
      }
    });
  });
});
