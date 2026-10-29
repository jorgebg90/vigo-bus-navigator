import type { DayType } from './types';

export function deriveDayType(date: Date, holidays: string[]): DayType {
  const isoDate = date.toISOString().slice(0, 10);
  if (holidays.includes(isoDate)) return 'sunday_holiday';
  const day = date.getUTCDay();
  if (day === 6) return 'saturday';
  if (day === 0) return 'sunday_holiday';
  return 'weekday';
}
