import { describe, expect, it, vi } from 'vitest';
import { loadTransitCatalog } from '../../src/application/load-transit-catalog';

const provenance = { kind: 'bundled-catalog' as const, sourceName: 'Bundled Vigo catalog' };

describe('loadTransitCatalog', () => {
  it('loads both catalogs concurrently through the schedule repository port', async () => {
    const lineCatalog = { kind: 'unavailable' as const, reason: 'offline' as const };
    const discovery = {
      lines: [],
      stops: [],
      patternsByLine: {},
      completeness: 'bundled-seed' as const,
      provenance
    };
    const repository = {
      getMunicipalLineCatalog: vi.fn(async () => lineCatalog),
      getStopDiscoveryCatalog: vi.fn(async () => discovery)
    };

    await expect(loadTransitCatalog(repository, 'es')).resolves.toEqual({ lineCatalog, discovery });
    expect(repository.getMunicipalLineCatalog).toHaveBeenCalledWith('es');
    expect(repository.getStopDiscoveryCatalog).toHaveBeenCalledOnce();
  });
});
