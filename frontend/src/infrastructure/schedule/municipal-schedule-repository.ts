import type {
  LineScheduleGateway,
  MunicipalLineCatalogReceipt,
  MunicipalOperationResult,
  MunicipalServingLinesReceipt,
  ScheduleRepositoryV5,
  StopDiscoveryCatalog
} from '../../application/ports';
import type {
  BundledScheduleSnapshot,
  DayType,
  DirectionalRoute,
  Language,
  LineRoutePattern,
  NetworkLineSummary,
  NetworkStop,
  PublishedLineSchedule,
  PublishedTrip,
  RouteShapeReceipt,
  Stop,
  TripStopSequence,
  LineStopDetail
} from '../../domain/types';
import type { MunicipalLineCatalogAdapter } from '../municipal/line-catalog-adapter';
import { joinServiceMetadata, type MunicipalServiceCatalogAdapter } from '../municipal/service-catalog-adapter';
import type { MunicipalStopDetailAdapter, StopIdentity } from '../municipal/stop-detail-adapter';
import type { MunicipalServingLinesAdapter } from '../municipal/serving-lines-adapter';
import type { ServingLines } from '../municipal/serving-lines-adapter';
import type { BundledDiscoveryCatalog } from '../municipal/bundled-discovery-catalog';
import type { OnlineStopCatalog } from '../municipal/online-stop-catalog';
import type { MunicipalRouteShapeAdapter } from '../municipal/route-shape-adapter';
import type { MunicipalTripStopAdapter } from '../municipal/trip-stop-adapter';
import type { MunicipalLineStopAdapter } from '../municipal/line-stop-adapter';
import { BundledScheduleSnapshotCatalog } from './bundled-schedule-snapshot';

export interface OnlineCatalogOptions {
  stopCatalog: OnlineStopCatalog;
  evidenceRef: string;
}

export interface OnlineLineRoute {
  patterns: LineRoutePattern[];
  directionalRoutes?: DirectionalRoute[];
  routeShape?: RouteShapeReceipt;
  provenance?: TripStopSequence['provenance'];
}

export class MunicipalScheduleRepository implements ScheduleRepositoryV5 {
  private discoveryRequest?: Promise<StopDiscoveryCatalog>;

  constructor(
    private readonly lineCatalog: MunicipalLineCatalogAdapter,
    private readonly serviceCatalog: MunicipalServiceCatalogAdapter,
    private readonly stopDetail: MunicipalStopDetailAdapter,
    private readonly servingLines: MunicipalServingLinesAdapter,
    private readonly lineSchedule: LineScheduleGateway,
    private readonly bundledDiscovery: BundledDiscoveryCatalog,
    private readonly routeShape?: MunicipalRouteShapeAdapter,
    private readonly tripStops?: MunicipalTripStopAdapter,
    private readonly lineStop?: MunicipalLineStopAdapter,
    private readonly bundledScheduleSnapshots = new BundledScheduleSnapshotCatalog([]),
    private readonly online?: OnlineCatalogOptions
  ) {}

  async getMunicipalLineCatalog(
    language: Language
  ): Promise<MunicipalOperationResult<MunicipalLineCatalogReceipt>> {
    const [lineResult, serviceResult, discovery] = await Promise.all([
      this.lineCatalog.getCatalog(language),
      this.serviceCatalog.getCatalog(language),
      this.getStopDiscoveryCatalog()
    ]);
    if (lineResult.kind === 'unavailable') return lineResult;

    const discoveryIdsByCode = new Map(discovery.lines.map(({ code, id }) => [code, id]));
    const linesWithStableIds = {
      ...lineResult.value,
      lines: lineResult.value.lines.map((line) => ({
        ...line,
        id: discoveryIdsByCode.get(line.code) ?? line.code
      }))
    };
    const mappedServices: typeof serviceResult = serviceResult.kind === 'success'
      ? {
          kind: 'success',
          value: {
            ...serviceResult.value,
            lines: serviceResult.value.lines.map((line) => ({
              ...line,
              id: discoveryIdsByCode.get(line.code) ?? line.code
            }))
          }
        }
      : serviceResult;
    const joinedCatalog = mappedServices.kind === 'success'
      ? joinServiceMetadata(linesWithStableIds, mappedServices.value)
      : linesWithStableIds;
    const receipt: MunicipalLineCatalogReceipt = {
      lines: joinedCatalog.lines,
      provenance: joinedCatalog.provenance,
      serviceMetadata: mappedServices.kind === 'success'
        ? { kind: 'available', provenance: mappedServices.value.provenance }
        : { kind: 'unavailable', reason: mappedServices.reason }
    };
    return { kind: 'success', value: receipt };
  }

  getStopDiscoveryCatalog(): Promise<StopDiscoveryCatalog> {
    this.discoveryRequest ??= this.online
      ? this.online.stopCatalog.getCatalog().catch(() => this.bundledDiscovery.getCatalog())
      : this.bundledDiscovery.getCatalog();
    return this.discoveryRequest;
  }

