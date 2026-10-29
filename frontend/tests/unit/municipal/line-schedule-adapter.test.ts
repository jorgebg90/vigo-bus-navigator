import { describe, expect, it, vi } from 'vitest';
import type { ClockPort } from '../../../src/application/ports';
import { MunicipalLineScheduleAdapter, type ScheduleMapping } from '../../../src/infrastructure/municipal/line-schedule-adapter';
import { MunicipalHttpClient } from '../../../src/infrastructure/municipal/http-client';

const mapping: ScheduleMapping = {
  scheduleId: 'schedule-004',
  evidenceRef: 'source-evidence-r2',
  dayCodes: { weekday: '1', saturday: '6', sunday_holiday: '0' }
};
const provisionalMapping: ScheduleMapping = {
  scheduleId: 'A',
  evidenceRef: 'spec.md#FR-031',
  verification: 'provisional',
  dayCodes: { weekday: '1', saturday: '6', sunday_holiday: '0' }
};
const validatedLiveMapping: ScheduleMapping = {
  scheduleId: 'A',
  evidenceRef: 'stakeholder-postman-validation-2026-10-28',
  verification: 'stakeholder-attested',
  dayCodes: { weekday: '1', saturday: '6', sunday_holiday: '0' },
  mixedLineRows: 'filter-by-leading-line-code'
};

const clock: ClockPort = {
  now: () => new Date('2026-10-27T12:00:00.000Z'),
  onDateChange: () => () => undefined
};

function createClient(payload: unknown) {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  }));
  return { client: new MunicipalHttpClient('fixture', fetcher), fetcher };
}

