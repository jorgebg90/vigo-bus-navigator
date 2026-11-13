import type { AddressSearchResult, AddressSuggestion } from '../../domain/journey-address';
import type { JourneySearchOutcome } from '../../application/search-journeys';
import type { EndpointStopCandidate, JourneyPoint } from '../../domain/journey';
import { translateCurrent } from '../../i18n';
import { createIcon } from '../icons';
import type { JourneyPlace, TransitJourney } from '../../domain/transit-journey';
import { renderJourneyResults } from './journey-results-view';

export type JourneyEndpoint = 'origin' | 'destination';

export interface JourneySearchViewOptions {
  origin: JourneyPoint | null;
  destination: JourneyPoint | null;
  originLabel: string;
  destinationLabel: string;
  departureLocal: string;
  outcome: JourneySearchOutcome | null;
  selectedOriginStopId: string | null;
  selectedDestinationStopId: string | null;
  notice: 'location-unavailable' | 'point-outside' | null;
  selectedJourneyId?: string;
  onJourneySelect?: (journey: TransitJourney) => void;
  onPlaceSelect?: (place: JourneyPlace) => void;
  onDepartureEdit?: (departureLocal: string) => void;
  onSwapEndpoints: () => void;
  onAddressEdit: (endpoint: JourneyEndpoint, query: string) => void;
  onAddressSearch: (query: string, signal: AbortSignal) => Promise<AddressSearchResult>;
  onAddressSelect: (endpoint: JourneyEndpoint, suggestion: AddressSuggestion) => void;
  onCandidateSelect: (endpoint: JourneyEndpoint, candidate: EndpointStopCandidate) => void;
  onUseLocation: () => void;
  onSearch: (departureLocal: string) => void;
}

