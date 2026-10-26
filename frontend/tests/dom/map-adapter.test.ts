// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { BrowserMapPort } from '../../src/infrastructure/map/map-port';

describe('BrowserMapPort', () => {
  it('mounts a themed accessible map container and renders stop controls', () => {
    const root = document.createElement('div');
    const map = new BrowserMapPort();
    map.mount(root, { theme: 'dark' });
    map.showStops([{ id: 's1', code: '1001', vitrasaId: '1001', name: 'Central', lat: 1, lon: 2, lineIds: ['l4a'] }], {});
    expect(root.dataset.theme).toBe('dark');
    expect(root.querySelector('button')?.textContent).toContain('Central');
    const onSelect = vi.fn();
    map.onStopSelected(onSelect);
    root.querySelector('button')?.click();
    expect(onSelect).toHaveBeenCalledWith('s1');
    map.unmount();
  });
});
