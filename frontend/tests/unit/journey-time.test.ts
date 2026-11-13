import { describe, expect, it } from 'vitest';
import { currentMadridLocalDateTime, parseMadridLocalDateTime } from '../../src/domain/journey-time';

describe('Europe/Madrid journey time', () => {
  it('converts an unambiguous local departure time using the Madrid offset', () => {
    expect(parseMadridLocalDateTime('2026-01-15T12:30')).toBe(Date.UTC(2026, 0, 15, 11, 30));
    expect(parseMadridLocalDateTime('2026-07-15T12:30')).toBe(Date.UTC(2026, 6, 15, 10, 30));
  });

  it('rejects invalid and daylight-saving gap or ambiguous local times', () => {
    expect(parseMadridLocalDateTime('2026-02-30T12:00')).toBeNull();
    expect(parseMadridLocalDateTime('2026-03-29T02:30')).toBeNull();
    expect(parseMadridLocalDateTime('2026-10-25T02:30')).toBeNull();
  });

  it('formats the current value in Europe/Madrid regardless of browser timezone', () => {
    expect(currentMadridLocalDateTime(Date.UTC(2026, 0, 15, 11, 30))).toBe('2026-01-15T12:30');
  });
});
