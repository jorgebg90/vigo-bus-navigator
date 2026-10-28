import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import { BundledDiscoveryCatalog } from '../../../src/infrastructure/municipal/bundled-discovery-catalog';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';
import { toLineId } from '../../../src/infrastructure/municipal/line-id';
import { MunicipalLineCatalogAdapter } from '../../../src/infrastructure/municipal/line-catalog-adapter';
import { MunicipalLineScheduleAdapter } from '../../../src/infrastructure/municipal/line-schedule-adapter';
import { normalizeOnlineStopCatalog, OnlineStopCatalog } from '../../../src/infrastructure/municipal/online-stop-catalog';
import { MunicipalRouteShapeAdapter } from '../../../src/infrastructure/municipal/route-shape-adapter';
import { MunicipalServiceCatalogAdapter } from '../../../src/infrastructure/municipal/service-catalog-adapter';
import { MunicipalServingLinesAdapter } from '../../../src/infrastructure/municipal/serving-lines-adapter';
import { MunicipalStopDetailAdapter } from '../../../src/infrastructure/municipal/stop-detail-adapter';
import { MunicipalTripStopAdapter } from '../../../src/infrastructure/municipal/trip-stop-adapter';
import { BundledScheduleSnapshotCatalog } from '../../../src/infrastructure/schedule/bundled-schedule-snapshot';
import { MunicipalScheduleRepository } from '../../../src/infrastructure/schedule/municipal-schedule-repository';

