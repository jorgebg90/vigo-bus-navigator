// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStopArrivals } from '../../src/ui/stop/stop-arrivals-view';
import { setDocumentLanguage } from '../../src/i18n';
import type { StopArrivalsResult } from '../../src/application/get-stop-arrivals';
import type { Line } from '../../src/domain/types';

const stop = {
  id: 'stop-1001',
  code: 'municipal-1001',
  municipalCode: '2789',
  vitrasaId: '1001',
  name: 'Central',
  lat: 42.2,
  lon: -8.7,
  lineIds: []
};

function result(dataStatus: StopArrivalsResult['dataStatus']): StopArrivalsResult {
  return {
    stop,
    arrivals: [],
    source: dataStatus === 'unavailable' ? 'unavailable' : 'live',
    dataStatus,
    fetchedAt: ''
  };
}

describe('stop panel presentation', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it('does not expose network implementation details or a privacy link', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, result('loading'));
    expect(root.querySelector('[data-arrivals-privacy]')).toBeNull();
    expect(root.querySelector('[data-privacy-entry]')).toBeNull();
    expect(root.textContent).not.toMatch(/Cloudflare|Vitrasa|metadatos|perfil/i);
  });

  it('shows the update time with a refresh icon at the end and refreshes on activation', () => {
    const root = document.createElement('main');
    const onRefresh = vi.fn();
    renderStopArrivals(root, {
      ...result('current'),
      fetchedAt: '2026-10-28T10:10:01.401Z'
    }, onRefresh);

    const status = root.querySelector<HTMLElement>('[data-arrivals-status]')!;
    const refresh = root.querySelector<HTMLButtonElement>('[data-refresh-arrivals]')!;
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
      .format(new Date('2026-10-28T10:10:01.401Z'));
    expect(status.textContent).toBe(`Updated: ${time}`);
    expect(status.textContent).not.toContain('2026');
    expect(status.textContent).not.toContain('Live');
    expect(refresh.querySelector('svg')).toBeTruthy();
    expect(refresh.getAttribute('aria-label')).toBe('Refresh arrivals');
    expect(refresh.parentElement).toBe(root.querySelector('[data-arrivals-status-row]'));
    expect([...refresh.parentElement!.children]).toEqual([status, refresh]);
    refresh.click();
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('preserves and disables the refresh control while an update is pending', () => {
    const root = document.createElement('main');
    document.body.append(root);
    const refresh = vi.fn();
    renderStopArrivals(root, result('current'), refresh);
    const button = root.querySelector<HTMLButtonElement>('[data-refresh-arrivals]')!;
    button.focus();

    renderStopArrivals(root, { ...result('loading'), retryPending: true }, refresh);

    expect(root.querySelector('[data-refresh-arrivals]')).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.click();
    expect(refresh).not.toHaveBeenCalled();
    root.remove();
  });

  it('updates the displayed time when a manual refresh completes with unchanged arrivals', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, {
      ...result('current'),
      fetchedAt: '2026-10-28T10:10:01.401Z'
    }, vi.fn());
    renderStopArrivals(root, {
      ...result('current'),
      fetchedAt: '2026-10-28T10:10:01.401Z',
      retryPending: true
    }, vi.fn());
    renderStopArrivals(root, {
      ...result('current'),
      fetchedAt: '2026-10-28T10:11:01.401Z'
    }, vi.fn());

    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
      .format(new Date('2026-10-28T10:11:01.401Z'));
    expect(root.querySelector('[data-arrivals-status]')?.textContent).toBe(`Updated: ${time}`);
  });

  it('shows the selected stop serving lines with their catalog colors', () => {
    const root = document.createElement('main');
    const lines: Line[] = [
      { id: 'line-4a', code: '4A', name: 'Bouzas', color: '#009900' },
      { id: 'line-7', code: '7', name: 'Coia', color: '#14532D' }
    ];
    const favorite = { saved: true, onToggle: () => undefined };
    renderStopArrivals(root, {
      ...result('current'), stop: { ...stop, lineIds: ['line-4a', 'line-7'] }
    }, undefined, favorite, lines);

    const badges = [...root.querySelectorAll('.stop-arrivals-summary [data-line-code-badge]')];
    expect(badges.map((badge) => badge.textContent)).toEqual(['4A', '7']);
    expect((badges[0] as HTMLElement).style.backgroundColor).toBe('#009900');
    expect(root.querySelector('.stop-arrivals-summary .favorite-toggle')?.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('stop panel states and next actions', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it('offers a retry for stale and unavailable arrivals', () => {
    for (const dataStatus of ['stale', 'unavailable'] as const) {
      const root = document.createElement('main');
      renderStopArrivals(root, result(dataStatus), () => undefined);
      expect(root.querySelector('[data-next-action="retry"]')).toBeTruthy();
    }
  });

  it('preserves the focused Retry node and announces completion after pending refresh', () => {
    const root = document.createElement('main');
    document.body.append(root);
    const onRetry = vi.fn();
    renderStopArrivals(root, result('stale'), onRetry);
    const retry = root.querySelector<HTMLButtonElement>('[data-next-action="retry"]')!;
    retry.focus();
    expect(retry.type).toBe('button');
    retry.click();
    expect(onRetry).toHaveBeenCalledOnce();
    onRetry.mockClear();

    renderStopArrivals(root, { ...result('stale'), retryPending: true }, onRetry);

    expect(root.querySelector('[data-next-action="retry"]')).toBe(retry);
    expect(document.activeElement).toBe(retry);
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    retry.click();
    expect(onRetry).not.toHaveBeenCalled();

    renderStopArrivals(root, result('current'), onRetry);
    expect(root.querySelector('[data-arrivals-status]')?.getAttribute('aria-live')).toBe('polite');
    expect(root.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(root.querySelector('[data-next-action="retry"]')).toBeNull();
  });

  it('links empty results to lines serving the selected stop', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, { ...result('empty'), stop: { ...stop, lineIds: ['line-4a'] } });
    expect(root.querySelector('[data-next-action="serving-lines"]')).toBeTruthy();
  });

  it('shows no-live-id and missing-coordinate states without printing coordinates', () => {
    const noLiveId = document.createElement('main');
    renderStopArrivals(noLiveId, { ...result('unavailable'), stop: { ...stop, vitrasaId: null } });
    expect(noLiveId.querySelector('[data-stop-state="no-live-id"]')).toBeTruthy();

    const unlocated = document.createElement('main');
    renderStopArrivals(unlocated, { ...result('current'), stop: { ...stop, lat: null, lon: null } });
    expect(unlocated.textContent).toContain('No map position');
    expect(unlocated.textContent).not.toContain('42.2');
    expect(unlocated.textContent).not.toContain('-8.7');
  });

  it('uses the offline state without removing the selected stop', () => {
    const root = document.createElement('main');
    renderStopArrivals(root, { ...result('unavailable'), dataStatus: 'offline' });
    expect(root.querySelector('[data-freshness="offline"]')).toBeTruthy();
    expect(root.textContent).toContain('Offline');
  });
});