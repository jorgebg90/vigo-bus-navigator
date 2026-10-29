import { describe, expect, it, vi } from 'vitest';
import { loadServingLineDetails, loadStopServingLines } from '../../src/application/load-stop-serving-lines';
import type { NetworkStop } from '../../src/domain/types';

const stop: NetworkStop = {
  id: 'stop-1',
  code: '1',
  municipalCode: '1001',
  vitrasaId: null,
  name: 'Center',
  lat: 42.24,
  lon: -8.72,
  lineIds: []
};
const line = { id: 'line-4a', code: 'L4A', name: 'Line 4A', color: '#000000' };
const provenance = { kind: 'municipal' as const, sourceName: 'Vigo JSP' };

describe('stop serving-line use cases', () => {
  it('loads line details only for the lines reported at the stop', async () => {
    const detail = { municipalCode: stop.municipalCode, lineCode: line.code, patterns: [], provenance };
    const repository = {
      getMunicipalServingLines: vi.fn(async () => ({
        kind: 'success' as const,
        value: { lines: [line], provenance }
      })),
      getLineStopDetail: vi.fn(async () => ({ kind: 'success' as const, value: detail }))
    };

    const servingLines = await loadStopServingLines(repository, stop);
    await expect(loadServingLineDetails(repository, stop, servingLines)).resolves.toEqual([detail]);
    expect(repository.getMunicipalServingLines).toHaveBeenCalledWith(stop);
    expect(repository.getLineStopDetail).toHaveBeenCalledWith(stop, line.code);
  });

  it('does not request details when the serving-line lookup is unavailable', async () => {
    const repository = {
      getMunicipalServingLines: vi.fn(async () => ({
        kind: 'unavailable' as const,
        reason: 'offline' as const
      })),
      getLineStopDetail: vi.fn()
    };

    const servingLines = await loadStopServingLines(repository, stop);
    await expect(loadServingLineDetails(repository, stop, servingLines)).resolves.toEqual([]);
    expect(repository.getLineStopDetail).not.toHaveBeenCalled();
  });
});
