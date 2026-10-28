import { getDayService } from '../../domain/frequency';
import type {
  BundledScheduleSnapshot,
  DayType,
  Line,
  LineRoutePattern,
  Provenance,
  PublishedLineSchedule,
  RouteShapeReceipt,
  Timetable,
  TripStopSequence
} from '../../domain/types';
import type { MunicipalFailureReason } from '../../domain/municipal-failures';
import { translateCurrent } from '../../i18n';
import { renderFavoriteToggle } from '../favorite-toggle';
import { createLineBadge, createLineBadges } from '../line-badge';

export interface FrequencyViewOptions {
  lineCode: string;
  lineColor?: string | null;
  timetable?: Timetable;
  publishedSchedule?: PublishedLineSchedule;
  bundledScheduleSnapshots?: BundledScheduleSnapshot[];
  snapshotFallbackAttempted?: boolean;
  scheduleUnavailableReason?: MunicipalFailureReason;
  routeProvenance?: Provenance;
  routeShape?: RouteShapeReceipt;
  tripStops?: TripStopSequence;
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
const snapshotDateLabels = {
  publication: 'publicationDate',
  effective: 'effectiveDate',
  capture: 'captureDate'
} as const;

export function renderLineFrequency(root: HTMLElement, options: FrequencyViewOptions): void {
  const restoreDayTabFocus = root.contains(document.activeElement)
    && document.activeElement?.getAttribute('role') === 'tab';
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
  const createTabs = () => createDayTabs(options);
  const restoreTabsFocus = (tabList: HTMLElement) => {
    if (restoreDayTabFocus) {
      tabList.querySelector<HTMLButtonElement>(`[data-day-type="${options.dayType}"]`)?.focus();
    }
  };
  const appendRouteProvenance = () => {
    if (!options.routeProvenance) return;
    if (options.routeProvenance.kind === 'municipal') return;
    const source = document.createElement('p');
    source.dataset.routeProvenance = options.routeProvenance.kind;
    source.textContent = translateCurrent('bundledDiscoveryNotice', {
      date: options.routeProvenance.snapshotDate ?? ''
    });
    root.append(source);
  };
  if (!options.timetable) {
    const dayTabs = options.onDayTypeChange ? createTabs() : undefined;
    if (dayTabs) {
      root.append(dayTabs);
      restoreTabsFocus(dayTabs);
    }
    if (options.publishedSchedule) {
      if (options.publishedSchedule.provenance.kind !== 'municipal') {
        const source = document.createElement('p');
        source.dataset.scheduleProvenance = options.publishedSchedule.provenance.kind;
        source.textContent = translateCurrent(
          options.publishedSchedule.provenance.kind === 'provisional-fixture'
            ? 'provisionalScheduleSource'
            : 'scheduleSource',
          {
          source: options.publishedSchedule.provenance.kind === 'fixture'
            ? translateCurrent('syntheticData')
            : options.publishedSchedule.provenance.sourceName,
          time: formatReceivedDateTime(options.publishedSchedule.provenance.fetchedAt ?? '')
          }
        );
        root.append(source);
      }
      if (options.publishedSchedule.provenance.kind === 'provisional-fixture') {
        const warning = document.createElement('p');
        warning.dataset.provisionalWarning = 'true';
        warning.setAttribute('role', 'note');
        warning.textContent = translateCurrent('provisionalDataWarning');
        root.append(warning);
      }
      const heading = document.createElement('h2');
      heading.textContent = translateCurrent('lineDepartures');
      root.append(heading);
      const directions = groupDeparturesByDirection(options.publishedSchedule);
      if (options.publishedSchedule.departures.length === 0) {
        const noService = document.createElement('p');
        noService.dataset.noService = 'true';
        noService.textContent = translateCurrent('noPublishedService');
        root.append(noService);
      } else if (directions.length === 0) {
        root.append(createDepartureList(options.publishedSchedule.departures, translateCurrent('lineDepartures')));
      }
      for (const direction of directions) {
        const section = document.createElement('section');
        section.dataset.scheduleDirection = String(direction.direction);
        const directionHeading = document.createElement('h3');
        directionHeading.textContent = direction.headsign;
        section.append(
          directionHeading,
          createDepartureList(direction.departures, `${translateCurrent('lineDepartures')} · ${direction.headsign}`)
        );
        root.append(section);
      }
    } else if (options.bundledScheduleSnapshots?.length) {
      for (const snapshot of options.bundledScheduleSnapshots) {
        const direction = options.patterns?.find((pattern) => pattern.id === snapshot.directionId);
        const section = document.createElement('section');
        section.dataset.scheduleDirection = snapshot.directionId;
        const heading = document.createElement('h2');
        heading.textContent = direction?.headsign ?? snapshot.directionId;
        section.append(heading);
        const source = document.createElement('p');
        source.dataset.scheduleProvenance = 'snapshot';
        source.textContent = translateCurrent('bundledScheduleSnapshotSource', {
          source: snapshot.provenance.sourceName,
          dateKind: translateCurrent(snapshotDateLabels[snapshot.provenance.dateKind ?? 'capture']),
          date: snapshot.provenance.snapshotDate ?? '',
          line: snapshot.lineCode,
          direction: snapshot.directionId,
          dayType: translateCurrent(labels[snapshot.dayType] as 'weekday' | 'saturday' | 'sundayHoliday')
        });
        section.append(source);
        appendFrequencyTable(section, snapshot.lineCode, snapshot.dayType, snapshot.service);
        root.append(section);
      }
    } else {
      const unavailable = document.createElement('p');
      unavailable.dataset.scheduleStatus = options.snapshotFallbackAttempted
        ? 'snapshot-unavailable'
        : options.scheduleUnavailableReason ?? 'unavailable';
      unavailable.textContent = options.snapshotFallbackAttempted
        ? translateCurrent('snapshotScheduleUnavailable')
        : options.scheduleUnavailableReason === 'mapping-unverified'
          ? translateCurrent('scheduleMappingUnavailable')
          : translateCurrent('frequencyUnavailable');
      root.append(unavailable);
    }
    appendRouteProvenance();
    appendPatterns();
    appendProvisionalCandidateDetails(root, options);
    if (dayTabs) wrapDayPanel(root, dayTabs, options.dayType);
    return;
  }
  const dayTabs = createTabs();
  root.append(dayTabs);
  restoreTabsFocus(dayTabs);
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
    wrapDayPanel(root, dayTabs, options.dayType);
    return;
  }
  appendFrequencyTable(root, options.lineCode, options.dayType, service);
  appendRouteProvenance();
  appendPatterns();
  appendProvisionalCandidateDetails(root, options);
  wrapDayPanel(root, dayTabs, options.dayType);
}