  /**
   * Builds route summaries from the published schedule, as the official app does: one representative
   * source trip per direction supplies the stop sequence, and its source shape supplies the geometry.
   */
  async getOnlineLineRoute(schedule: PublishedLineSchedule): Promise<OnlineLineRoute> {
    if (!this.online || !schedule.trips?.length || !this.tripStops) return { patterns: [] };
    const discovery = await this.getStopDiscoveryCatalog();
    const stopsByMunicipalCode = Object.fromEntries(
      discovery.stops.map((stop) => [stop.municipalCode, stop])
    );
    const representatives = selectRepresentativeTrips(schedule.trips);
    const shapeIds = [...new Set(representatives.map((trip) => trip.shapeId))];
    const [sequences, routeShapes] = await Promise.all([
      Promise.all(representatives.map((trip) => this.tripStops!.getTripStopsById(
        schedule.lineCode,
        schedule.dayType,
        trip.tripId,
        this.online!.evidenceRef,
        stopsByMunicipalCode
      ))),
      this.routeShape
        ? Promise.all(shapeIds.map((shapeId) => this.routeShape!.getRouteShapeById(
            schedule.lineCode,
            shapeId,
            this.online!.evidenceRef
          )))
        : Promise.resolve([])
    ]);

    const routeShapesById = new Map<string, RouteShapeReceipt>();
    routeShapes.forEach((result, index) => {
      const shapeId = shapeIds[index];
      if (result?.kind === 'success' && shapeId) routeShapesById.set(shapeId, result.value);
    });
    const directionalRoutes: DirectionalRoute[] = representatives.flatMap((trip) => {
      const shape = routeShapesById.get(trip.shapeId);
      return shape
        ? [{ direction: trip.direction, headsign: trip.headsign, shapeId: trip.shapeId, geometry: shape.geometry }]
        : [];
    });

    const patterns: LineRoutePattern[] = [];
    let provenance: OnlineLineRoute['provenance'];
    sequences.forEach((sequence, index) => {
      const trip = representatives[index];
      if (sequence.kind !== 'success' || !trip) return;
      provenance ??= sequence.value.provenance;
      // Circular trips repeat their terminus: keep the ordered sequence, but list each stop once.
      const sequenceStops = sequence.value.stops.map(({ stop }) => toStop(stop));
      patterns.push({
        id: trip.tripId,
        headsign: trip.headsign,
        stopIds: sequenceStops.map((stop) => stop.id),
        stops: [...new Map(sequenceStops.map((stop) => [stop.id, stop])).values()]
      });
    });
    return {
      patterns,
      directionalRoutes,
      routeShape: directionalRoutes[0] ? routeShapesById.get(directionalRoutes[0].shapeId) : undefined,
      provenance
    };
  }

  getRoutePatterns(lineId: string): Promise<LineRoutePattern[]> {
    if (this.online) return Promise.resolve([]);
    return this.bundledDiscovery.getRoutePatterns(lineId);
  }

  getMunicipalStopDetail(
    stop: NetworkStop
  ): ReturnType<MunicipalStopDetailAdapter['getStop']> {
    const identity: StopIdentity = {
      id: stop.id,
      code: stop.code,
      vitrasaId: stop.vitrasaId,
      lineIds: stop.lineIds
    };
    return this.stopDetail.getStop(identity);
  }

  async getMunicipalServingLines(
    stop: NetworkStop
  ): Promise<MunicipalOperationResult<MunicipalServingLinesReceipt>> {
    const result: MunicipalOperationResult<ServingLines> = await this.servingLines.getServingLines(stop);
    if (result.kind === 'unavailable') return result;

    const discovery = await this.getStopDiscoveryCatalog();
    const idsByCode = new Map(discovery.lines.map(({ code, id }) => [code, id]));
    return {
      kind: 'success',
      value: {
        lines: result.value.lines.map((line) => ({
          ...line,
          id: idsByCode.get(line.code) ?? line.code
        })),
        provenance: result.value.provenance
      }
    };
  }

  getPublishedLineSchedule(
    lineCode: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<PublishedLineSchedule>> {
    return this.lineSchedule.getLineSchedule(lineCode, dayType);
  }

  async getBundledScheduleSnapshot(
    lineId: string,
    lineCode: string,
    directionId: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<BundledScheduleSnapshot>> {
    return this.bundledScheduleSnapshots.getExact(lineId, lineCode, directionId, dayType);
  }

  getRouteShape(lineCode: string): Promise<MunicipalOperationResult<RouteShapeReceipt>> {
    return this.routeShape
      ? this.routeShape.getRouteShape(lineCode)
      : Promise.resolve({ kind: 'unavailable', reason: 'mapping-unverified' });
  }

  async getTripStops(
    lineCode: string,
    dayType: DayType
  ): Promise<MunicipalOperationResult<TripStopSequence>> {
    if (!this.tripStops) return { kind: 'unavailable', reason: 'mapping-unverified' };
    const discovery = await this.getStopDiscoveryCatalog();
    const stopsByMunicipalCode = Object.fromEntries(
      discovery.stops.map((stop) => [stop.municipalCode, stop])
    );
    return this.tripStops.getTripStops(lineCode, dayType, stopsByMunicipalCode);
  }

  getLineStopDetail(
    stop: NetworkStop,
    lineCode: string
  ): Promise<MunicipalOperationResult<LineStopDetail>> {
    return this.lineStop
      ? this.lineStop.getLineStopDetail(stop, lineCode)
      : Promise.resolve({ kind: 'unavailable', reason: 'mapping-unverified' });
  }
}

function selectRepresentativeTrips(trips: readonly PublishedTrip[]): PublishedTrip[] {
  const byDirection = new Map<PublishedTrip['direction'], PublishedTrip>();
  for (const trip of trips) {
    const current = byDirection.get(trip.direction);
    if (!current || compareRepresentativeTrips(trip, current) < 0) byDirection.set(trip.direction, trip);
  }
  return [...byDirection.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, trip]) => trip);
}

function compareRepresentativeTrips(left: PublishedTrip, right: PublishedTrip): number {
  if (left.active !== right.active) return left.active ? -1 : 1;
  return right.departures.length - left.departures.length;
}

function toStop(stop: NetworkStop): Stop {
  return {
    id: stop.id,
    code: stop.code,
    vitrasaId: stop.vitrasaId,
    name: stop.name,
    lat: stop.lat,
    lon: stop.lon,
    lineIds: [...stop.lineIds]
  };
}
