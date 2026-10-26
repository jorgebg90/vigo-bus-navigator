import { getDayService } from '../../domain/frequency';
import type { DayType, Timetable } from '../../domain/types';
import { translateCurrent } from '../../i18n';

export interface FrequencyViewOptions {
  lineCode: string;
  timetable?: Timetable;
  dayType: DayType;
  datasetVersion: string;
  onDayTypeChange?: (dayType: DayType) => void;
  onStopSelect?: (stopId: string) => void;
  onFavoriteToggle?: () => void;
}

const labels: Record<DayType, string> = {
  weekday: 'weekday',
  saturday: 'saturday',
  sunday_holiday: 'sundayHoliday'
};

export function renderLineFrequency(root: HTMLElement, options: FrequencyViewOptions): void {
  const service = options.timetable ? getDayService(options.timetable, options.dayType) : undefined;
  root.replaceChildren();
  root.className = 'app-view line-view';
  const heading = document.createElement('h1');
  heading.textContent = options.lineCode;
  root.append(heading);
  if (!options.timetable) {
    const unavailable = document.createElement('p');
    unavailable.textContent = translateCurrent('frequencyUnavailable');
    root.append(unavailable);
    if (options.onFavoriteToggle) {
      const favorite = document.createElement('button');
      favorite.type = 'button';
      favorite.textContent = translateCurrent('addFavorite');
      favorite.addEventListener('click', options.onFavoriteToggle);
      root.append(favorite);
    }
    return;
  }
  const dayTypeLabel = document.createElement('label');
  dayTypeLabel.textContent = translateCurrent('dayType');
  const dayTypeSelect = document.createElement('select');
  dayTypeSelect.setAttribute('aria-label', translateCurrent('dayType'));
  for (const [value, text] of Object.entries(labels) as [DayType, string][]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = translateCurrent(text as 'weekday' | 'saturday' | 'sundayHoliday');
    option.selected = value === options.dayType;
    dayTypeSelect.append(option);
  }
  dayTypeSelect.addEventListener('change', () => options.onDayTypeChange?.(dayTypeSelect.value as DayType));
  dayTypeLabel.append(dayTypeSelect);
  root.append(dayTypeLabel);
  if (options.onFavoriteToggle) {
    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.textContent = translateCurrent('addFavorite');
    favorite.addEventListener('click', options.onFavoriteToggle);
    root.append(favorite);
  }
  const metadata = document.createElement('p');
  metadata.textContent = `${translateCurrent(labels[options.dayType] as 'weekday' | 'saturday' | 'sundayHoliday')} · ${translateCurrent('dataset', { version: options.datasetVersion })}`;
  root.append(metadata);
  if (!service) {
    const empty = document.createElement('p');
    empty.textContent = translateCurrent('noService');
    root.append(empty);
    const nearestDay = (Object.keys(labels) as DayType[]).find((candidate) => candidate !== options.dayType && options.timetable?.byDayType[candidate]);
    if (nearestDay) {
      const nearest = document.createElement('button');
      nearest.type = 'button';
      nearest.dataset.nearestDay = nearestDay;
      nearest.textContent = translateCurrent('viewService', { dayType: translateCurrent(labels[nearestDay] as 'weekday' | 'saturday' | 'sundayHoliday') });
      nearest.addEventListener('click', () => options.onDayTypeChange?.(nearestDay));
      root.append(nearest);
    }
    return;
  }
  const table = document.createElement('table');
  table.innerHTML = `<thead><tr><th>${translateCurrent('timeBand')}</th><th>${translateCurrent('first')}</th><th>${translateCurrent('last')}</th><th>${translateCurrent('interval')}</th></tr></thead>`;
  const body = document.createElement('tbody');
  for (const band of service.bands) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${band.startMinute}-${band.endMinute}</td><td>${service.firstDeparture}</td><td>${service.lastDeparture}</td><td>${band.intervalMinutes}</td>`;
    body.append(row);
  }
  table.append(body);
  root.append(table);
  if (options.onStopSelect) {
    const stops = document.createElement('div');
    for (const stopId of service.stopIds) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = translateCurrent('stop', { id: stopId });
      button.addEventListener('click', () => options.onStopSelect?.(stopId));
      stops.append(button);
    }
    root.append(stops);
  }
}
