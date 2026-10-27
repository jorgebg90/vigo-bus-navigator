import { deriveDayType } from '../domain/day-type';
import { getDayService } from '../domain/frequency';
import type { DayType, DayService, Line, LineRoutePattern, Timetable } from '../domain/types';
import type { ClockPort, ScheduleRepository } from './ports';

export interface LineFrequencyResult {
  line: Line;
  timetable?: Timetable;
  patterns: LineRoutePattern[];
  dayType: DayType;
  service?: DayService;
  datasetVersion: string;
  validUntil: string;
}

export async function getLineFrequency(
  lineId: string,
  schedule: ScheduleRepository,
  clock: ClockPort,
  requestedDayType?: DayType
): Promise<LineFrequencyResult> {
  const [lines, manifest, details] = await Promise.all([
    schedule.listLines(),
    schedule.getManifest(),
    schedule.getLineDetails(lineId)
  ]);
  const timetable = details.timetable;
  const line = lines.find((candidate) => candidate.id === lineId);
  if (!line) throw new Error(`Unknown line: ${lineId}`);
  const dayType = requestedDayType ?? deriveDayType(clock.now(), manifest.holidays);
  return {
    line,
    timetable,
    patterns: details.patterns,
    dayType,
    service: timetable ? getDayService(timetable, dayType) : undefined,
    datasetVersion: manifest.datasetVersion,
    validUntil: manifest.validUntil
  };
}
