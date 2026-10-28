import type { ClockPort, StopDiscoveryCatalog } from '../../application/ports';
import type { NetworkLineSummary, NetworkStop } from '../../domain/types';
import { MunicipalOperationError } from '../../domain/municipal-failures';
import type { MunicipalHttpClient } from './http-client';
import { splitLineCodes, toLineId } from './line-id';
import { canonicalNumericId, isNumericId, isOpaqueId } from './request-validation';

const sourceName = 'Vigo municipal transit JSP';
const fallbackLineColor = '#666666';
const maxStops = 5000;

type StopCatalogClient = Pick<MunicipalHttpClient, 'get'>;

/** Loads the full stop catalog published by `TRANSPORTE_PARADAS`, as the official app does. */
export class OnlineStopCatalog {
  constructor(
    private readonly client: StopCatalogClient,
    private readonly clock: ClockPort
  ) {}

  async getCatalog(): Promise<StopDiscoveryCatalog> {
    const payload = await this.client.get('TRANSPORTE_PARADAS', {});
    return normalizeOnlineStopCatalog(payload, this.clock.now().toISOString());
  }
}

export function normalizeOnlineStopCatalog(payload: unknown, fetchedAt: string): StopDiscoveryCatalog {
  if (!Array.isArray(payload) || payload.length === 0 || payload.length > maxStops) {
    throw new MunicipalOperationError('invalid', 'Online stop catalog was invalid');
  }

  const linesByCode = new Map<string, NetworkLineSummary>();
  const stops: NetworkStop[] = [];
  const seenStopIds = new Set<string>();
  for (const row of payload) {
    const stop = normalizeOnlineStop(row, linesByCode);
    if (seenStopIds.has(stop.id)) {
      throw new MunicipalOperationError('invalid', 'Online stop catalog contained duplicate stop IDs');
    }
    seenStopIds.add(stop.id);
    stops.push(stop);
  }

  return {
    lines: [...linesByCode.values()],
    stops,
    patternsByLine: {},
    completeness: 'municipal-online',
    provenance: { kind: 'municipal', sourceName, fetchedAt }
  };
}

function normalizeOnlineStop(
  value: unknown,
  linesByCode: Map<string, NetworkLineSummary>
): NetworkStop {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new MunicipalOperationError('invalid', 'Online stop record was invalid');
  }
  const { stop_id: municipalCode, id, nombre: name, lat, lon, lineas } = value as Record<string, unknown>;
  const vitrasaId = canonicalNumericId(id);
  if (
    !isNumericId(municipalCode)
    || !vitrasaId
    || !isOpaqueId(name)
    || typeof lineas !== 'string'
    || !hasVigoCoordinates(lat, lon)
  ) {
    throw new MunicipalOperationError('invalid', 'Online stop identity, name or coordinates were invalid');
  }

  const lineIds: string[] = [];
  for (const code of splitLineCodes(lineas)) {
    if (!isOpaqueId(code)) {
      throw new MunicipalOperationError('invalid', 'Online stop referenced an invalid line code');
    }
    const lineId = toLineId(code);
    if (!linesByCode.has(code)) {
      linesByCode.set(code, { id: lineId, code, name: code, color: fallbackLineColor });
    }
    if (!lineIds.includes(lineId)) lineIds.push(lineId);
  }

  return {
    id: `stop-${municipalCode}`,
    code: vitrasaId,
    municipalCode,
    vitrasaId,
    name: name.trim(),
    lat: lat as number,
    lon: lon as number,
    lineIds
  };
}

function hasVigoCoordinates(lat: unknown, lon: unknown): boolean {
  return typeof lat === 'number'
    && typeof lon === 'number'
    && Number.isFinite(lat)
    && Number.isFinite(lon)
    && lat >= 42
    && lat <= 42.5
    && lon >= -9
    && lon <= -8.4;
}
