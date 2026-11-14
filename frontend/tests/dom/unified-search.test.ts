// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderUnifiedSearch, type UnifiedSearchOptions } from '../../src/ui/search/unified-search';
import { createSearchSession } from '../../src/ui/search/search-session';
import { renderContentState } from '../../src/ui/content-state';
import { setDocumentLanguage } from '../../src/i18n';
import type { Line, Stop } from '../../src/domain/types';
import type { AddressSearchResult } from '../../src/domain/journey-address';

const stops: Stop[] = [
  { id: 'stop-1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['line-4a'] },
  { id: 'stop-2', code: '2002', vitrasaId: null, name: 'Search-only', lat: null, lon: null, lineIds: ['line-7'] }
];
const lines: Line[] = [{ id: 'line-4a', code: '4A', name: 'Central - Beiramar', color: '#c00' }];
const suggestion = { id: 'a1', label: 'Rúa do Príncipe 1', point: { latitude: 42.23, longitude: -8.72 } };

beforeEach(() => {
  vi.useFakeTimers();
  setDocumentLanguage('en');
});
afterEach(() => vi.useRealTimers());

function mount(overrides: Partial<UnifiedSearchOptions> = {}) {
  const root = document.createElement('main');
  const options: UnifiedSearchOptions = {
    session: createSearchSession(),
    stops,
    lines,
    favoriteStopIds: ['stop-2'],
    addressSearch: vi.fn(async (): Promise<AddressSearchResult> => ({ kind: 'success', suggestions: [suggestion] })),
    debounceMs: 10,
    onStopSelect: vi.fn(),
    onFavoriteToggle: vi.fn(),
    onLineSelect: vi.fn(),
    onStopEndpoint: vi.fn(),
    onAddressEndpoint: vi.fn(),
    ...overrides
  };
  const dispose = renderUnifiedSearch(root, options);
  const type = (value: string) => {
    const input = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  return { root, options, type, dispose };
}

describe('unified search', () => {
  it('prompts on a blank query and never requests addresses', async () => {
    const { root, options } = mount();
    await vi.advanceTimersByTimeAsync(50);
    expect(root.querySelector('[data-content-state="empty"]')).toBeTruthy();
    expect(options.addressSearch).not.toHaveBeenCalled();
  });

  it('labels stop, line and address results by type and filters by category', async () => {
    const { root, type } = mount();
    type('central');
    await vi.advanceTimersByTimeAsync(50);
    expect(root.querySelector('[data-stop-row="stop-1"] .result-type')?.textContent).toBe('Stop');
    expect(root.querySelector('[data-line-row="line-4a"] .result-type')?.textContent).toBe('Line');
    root.querySelector<HTMLButtonElement>('[data-search-category="lines"]')!.click();
    expect(root.querySelector('[data-stop-row]')).toBeNull();
    expect(root.querySelector('[data-line-row]')).toBeTruthy();
    root.querySelector<HTMLButtonElement>('[data-search-category="addresses"]')!.click();
    await vi.advanceTimersByTimeAsync(50);
    expect(root.querySelector('[data-address-row] .result-type')?.textContent).toBe('Address');
    expect(root.querySelector('[data-search-category="addresses"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('offers endpoint actions only for stops with coordinates and hands them off', () => {
    const { root, options, type } = mount();
    type('0');
    expect(root.querySelector('[data-stop-row="stop-2"] [data-stop-origin]')).toBeNull();
    expect(root.querySelector('[data-stop-row="stop-2"] [data-map-position="missing"]')).toBeTruthy();
    root.querySelector<HTMLButtonElement>('[data-stop-row="stop-1"] [data-stop-destination]')!.click();
    expect(options.onStopEndpoint).toHaveBeenCalledWith('destination', stops[0]);
    root.querySelector<HTMLButtonElement>('[data-stop-open="stop-1"]')!.click();
    expect(options.onStopSelect).toHaveBeenCalledWith('stop-1');
    root.querySelector<HTMLButtonElement>('[data-line-row] button')?.click();
  });

  it('hands an address to the chosen endpoint', async () => {
    const { root, options, type } = mount();
    type('principe');
    await vi.advanceTimersByTimeAsync(50);
    root.querySelector<HTMLButtonElement>('[data-address-origin]')!.click();
    expect(options.onAddressEndpoint).toHaveBeenCalledWith('origin', suggestion);
  });

  it('discards stale address results and aborts the superseded request', async () => {
    const resolvers: Array<(result: AddressSearchResult) => void> = [];
    const signals: AbortSignal[] = [];
    const addressSearch = vi.fn((_query: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<AddressSearchResult>((resolve) => resolvers.push(resolve));
    });
    const { root, type } = mount({ addressSearch });
    type('princ');
    await vi.advanceTimersByTimeAsync(20);
    type('princi');
    expect(signals[0]!.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(20);
    resolvers[0]!({ kind: 'success', suggestions: [{ ...suggestion, id: 'old', label: 'old' }] });
    resolvers[1]!({ kind: 'success', suggestions: [suggestion] });
    await vi.advanceTimersByTimeAsync(0);
    expect(root.querySelector('[data-address-row="old"]')).toBeNull();
    expect(root.querySelector('[data-address-row="a1"]')).toBeTruthy();
  });

  it('shows offline and error states, retrying only when the request can be repeated', async () => {
    const offline = mount({ isOffline: () => true });
    offline.type('princ');
    expect(offline.root.querySelector('[data-content-state="offline"]')).toBeTruthy();
    expect(offline.root.querySelector('[data-address-results] button')).toBeNull();
    expect(offline.options.addressSearch).not.toHaveBeenCalled();

    const addressSearch = vi.fn<UnifiedSearchOptions['addressSearch']>()
      .mockResolvedValueOnce({ kind: 'unavailable', reason: 'network' })
      .mockResolvedValueOnce({ kind: 'success', suggestions: [suggestion] });
    const failing = mount({ addressSearch });
    failing.type('princ');
    await vi.advanceTimersByTimeAsync(50);
    expect(failing.root.querySelector('[data-content-state="error"]')).toBeTruthy();
    failing.root.querySelector<HTMLButtonElement>('[data-content-state-action]')!.click();
    await vi.advanceTimersByTimeAsync(50);
    expect(failing.root.querySelector('[data-address-row]')).toBeTruthy();
  });

  it('keeps the query in the in-memory session and restores it, without touching storage', () => {
    const session = createSearchSession();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const first = mount({ session });
    first.type('central');
    const second = mount({ session });
    expect(second.root.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('central');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('shows a clearable no-results state for local categories', () => {
    const { root, type } = mount({ session: { query: '', category: 'stops' } });
    type('zzz');
    expect(root.textContent).toContain('Nothing matches');
    root.querySelector<HTMLButtonElement>('[data-clear-search]')!.click();
    expect(root.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('');
  });
});

describe('content state', () => {
  it('announces errors assertively and others politely', () => {
    const host = document.createElement('div');
    expect(renderContentState(host, 'error', { message: 'x' }).getAttribute('role')).toBe('alert');
    expect(renderContentState(host, 'loading', { message: 'x' }).getAttribute('role')).toBe('status');
  });
});
