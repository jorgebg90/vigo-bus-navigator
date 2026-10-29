import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import type { NetworkStop, PublishedLineSchedule, PublishedTrip, RouteShapeReceipt } from '../../../src/domain/types';
import type { MunicipalRouteShapeAdapter } from '../../../src/infrastructure/municipal/route-shape-adapter';
import type { MunicipalTripStopAdapter } from '../../../src/infrastructure/municipal/trip-stop-adapter';
import type { OnlineStopCatalog } from '../../../src/infrastructure/municipal/online-stop-catalog';
import { BundledDiscoveryCatalog } from '../../../src/infrastructure/municipal/bundled-discovery-catalog';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';
import { MunicipalLineCatalogAdapter } from '../../../src/infrastructure/municipal/line-catalog-adapter';
import { MunicipalServingLinesAdapter } from '../../../src/infrastructure/municipal/serving-lines-adapter';
import { MunicipalServiceCatalogAdapter } from '../../../src/infrastructure/municipal/service-catalog-adapter';
import { MunicipalStopDetailAdapter } from '../../../src/infrastructure/municipal/stop-detail-adapter';
import { MunicipalScheduleRepository } from '../../../src/infrastructure/schedule/municipal-schedule-repository';

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

function createPublishedSchedule(
  trips: Array<Omit<PublishedTrip, 'origin' | 'destination'>>
): PublishedLineSchedule {
  const publishedTrips: PublishedTrip[] = trips.map((trip) => ({
    ...trip,
    origin: null,
    destination: null
  }));
  return {
    lineCode: '4C',
    dayType: 'weekday',
    scheduleId: '4C',
    departures: publishedTrips.flatMap((trip) => trip.departures),
    trips: publishedTrips,
    provenance: { kind: 'municipal', sourceName: 'test' }
  };
}

function createOnlineRouteRepository(
  routeShape: Pick<MunicipalRouteShapeAdapter, 'getRouteShapeById'>
): MunicipalScheduleRepository {
  const client = new MunicipalHttpClient('production', vi.fn<typeof fetch>(async () => new Response('[]')));
  const discovery = {
    lines: [],
    stops: [],
    patternsByLine: {},
    completeness: 'municipal-online' as const,
    provenance: { kind: 'municipal' as const, sourceName: 'test' }
  };
  const tripStops = {
    getTripStopsById: vi.fn(async () => ({ kind: 'unavailable' as const, reason: 'invalid' as const }))
  };
  return new MunicipalScheduleRepository(
    new MunicipalLineCatalogAdapter(client, clock, 'production'),
    new MunicipalServiceCatalogAdapter(client, clock, 'production'),
    new MunicipalStopDetailAdapter(client, 'production'),
    new MunicipalServingLinesAdapter(client, clock, 'production'),
    { getLineSchedule: vi.fn() },
    new BundledDiscoveryCatalog(),
    routeShape as unknown as MunicipalRouteShapeAdapter,
    tripStops as unknown as MunicipalTripStopAdapter,
    undefined,
    undefined,
    {
      stopCatalog: { getCatalog: vi.fn(async () => discovery) } as unknown as OnlineStopCatalog,
      evidenceRef: 'test'
    }
  );
}