export function renderJourneySearch(root: HTMLElement, options: JourneySearchViewOptions): void {
  root.dispatchEvent(new Event('journey-view-dispose'));
  root.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = translateCurrent('journeySearchTitle');
  root.append(heading);

  const content = document.createElement('section');
  content.className = 'journey-search';
  const mode = document.createElement('p');
  mode.className = 'journey-mode';
  mode.dataset.journeyMode = 'bus';
  mode.append(createIcon('bus'), document.createTextNode(translateCurrent('journeyModeBus')));
  content.append(mode);

  const form = document.createElement('form');
  form.dataset.journeySearch = 'true';
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const departureInput = form.querySelector<HTMLInputElement>('[data-journey-departure]');
    if (departureInput) options.onSearch(departureInput.value);
  });

  const endpoints = document.createElement('div');
  endpoints.className = 'journey-endpoints';
  const submitButton = document.createElement('button');
  let hasOrigin = options.origin !== null;
  let hasDestination = options.destination !== null;
  let hasOriginText = options.originLabel.length > 0;
  let hasDestinationText = options.destinationLabel.length > 0;
  let swapButton: HTMLButtonElement | undefined;
  const onPointChange = (endpoint: JourneyEndpoint, query: string) => {
    if (endpoint === 'origin') {
      hasOrigin = false;
      hasOriginText = query.trim().length > 0;
    } else {
      hasDestination = false;
      hasDestinationText = query.trim().length > 0;
    }
    submitButton.disabled = !hasOrigin || !hasDestination;
    submitButton.textContent = translateCurrent('journeyRouteSearch');
    if (swapButton) swapButton.disabled = !hasOriginText && !hasDestinationText;
  };
  const originEndpoint = renderEndpoint('origin', options.origin, options.originLabel, options, onPointChange);
  const destinationEndpoint = renderEndpoint('destination', options.destination, options.destinationLabel, options, onPointChange);
  swapButton = document.createElement('button');
  swapButton.type = 'button';
  swapButton.className = 'journey-swap';
  swapButton.dataset.journeySwap = 'true';
  swapButton.disabled = !hasOriginText && !hasDestinationText;
  swapButton.setAttribute('aria-label', translateCurrent('journeySwapEndpoints'));
  swapButton.title = translateCurrent('journeySwapEndpoints');
  swapButton.append(createIcon('swap'));
  swapButton.addEventListener('click', options.onSwapEndpoints);
  endpoints.append(
    originEndpoint,
    swapButton,
    destinationEndpoint
  );
  form.append(endpoints);

  const endpointActions = document.createElement('div');
  endpointActions.className = 'journey-endpoint-actions';
  const locationButton = document.createElement('button');
  locationButton.type = 'button';
  locationButton.dataset.journeyUseLocation = 'true';
  locationButton.textContent = translateCurrent('journeyUseCurrentLocation');
  locationButton.addEventListener('click', options.onUseLocation);
  endpointActions.append(locationButton);
  form.append(endpointActions);

  const departureLabel = document.createElement('label');
  departureLabel.className = 'journey-departure';
  departureLabel.textContent = translateCurrent('journeyDepartureTime');
  const departureInput = document.createElement('input');
  departureInput.type = 'datetime-local';
  departureInput.required = true;
  departureInput.value = options.departureLocal;
  departureInput.dataset.journeyDeparture = 'true';
  departureInput.addEventListener('input', () => {
    options.onDepartureEdit?.(departureInput.value);
    content.querySelector('[data-journey-options]')?.remove();
    content.querySelector('[data-journey-data-status]')?.remove();
    submitButton.disabled = !hasOrigin || !hasDestination;
    submitButton.textContent = translateCurrent('journeyRouteSearch');
  });
  departureLabel.append(departureInput);
  form.append(departureLabel);

  submitButton.type = 'submit';
  submitButton.dataset.journeySubmit = 'true';
  submitButton.textContent = translateCurrent(options.outcome?.status === 'loading' ? 'journeyLoading' : 'journeyRouteSearch');
  submitButton.disabled = !options.origin || !options.destination || options.outcome?.status === 'loading';
  form.append(submitButton);
  content.append(form);
  if (options.outcome && options.outcome.status !== 'invalid' && options.outcome.status !== 'loading') {
    const candidateDetails = document.createElement('details');
    candidateDetails.className = 'journey-nearby-details';
    const candidateSummary = document.createElement('summary');
    candidateSummary.textContent = translateCurrent('journeyNearbyStops');
    candidateDetails.append(candidateSummary);
    const candidates = document.createElement('div');
    candidates.className = 'journey-candidate-results';
    appendCandidates(candidates, 'origin', options.outcome.originCandidates,
      options.selectedOriginStopId, options.onCandidateSelect);
    appendCandidates(candidates, 'destination', options.outcome.destinationCandidates,
      options.selectedDestinationStopId, options.onCandidateSelect);
    candidateDetails.append(candidates);
    content.append(candidateDetails);
  }

  if (options.notice === 'location-unavailable') {
    const locationStatus = document.createElement('p');
    locationStatus.setAttribute('role', 'alert');
    locationStatus.textContent = translateCurrent('journeyLocationUnavailable');
    content.append(locationStatus);
  } else if (options.notice === 'point-outside') {
    const locationStatus = document.createElement('p');
    locationStatus.setAttribute('role', 'alert');
    locationStatus.textContent = translateCurrent('journeyPointOutside');
    content.append(locationStatus);
  }
  if (options.outcome?.status === 'invalid') {
    const invalidStatus = document.createElement('p');
    invalidStatus.setAttribute('role', 'alert');
    invalidStatus.textContent = translateCurrent('journeyInvalidSearch');
    content.append(invalidStatus);
  } else if (options.outcome?.status === 'incomplete') {
    const dataStatus = document.createElement('p');
    dataStatus.dataset.journeyDataStatus = 'incomplete';
    dataStatus.setAttribute('role', 'status');
    dataStatus.setAttribute('aria-live', 'polite');
    dataStatus.textContent = translateCurrent('journeyDataIncomplete');
    content.append(dataStatus);
  } else if (options.outcome?.status === 'loading' || options.outcome?.status === 'unavailable') {
    const status = document.createElement('p');
    status.dataset.journeyDataStatus = options.outcome.status;
    status.setAttribute('role', options.outcome.status === 'unavailable' ? 'alert' : 'status');
    status.textContent = translateCurrent(options.outcome.status === 'loading' ? 'journeyLoading' : 'journeyDataUnavailable');
    content.append(status);
  } else if (options.outcome?.status === 'complete') {
    const results = document.createElement('div');
    renderJourneyResults(results, options);
    content.append(results);
  }

  const privacy = document.createElement('details');
  privacy.className = 'journey-privacy-note';
  const privacySummary = document.createElement('summary');
  privacySummary.textContent = translateCurrent('journeyPrivacySummary');
  const privacyText = document.createElement('p');
  privacyText.textContent = translateCurrent('journeyPrivacyNote');
  const geocoderLink = document.createElement('a');
  geocoderLink.href = 'https://planificador-rutas-api.vigo.org/attribution';
  geocoderLink.target = '_blank';
  geocoderLink.rel = 'noopener noreferrer';
  geocoderLink.textContent = translateCurrent('journeyGeocoderAttribution');
  const osmLink = document.createElement('a');
  osmLink.href = 'https://www.openstreetmap.org/copyright';
  osmLink.target = '_blank';
  osmLink.rel = 'noopener noreferrer';
  osmLink.textContent = '© OpenStreetMap contributors';
  privacyText.append(document.createTextNode(' '), geocoderLink, document.createTextNode(' · '), osmLink);
  privacy.append(privacySummary, privacyText);
  content.append(privacy);
  root.append(content);
}

