import { translateCurrent } from '../../i18n';

export type LocationStatusMessage = 'no-nearby-stops' | 'unavailable' | 'outside-coverage';

const messageKeys = {
  'no-nearby-stops': 'locationNoNearbyStops',
  unavailable: 'locationUnavailable',
  'outside-coverage': 'locationOutsideCoverage'
} as const;

export function renderLocationStatus(root: HTMLElement, status: LocationStatusMessage | null): void {
  root.querySelector('[data-location-status]')?.remove();
  if (!status) return;

  const region = document.createElement('p');
  region.dataset.locationStatus = status;
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.textContent = translateCurrent(messageKeys[status]);
  root.append(region);
}
