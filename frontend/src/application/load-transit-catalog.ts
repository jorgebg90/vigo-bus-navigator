import type { ScheduleRepositoryV5 } from './ports';
import type { Language } from '../domain/types';

export async function loadTransitCatalog(
  repository: Pick<ScheduleRepositoryV5, 'getMunicipalLineCatalog' | 'getStopDiscoveryCatalog'>,
  language: Language
) {
  const [lineCatalog, discovery] = await Promise.all([
    repository.getMunicipalLineCatalog(language),
    repository.getStopDiscoveryCatalog()
  ]);
  return { lineCatalog, discovery };
}
