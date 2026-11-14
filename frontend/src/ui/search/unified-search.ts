import type { AddressSearchResult, AddressSuggestion } from '../../domain/journey-address';
import type { Line, Provenance, Stop } from '../../domain/types';
import { translateCurrent } from '../../i18n';
import { renderContentState } from '../content-state';
import { renderFavoriteToggle } from '../favorite-toggle';
import { createLineBadge } from '../line-badge';
import { createIcon } from '../icons';
import type { SearchCategory, SearchSession } from './search-session';

export type JourneyEndpointKind = 'origin' | 'destination';

export interface UnifiedSearchOptions {
  session: SearchSession;
  stops: Stop[];
  lines: Line[];
  favoriteStopIds: string[];
  discoveryProvenance?: Provenance;
  addressSearch: (query: string, signal: AbortSignal) => Promise<AddressSearchResult>;
  isOffline?: () => boolean;
  debounceMs?: number;
  onStopSelect: (stopId: string) => void;
  onFavoriteToggle: (stopId: string) => void;
  onLineSelect: (line: Line) => void;
  onStopEndpoint: (endpoint: JourneyEndpointKind, stop: Stop) => void;
  onAddressEndpoint: (endpoint: JourneyEndpointKind, suggestion: AddressSuggestion) => void;
}

const CATEGORIES: Array<{ id: SearchCategory; key: Parameters<typeof translateCurrent>[0] }> = [
  { id: 'all', key: 'searchCategoryAll' },
  { id: 'stops', key: 'searchCategoryStops' },
  { id: 'lines', key: 'searchCategoryLines' },
  { id: 'addresses', key: 'searchCategoryAddresses' }
];
const MIN_ADDRESS_QUERY = 3;
const MAX_LOCAL_RESULTS = 50;

function typeTag(kind: 'Stop' | 'Line' | 'Address'): HTMLElement {
  const tag = document.createElement('span');
  tag.className = 'result-type';
  tag.textContent = translateCurrent(`searchResult${kind}`);
  return tag;
}

