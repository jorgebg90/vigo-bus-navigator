import { getBundledScheduleFallback } from './get-bundled-schedule-fallback';
import type { MunicipalOperationResult, OnlineLineRoute, ScheduleRepositoryV5 } from './ports';
import { deriveDayType } from '../domain/day-type';
import type {
  DayType,
  Line,
  LineRoutePattern,
  PublishedLineSchedule,
  RouteShapeReceipt,
  TripStopSequence
} from '../domain/types';

type LineViewRepository = Pick<
  ScheduleRepositoryV5,
  | 'getBundledScheduleSnapshot'
  | 'getPublishedLineSchedule'
  | 'getRoutePatterns'
  | 'getRouteShape'
  | 'getTripStops'
>;

export interface LineViewData {
  dayType: DayType;
  scheduleResult: MunicipalOperationResult<PublishedLineSchedule>;
  patterns: LineRoutePattern[];
  routeShapeResult: MunicipalOperationResult<RouteShapeReceipt>;
  tripStopsResult: MunicipalOperationResult<TripStopSequence>;
  snapshotFallback: Awaited<ReturnType<typeof getBundledScheduleFallback>>;
}

export async function loadLineView(
  repository: LineViewRepository,
  line: Line,
  requestedDayType: DayType | undefined,
  online: boolean,
  now: Date
): Promise<LineViewData> {
  const dayType = requestedDayType ?? deriveDayType(now, []);
  const [scheduleResult, patterns, routeShapeResult, tripStopsResult] = await Promise.all([
    online
      ? repository.getPublishedLineSchedule(line.code, dayType)
      : Promise.resolve({ kind: 'unavailable' as const, reason: 'offline' as const }),
    repository.getRoutePatterns(line.id),
    repository.getRouteShape(line.code),
    repository.getTripStops(line.code, dayType)
  ]);
  const snapshotFallback = await getBundledScheduleFallback(
    repository,
    line,
    dayType,
    patterns,
    online,
    scheduleResult
  );
  return { dayType, scheduleResult, patterns, routeShapeResult, tripStopsResult, snapshotFallback };
}

export function loadOnlineLineRoute(
  repository: Pick<ScheduleRepositoryV5, 'getOnlineLineRoute'>,
  schedule: PublishedLineSchedule
): Promise<OnlineLineRoute> {
  return repository.getOnlineLineRoute(schedule);
}
