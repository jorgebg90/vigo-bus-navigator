import { describe, expect, it } from 'vitest';
import { buildMunicipalRequest, MUNICIPAL_ACTIONS } from '../../../src/infrastructure/municipal/request-builder';

describe('municipal request builder', () => {
  it('exposes exactly the twelve contract actions', () => {
    expect(MUNICIPAL_ACTIONS).toEqual([
      'TRANSPORTE_LINEAS_ES',
      'TRANSPORTE_LINEAS_GA',
      'TRANSPORTE_LINEAS_SERVICIOS_ES',
      'TRANSPORTE_LINEAS_SERVICIOS_GA',
      'TRANSPORTE_PARADA_ID',
      'TRANSPORTE_LINEAS_PARADA',
      'TRANSPORTE_PARADAS',
      'TRANSPORTE-ESTIMACION-PARADA',
      'TRANSPORTE_LINEA_HORARIOS_EXTEND',
      'TRANSPORTE_LINEA_GEOJSON',
      'TRANSPORTE_PARADAS_TRIP',
      'TRANSPORTE_LINEA_INFO_PARADA'
    ]);
  });

  it.each([
    ['TRANSPORTE_LINEAS_ES', {}],
    ['TRANSPORTE_LINEAS_GA', {}],
    ['TRANSPORTE_LINEAS_SERVICIOS_ES', {}],
    ['TRANSPORTE_LINEAS_SERVICIOS_GA', {}],
    ['TRANSPORTE_PARADA_ID', { id: '90' }],
    ['TRANSPORTE_LINEAS_PARADA', { id: '2789' }],
    ['TRANSPORTE-ESTIMACION-PARADA', { id: '90' }],
    ['TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'schedule A', dia: '1' }],
    ['TRANSPORTE_LINEA_GEOJSON', { id: 'shape/1005' }],
    ['TRANSPORTE_PARADAS_TRIP', { id: 'trip A' }],
    ['TRANSPORTE_LINEA_INFO_PARADA', { stop_id: '2789', linea: 'A' }]
  ] as const)('builds the exact allowlisted query for %s', (action, params) => {
    const url = buildMunicipalRequest(action, params);

    expect(url.origin).toBe('https://datos.vigo.org');
    expect(url.pathname).toBe('/vci_api_app/api2.jsp');
    expect(url.searchParams.get('tipo')).toBe(action);
    expect([...url.searchParams.keys()].sort()).toEqual(
      ['tipo', ...Object.keys(params), ...(action === 'TRANSPORTE-ESTIMACION-PARADA' ? ['ttl'] : []),
        ...(action === 'TRANSPORTE_LINEA_INFO_PARADA' ? ['min'] : [])].sort()
    );
    if (action === 'TRANSPORTE-ESTIMACION-PARADA') expect(url.searchParams.get('ttl')).toBe('5');
    if (action === 'TRANSPORTE_LINEA_INFO_PARADA') expect(url.searchParams.get('min')).toBe('0');
  });

  it('encodes opaque IDs while preserving their interior spaces', () => {
    const url = buildMunicipalRequest('TRANSPORTE_PARADAS_TRIP', { id: 'trip  A/1' });
    expect(url.searchParams.get('id')).toBe('trip  A/1');
  });

  it.each(['0', '1', '6'])('accepts APK-defined timetable day code %s', (dia) => {
    const url = buildMunicipalRequest('TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'A', dia });
    expect(url.searchParams.get('dia')).toBe(dia);
  });

  it('rejects unknown actions, missing values, and unlisted keys', () => {
    expect(() => buildMunicipalRequest('TRANSPORTE_UNKNOWN', {})).toThrow(/action/i);
    expect(() => buildMunicipalRequest('TRANSPORTE_PARADA_ID', {})).toThrow(/id/i);
    expect(() => buildMunicipalRequest('TRANSPORTE_LINEAS_ES', { locale: 'en' })).toThrow(/parameter/i);
    expect(() => buildMunicipalRequest('TRANSPORTE-ESTIMACION-PARADA', { id: '90', ttl: 3 })).toThrow(/parameter/i);
  });

  it('rejects malformed or wrong-namespace identifiers and day codes', () => {
    expect(() => buildMunicipalRequest('TRANSPORTE_PARADA_ID', { id: 'stop-90' })).toThrow(/id/i);
    expect(() => buildMunicipalRequest('TRANSPORTE_LINEAS_PARADA', { id: '90 1' })).toThrow(/id/i);
    for (const dia of ['2', '3', '4']) {
      expect(() => buildMunicipalRequest('TRANSPORTE_LINEA_HORARIOS_EXTEND', { id: 'A', dia })).toThrow(/dia/i);
    }
    expect(() => buildMunicipalRequest('TRANSPORTE_LINEA_INFO_PARADA', { stop_id: '2789', linea: 'A', min: 4 })).toThrow(/parameter/i);
  });
});