function appendFrequencyTable(
  root: HTMLElement,
  lineCode: string,
  dayType: DayType,
  service: { firstDeparture: number; lastDeparture: number; bands: Array<{ startMinute: number; endMinute: number; intervalMinutes: number }> }
): void {
  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = translateCurrent('frequencyCaption', {
    line: lineCode,
    dayType: translateCurrent(labels[dayType] as 'weekday' | 'saturday' | 'sundayHoliday')
  });
  table.append(caption);
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const label of ['timeBand', 'firstDeparture', 'lastDeparture', 'interval'] as const) {
    const header = document.createElement('th');
    header.textContent = translateCurrent(label);
    headerRow.append(header);
  }
  head.append(headerRow);
  table.append(head);
  const body = document.createElement('tbody');
  const formatTime = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  for (const band of service.bands) {
    const row = document.createElement('tr');
    for (const value of [
      `${formatTime(band.startMinute)}-${formatTime(band.endMinute)}`,
      formatTime(service.firstDeparture),
      formatTime(service.lastDeparture),
      String(band.intervalMinutes)
    ]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
  table.append(body);
  root.append(table);
}

interface DirectionDepartures {
  direction: 0 | 1;
  headsign: string;
  departures: string[];
}

function groupDeparturesByDirection(schedule: PublishedLineSchedule): DirectionDepartures[] {
  const groups = new Map<0 | 1, { headsign: string; headsignWeight: number; departures: Set<string> }>();
  for (const trip of schedule.trips ?? []) {
    const weight = (trip.active ? 100000 : 0) + trip.departures.length;
    const group = groups.get(trip.direction) ?? { headsign: trip.headsign, headsignWeight: -1, departures: new Set<string>() };
    if (weight > group.headsignWeight) {
      group.headsign = trip.headsign;
      group.headsignWeight = weight;
    }
    for (const time of trip.departures) group.departures.add(time);
    groups.set(trip.direction, group);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .filter(([, group]) => group.departures.size > 0)
    .map(([direction, group]) => ({ direction, headsign: group.headsign, departures: [...group.departures].sort() }));
}

function createDepartureList(times: readonly string[], label: string): HTMLOListElement {
  const departures = document.createElement('ol');
  departures.dataset.lineDepartures = 'true';
  departures.setAttribute('aria-label', label);
  for (const time of times) {
    const item = document.createElement('li');
    item.textContent = time;
    departures.append(item);
  }
  return departures;
}

function formatReceivedDateTime(value: string): string {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return '';
  const language = document.documentElement.lang as 'es' | 'gl' | 'en';
  const locale = { es: 'es-ES', gl: 'gl-ES', en: 'en-GB' }[language] ?? 'es-ES';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
}

function appendProvisionalCandidateDetails(root: HTMLElement, options: FrequencyViewOptions): void {
  if (options.routeShape) {
    const section = document.createElement('section');
    section.dataset.routeShape = options.routeShape.shapeId;
    const isMunicipalShape = options.routeShape.provenance.kind === 'municipal';
    const describedByStops = isMunicipalShape && (options.patterns?.length ?? 0) > 0;
    const heading = document.createElement('h2');
    heading.textContent = translateCurrent(isMunicipalShape ? 'routeShape' : 'routeShapePreview');
    section.append(heading);
    appendCandidateSource(section, options.routeShape.provenance);
    appendProvisionalWarning(section, options.routeShape.provenance.kind);
    const textAlternative = document.createElement('p');
    textAlternative.dataset.routeShapeTextAlternative = describedByStops ? 'route-stops' : 'unavailable';
    textAlternative.textContent = translateCurrent(
      describedByStops ? 'routeShapeStopsAlternative' : 'routeShapeTextAlternative'
    );
    section.append(textAlternative);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('provisional-route-shape');
    svg.setAttribute('viewBox', '0 0 1000 500');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const coordinates = options.routeShape.geometry.coordinates;
    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);
    const minLongitude = Math.min(...longitudes);
    const longitudeSpan = Math.max(...longitudes) - minLongitude || 1;
    const minLatitude = Math.min(...latitudes);
    const latitudeSpan = Math.max(...latitudes) - minLatitude || 1;
    const points = coordinates.map(([longitude, latitude]) => {
      const x = ((longitude - minLongitude) / longitudeSpan) * 1000;
      const y = 500 - ((latitude - minLatitude) / latitudeSpan) * 500;
      return `${x},${y}`;
    }).join(' ');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', 'currentColor');
    polyline.setAttribute('stroke-width', '8');
    svg.append(polyline);
    section.append(svg);
    root.append(section);
  }

  if (options.tripStops) {
    const section = document.createElement('section');
    section.dataset.tripStopSequence = options.tripStops.tripId;
    const heading = document.createElement('h2');
    heading.textContent = translateCurrent('tripStopSequence');
    section.append(heading);
    appendCandidateSource(section, options.tripStops.provenance);
    appendProvisionalWarning(section, options.tripStops.provenance.kind);
    const list = document.createElement('ol');
    list.setAttribute('aria-label', translateCurrent('tripStopSequence'));
    for (const { stop } of options.tripStops.stops) {
      const item = document.createElement('li');
      item.textContent = stop.name;
      list.append(item);
    }
    section.append(list);
    root.append(section);
  }
}

function createDayTabs(options: FrequencyViewOptions): HTMLElement {
  const tabs = document.createElement('div');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', translateCurrent('dayType'));
  const tabValues = Object.keys(labels) as DayType[];
  const tabButtons = tabValues.map((value) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(value === options.dayType));
    tab.tabIndex = value === options.dayType ? 0 : -1;
    tab.id = `line-day-tab-${value}`;
    tab.setAttribute('aria-controls', 'line-day-panel');
    tab.dataset.dayType = value;
    tab.textContent = translateCurrent(labels[value] as 'weekday' | 'saturday' | 'sundayHoliday');
    tab.addEventListener('click', () => options.onDayTypeChange?.(value));
    tab.addEventListener('keydown', (event) => {
      const currentIndex = tabButtons.indexOf(tab);
      let nextIndex: number | undefined;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabButtons.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      const nextTab = tabButtons[nextIndex];
      for (const candidate of tabButtons) candidate.tabIndex = candidate === nextTab ? 0 : -1;
      nextTab?.focus();
    });
    tabs.append(tab);
    return tab;
  });
  return tabs;
}

