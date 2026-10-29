import type { MunicipalOperationResult, ScheduleRepositoryV5 } from './ports';
import type {
  BundledScheduleSnapshot,
  DayType,
  Line,
  LineRoutePattern,
  PublishedLineSchedule
} from '../domain/types';

export async function getBundledScheduleFallback(
  repository: Pick<ScheduleRepositoryV5, 'getBundledScheduleSnapshot'>,
  line: Line,
  dayType: DayType,
  patterns: LineRoutePattern[],
  online: boolean,
  scheduleResult: MunicipalOperationResult<PublishedLineSchedule>
): Promise<{ attempted: boolean; snapshots: BundledScheduleSnapshot[] }> {
  if (online || scheduleResult.kind === 'success') {
    return { attempted: false, snapshots: [] };
  }

  const results = await Promise.all(patterns.map((pattern) => (
    repository.getBundledScheduleSnapshot(line.id, line.code, pattern.id, dayType)
  )));
  return {
    attempted: true,
    snapshots: results.flatMap((result) => (
      result.kind === 'success' ? [result.value] : []
    ))
  };
}
