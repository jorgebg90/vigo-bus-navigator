import catalogData from './data/catalog-data.json?raw';
import type { BundledRoutePattern, StopDiscoveryCatalog } from '../../application/ports';
import type { LineRoutePattern, NetworkLineSummary, NetworkStop, Stop } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import { isNumericId, isOpaqueId } from './request-validation';

const sourceName = 'Vigo open-data and GTFS bundled discovery catalog';
const validColor = /^#[0-9A-Fa-f]{6}$/;

interface BundledCatalogData {
  datasetVersion: string;
  generatedAt: string;
  lines: unknown[];
  stops: unknown[];
}

export class BundledDiscoveryCatalog {
  private catalog?: StopDiscoveryCatalog;

  async getCatalog(): Promise<StopDiscoveryCatalog> {
    this.catalog ??= normalizeBundledCatalog(JSON.parse(catalogData) as unknown);
    return structuredClone(this.catalog);
  }

  async getRoutePatterns(lineId: string): Promise<LineRoutePattern[]> {
    const catalog = await this.getCatalog();
    const routePatterns = catalog.patternsByLine[lineId] ?? [];
    const stopsById = new Map(catalog.stops.map((stop) => [stop.id, toStop(stop)]));
    return routePatterns.map((pattern) => ({
      id: pattern.id,
      headsign: pattern.headsign,
      stopIds: [...pattern.stopIds],
      stops: pattern.stopIds
        .map((stopId) => stopsById.get(stopId))
        .filter((stop): stop is Stop => stop !== undefined)
    }));
  }
}

export function normalizeBundledCatalog(payload: unknown): StopDiscoveryCatalog {
  if (!isRecord(payload)) {
    throw new MunicipalOperationError('invalid', 'Bundled discovery catalog was invalid');
  }
  const data = payload as Partial<BundledCatalogData>;
  if (
    !isOpaqueId(data.datasetVersion)
    || typeof data.generatedAt !== 'string'
    || !Number.isFinite(Date.parse(data.generatedAt))
    || !Array.isArray(data.lines)
    || !Array.isArray(data.stops)
  ) {
    throw new MunicipalOperationError('invalid', 'Bundled discovery catalog metadata was invalid');
  }

  const lines = data.lines.map(normalizeBundledLine);
  const lineIds = new Set(lines.map((line) => line.id));
  if (lineIds.size !== lines.length) {
    throw new MunicipalOperationError('invalid', 'Bundled discovery catalog contained duplicate line IDs');
  }
  const linesById = new Map(lines.map((line) => [line.id, line]));
  const stops = data.stops.map((stop) => normalizeBundledStop(stop, lineIds));
  const stopIds = new Set(stops.map((stop) => stop.id));
  if (stopIds.size !== stops.length) {
    throw new MunicipalOperationError('invalid', 'Bundled discovery catalog contained duplicate stop IDs');
  }
  for (const stop of stops) {
    for (const lineId of stop.lineIds) {
      if (!linesById.has(lineId)) {
        throw new MunicipalOperationError('invalid', 'Bundled stop referenced an unknown line');
      }
    }
  }

  const patternsByLine: Record<string, BundledRoutePattern[]> = {};
  for (let index = 0; index < data.lines.length; index += 1) {
    const sourceLine: unknown = data.lines[index];
    if (!isRecord(sourceLine)) {
      throw new MunicipalOperationError('invalid', 'Bundled line record was invalid');
    }
    const id = sourceLine['id'];
    const patterns = sourceLine['patterns'];
    if (!isOpaqueId(id) || !Array.isArray(patterns)) {
      throw new MunicipalOperationError('invalid', 'Bundled route patterns were invalid');
    }
    patternsByLine[id] = patterns.map((pattern) => normalizeBundledPattern(pattern, stopIds));
  }

  const generatedAt = new Date(data.generatedAt).toISOString();
  return {
    lines,
    stops,
    patternsByLine,
    completeness: 'bundled-seed',
    provenance: {
      kind: 'bundled-catalog',
      sourceName,
      evidenceRef: data.datasetVersion,
      snapshotDate: generatedAt.slice(0, 10),
      dateKind: 'capture'
    }
  };
}

function normalizeBundledPattern(value: unknown, stopIds: ReadonlySet<string>): BundledRoutePattern {
  if (!isRecord(value)) {
    throw new MunicipalOperationError('invalid', 'Bundled route pattern was invalid');
  }
  const { id, headsign, stopIds: patternStopIds } = value;
  if (
    !isOpaqueId(id)
    || !isOpaqueId(headsign)
    || !Array.isArray(patternStopIds)
    || patternStopIds.length === 0
    || !patternStopIds.every((stopId): stopId is string => isOpaqueId(stopId) && stopIds.has(stopId))
  ) {
    throw new MunicipalOperationError('invalid', 'Bundled route pattern references were invalid');
  }
  return { id, headsign, stopIds: [...patternStopIds] };
}

function normalizeBundledLine(value: unknown): NetworkLineSummary {
  if (!isRecord(value)) {
    throw new MunicipalOperationError('invalid', 'Bundled line record was invalid');
  }
  const { id, code, name, color } = value;
  if (
    !isOpaqueId(id)
    || !isOpaqueId(code)
    || !isOpaqueId(name)
    || (color !== null && (typeof color !== 'string' || !validColor.test(color)))
  ) {
    throw new MunicipalOperationError('invalid', 'Bundled line identity or color was invalid');
  }
  return { id, code, name, color: color ?? '#666666' };
}

function normalizeBundledStop(value: unknown, lineIds: ReadonlySet<string>): NetworkStop {
  if (!isRecord(value)) {
    throw new MunicipalOperationError('invalid', 'Bundled stop record was invalid');
  }
  const { id, code, municipalCode, vitrasaId, name, lat, lon, lineIds: stopLineIds } = value;
  if (
    !isOpaqueId(id)
    || !isOpaqueId(code)
    || !isNumericId(municipalCode)
    || (vitrasaId !== null && !isNumericId(vitrasaId))
    || !isOpaqueId(name)
    || !Array.isArray(stopLineIds)
    || !stopLineIds.every((lineId): lineId is string => isOpaqueId(lineId) && lineIds.has(lineId))
  ) {
    throw new MunicipalOperationError('invalid', 'Bundled stop identity or line membership was invalid');
  }

  if ((lat === null) !== (lon === null)) {
    throw new MunicipalOperationError('invalid', 'Bundled stop coordinates were not an atomic pair');
  }
  if (lat === null && lon === null) {
    return {
      id,
      code,
      municipalCode,
      vitrasaId,
      name,
      lat: null,
      lon: null,
      lineIds: [...stopLineIds]
    };
  }
  if (
    typeof lat !== 'number'
    || typeof lon !== 'number'
    || !Number.isFinite(lat)
    || !Number.isFinite(lon)
    || lat < 42
    || lat > 42.5
    || lon < -9
    || lon > -8.4
  ) {
    throw new MunicipalOperationError('invalid', 'Bundled stop coordinates were outside Vigo bounds');
  }

  return {
    id,
    code,
    municipalCode,
    vitrasaId,
    name,
    lat,
    lon,
    lineIds: [...stopLineIds]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