describe('municipal line schedule adapter', () => {
  it('does not make a request while line or day mappings are unverified', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = new MunicipalLineScheduleAdapter(new MunicipalHttpClient('fixture', fetcher), clock, 'fixture');
    const withoutMapping = await adapter.getLineSchedule('L4A', 'weekday');
    const withoutDay = new MunicipalLineScheduleAdapter(
      new MunicipalHttpClient('fixture', fetcher),
      clock,
      'fixture',
      { L4A: { scheduleId: 'schedule-004', evidenceRef: 'evidence', dayCodes: {} } }
    );

    await expect(withoutDay.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(withoutMapping).toEqual({ kind: 'unavailable', reason: 'mapping-unverified' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses the exact verified schedule and day mapping and preserves published times', async () => {
    const { client, fetcher } = createClient([
      { trip_id: 'trip-1', shape_id: 'shape-1', horarios: '08:00,08:15,09:30' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { L4A: mapping });

    await expect(adapter.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
      kind: 'success',
      value: {
        lineCode: 'L4A',
        dayType: 'weekday',
        scheduleId: 'schedule-004',
        departures: ['08:00', '08:15', '09:30'],
        provenance: {
          kind: 'fixture',
          sourceName: 'Synthetic municipal-contract fixture',
          fetchedAt: '2026-10-27T12:00:00.000Z',
          evidenceRef: 'source-evidence-r2'
        }
      }
    });
    const requestUrl = new URL(fetcher.mock.calls[0]?.[0] as string);
    expect(requestUrl.searchParams.get('id')).toBe('schedule-004');
    expect(requestUrl.searchParams.get('dia')).toBe('1');
  });

  it('uses only explicit provisional mappings in fixture mode and filters exact line-prefix rows', async () => {
    const { client, fetcher } = createClient([
      { trip_id: 'A  02LP000_008002_4', shape_id: 'Route_1005', horarios: '08:00,08:15' },
      { trip_id: 'C3  02LP000_008002_4', shape_id: 'Route_1005', horarios: '08:05' },
      { trip_id: '20105L0114', shape_id: 'Route_1005', horarios: '08:10' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { A: provisionalMapping });

    await expect(adapter.getLineSchedule('A', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: {
        lineCode: 'A',
        dayType: 'weekday',
        scheduleId: 'A',
        departures: ['08:00', '08:15'],
        provenance: {
          kind: 'provisional-fixture',
          sourceName: expect.stringContaining('provisional'),
          evidenceRef: 'spec.md#FR-031'
        }
      }
    });

    const requestUrl = new URL(fetcher.mock.calls[0]?.[0] as string);
    expect(requestUrl.searchParams.get('id')).toBe('A');
    expect(requestUrl.searchParams.get('dia')).toBe('1');
  });

  it('filters mixed live responses to the validated line and maps all confirmed day codes', async () => {
    const { client, fetcher } = createClient([
      { trip_id: 'A  02LP000_008002_4', shape_id: 'Route_1005', horarios: '08:00,08:15' },
      { trip_id: 'C3  02LP000_008002_4', shape_id: 'Route_1005', horarios: '08:05' },
      { trip_id: '20105L0114', shape_id: 'Route_1005', horarios: '08:10' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'local-live', {
      A: validatedLiveMapping
    });

    await expect(adapter.getLineSchedule('A', 'weekday')).resolves.toMatchObject({
      kind: 'success',
      value: {
        scheduleId: 'A',
        departures: ['08:00', '08:15'],
        provenance: {
          kind: 'municipal',
          evidenceRef: 'stakeholder-postman-validation-2026-10-28'
        }
      }
    });
    expect(new URL(fetcher.mock.calls[0]?.[0] as string).searchParams.get('dia')).toBe('1');

    for (const [dayType, sourceDay] of [
      ['weekday', '1'],
      ['saturday', '6'],
      ['sunday_holiday', '0']
    ] as const) {
      await adapter.getLineSchedule('A', dayType);
      expect(new URL(fetcher.mock.calls.at(-1)?.[0] as string).searchParams.get('dia')).toBe(sourceDay);
    }
  });

  it('rejects provisional schedules without an exact matching trip token and keeps live profiles closed', async () => {
    const { client, fetcher } = createClient([
      { trip_id: 'A-extra', shape_id: 'shape-A', horarios: '08:00' }
    ]);
    const fixtureAdapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { A: provisionalMapping });
    const liveAdapter = new MunicipalLineScheduleAdapter(client, clock, 'production', { A: provisionalMapping });

    await expect(fixtureAdapter.getLineSchedule('A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'invalid'
    });
    await expect(liveAdapter.getLineSchedule('A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects a mixed-trip response that cannot be attributed to the requested public line', async () => {
    const { client } = createClient([
      { trip_id: 'trip-A', shape_id: 'shape-A', horarios: '08:00' },
      { trip_id: 'trip-C3', shape_id: 'shape-C3', horarios: '08:10' },
      { trip_id: 'trip-20105L', shape_id: 'shape-20105L', horarios: '08:20' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { L4A: mapping });

    await expect(adapter.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'invalid'
    });
  });

  it('rejects duplicate source row identities rather than duplicating published times', async () => {
    const { client } = createClient([
      { trip_id: 'trip-1', shape_id: 'shape-1', horarios: '08:00' },
      { trip_id: 'trip-1', shape_id: 'shape-1', horarios: '08:00' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { L4A: mapping });

    await expect(adapter.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'invalid'
    });
  });

  it.each(['24:00', '8:00', '08:60', '08:00 ', '08:00,'])(
    'rejects an invalid or ambiguous published time string: %s',
    async (horarios) => {
      const { client } = createClient([
        { trip_id: 'trip-1', shape_id: 'shape-1', horarios }
      ]);
      const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { L4A: mapping });

      await expect(adapter.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
        kind: 'unavailable',
        reason: 'invalid'
      });
    }
  );

  it('rejects rows associated with a different public line', async () => {
    const { client } = createClient([
      { trip_id: 'trip-1', shape_id: 'shape-1', horarios: '08:00', linea: 'L7' }
    ]);
    const adapter = new MunicipalLineScheduleAdapter(client, clock, 'fixture', { L4A: mapping });

    await expect(adapter.getLineSchedule('L4A', 'weekday')).resolves.toEqual({
      kind: 'unavailable',
      reason: 'invalid'
    });
  });
});
