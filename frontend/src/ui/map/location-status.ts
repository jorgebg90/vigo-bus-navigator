import { translateCurrent } from '../../i18n';

export type LocationStatusMessage = 'no-nearby-stops' | 'unavailable' | 'outside-coverage';

const messageKeys = {
  'no-nearby-stops': 'locationNoNearbyStops',
  unavailable: 'locationUnavailable',
  'outside-coverage': 'locationOutsideCoverage'
} as const;

export interface LocationStatusOptions {
  mobile?: boolean;
}

export function renderLocationStatus(
  root: HTMLElement,
  status: LocationStatusMessage | null,
  options: LocationStatusOptions = {}
): void {
  root.querySelector('[data-location-status]')?.remove();
  if (!status) return;
  if (options.mobile && status !== 'no-nearby-stops') return;

  const region = document.createElement('p');
  region.dataset.locationStatus = status;
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.textContent = translateCurrent(messageKeys[status]);
  root.append(region);
}
