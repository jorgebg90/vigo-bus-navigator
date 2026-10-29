import type {
  MunicipalOperationResult,
  MunicipalServingLinesReceipt,
  ScheduleRepositoryV5
} from './ports';
import type { LineStopDetail, NetworkStop } from '../domain/types';

type ServingLinesRepository = Pick<ScheduleRepositoryV5, 'getMunicipalServingLines' | 'getLineStopDetail'>;

export function loadStopServingLines(
  repository: Pick<ScheduleRepositoryV5, 'getMunicipalServingLines'>,
  stop: NetworkStop
): Promise<MunicipalOperationResult<MunicipalServingLinesReceipt>> {
  return repository.getMunicipalServingLines(stop);
}

export async function loadServingLineDetails(
  repository: ServingLinesRepository,
  stop: NetworkStop,
  servingLines: MunicipalOperationResult<MunicipalServingLinesReceipt>
): Promise<LineStopDetail[]> {
  if (servingLines.kind === 'unavailable') return [];
  const results = await Promise.all(
    servingLines.value.lines.map((line) => repository.getLineStopDetail(stop, line.code))
  );
  return results.flatMap((result) => result.kind === 'success' ? [result.value] : []);
}
