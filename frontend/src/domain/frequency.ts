import type { DayService, DayType, Timetable } from './types';

export function getDayService(timetable: Timetable, dayType: DayType): DayService | undefined {
  return timetable.byDayType[dayType];
}

export function validateDayService(service: DayService): void {
  if (service.firstDeparture < 0 || service.lastDeparture < service.firstDeparture) {
    throw new Error('Invalid departure range');
  }
  let previousEnd = -1;
  for (const band of service.bands) {
    if (band.startMinute < previousEnd || band.endMinute <= band.startMinute || band.intervalMinutes <= 0) {
      throw new Error('Invalid time band');
    }
    if (service.firstDeparture < band.startMinute || service.lastDeparture > band.endMinute) {
      throw new Error('Departure outside time bands');
    }
    previousEnd = band.endMinute;
  }
}
