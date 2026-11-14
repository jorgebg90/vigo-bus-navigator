// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderLineFrequency } from '../../src/ui/line/frequency-view';
import { renderUnifiedSearch } from '../../src/ui/search/unified-search';
import { createSearchSession } from '../../src/ui/search/search-session';
import { createShell } from '../../src/ui/shell';
import { setDocumentLanguage } from '../../src/i18n';

const stop = { id: 'stop-1', code: '101', vitrasaId: null, name: 'Praza de América', lat: 42, lon: -8, lineIds: [] };

beforeEach(() => {
  setDocumentLanguage('en');
});

describe('cross-destination handoffs', () => {
  it('lets a rider continue from a line route stop into trip planning', () => {
    const root = document.createElement('main');
    const onStopEndpoint = vi.fn();
    renderLineFrequency(root, {
      lineCode: '4A',
      dayType: 'weekday',
      patterns: [{ id: 'out', headsign: 'Urzáiz', stopIds: ['stop-1'], stops: [stop] }],
      onStopEndpoint
    });
    root.querySelector<HTMLButtonElement>('[data-route-stop="stop-1"] [data-route-stop-endpoint="destination"]')!.click();
    expect(onStopEndpoint).toHaveBeenCalledWith('destination', 'stop-1');
  });

  it('omits route-stop endpoint actions when no handoff is available', () => {
    const root = document.createElement('main');
    renderLineFrequency(root, {
      lineCode: '4A',
      dayType: 'weekday',
      patterns: [{ id: 'out', headsign: 'Urzáiz', stopIds: ['stop-1'], stops: [stop] }]
    });
    expect(root.querySelector('[data-route-stop-endpoint]')).toBeNull();
  });

  it('keeps the search query when the rider leaves search and comes back, without storing it', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const container = document.createElement('div');
    document.body.append(container);
    const shell = createShell(container);
    const session = createSearchSession();
    const render = () => renderUnifiedSearch(shell.main, {
      session, stops: [stop], lines: [], favoriteStopIds: [],
      addressSearch: async () => ({ kind: 'cancelled' }),
      onStopSelect: () => undefined, onFavoriteToggle: () => undefined, onLineSelect: () => undefined,
      onStopEndpoint: () => undefined, onAddressEndpoint: () => undefined
    });
    shell.navigate('search');
    const dispose = render();
    const input = shell.main.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'praza';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    dispose();
    shell.navigate('journeys');
    shell.navigate('search');
    render();
    expect(shell.main.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('praza');
    expect(setItem).not.toHaveBeenCalled();
    expect(location.search).toBe('');
    shell.destroy();
  });
});