function renderEndpoint(
  endpoint: JourneyEndpoint,
  point: JourneyPoint | null,
  label: string,
  options: JourneySearchViewOptions,
  onPointChange: (endpoint: JourneyEndpoint, query: string) => void
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'journey-endpoint';
  section.dataset.journeyEndpoint = endpoint;
  section.dataset.journeySelected = String(point !== null);

  const labelId = `journey-${endpoint}-label`;
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 180;
  input.id = labelId;
  input.dataset.journeyAddress = endpoint;
  input.placeholder = translateCurrent(endpoint === 'origin' ? 'journeyOriginPlaceholder' : 'journeyDestinationPlaceholder');
  input.value = label;
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', `journey-${endpoint}-suggestions`);
  const inputLabel = document.createElement('label');
  inputLabel.htmlFor = labelId;
  inputLabel.className = 'journey-address-label';
  inputLabel.textContent = translateCurrent(endpoint === 'origin' ? 'journeyOrigin' : 'journeyDestination');
  const status = document.createElement('p');
  status.className = 'journey-address-status';
  status.dataset.journeyAddressStatus = endpoint;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const list = document.createElement('ul');
  list.id = `journey-${endpoint}-suggestions`;
  list.className = 'journey-address-suggestions';
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'journey-address-clear';
  clearButton.dataset.journeyClear = endpoint;
  clearButton.setAttribute('aria-label', translateCurrent(
    endpoint === 'origin' ? 'journeyClearOrigin' : 'journeyClearDestination'
  ));
  clearButton.textContent = '×';
  clearButton.hidden = input.value.length === 0;
  clearButton.addEventListener('click', () => {
    input.value = '';
    search('');
    input.focus();
  });

  let debounce: ReturnType<typeof setTimeout> | undefined;
  let activeRequest: AbortController | undefined;
  let requestVersion = 0;
  const clearSuggestions = () => {
    list.replaceChildren();
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  };
  const search = (query: string) => {
    clearTimeout(debounce);
    activeRequest?.abort();
    const version = ++requestVersion;
    status.textContent = '';
    status.dataset.addressStatus = '';
    clearSuggestions();
    options.onAddressEdit(endpoint, query);
    section.dataset.journeySelected = 'false';
    section.querySelector(`[data-journey-point="${endpoint}"]`)?.remove();
    section.querySelector(`[data-journey-candidates="${endpoint}"]`)?.remove();
    section.closest('.journey-search')?.querySelector('[data-journey-data-status]')?.remove();
    section.closest('.journey-search')?.querySelector('[data-journey-options]')?.remove();
    section.closest('.journey-search')?.querySelector('.journey-nearby-details')?.remove();
    clearButton.hidden = query.length === 0;
    onPointChange(endpoint, query);
    if (query.trim().length < 3) return;
    status.textContent = translateCurrent('journeyAddressSearching');
    status.dataset.addressStatus = 'loading';
    debounce = setTimeout(() => {
      const controller = new AbortController();
      activeRequest = controller;
      void options.onAddressSearch(query, controller.signal).then((result) => {
        if (controller.signal.aborted || version !== requestVersion) return;
        if (result.kind === 'cancelled') return;
        if (result.kind === 'unavailable') {
          status.textContent = translateCurrent('journeyAddressUnavailable');
          status.dataset.addressStatus = 'unavailable';
          return;
        }

        if (result.suggestions.length === 0) {
          status.textContent = translateCurrent('journeyAddressNoResults');
          status.dataset.addressStatus = 'empty';
          return;
        }
        status.textContent = '';
        status.dataset.addressStatus = '';
        for (const suggestion of result.suggestions) {
          const item = document.createElement('li');
          item.setAttribute('role', 'presentation');
          const button = document.createElement('button');
          button.type = 'button';
          button.setAttribute('role', 'option');
          button.setAttribute('aria-label', suggestion.label);
          button.title = suggestion.label;
          button.textContent = suggestion.label;
          button.addEventListener('click', () => {
            activeRequest?.abort();
            input.value = suggestion.label;
            clearSuggestions();
            status.textContent = '';
            options.onAddressSelect(endpoint, suggestion);
          });
          item.append(button);
          list.append(item);
        }
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
      }).catch((error: unknown) => {
        if (controller.signal.aborted || version !== requestVersion) return;
        status.textContent = translateCurrent('journeyAddressUnavailable');
        status.dataset.addressStatus = 'unavailable';
        console.error('Could not search public address suggestions.', error);
      });
    }, 350);
  };
  input.addEventListener('input', () => search(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      clearSuggestions();
      status.textContent = '';
    } else if (event.key === 'ArrowDown' && !list.hidden) {
      event.preventDefault();
      list.querySelector<HTMLButtonElement>('button')?.focus();
    }
  });
  list.addEventListener('keydown', (event) => {
    const buttons = [...list.querySelectorAll<HTMLButtonElement>('button[role="option"]')];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(index + direction + buttons.length) % buttons.length]?.focus();
    } else if (event.key === 'Escape') {
      clearSuggestions();
      input.focus();
    }
  });
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (!section.contains(document.activeElement)) clearSuggestions();
    }, 250);
  });
  rootDisposeListener(section, () => {
    clearTimeout(debounce);
    activeRequest?.abort();
  });

  const controls = document.createElement('div');
  controls.className = 'journey-address-control';
  const field = document.createElement('div');
  field.className = 'journey-address-field';
  const marker = document.createElement('span');
  marker.className = 'journey-endpoint-marker';
  marker.setAttribute('aria-hidden', 'true');
  field.append(inputLabel, input, clearButton);
  controls.append(field, list, status);
  section.append(marker, controls);
  return section;
}

