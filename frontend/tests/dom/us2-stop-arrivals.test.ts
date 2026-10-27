// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { renderStopArrivals } from '../../src/ui/stop/stop-arrivals-view';
import { setDocumentLanguage } from '../../src/i18n';
import { translateCurrent } from '../../src/i18n';

describe('US2 stop arrivals view', () => {
  beforeEach(() => setDocumentLanguage('en'));
  it('renders live and cached status with arrival details', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, { stop: { id: 's1', code: '1', vitrasaId: '1', name: 'Central', lat: 0, lon: 0, lineIds: [] }, arrivals: [{ lineCode: 'L4A', destination: 'Bouzas', minutes: 5, eta: '10:00' }], source: 'cached', dataStatus: 'stale', fetchedAt: 'now', error: 'Live arrivals unavailable' });
    expect(root.textContent).toContain(translateCurrent('statusStale'));
    const row = root.querySelector('ol li');
    expect(row?.querySelector('[data-line-code-badge]')?.textContent).toBe('L4A');
    expect(row?.textContent).toContain('Bouzas');
    expect(row?.textContent).toContain('5 min');
  });
});
