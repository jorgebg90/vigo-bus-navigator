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
const retryButtons = new WeakMap<HTMLElement, HTMLButtonElement>();
const refreshButtons = new WeakMap<HTMLElement, HTMLButtonElement>();
const explicitRefreshPending = new WeakMap<HTMLElement, boolean>();
const timeLocales = { es: 'es-ES', gl: 'gl-ES', en: 'en-GB' } as const;

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
  if (result.retryPending) explicitRefreshPending.set(root, true);
  const isExplicitRefreshComplete = !result.retryPending && explicitRefreshPending.get(root) === true;
  if (isExplicitRefreshComplete) explicitRefreshPending.delete(root);
  const loadingTimer = loadingTimers.get(root);
  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimers.delete(root);

  let status = root.querySelector<HTMLElement>('[data-arrivals-status]');
  const existingRetry = retryButtons.get(root);
  const existingRefresh = refreshButtons.get(root);
  const statusRow = status?.closest<HTMLElement>('[data-arrivals-status-row]')
    ?? document.createElement('div');
  statusRow.dataset.arrivalsStatusRow = 'true';
  const showRetry = Boolean(
    onRetry
    && result.stop.vitrasaId
    && (result.dataStatus === 'unavailable' || result.dataStatus === 'stale')
  );
  const preservedRetry = showRetry ? existingRetry : undefined;
  const showRefresh = Boolean(
    onRetry
    && result.stop.vitrasaId
    && ['current', 'empty', 'loading'].includes(result.dataStatus)
  );
  const preservedRefresh = showRefresh ? existingRefresh : undefined;
  if (!status) {
    status = document.createElement('p');
    status.dataset.arrivalsStatus = 'true';
    status.setAttribute('role', 'status');
  }
  status.setAttribute('aria-live', result.dataStatus === 'loading' ? 'off' : 'polite');
  for (const child of Array.from(root.children)) {
    if (child !== statusRow && child !== preservedRetry) child.remove();
  }

  status.dataset.freshness = result.dataStatus;
  const noLiveId = !result.stop.vitrasaId;
  status.dataset.stopState = noLiveId ? 'no-live-id' : result.dataStatus;
  const isFixture = result.provenance?.kind === 'fixture';
  const freshnessText = isFixture && result.dataStatus === 'current'
    ? translateCurrent('syntheticData')
    : translateCurrent(STATUS_KEYS[result.dataStatus as keyof typeof STATUS_KEYS]);
  const provenanceText = isFixture && result.dataStatus !== 'current'
    ? ` · ${translateCurrent('syntheticData')}`
    : '';
  const freshnessPrefix = result.dataStatus === 'current' && !isFixture ? '' : freshnessText;
  const statusText = noLiveId
    ? translateCurrent('liveUnavailable')
    : result.dataStatus === 'loading'
      ? translateCurrent(STATUS_KEYS.loading)
      : `${freshnessPrefix}${freshnessPrefix ? ' · ' : ''}${provenanceText}${provenanceText ? ' · ' : ''}${translateCurrent('updated', { time: formatUpdatedTime(result.fetchedAt) })}${changedFirstArrival && result.arrivals[0] ? ` · ${translateCurrent('arrivalsTo', { line: result.arrivals[0].lineCode, destination: result.arrivals[0].destination, minutes: result.arrivals[0].minutes })}` : ''}`;
  status.textContent = unchangedRefresh
    && !isExplicitRefreshComplete
    && previousStatusText
    ? previousStatusText
    : statusText;
  if (showRefresh && onRetry) {
    const refresh = preservedRefresh ?? createRefreshButton();
    refresh.setAttribute('aria-label', translateCurrent('refreshArrivals'));
    refresh.setAttribute('aria-disabled', String(result.dataStatus === 'loading' || result.retryPending === true));
    refresh.onclick = () => {
      if (refresh.getAttribute('aria-disabled') !== 'true') onRetry();
    };
    refreshButtons.set(root, refresh);
    if (
      status.parentElement !== statusRow
      || refresh.parentElement !== statusRow
      || statusRow.firstElementChild !== status
      || statusRow.lastElementChild !== refresh
    ) {
      statusRow.append(status, refresh);
    }
  } else if (existingRefresh) {
    existingRefresh.remove();
    refreshButtons.delete(root);
    statusRow.append(status);
  } else {
    statusRow.append(status);
  }
  if (statusRow.parentElement !== root) root.append(statusRow);
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

  function formatUpdatedTime(value: string): string {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return '';
    const language = document.documentElement.lang as keyof typeof timeLocales;
    const locale = timeLocales[language] ?? timeLocales.es;
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function createRefreshButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.refreshArrivals = 'true';
    button.className = 'arrivals-refresh';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20 7v5h-5M4 17v-5h5m-4.1-3a8 8 0 0 1 13.2-2L20 12M4 12l1.9 5a8 8 0 0 0 13.2-2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    icon.append(path);
    button.append(icon);
    return button;
  }
  if (summary.childElementCount) root.insertBefore(summary, statusRow);
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
  if (showRetry && onRetry) {
    const retry = preservedRetry ?? document.createElement('button');
    retry.type = 'button';
    retry.dataset.nextAction = 'retry';
    retry.textContent = translateCurrent('retry');
    retry.setAttribute('aria-disabled', String(result.retryPending === true));
    retry.onclick = () => {
      if (retry.getAttribute('aria-disabled') !== 'true') onRetry();
    };
    if (!preservedRetry) root.append(retry);
    retryButtons.set(root, retry);
  } else if (existingRetry) {
    existingRetry.remove();
    retryButtons.delete(root);
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