function rootDisposeListener(section: HTMLElement, dispose: () => void): void {
  const root = section.closest<HTMLElement>('.destination-view');
  root?.addEventListener('journey-view-dispose', dispose, { once: true });
}

function appendCandidates(
  parent: HTMLElement,
  endpoint: JourneyEndpoint,
  candidates: JourneySearchOutcome['originCandidates'],
  selectedStopId: string | null,
  onCandidateSelect: JourneySearchViewOptions['onCandidateSelect']
): void {
  const group = document.createElement('section');
  group.dataset.journeyCandidates = endpoint;
  group.className = 'journey-candidates';
  const heading = document.createElement('h3');
  heading.textContent = `${translateCurrent('journeyNearbyStops')} · ${translateCurrent(
    endpoint === 'origin' ? 'journeyOrigin' : 'journeyDestination'
  )}`;
  group.append(heading);
  if (candidates.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = translateCurrent('journeyNoStopsInCatalog');
    group.append(empty);
  } else {
    const list = document.createElement('ul');
    for (const candidate of candidates) {
      const item = document.createElement('li');
      item.dataset.journeyCandidate = candidate.stop.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.journeyCandidateSelect = candidate.stop.id;
      button.setAttribute('aria-pressed', String(candidate.stop.id === selectedStopId));
      button.textContent = `${candidate.stop.name} · ${translateCurrent('journeyApproxDistance', {
        meters: Math.round(candidate.distanceMeters)
      })} · ${translateCurrent('journeyApproxWalk', { minutes: candidate.walkMinutes })}`;
      button.addEventListener('click', () => onCandidateSelect(endpoint, candidate));
      item.append(button);
      list.append(item);
    }
    group.append(list);
  }
  parent.append(group);
}
