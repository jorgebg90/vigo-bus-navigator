import catalogData from './catalog-data.json';
import scheduleManifest from './schedule-data/manifest.json';
import l4aTimetable from './schedule-data/lines/l4a.json';
import l7Timetable from './schedule-data/lines/l7.json';

interface ScheduleTimetable {
  lineId: string;
  byDayType: Partial<Record<'weekday' | 'saturday' | 'sunday_holiday', {
    firstDeparture: number;
    lastDeparture: number;
    bands: Array<{ startMinute: number; endMinute: number; intervalMinutes: number }>;
    stopIds: string[];
  }>>;
}

const timetables: Record<string, ScheduleTimetable> = {
  l4a: l4aTimetable,
  l7: l7Timetable
};

function normalizeScheduleCode(code: string): string {
  return code.toUpperCase().replace(/^L(?=\d)/, '');
}

function timetableForLine(code: string, lineId: string) {
  const schedule = scheduleManifest.lines.find((entry) => normalizeScheduleCode(entry.code) === normalizeScheduleCode(code));
  if (!schedule) return undefined;
  const timetable = timetables[schedule.id];
  if (!timetable) return undefined;
  const routeStopIds = catalogData.lines.find((line) => line.id === lineId)?.patterns[0]?.stopIds ?? [];
  const byDayType = Object.fromEntries(Object.entries(timetable.byDayType).map(([dayType, service]) => [
    dayType,
    service && { ...service, stopIds: routeStopIds }
  ]));
  return { ...timetable, lineId, byDayType };
}

export const catalogMetadata = {
  datasetVersion: catalogData.datasetVersion,
  generatedAt: catalogData.generatedAt
};

export const scheduleMetadata = scheduleManifest;

export function listLines() {
  return catalogData.lines.map(({ id, code, name, color, stopCount, patterns }) => ({
    id,
    code,
    name,
    color,
    stopCount,
    patternCount: patterns.length
  }));
}

export function getLineByCode(code: string) {
  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');
  const line = catalogData.lines.find((candidate) => candidate.code === normalizedCode);
  if (!line) return undefined;

  const catalogStopsById = new Map(catalogData.stops.map((stop) => [stop.id, stop]));
  return {
    ...line,
    timetable: timetableForLine(line.code, line.id),
    patterns: line.patterns.map((pattern) => ({
      ...pattern,
      stops: pattern.stopIds.map((stopId) => {
        const stop = catalogStopsById.get(stopId);
        if (!stop) throw new Error(`Line ${line.code} references unknown stop ${stopId}`);
        return stop;
      })
    }))
  };
}

export function listStops() {
  return catalogData.stops;
}