describe('municipal schedule repository', () => {
  it('loads one representative shape per direction and deduplicates shared shapes', async () => {
    const shapeIds: string[] = [];
    const geometry = (shapeId: string): RouteShapeReceipt => ({
      lineCode: '4C',
      shapeId,
      crs: 'OGC:CRS84',
      geometry: { type: 'LineString', coordinates: [[-8.72, 42.24], [-8.7, 42.25]] },
      provenance: { kind: 'municipal', sourceName: 'test' }
    });

    const shapeAdapter = {
      getRouteShapeById: vi.fn(async (lineCode: string, shapeId: string) => {
        shapeIds.push(shapeId);
        return { kind: 'success' as const, value: geometry(shapeId) };
      })
    };
    const repository = createOnlineRouteRepository(shapeAdapter);
    const route = await repository.getOnlineLineRoute(createPublishedSchedule([
      { tripId: 'trip-0-primary', shapeId: 'shape-out', direction: 0, headsign: 'Outbound', active: true, departures: ['07:00', '08:00'] },
      { tripId: 'trip-0-secondary', shapeId: 'shape-unused', direction: 0, headsign: 'Outbound', active: false, departures: ['09:00'] },
      { tripId: 'trip-1-primary', shapeId: 'shape-back', direction: 1, headsign: 'Inbound', active: true, departures: ['07:30'] }
    ]));

    expect(shapeIds).toEqual(['shape-out', 'shape-back']);
    expect(route.directionalRoutes?.map(({ direction, headsign, shapeId }) => [direction, headsign, shapeId]))
      .toEqual([[0, 'Outbound', 'shape-out'], [1, 'Inbound', 'shape-back']]);

    shapeIds.length = 0;
    const sharedRoute = await createOnlineRouteRepository({
      getRouteShapeById: vi.fn(async (_lineCode: string, shapeId: string) => {
        shapeIds.push(shapeId);
        return { kind: 'success' as const, value: geometry(shapeId) };
      })
    }).getOnlineLineRoute(createPublishedSchedule([
      { tripId: 'trip-shared-0', shapeId: 'shape-shared', direction: 0, headsign: 'Outbound', active: true, departures: ['07:00'] },
      { tripId: 'trip-shared-1', shapeId: 'shape-shared', direction: 1, headsign: 'Inbound', active: true, departures: ['07:30'] }
    ]));

    expect(shapeIds).toEqual(['shape-shared']);
    expect(sharedRoute.directionalRoutes).toHaveLength(2);
    expect(sharedRoute.directionalRoutes?.map(({ shapeId }) => shapeId)).toEqual(['shape-shared', 'shape-shared']);
  });

  it('retains valid directions when another shape is missing or invalid', async () => {
    const geometry = (shapeId: string): RouteShapeReceipt => ({
      lineCode: '4C',
      shapeId,
      crs: 'OGC:CRS84',
      geometry: { type: 'LineString', coordinates: [[-8.72, 42.24], [-8.7, 42.25]] },
      provenance: { kind: 'municipal', sourceName: 'test' }
    });
    const shapeAdapter = {
      getRouteShapeById: vi.fn(async (_lineCode: string, shapeId: string) => {
        if (shapeId === 'shape-valid') {
          return { kind: 'success' as const, value: geometry(shapeId) };
        }
        return { kind: 'unavailable' as const, reason: shapeId === 'shape-invalid' ? 'invalid' as const : 'offline' as const };
      })
    };

    const repository = createOnlineRouteRepository(shapeAdapter);
    const missingRoute = await repository.getOnlineLineRoute(createPublishedSchedule([
      { tripId: 'trip-valid', shapeId: 'shape-valid', direction: 0, headsign: 'Outbound', active: true, departures: ['07:00'] },
      { tripId: 'trip-missing', shapeId: 'shape-missing', direction: 1, headsign: 'Inbound', active: true, departures: ['07:30'] }
    ]));
    const invalidRoute = await repository.getOnlineLineRoute(createPublishedSchedule([
      { tripId: 'trip-valid-2', shapeId: 'shape-valid', direction: 0, headsign: 'Outbound', active: true, departures: ['07:00'] },
      { tripId: 'trip-invalid', shapeId: 'shape-invalid', direction: 1, headsign: 'Inbound', active: true, departures: ['07:30'] }
    ]));

    expect(missingRoute.directionalRoutes?.map(({ direction, shapeId }) => [direction, shapeId]))
      .toEqual([[0, 'shape-valid']]);
    expect(invalidRoute.directionalRoutes?.map(({ direction, shapeId }) => [direction, shapeId]))
      .toEqual([[0, 'shape-valid']]);
    expect(invalidRoute.routeShape?.shapeId).toBe('shape-valid');
  });

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