function actionButton(label: string, attribute: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'result-action';
  button.dataset[attribute] = 'true';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

export function renderUnifiedSearch(root: HTMLElement, options: UnifiedSearchOptions): () => void {
  const { session } = options;
  root.replaceChildren();
  let controller: AbortController | undefined;
  let version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const landmark = document.createElement('div');
  landmark.className = 'search-field';
  landmark.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.value = session.query;
  input.setAttribute('aria-label', translateCurrent('searchAllPlaceholder'));
  input.placeholder = translateCurrent('searchAllPlaceholder');
  landmark.append(createIcon('search'), input);

  const filters = document.createElement('div');
  filters.className = 'filter-group';
  filters.setAttribute('role', 'group');
  filters.setAttribute('aria-label', translateCurrent('searchFilters'));
  const filterButtons = new Map<SearchCategory, HTMLButtonElement>();
  for (const category of CATEGORIES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.dataset.searchCategory = category.id;
    button.textContent = translateCurrent(category.key);
    button.addEventListener('click', () => {
      session.category = category.id;
      render();
    });
    filterButtons.set(category.id, button);
    filters.append(button);
  }

  const localResults = document.createElement('ul');
  localResults.setAttribute('aria-label', translateCurrent('stops'));
  const addressRegion = document.createElement('div');
  addressRegion.dataset.addressResults = 'true';
  const addressList = document.createElement('ul');
  addressList.setAttribute('aria-label', translateCurrent('searchCategoryAddresses'));
  const status = document.createElement('div');
  root.append(landmark, filters);
  if (options.discoveryProvenance?.kind === 'bundled-catalog') {
    const bundled = document.createElement('p');
    bundled.dataset.stopDiscoverySource = options.discoveryProvenance.kind;
    bundled.textContent = translateCurrent('bundledDiscoveryNotice', { date: options.discoveryProvenance.snapshotDate ?? '' });
    root.append(bundled);
  }
  root.append(status, localResults, addressRegion);

  const cancelAddresses = () => {
    version += 1;
    if (timer) clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
  };

  const showStop = (stop: Stop): HTMLLIElement => {
    const row = document.createElement('li');
    row.dataset.stopRow = stop.id;
    row.dataset.resultKind = 'stop';
    const open = document.createElement('button');
    open.type = 'button';
    open.dataset.stopOpen = stop.id;
    open.className = 'stop-open';
    const stopTag = typeTag('Stop');
    stopTag.setAttribute('aria-hidden', 'true');
    open.append(stopTag, document.createTextNode(` ${stop.name}`));
    open.setAttribute('aria-label', stop.name);
    open.addEventListener('click', () => options.onStopSelect(stop.id));
    row.append(open);
    const favorite = document.createElement('div');
    renderFavoriteToggle(favorite, {
      type: 'stop',
      name: stop.name,
      saved: options.favoriteStopIds.includes(stop.id),
      onToggle: () => options.onFavoriteToggle(stop.id)
    });
    row.append(favorite);
    if (stop.lat === null || stop.lon === null) {
      const missing = document.createElement('span');
      missing.dataset.mapPosition = 'missing';
      missing.textContent = translateCurrent('noMapPosition');
      row.append(missing);
    } else {
      const actions = document.createElement('div');
      actions.className = 'result-actions';
      actions.append(
        actionButton(translateCurrent('useAsOrigin'), 'stopOrigin', () => options.onStopEndpoint('origin', stop)),
        actionButton(translateCurrent('useAsDestination'), 'stopDestination', () => options.onStopEndpoint('destination', stop))
      );
      row.append(actions);
    }
    return row;
  };

  const showLine = (line: Line): HTMLLIElement => {
    const row = document.createElement('li');
    row.dataset.lineRow = line.id;
    row.dataset.resultKind = 'line';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'line-list-item';
    const name = document.createElement('span');
    name.append(typeTag('Line'), document.createTextNode(` ${line.name}`));
    button.append(createLineBadge(line), name);
    button.addEventListener('click', () => options.onLineSelect(line));
    row.append(button);
    return row;
  };

  const renderAddresses = (suggestions: AddressSuggestion[]) => {
    addressList.replaceChildren();
    for (const suggestion of suggestions) {
      const row = document.createElement('li');
      row.dataset.addressRow = suggestion.id;
      row.dataset.resultKind = 'address';
      const label = document.createElement('span');
      label.className = 'address-label';
      label.append(typeTag('Address'), document.createTextNode(` ${suggestion.label}`));
      const actions = document.createElement('div');
      actions.className = 'result-actions';
      actions.append(
        actionButton(translateCurrent('useAddressAsOrigin'), 'addressOrigin', () => options.onAddressEndpoint('origin', suggestion)),
        actionButton(translateCurrent('useAddressAsDestination'), 'addressDestination', () => options.onAddressEndpoint('destination', suggestion))
      );
      row.append(label, actions);
      addressList.append(row);
    }
    addressRegion.replaceChildren(addressList);
  };

  const runAddressSearch = (query: string) => {
    cancelAddresses();
    if (query.length < MIN_ADDRESS_QUERY) {
      addressRegion.replaceChildren();
      return;
    }
    if (options.isOffline?.()) {
      renderContentState(addressRegion, 'offline', { message: translateCurrent('searchOfflineAddresses') });
      return;
    }
    const current = version;
    renderContentState(addressRegion, 'loading', { message: translateCurrent('journeyAddressSearching') });
    timer = setTimeout(() => {
      timer = undefined;
      controller = new AbortController();
      const signal = controller.signal;
      options.addressSearch(query, signal).then((result) => {
        if (current !== version || result.kind === 'cancelled') return;
        if (result.kind === 'unavailable') {
          renderContentState(addressRegion, 'error', {
            message: translateCurrent('journeyAddressUnavailable'),
            action: { label: translateCurrent('searchRetry'), onActivate: () => runAddressSearch(query) }
          });
        } else if (result.suggestions.length === 0) {
          renderContentState(addressRegion, 'empty', { message: translateCurrent('journeyAddressNoResults') });
        } else renderAddresses(result.suggestions);
      }).catch(() => {
        if (current !== version) return;
        renderContentState(addressRegion, 'error', {
          message: translateCurrent('journeyAddressUnavailable'),
          action: { label: translateCurrent('searchRetry'), onActivate: () => runAddressSearch(query) }
        });
      });
    }, options.debounceMs ?? 250);
  };

  const render = () => {
    const rawQuery = input.value.trim();
    session.query = input.value;
    const query = rawQuery.toLocaleLowerCase();
    for (const [id, button] of filterButtons) button.setAttribute('aria-pressed', String(id === session.category));
    const showStops = session.category === 'all' || session.category === 'stops';
    const showLines = session.category === 'all' || session.category === 'lines';
    const showAddresses = session.category === 'all' || session.category === 'addresses';

    localResults.replaceChildren();
    status.replaceChildren();
    if (!rawQuery) {
      cancelAddresses();
      addressRegion.replaceChildren();
      renderContentState(status, 'empty', { message: translateCurrent('searchPrompt') });
      return;
    }
    let count = 0;
    if (showStops) {
      for (const stop of options.stops.filter((item) => `${item.name} ${item.code}`.toLocaleLowerCase().includes(query)).slice(0, MAX_LOCAL_RESULTS)) {
        localResults.append(showStop(stop));
        count += 1;
      }
    }
    if (showLines) {
      for (const line of options.lines.filter((item) => `${item.code} ${item.name}`.toLocaleLowerCase().includes(query)).slice(0, MAX_LOCAL_RESULTS)) {
        localResults.append(showLine(line));
        count += 1;
      }
    }
    if (showAddresses) runAddressSearch(rawQuery);
    else {
      cancelAddresses();
      addressRegion.replaceChildren();
    }
    if (count === 0 && !showAddresses) {
      const empty = renderContentState(status, 'empty', {
        message: translateCurrent('searchNoResults', { query: rawQuery }),
        action: { label: translateCurrent('clearSearch'), onActivate: () => { input.value = ''; render(); input.focus(); } }
      });
      empty.querySelector('button')?.setAttribute('data-clear-search', 'true');
    }
  };

  input.addEventListener('input', render);
  landmark.addEventListener('submit', (event) => event.preventDefault());
  render();
  return cancelAddresses;
}
