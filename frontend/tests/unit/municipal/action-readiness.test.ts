import { describe, expect, it, vi } from 'vitest';
import { MUNICIPAL_ACTIONS } from '../../../src/infrastructure/municipal/request-builder';
import { isMunicipalActionEnabled } from '../../../src/infrastructure/municipal/action-readiness';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';

describe('municipal action readiness', () => {
  it('enables all actions for deterministic fixtures', () => {
    expect(MUNICIPAL_ACTIONS.every((action) => isMunicipalActionEnabled(action, 'fixture'))).toBe(true);
  });

  it('allows the eight general JSP actions in local-live and production', () => {
    const allowed = MUNICIPAL_ACTIONS.filter((action) => isMunicipalActionEnabled(action, 'local-live'));
    expect(allowed).toEqual([
      'TRANSPORTE_LINEAS_ES',
      'TRANSPORTE_LINEAS_GA',
      'TRANSPORTE_LINEAS_SERVICIOS_ES',
      'TRANSPORTE_LINEAS_SERVICIOS_GA',
      'TRANSPORTE_PARADA_ID',
      'TRANSPORTE_LINEAS_PARADA',
      'TRANSPORTE_PARADAS',
      'TRANSPORTE-ESTIMACION-PARADA'
    ]);
    expect(MUNICIPAL_ACTIONS.filter((action) => isMunicipalActionEnabled(action, 'production'))).toEqual(allowed);
  });

  it.each(['local-live', 'production'] as const)(
    'allows online catalog actions for any line, shape and trip identifier in %s',
    (profile) => {
      for (const [action, parameters] of [
        ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'A', dia: '1' }],
        ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: '4C', dia: '6' }],
        ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'PSA 1', dia: '0' }],
        ['TRANSPORTE_LINEA_GEOJSON', { id: 'Route_664' }],
        ['TRANSPORTE_PARADAS_TRIP', { id: 'L4 02LP101_004002_6' }]
      ] as const) {
        expect(isMunicipalActionEnabled(action, profile, parameters)).toBe(true);
      }
    }
  );

  it.each(['local-live', 'production'] as const)(
    'keeps line-stop detail restricted to the exact validated mapping in %s',
    (profile) => {
      expect(isMunicipalActionEnabled('TRANSPORTE_LINEA_INFO_PARADA', profile, {
        stop_id: '2789',
        linea: 'A'
      })).toBe(true);
      expect(isMunicipalActionEnabled('TRANSPORTE_LINEA_INFO_PARADA', profile, {
        stop_id: '2790',
        linea: 'A'
      })).toBe(false);
    }
  );

  it('rejects invalid online catalog parameters at the HTTP boundary before network access', async () => {
    const body = JSON.stringify([{
      st_asgeojson: JSON.stringify({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })
    }]);
    const fetcher = vi.fn<typeof fetch>(async () => new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    }));
    const client = new MunicipalHttpClient('local-live', fetcher);

    await client.get('TRANSPORTE_LINEA_GEOJSON', { id: 'Route_664' });
    expect(() => client.get('TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'A', dia: '2' })).toThrow('Invalid dia');
    expect(() => client.get('TRANSPORTE_LINEA_GEOJSON', { id: '' })).toThrow('Invalid id');
    expect(() => client.get('TRANSPORTE_PARADAS_TRIP', { id: 'trip', extra: '1' })).toThrow('Unknown municipal parameter');

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(new URL(fetcher.mock.calls[0]?.[0] as string).searchParams.get('id')).toBe('Route_664');
  });

  it('keeps parameterized actions disabled in production without parameters', () => {
    expect(MUNICIPAL_ACTIONS.filter((action) => !isMunicipalActionEnabled(action, 'production'))).toEqual([
      'TRANSPORTE_LINEA_HORARIOS_EXTEND',
      'TRANSPORTE_LINEA_GEOJSON',
      'TRANSPORTE_PARADAS_TRIP',
      'TRANSPORTE_LINEA_INFO_PARADA'
    ]);
  });
});
