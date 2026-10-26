import { describe, expect, it } from 'vitest';
import { deriveDayType } from '../../src/domain/day-type';

describe('deriveDayType', () => {
  it('distinguishes weekday, Saturday, and Sunday', () => {
    expect(deriveDayType(new Date('2026-10-23T12:00:00Z'), [])).toBe('weekday');
    expect(deriveDayType(new Date('2026-10-24T12:00:00Z'), [])).toBe('saturday');
    expect(deriveDayType(new Date('2026-10-25T12:00:00Z'), [])).toBe('sunday_holiday');
  });

  it('gives holidays Sunday/holiday precedence', () => {
    expect(deriveDayType(new Date('2026-10-24T12:00:00Z'), ['2026-10-24'])).toBe('sunday_holiday');
  });
});
