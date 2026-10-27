import type { StopArrivalsResult } from '../../application/get-stop-arrivals';
import { firstArrivalChanged, shouldAnnounceLoading } from '../../domain/freshness';
import type { Line } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { renderFavoriteToggle } from '../favorite-toggle';
import { createLineBadge, createLineBadges } from '../line-badge';

const STATUS_KEYS = {
  loading: 'statusLoading',
  current: 'statusCurrent',
  stale: 'statusStale',
  empty: 'statusEmpty',
  unavailable: 'statusUnavailable',
  offline: 'statusOffline'
} as const;

const loadingTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
const previousResults = new WeakMap<HTMLElement, StopArrivalsResult>();

export function renderStopArrivals(
  root: HTMLElement,
  result: StopArrivalsResult,
  onRetry?: () => void,
  favorite?: { saved: boolean; onToggle: () => void },
  lines?: Line[],
  lineColors?: ReadonlyMap<string, string | null>
): void {
  const previous = previousResults.get(root);
  const unchangedRefresh = Boolean(previous
    && previous.stop.id === result.stop.id
    && (previous.dataStatus === 'current' || previous.dataStatus === 'empty')
    && (result.dataStatus === 'current' || result.dataStatus === 'empty')
    && !firstArrivalChanged(previous.arrivals, result.arrivals));
  const changedFirstArrival = Boolean(previous
    && previous.stop.id === result.stop.id
    && (previous.dataStatus === 'current' || previous.dataStatus === 'empty')
    && (result.dataStatus === 'current' || result.dataStatus === 'empty')
    && firstArrivalChanged(previous.arrivals, result.arrivals));
  const previousStatusText = root.querySelector<HTMLElement>('[data-arrivals-status]')?.textContent;
  const loadingTimer = loadingTimers.get(root);
  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimers.delete(root);

  let status = root.querySelector<HTMLElement>('[data-arrivals-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.arrivalsStatus = 'true';
    status.setAttribute('role', 'status');
  }
  status.setAttribute('aria-live', result.dataStatus === 'loading' ? 'off' : 'polite');
  if (status.parentElement !== root) root.append(status);
  for (const child of Array.from(root.children)) {
    if (child !== status) child.remove();
  }

  status.dataset.freshness = result.dataStatus;
  const noLiveId = !result.stop.vitrasaId;
  status.dataset.stopState = noLiveId ? 'no-live-id' : result.dataStatus;
  const statusText = noLiveId
    ? translateCurrent('liveUnavailable')
    : result.dataStatus === 'loading'
      ? translateCurrent(STATUS_KEYS.loading)
      : `${translateCurrent(STATUS_KEYS[result.dataStatus as keyof typeof STATUS_KEYS])} · ${translateCurrent('updated', { time: result.fetchedAt })}${changedFirstArrival && result.arrivals[0] ? ` · ${translateCurrent('arrivalsTo', { line: result.arrivals[0].lineCode, destination: result.arrivals[0].destination, minutes: result.arrivals[0].minutes })}` : ''}`;
  status.textContent = unchangedRefresh && previousStatusText ? previousStatusText : statusText;
  root.append(status);
  const summary = document.createElement('div');
  summary.className = 'stop-arrivals-summary';
  const lineBadges = createLineBadges(result.stop.lineIds, lines ?? []);
  if (result.stop.lineIds.length) summary.append(lineBadges);
  if (favorite) {
    const favoriteHost = document.createElement('div');
    favoriteHost.dataset.favoriteToggle = 'true';
    favoriteHost.className = 'stop-arrivals-actions';
    renderFavoriteToggle(favoriteHost, { type: 'stop', name: result.stop.name, ...favorite });
    summary.append(favoriteHost);
  }
  if (summary.childElementCount) root.insertBefore(summary, status);
  if (result.dataStatus === 'loading') {
    const timer = setTimeout(() => {
      if (status?.dataset.freshness === 'loading' && shouldAnnounceLoading(3_000, false)) {
        status.setAttribute('aria-live', 'polite');
      }
      loadingTimers.delete(root);
    }, 3_000);
    loadingTimers.set(root, timer);
  }
  previousResults.set(root, result);
  if (onRetry && result.stop.vitrasaId && (result.dataStatus === 'unavailable' || result.dataStatus === 'stale')) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.dataset.nextAction = 'retry';
    retry.textContent = translateCurrent('retry');
    retry.addEventListener('click', onRetry);
    root.append(retry);
  }
  if (result.dataStatus === 'empty' || noLiveId) {
    const lines = document.createElement('a');
    lines.href = '#/lines';
    lines.dataset.nextAction = result.dataStatus === 'empty' ? 'serving-lines' : 'line-frequencies';
    lines.textContent = translateCurrent(result.dataStatus === 'empty' ? 'servingLines' : 'lineFrequencies');
    lines.addEventListener('click', (event) => {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('vbn:navigate', { detail: 'lines' }));
    });
    root.append(lines);
  }
  if (result.stop.lat === null || result.stop.lon === null) {
    const location = document.createElement('p');
    location.dataset.mapPosition = 'missing';
    location.textContent = translateCurrent('noMapPosition');
    root.append(location);
  }
  const list = document.createElement('ol');
  for (const arrival of result.arrivals) {
    const item = document.createElement('li');
    const destination = document.createElement('span');
    destination.className = 'arrival-destination';
    destination.textContent = arrival.destination;
    const minutes = document.createElement('strong');
    minutes.className = 'arrival-minutes';
    minutes.textContent = translateCurrent('minutes', { minutes: arrival.minutes });
    item.append(createLineBadge({ code: arrival.lineCode, color: lineColors?.get(arrival.lineCode) }), destination, minutes);
    list.append(item);
  }
  root.append(list);
}
