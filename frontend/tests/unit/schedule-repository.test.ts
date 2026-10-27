import { describe, expect, it, vi } from 'vitest';
import { ApiScheduleRepository } from '../../src/infrastructure/schedule/api-schedule-repository';

const manifest = {
  datasetVersion: 'test-schedule-v1',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  generatedAt: '2026-10-26T00:00:00Z',
  holidays: [],
  lines: []
};
const line = { id: 'line-4a', code: '4A', name: 'Praza de América', color: null, stopCount: 2, patternCount: 1 };
const stop = { id: 'stop-1', code: '1', vitrasaId: '1', name: 'Praza de América', lat: 42.2, lon: -8.7, lineIds: ['line-4a'] };
const timetable = {
  lineId: 'line-4a',
  byDayType: { weekday: { firstDeparture: 360, lastDeparture: 1380, bands: [], stopIds: ['stop-1'] } }
};
const patterns = [{
  id: 'pattern-outbound', headsign: 'Praza de América', stopIds: ['stop-1'], stops: [stop]
}];

describe('ApiScheduleRepository', () => {
  it('loads catalog, stops, schedule metadata, and line timetable through Worker endpoints', async () => {
    const responses: Record<string, unknown> = {
      '/lines': { scheduleMetadata: manifest, lines: [line] },
      '/stops': { stops: [stop] },
      '/lines/4A': { ...line, patterns, timetable }
    };
    const fetcher = vi.fn(async (url: string) => {
      const body = responses[new URL(url).pathname];
      return new Response(JSON.stringify(body), { status: body ? 200 : 404 });
    });
    const repository = new ApiScheduleRepository('http://worker.test', fetcher);

    expect(await repository.listLines()).toEqual([{ ...line, color: '#666666' }]);
    expect(await repository.listStops()).toEqual([stop]);
    expect(await repository.getManifest()).toEqual(manifest);
    expect(await repository.getLineDetails('line-4a')).toEqual({ timetable, patterns });
    expect(fetcher.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(['/lines', '/stops', '/lines/4A']);
  });

  it('returns no timetable for a line without published schedule data', async () => {
    const unscheduledLine = { ...line, code: '4C' };
    const fetcher = vi.fn(async (url: string) => {
      const body = new URL(url).pathname === '/lines'
        ? { scheduleMetadata: manifest, lines: [unscheduledLine] }
        : { ...unscheduledLine, patterns: [] };
      return new Response(JSON.stringify(body), { status: 200 });
    });
    const repository = new ApiScheduleRepository('http://worker.test', fetcher);

    await expect(repository.getLineDetails('line-4a')).resolves.toEqual({ patterns: [] });
  });
});
