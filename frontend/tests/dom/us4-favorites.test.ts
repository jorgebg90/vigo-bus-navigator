// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderFavorites } from '../../src/ui/home/favorites';
import { renderFavoriteToggle } from '../../src/ui/favorite-toggle';
import { showStorageNotice } from '../../src/ui/settings/storage-notice';
import { setDocumentLanguage } from '../../src/i18n';
import { translateCurrent } from '../../src/i18n';

describe('US4 favorites view', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('renders favorite targets first with actionable controls', () => {
    const root = document.createElement('main');
    renderFavorites(root, [{ type: 'stop', targetId: 'stop-1', order: 0 }], [], [{
      id: 'stop-1', code: '101', vitrasaId: '101', name: 'Praza de América', lat: 42, lon: -8, lineIds: ['l4a']
    }], () => undefined);
    expect(root.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe(translateCurrent('savedFavorites'));
    expect(root.querySelector('[role="tabpanel"] button')?.textContent).toContain('Praza de América');
  });

  it('opens a migrated line favorite when its line is available', () => {
    const root = document.createElement('main');
    const opened: string[] = [];
    renderFavorites(root, [{ type: 'line', targetId: 'l4a', order: 0 }], [
      { id: 'l4a', code: 'L4A', name: 'Bouzas', color: '#000' }
    ], [], (item) => opened.push(`${item.type}:${item.targetId}`));

    const open = root.querySelector<HTMLButtonElement>('.stop-open');
    expect(open?.textContent).toContain('L4A');
    expect(open?.textContent).toContain('Bouzas');
    open?.click();
    expect(opened).toEqual(['line:l4a']);
  });

  it('keeps unresolved line favorites visible but unavailable and removable', () => {
    const root = document.createElement('main');
    const opened: string[] = [];
    const removed: string[] = [];
    renderFavorites(root, [{ type: 'line', targetId: 'legacy-line', order: 0 }], [], [], (item) => {
      opened.push(item.targetId);
    }, { onRemove: (favorite) => removed.push(favorite.targetId) });

    expect(root.textContent).toContain('Unavailable: legacy-line');
    expect(root.querySelector('.stop-open')?.tagName).toBe('SPAN');
    root.querySelector<HTMLButtonElement>('[data-action="remove"]')?.click();
    expect(opened).toEqual([]);
    expect(removed).toEqual(['legacy-line']);
  });

  it('renders recent views and a session-only persistence notice', () => {
    const root = document.createElement('main');
    renderFavorites(root, [], [{ id: 'l4a', code: 'L4A', name: 'Bouzas', color: '#000' }], [], () => undefined, {
      recentViews: [{ type: 'line', targetId: 'l4a', viewedAt: '2026-10-25T00:00:00Z' }],
      persisted: false
    });
    root.querySelector<HTMLButtonElement>('[data-nonexistent]');
    root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    expect(root.textContent).toContain(translateCurrent('savedRecent'));
    expect(root.textContent).toContain('Storage unavailable');
  });

  it('renders a named favorite toggle with pressed state and updates on click', () => {
    const root = document.createElement('div');
    let saved = false;
    renderFavoriteToggle(root, {
      type: 'stop', name: 'Central', saved,
      onToggle: () => { saved = !saved; }
    });
    const toggle = root.querySelector<HTMLButtonElement>('button')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toContain('Save Central');
    toggle.click();
    renderFavoriteToggle(root, { type: 'stop', name: 'Central', saved, onToggle: () => undefined });
    expect(root.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('button')?.getAttribute('aria-label')).toContain('Remove Central');
  });

  it('renders Favorites and Recent tabs, with a visible Remove for unavailable favorites', () => {
    const root = document.createElement('main');
    const removed: string[] = [];
    renderFavorites(root, [{ type: 'stop', targetId: 'missing-stop', order: 0 }], [], [], () => undefined, {
      recentViews: [], persisted: true, onRemove: (favorite) => removed.push(favorite.targetId)
    });

    expect(root.querySelector('[role="tablist"]')).toBeTruthy();
    expect(root.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe('Favorites');
    expect(root.textContent).toContain('Unavailable');
    const remove = root.querySelector<HTMLButtonElement>('[data-action="remove"]');
    expect(remove?.textContent).toBe('');
    expect(remove?.getAttribute('aria-label')).toContain('Remove');
    remove?.click();
    expect(removed).toEqual(['missing-stop']);
  });

  it('announces when storage is unavailable and lets the rider dismiss the notice', () => {
    const root = document.createElement('div');
    showStorageNotice(root);
    const notice = root.querySelector('[data-storage-notice]');
    expect(notice?.getAttribute('role')).toBe('status');
    expect(notice?.getAttribute('aria-live')).toBe('polite');
    expect(notice?.textContent).toContain(translateCurrent('favoritesCannotSave'));
    notice?.querySelector<HTMLButtonElement>('[data-dismiss]')?.click();
    expect(root.querySelector('[data-storage-notice]')).toBeNull();
  });
});
