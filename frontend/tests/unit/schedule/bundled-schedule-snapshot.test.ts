import { describe, expect, it } from 'vitest';
import { BundledScheduleSnapshotCatalog } from '../../../src/infrastructure/schedule/bundled-schedule-snapshot';

const service = {
  firstDeparture: 360,
  lastDeparture: 1380,
  bands: [{ startMinute: 360, endMinute: 1380, intervalMinutes: 12 }],
  stopIds: ['stop-1', 'stop-2']
};
const provenance = {
  kind: 'snapshot',
  sourceName: 'Vigo municipal timetable publication',
  evidenceRef: 'https://example.test/timetables/2026',
  snapshotDate: '2026-10-25',
  dateKind: 'publication'
};
const target = {
  lineId: 'line-4a',
  lineCode: 'L4A',
  directionId: 'outbound',
  dayType: 'weekday',
  service,
  provenance
};

describe('BundledScheduleSnapshotCatalog', () => {
  it('selects only the exact line, day, and direction with dated source evidence', () => {
    const catalog = new BundledScheduleSnapshotCatalog([
      { ...target, dayType: 'saturday' },
      { ...target, directionId: 'inbound' },
      target
    ]);

    expect(catalog.getExact('line-4a', 'L4A', 'outbound', 'weekday')).toEqual({
      kind: 'success',
      value: target
    });
  });

  it.each([
    ['line', 'other-line', 'L4A', 'outbound', 'weekday'],
    ['public line code', 'line-4a', 'L7', 'outbound', 'weekday'],
    ['direction', 'line-4a', 'L4A', 'inbound', 'weekday'],
    ['day', 'line-4a', 'L4A', 'outbound', 'saturday']
  ] as const)('does not borrow a snapshot for a different %s', (_case, lineId, lineCode, directionId, dayType) => {
    const catalog = new BundledScheduleSnapshotCatalog([target]);

    expect(catalog.getExact(lineId, lineCode, directionId, dayType)).toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
  });

  it('rejects duplicate exact matches rather than selecting ambiguously', () => {
    const catalog = new BundledScheduleSnapshotCatalog([target, target]);

    expect(catalog.getExact('line-4a', 'L4A', 'outbound', 'weekday')).toEqual({
      kind: 'unavailable',
      reason: 'mapping-unverified'
    });
  });

  it.each([
    ['missing source', { ...provenance, sourceName: '' }],
    ['missing evidence', { ...provenance, evidenceRef: '' }],
    ['missing date', { ...provenance, snapshotDate: undefined }],
    ['invalid date', { ...provenance, snapshotDate: '2026-02-30' }],
    ['generated-at-only provenance', { kind: 'snapshot', sourceName: 'Legacy fixture', generatedAt: '2026-10-25T00:00:00Z' }]
  ])('fails closed for %s provenance', (_case, untrustedProvenance) => {
    const catalog = new BundledScheduleSnapshotCatalog([{ ...target, provenance: untrustedProvenance }]);

    expect(catalog.getExact('line-4a', 'L4A', 'outbound', 'weekday')).toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });

  it('rejects malformed or incomplete frequency data', () => {
    const catalog = new BundledScheduleSnapshotCatalog([
      { ...target, service: { ...service, bands: [] } }
    ]);

    expect(catalog.getExact('line-4a', 'L4A', 'outbound', 'weekday')).toEqual({
      kind: 'unavailable',
      reason: 'identity-unverified'
    });
  });
});
