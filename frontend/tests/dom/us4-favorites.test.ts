// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderFavorites } from '../../src/ui/home/favorites';
import { setDocumentLanguage } from '../../src/i18n';
import { translateCurrent } from '../../src/i18n';

describe('US4 favorites view', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('renders favorite targets first with actionable controls', () => {
    const root = document.createElement('main');
    renderFavorites(root, [{ type: 'line', targetId: 'l4a', order: 0 }], [{ id: 'l4a', code: 'L4A', name: 'Bouzas', color: '#000' }], [], () => undefined);
    expect(root.querySelector('h2')?.textContent).toBe(translateCurrent('favorites'));
    expect(root.querySelector('button')?.textContent).toContain('Bouzas');
  });

  it('renders recent views and a session-only persistence notice', () => {
    const root = document.createElement('main');
    renderFavorites(root, [], [{ id: 'l4a', code: 'L4A', name: 'Bouzas', color: '#000' }], [], () => undefined, {
      recentViews: [{ type: 'line', targetId: 'l4a', viewedAt: '2026-10-25T00:00:00Z' }],
      persisted: false
    });
    expect(root.textContent).toContain('Recent views');
    expect(root.textContent).toContain('Storage unavailable');
  });
});
