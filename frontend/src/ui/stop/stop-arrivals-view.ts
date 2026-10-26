import type { StopArrivalsResult } from '../../application/get-stop-arrivals';
import { translateCurrent } from '../../i18n';

const STATUS_KEYS = {
  loading: 'statusLoading',
  current: 'statusCurrent',
  stale: 'statusStale',
  empty: 'statusEmpty',
  unavailable: 'statusUnavailable'
} as const;

export function renderStopArrivals(root: HTMLElement, result: StopArrivalsResult, onRetry?: () => void): void {
  let status = root.querySelector<HTMLElement>('[data-arrivals-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.arrivalsStatus = 'true';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
  }
  if (status.parentElement !== root) root.append(status);
  for (const child of Array.from(root.children)) {
    if (child !== status) child.remove();
  }

  const heading = document.createElement('h1');
  heading.textContent = result.stop.name;
  root.insertBefore(heading, status);
  if (result.stop.vitrasaId) {
    const privacy = document.createElement('p');
    privacy.dataset.arrivalsPrivacy = 'true';
    privacy.textContent = translateCurrent('arrivalsPrivacyNotice');
    root.insertBefore(privacy, status);
  }
  status.dataset.freshness = result.dataStatus;
  const statusText = result.dataStatus === 'unavailable'
    ? translateCurrent(STATUS_KEYS.unavailable)
    : result.dataStatus === 'loading'
      ? translateCurrent(STATUS_KEYS.loading)
      : `${translateCurrent(STATUS_KEYS[result.dataStatus as keyof typeof STATUS_KEYS])} · ${translateCurrent('updated', { time: result.fetchedAt })}`;
  status.textContent = statusText;
  root.append(status);
  if (onRetry && result.stop.vitrasaId && (result.dataStatus === 'unavailable' || result.dataStatus === 'stale')) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = translateCurrent('retry');
    retry.addEventListener('click', onRetry);
    root.append(retry);
  }
  const list = document.createElement('ul');
  for (const arrival of result.arrivals) {
    const item = document.createElement('li');
    item.textContent = translateCurrent('arrivalsTo', { line: arrival.lineCode, destination: arrival.destination, minutes: arrival.minutes });
    list.append(item);
  }
  root.append(list);
}
