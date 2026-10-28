// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStopArrivals } from '../../src/ui/stop/stop-arrivals-view';
import { setDocumentLanguage, translateCurrent } from '../../src/i18n';
import type { StopArrivalsResult } from '../../src/application/get-stop-arrivals';

const stop = { id: 's1', code: '1', municipalCode: '2789', vitrasaId: '1', name: 'Central', lat: null, lon: null, lineIds: [] };
const arrival = { lineCode: 'L4A', destination: 'Bouzas', minutes: 5 };

function result(dataStatus: StopArrivalsResult['dataStatus']): StopArrivalsResult {
  return {
    stop,
    arrivals: dataStatus === 'unavailable' || dataStatus === 'empty' || dataStatus === 'loading' ? [] : [arrival],
    source: dataStatus === 'unavailable' ? 'unavailable' : dataStatus === 'stale' ? 'cached' : 'live',
    dataStatus,
    fetchedAt: '2026-10-25T18:29:00Z'
  };
}

describe('stop arrivals freshness states', () => {
  beforeEach(() => setDocumentLanguage('en'));
  afterEach(() => vi.useRealTimers());

  for (const state of ['loading', 'current', 'stale', 'empty', 'unavailable'] as const) {
    it(`renders a distinct localized status for ${state}`, () => {
      const root = document.createElement('main');
      renderStopArrivals(root, result(state));
      const status = root.querySelector('[role=status]') as HTMLElement;
      expect(status.dataset.freshness).toBe(state);
      expect(status.getAttribute('aria-live')).toBe(state === 'loading' ? 'off' : 'polite');
      if (state === 'current') {
        expect(status.textContent).toMatch(/^Updated:/);
        expect(status.textContent).not.toContain(translateCurrent('statusCurrent'));
      } else {
        expect(status.textContent).toContain(translateCurrent(`status${state[0].toUpperCase()}${state.slice(1)}` as 'statusCurrent'));
      }
    });
  }

  it('states are mutually distinguishable', () => {
    const texts = (['loading', 'current', 'stale', 'empty', 'unavailable'] as const).map((state) => {
      const root = document.createElement('main');
      renderStopArrivals(root, result(state));
      return (root.querySelector('[role=status]') as HTMLElement).textContent;
    });
    expect(new Set(texts).size).toBe(5);
  });

  it('keeps one live-region node while announcing status transitions', () => {
    const root = document.createElement('main');
    const states = ['loading', 'current', 'stale', 'empty', 'unavailable'] as const;
    let liveRegion: Element | null = null;

    for (const state of states) {
      renderStopArrivals(root, result(state));
      const currentRegion = root.querySelector('[role=status]');
      if (liveRegion) expect(currentRegion).toBe(liveRegion);
      liveRegion = currentRegion;
      if (state === 'current') {
        expect(liveRegion?.textContent).toMatch(/^Updated:/);
        expect(liveRegion?.textContent).not.toContain(translateCurrent('statusCurrent'));
      } else {
        expect(liveRegion?.textContent).toContain(
          translateCurrent(`status${state[0].toUpperCase()}${state.slice(1)}` as 'statusCurrent')
        );
      }
    }
  });

  it('stale keeps the original update time', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, result('stale'));
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
      .format(new Date('2026-10-25T18:29:00Z'));
    expect(root.querySelector('[role=status]')?.textContent).toContain(`Updated: ${time}`);
    expect(root.querySelector('[role=status]')?.textContent).not.toContain('2026');
  });

  it('does not announce loading before three seconds and announces it once afterward', () => {
    vi.useFakeTimers();
    const root = document.createElement('main');
    renderStopArrivals(root, result('loading'));
    const status = root.querySelector('[role=status]');
    expect(status?.getAttribute('aria-live')).toBe('off');
    vi.advanceTimersByTime(2_999);
    expect(status?.getAttribute('aria-live')).toBe('off');
    vi.advanceTimersByTime(1);
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent).toContain('Loading arrivals');
  });

  it('silences unchanged refreshes and announces a changed first arrival', () => {
    const root = document.createElement('main');
    const initial = result('current');
    renderStopArrivals(root, initial);
    const status = root.querySelector('[role=status]');
    const originalStatus = status?.textContent;

    renderStopArrivals(root, { ...initial, fetchedAt: 'later' });
    expect(status?.textContent).toBe(originalStatus);

    renderStopArrivals(root, {
      ...initial,
      arrivals: [{ ...arrival, minutes: 4 }],
      fetchedAt: 'latest'
    });
    expect(status?.textContent).toContain('4A to Bouzas: 4 min');
  });
});