function wrapDayPanel(root: HTMLElement, tabs: HTMLElement, dayType: DayType): void {
  const heading = root.querySelector('h1');
  const selectedTab = tabs.querySelector<HTMLButtonElement>(`[data-day-type="${dayType}"]`);
  const panel = document.createElement('div');
  panel.id = 'line-day-panel';
  panel.setAttribute('role', 'tabpanel');
  panel.tabIndex = 0;
  if (selectedTab) panel.setAttribute('aria-labelledby', selectedTab.id);

  for (const child of Array.from(root.childNodes)) {
    if (child !== heading && child !== tabs) panel.append(child);
  }
  root.append(panel);
}

function appendCandidateSource(section: HTMLElement, provenance: Provenance): void {
  if (provenance.kind === 'municipal') return;
  const source = document.createElement('p');
  source.dataset.provenanceSource = provenance.kind;
  source.textContent = translateCurrent(
    provenance.kind === 'provisional-fixture' ? 'provisionalSourceLabel' : 'sourceLabel',
    { source: provenance.sourceName }
  );
  section.append(source);
}

function appendProvisionalWarning(root: HTMLElement, provenanceKind: Provenance['kind']): void {
  if (provenanceKind !== 'provisional-fixture') return;
  const warning = document.createElement('p');
  warning.dataset.provisionalWarning = 'true';
  warning.setAttribute('role', 'note');
  warning.textContent = translateCurrent('provisionalDataWarning');
  root.append(warning);
}
