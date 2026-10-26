import { describe, expect, it } from 'vitest';
import { normalizeSourceRows } from '../src/normalize';

const generatedAt = '2026-10-26T10:00:00.000Z';

describe('normalizeSourceRows', () => {
  it('normalizes decoded text, preserves complete line codes, and computes ETA', () => {
    expect(normalizeSourceRows([
      { lineCode: '12B', destination: ' HOSPITAL MEIXOEIRO ', minutesText: '1' }
    ], generatedAt)).toEqual([
      {
        lineCode: '12B',
        destination: 'HOSPITAL MEIXOEIRO',
        minutes: 1,
        eta: '2026-10-26T10:01:00.000Z'
      }
    ]);
  });

  it('repairs mojibake in the source text', () => {
    expect(normalizeSourceRows([
      { lineCode: '4A', destination: 'PRAZA DE AMÃ‰RICA', minutesText: '4' }
    ], generatedAt)[0].destination).toBe('PRAZA DE AMÉRICA');
  });

  it('sorts by minutes then destination and removes exact duplicates stably', () => {
    expect(normalizeSourceRows([
      { lineCode: '4A', destination: 'ZARAGOZA', minutesText: '8' },
      { lineCode: '11', destination: 'CABRAL', minutesText: '3' },
      { lineCode: '4A', destination: 'ARAGON', minutesText: '8' },
      { lineCode: '11', destination: 'CABRAL', minutesText: '3' }
    ], generatedAt).map(({ lineCode, destination, minutes }) => [lineCode, destination, minutes])).toEqual([
      ['11', 'CABRAL', 3],
      ['4A', 'ARAGON', 8],
      ['4A', 'ZARAGOZA', 8]
    ]);
  });

  it.each([
    ['empty line code', { lineCode: ' ', destination: 'DESTINATION', minutesText: '1' }],
    ['empty destination', { lineCode: '4A', destination: ' ', minutesText: '1' }],
    ['nonnumeric minutes', { lineCode: '4A', destination: 'DESTINATION', minutesText: 'soon' }],
    ['negative minutes', { lineCode: '4A', destination: 'DESTINATION', minutesText: '-1' }],
    ['out-of-range minutes', { lineCode: '4A', destination: 'DESTINATION', minutesText: '1441' }]
  ])('fails the complete normalization for %s', (_description, row) => {
    expect(() => normalizeSourceRows([
      { lineCode: '12B', destination: 'VALID', minutesText: '2' },
      row
    ], generatedAt)).toThrow();
  });

  it('fails for invalid timestamps instead of emitting invalid ETA values', () => {
    expect(() => normalizeSourceRows([
      { lineCode: '4A', destination: 'DESTINATION', minutesText: '1' }
    ], 'not-a-date')).toThrow();
  });
});