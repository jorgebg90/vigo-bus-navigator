import { getDayService } from '../../domain/frequency';
import type { DayType, Line, LineRoutePattern, Timetable } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { renderFavoriteToggle } from '../favorite-toggle';
import { createLineBadge, createLineBadges } from '../line-badge';

export interface FrequencyViewOptions {
  lineCode: string;
  lineColor?: string | null;
  timetable?: Timetable;
  patterns?: LineRoutePattern[];
  lines?: Line[];
  favoriteStopIds?: string[];
  dayType: DayType;
  onDayTypeChange?: (dayType: DayType) => void;
  onStopSelect?: (stopId: string) => void;
  onStopFavoriteToggle?: (stopId: string) => void;
}

const labels: Record<DayType, string> = {
  weekday: 'weekday',
  saturday: 'saturday',
  sunday_holiday: 'sundayHoliday'
};

export function renderLineFrequency(root: HTMLElement, options: FrequencyViewOptions): void {
  const service = options.timetable ? getDayService(options.timetable, options.dayType) : undefined;
  root.replaceChildren();
  root.classList.add('line-view');
  const heading = document.createElement('h1');
  heading.append(createLineBadge({ code: options.lineCode, color: options.lineColor }));
  root.append(heading);
  const appendPatterns = () => {
    for (const pattern of options.patterns ?? []) {
      const direction = document.createElement('section');
      direction.dataset.routePattern = pattern.id;
      const headsign = document.createElement('h2');
      headsign.textContent = pattern.headsign;
      const stopList = document.createElement('ol');
      stopList.setAttribute('aria-label', `${translateCurrent('stops')} · ${pattern.headsign}`);
      for (const stopId of pattern.stopIds) {
        const stop = pattern.stops.find((candidate) => candidate.id === stopId);
        if (!stop?.name.trim()) continue;
        const item = document.createElement('li');
        item.dataset.routeStop = stop.id;
        const info = document.createElement('div');
        info.className = 'route-stop-info';
        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'stop-open';
        open.textContent = stop.name;
        open.addEventListener('click', () => options.onStopSelect?.(stop.id));
        info.append(open, createLineBadges(stop.lineIds, options.lines ?? []));
        item.append(info);
        if (options.onStopFavoriteToggle) {
          const favorite = document.createElement('div');
          renderFavoriteToggle(favorite, {
            type: 'stop',
            name: stop.name,
            saved: options.favoriteStopIds?.includes(stop.id) ?? false,
            onToggle: () => options.onStopFavoriteToggle?.(stop.id)
          });
          item.append(favorite);
        }
        stopList.append(item);
      }
      direction.append(headsign, stopList);
      root.append(direction);
    }
  };
  if (!options.timetable) {
    const unavailable = document.createElement('p');
    unavailable.textContent = translateCurrent('frequencyUnavailable');
    root.append(unavailable);
    appendPatterns();
    return;
  }
  const tabs = document.createElement('div');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', translateCurrent('dayType'));
  for (const [value, text] of Object.entries(labels) as [DayType, string][]) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(value === options.dayType));
    tab.dataset.dayType = value;
    tab.textContent = translateCurrent(text as 'weekday' | 'saturday' | 'sundayHoliday');
    tab.addEventListener('click', () => options.onDayTypeChange?.(value));
    tabs.append(tab);
  }
  root.append(tabs);
  const metadata = document.createElement('p');
  metadata.textContent = translateCurrent(labels[options.dayType] as 'weekday' | 'saturday' | 'sundayHoliday');
  root.append(metadata);
  if (!service) {
    const empty = document.createElement('p');
    empty.textContent = translateCurrent('noPublishedService');
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
    appendPatterns();
    return;
  }
  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = translateCurrent('frequencyCaption', {
    line: options.lineCode,
    dayType: translateCurrent(labels[options.dayType] as 'weekday' | 'saturday' | 'sundayHoliday')
  });
  table.append(caption);
  table.innerHTML += `<thead><tr><th>${translateCurrent('timeBand')}</th><th>${translateCurrent('firstDeparture')}</th><th>${translateCurrent('lastDeparture')}</th><th>${translateCurrent('interval')}</th></tr></thead>`;
  const body = document.createElement('tbody');
  const formatTime = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  for (const band of service.bands) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${formatTime(band.startMinute)}-${formatTime(band.endMinute)}</td><td>${formatTime(service.firstDeparture)}</td><td>${formatTime(service.lastDeparture)}</td><td>${band.intervalMinutes}</td>`;
    body.append(row);
  }
  table.append(body);
  root.append(table);
  appendPatterns();
}
