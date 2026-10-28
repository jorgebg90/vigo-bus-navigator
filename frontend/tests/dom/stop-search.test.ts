// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStopSearch } from '../../src/ui/search/stop-search';
import { setDocumentLanguage } from '../../src/i18n';
import type { Stop } from '../../src/domain/types';

const stops: Stop[] = [
  { id: 'stop-1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['line-4a'] },
  { id: 'stop-2', code: '2002', vitrasaId: null, name: 'Search-only', lat: null, lon: null, lineIds: ['line-7'] }
];

beforeEach(() => setDocumentLanguage('en'));

describe('stop search', () => {
  it('filters by name or code and labels stops without positions without a result count', () => {
    const root = document.createElement('main');
    renderStopSearch(root, {
      stops,
      favoriteStopIds: ['stop-2'],
      onSelect: () => undefined,
      onFavoriteToggle: () => undefined
    });
    expect(root.querySelector('[role="search"]')).toBeTruthy();
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(root.querySelector('[data-search-count]')).toBeNull();
    expect(root.querySelector('[data-line-code-badge]')).toBeNull();
    expect(root.textContent).toContain('No map position');
    expect(root.textContent).not.toContain('42.2');

    search.value = '2002';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelectorAll('[data-stop-row]')).toHaveLength(1);
  });

  it('shows a clearable no-results state and opens rows through the shared selection callback', () => {
    const root = document.createElement('main');
    const select = vi.fn();
    renderStopSearch(root, { stops, favoriteStopIds: [], onSelect: select, onFavoriteToggle: () => undefined });
    const search = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'not found';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.textContent).toContain('No stops match');
    root.querySelector<HTMLButtonElement>('[data-clear-search]')?.click();
    expect(search.value).toBe('');

    root.querySelector<HTMLButtonElement>('[data-stop-open="stop-1"]')?.click();
    expect(select).toHaveBeenCalledWith('stop-1');
  });

  it('shows favorite state in a stop result row', () => {
    const root = document.createElement('main');
    renderStopSearch(root, { stops, favoriteStopIds: ['stop-2'], onSelect: () => undefined, onFavoriteToggle: () => undefined });
    expect(root.querySelector('[data-stop-row="stop-2"] .favorite-toggle')?.getAttribute('aria-pressed')).toBe('true');
  });
});