const clock: ClockPort = {
  now: () => new Date('2026-10-28T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

const onlineStops = [
  { lineas: 'C1, 4C', stop_id: '3493', lon: -8.732835177, id: 6930, nombre: 'Praza de América  1', lat: 42.220997313 },
  { lineas: '4C, PSA 1', stop_id: '3366', lon: -8.708786105, id: 5750, nombre: 'Avda. do Alcalde Gregorio Espino  79', lat: 42.225785485 },
  { lineas: '4C', stop_id: '3746', lon: -8.752027594, id: 14123, nombre: 'Rúa do Porriño  9', lat: 42.214127819 }
];

const scheduleRows = [
  {
    trip_id: 'L2802LP103_028002_2', shape_id: 'Route_663', dir: 0, direccion: 'GREGORIO ESPINO por URZÁIZ',
    inicio_s: 'Rúa do Porriño  9', fin_s: 'Avda. do Alcalde Gregorio Espino  79', horarios: '07:00, 07:30', activo: 1
  },
  {
    trip_id: 'L4 02LP101_004002_6', shape_id: 'Route_664', dir: 1, direccion: 'COIA por CAMELIAS',
    inicio_s: 'Avda. do Alcalde Gregorio Espino  79', fin_s: 'Rúa do Porriño  9', horarios: '08:15, 08:47, 09:30', activo: 1
  },
  {
    trip_id: 'L2802LP103_028002_3', shape_id: 'Route_665', dir: 1, direccion: 'COIA por CAMELIAS',
    inicio_s: 'Avda. do Alcalde Gregorio Espino  79', fin_s: 'Rúa do Porriño (fronte 9)', horarios: '07:40', activo: 0
  }
];

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

describe('online municipal catalog', () => {
  it('derives stable app line IDs compatible with saved favorites', () => {
    expect(toLineId('A')).toBe('line-a');
    expect(toLineId('C3d')).toBe('line-c3d');
    expect(toLineId('PSA 1')).toBe('line-psa1');
    expect(toLineId('LZD.PSA')).toBe('line-lzd-psa');
  });

  it('normalizes TRANSPORTE_PARADAS into the stop discovery catalog with municipal provenance', () => {
    const catalog = normalizeOnlineStopCatalog(onlineStops, '2026-10-28T12:00:00.000Z');

    expect(catalog.completeness).toBe('municipal-online');
    expect(catalog.provenance).toEqual({
      kind: 'municipal',
      sourceName: 'Vigo municipal transit JSP',
      fetchedAt: '2026-10-28T12:00:00.000Z'
    });
    expect(catalog.stops[0]).toEqual({
      id: 'stop-3493',
      code: '6930',
      municipalCode: '3493',
      vitrasaId: '6930',
      name: 'Praza de América  1',
      lat: 42.220997313,
      lon: -8.732835177,
      lineIds: ['line-c1', 'line-4c']
    });
    expect(catalog.lines.map((line) => [line.code, line.id])).toEqual([
      ['C1', 'line-c1'],
      ['4C', 'line-4c'],
      ['PSA 1', 'line-psa1']
    ]);
  });

  it.each([
    ['an empty catalog', []],
    ['a stop outside Vigo', [{ ...onlineStops[0], lat: 40 }]],
    ['a non-numeric stop ID', [{ ...onlineStops[0], stop_id: 'x' }]],
    ['duplicate stops', [onlineStops[0], onlineStops[0]]]
  ])('rejects %s', (_label, payload) => {
    expect(() => normalizeOnlineStopCatalog(payload, '2026-10-28T12:00:00.000Z')).toThrow();
  });

  it('uses the public line code as schedule ID for every line and keeps all rows like the official app', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse(scheduleRows));
    const adapter = new MunicipalLineScheduleAdapter(
      new MunicipalHttpClient('production', fetcher),
      clock,
      'production',
      {},
      { evidenceRef: 'official-app-online-catalog' }
    );

    const result = await adapter.getLineSchedule('4C', 'saturday');

    expect(result).toMatchObject({
      kind: 'success',
      value: {
        lineCode: '4C',
        scheduleId: '4C',
        departures: ['07:00', '07:30', '07:40', '08:15', '08:47', '09:30'],
        provenance: { kind: 'municipal', evidenceRef: 'official-app-online-catalog' }
      }
    });
    expect(result.kind === 'success' && result.value.trips?.map((trip) => [trip.tripId, trip.direction, trip.active]))
      .toEqual([
        ['L2802LP103_028002_2', 0, true],
        ['L4 02LP101_004002_6', 1, true],
        ['L2802LP103_028002_3', 1, false]
      ]);
    const url = new URL(fetcher.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('id')).toBe('4C');
    expect(url.searchParams.get('dia')).toBe('6');
  });

  it('treats an empty online schedule as a day without service', async () => {
    const adapter = new MunicipalLineScheduleAdapter(
      new MunicipalHttpClient('production', vi.fn<typeof fetch>(async () => jsonResponse([]))),
      clock,
      'production',
      {},
      { evidenceRef: 'official-app-online-catalog' }
    );

    await expect(adapter.getLineSchedule('N4', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: { lineCode: 'N4', departures: [], trips: [] }
    });
  });

  it('never enables the all-line schedule policy in the fixture profile', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = new MunicipalLineScheduleAdapter(
      new MunicipalHttpClient('fixture', fetcher),
      clock,
      'fixture',
      {},
      { evidenceRef: 'official-app-online-catalog' }
    );

    await expect(adapter.getLineSchedule('4C', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('builds online route summaries from one representative trip per direction, including circular trips', async () => {
    const tripStops = {
      'L2802LP103_028002_2': [onlineStops[2], onlineStops[0], onlineStops[1]],
      'L4 02LP101_004002_6': [onlineStops[1], onlineStops[0], onlineStops[2], onlineStops[1]]
    } as Record<string, typeof onlineStops>;
    const client = {
      get: vi.fn(async (action: string, parameters: Readonly<Record<string, unknown>> = {}) => {
        if (action === 'TRANSPORTE_PARADAS') return onlineStops;
        if (action === 'TRANSPORTE_LINEA_HORARIOS_EXTEND') return scheduleRows;
        if (action === 'TRANSPORTE_PARADAS_TRIP') {
          return (tripStops[parameters['id'] as string] ?? []).map((stop, index) => ({ ...stop, orden: index + 1 }));
        }
        if (action === 'TRANSPORTE_LINEA_GEOJSON') {
          return [{ st_asgeojson: JSON.stringify({ type: 'LineString', coordinates: [[-8.75, 42.21], [-8.70, 42.22]] }) }];
        }
        throw new Error(`Unexpected action ${action}`);
      })
    };
    const httpClient = client as unknown as MunicipalHttpClient;
    const repository = new MunicipalScheduleRepository(
      new MunicipalLineCatalogAdapter(httpClient, clock, 'production'),
      new MunicipalServiceCatalogAdapter(httpClient, clock, 'production'),
      new MunicipalStopDetailAdapter(httpClient, 'production'),
      new MunicipalServingLinesAdapter(httpClient, clock, 'production'),
      new MunicipalLineScheduleAdapter(httpClient, clock, 'production', {}, { evidenceRef: 'official-app' }),
      new BundledDiscoveryCatalog(),
      new MunicipalRouteShapeAdapter(httpClient, clock, 'production'),
      new MunicipalTripStopAdapter(httpClient, clock, 'production'),
      undefined,
      new BundledScheduleSnapshotCatalog([]),
      { stopCatalog: new OnlineStopCatalog(httpClient, clock), evidenceRef: 'official-app' }
    );

    const discovery = await repository.getStopDiscoveryCatalog();
    expect(discovery.completeness).toBe('municipal-online');
    await expect(repository.getRoutePatterns('line-4c')).resolves.toEqual([]);

    const schedule = await repository.getPublishedLineSchedule('4C', 'weekday');
    expect(schedule.kind).toBe('success');
    if (schedule.kind !== 'success') return;
    const route = await repository.getOnlineLineRoute(schedule.value);

    expect(route.patterns.map((pattern) => [pattern.id, pattern.headsign, pattern.stopIds])).toEqual([
      ['L2802LP103_028002_2', 'GREGORIO ESPINO por URZÁIZ', ['stop-3746', 'stop-3493', 'stop-3366']],
      ['L4 02LP101_004002_6', 'COIA por CAMELIAS', ['stop-3366', 'stop-3493', 'stop-3746', 'stop-3366']]
    ]);
    expect(route.patterns[1]?.stops.map((stop) => stop.id)).toEqual(['stop-3366', 'stop-3493', 'stop-3746']);
    expect(route.routeShape).toMatchObject({ lineCode: '4C', shapeId: 'Route_663' });
    expect(route.provenance).toMatchObject({ kind: 'municipal', evidenceRef: 'official-app' });
    expect(client.get).not.toHaveBeenCalledWith('TRANSPORTE_PARADAS_TRIP', { id: 'L2802LP103_028002_3' });
  });

  it('falls back to the bundled discovery catalog when the online stop catalog is unavailable', async () => {
    const client = { get: vi.fn(async () => { throw new Error('offline'); }) } as unknown as MunicipalHttpClient;
    const repository = new MunicipalScheduleRepository(
      new MunicipalLineCatalogAdapter(client, clock, 'production'),
      new MunicipalServiceCatalogAdapter(client, clock, 'production'),
      new MunicipalStopDetailAdapter(client, 'production'),
      new MunicipalServingLinesAdapter(client, clock, 'production'),
      { getLineSchedule: vi.fn() },
      new BundledDiscoveryCatalog(),
      undefined,
      undefined,
      undefined,
      new BundledScheduleSnapshotCatalog([]),
      { stopCatalog: new OnlineStopCatalog(client, clock), evidenceRef: 'official-app' }
    );

    await expect(repository.getStopDiscoveryCatalog()).resolves.toMatchObject({
      completeness: 'bundled-seed',
      provenance: { kind: 'bundled-catalog' }
    });
  });
});
