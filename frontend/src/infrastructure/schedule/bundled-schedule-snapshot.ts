import type { MunicipalOperationResult } from '../../application/ports';
import type {
  BundledScheduleSnapshot,
  DayService,
  DayType,
  ProvenanceDateKind
} from '../../domain/types';

export class BundledScheduleSnapshotCatalog {
  constructor(private readonly entries: readonly unknown[]) {}

  getExact(
    lineId: string,
    lineCode: string,
    directionId: string,
    dayType: DayType
  ): MunicipalOperationResult<BundledScheduleSnapshot> {
    const matches = this.entries.filter((entry) => (
      isRecord(entry)
      && entry['lineId'] === lineId
      && entry['lineCode'] === lineCode
      && entry['directionId'] === directionId
      && entry['dayType'] === dayType
    ));
    if (matches.length !== 1) {
      return { kind: 'unavailable', reason: 'mapping-unverified' };
    }

    const entry = matches[0];
    if (!isRecord(entry) || !isDayService(entry['service']) || !isTrustedProvenance(entry['provenance'])) {
      return { kind: 'unavailable', reason: 'identity-unverified' };
    }

    return {
      kind: 'success',
      value: {
        lineId,
        lineCode,
        directionId,
        dayType,
        service: entry['service'],
        provenance: entry['provenance']
      }
    };
  }
}

function isDayService(value: unknown): value is DayService {
  if (!isRecord(value)) return false;
  const { firstDeparture, lastDeparture, bands, stopIds } = value;
  if (
    !isMinute(firstDeparture)
    || !isMinute(lastDeparture)
    || firstDeparture > lastDeparture
    || !Array.isArray(bands)
    || bands.length === 0
    || bands.length > 100
    || !Array.isArray(stopIds)
    || stopIds.length === 0
    || !stopIds.every(isOpaqueId)
    || new Set(stopIds).size !== stopIds.length
  ) return false;

  let previousEnd = -1;
  for (const band of bands) {
    if (
      !isRecord(band)
      || !isMinute(band['startMinute'])
      || !isBandBoundary(band['endMinute'])
      || !Number.isSafeInteger(band['intervalMinutes'])
      || typeof band['intervalMinutes'] !== 'number'
      || band['intervalMinutes'] <= 0
      || band['startMinute'] < previousEnd
      || band['endMinute'] <= band['startMinute']
      || firstDeparture < band['startMinute']
      || lastDeparture > band['endMinute']
    ) return false;
    previousEnd = band['endMinute'];
  }

  return true;
}

function isTrustedProvenance(value: unknown): value is BundledScheduleSnapshot['provenance'] {
  if (!isRecord(value)) return false;
  return value['kind'] === 'snapshot'
    && isText(value['sourceName'])
    && isText(value['evidenceRef'])
    && isDate(value['snapshotDate'])
    && isDateKind(value['dateKind']);
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isDateKind(value: unknown): value is ProvenanceDateKind {
  return value === 'publication' || value === 'effective' || value === 'capture';
}

function isMinute(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1439;
}

function isBandBoundary(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= 1440;
}

function isOpaqueId(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 128
    && value.trim() === value
    && !/[\u0000-\u001F\u007F]/u.test(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 2048
    && value.trim() === value
    && !/[\u0000-\u001F\u007F]/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
