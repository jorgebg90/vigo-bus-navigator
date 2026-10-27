import { describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from '../../src/infrastructure/storage/local-storage-adapter';

class FakeStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('LocalStorageAdapter', () => {
  it('uses versioned envelopes and resets corrupted data', () => {
    const browserStorage = new FakeStorage();
    browserStorage.setItem('vbn:v1:favorites', '{broken');
    const storage = new LocalStorageAdapter(browserStorage);
    expect(storage.loadFavorites()).toEqual([]);
    expect(browserStorage.getItem('vbn:v1:favorites.corrupt')).toBe('{broken');
  });

  it('falls back to session memory when storage is unavailable', () => {
    const unavailableStorage = { getItem: () => { throw new Error('quota'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => undefined };
    const storage = new LocalStorageAdapter(unavailableStorage);
    storage.saveFavorites([{ type: 'stop', targetId: 'stop-1', order: 0 }]);
    expect(storage.persisted).toBe(false);
    expect(storage.loadFavorites()).toHaveLength(1);
  });

  it('migrates away legacy line favorites and retains stop favorites', () => {
    const browserStorage = new FakeStorage();
    browserStorage.setItem('vbn:v1:favorites', JSON.stringify({ v: 1, data: [
      { type: 'line', targetId: 'line-4a', order: 0 },
      { type: 'stop', targetId: 'stop-1', order: 1 }
    ] }));
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'stop', targetId: 'stop-1', order: 1 }]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toContain('stop-1');
    expect(browserStorage.getItem('vbn:v1:favorites')).not.toContain('line-4a');
  });

  it('migrates a previously saved dark theme to light', () => {
    const browserStorage = new FakeStorage();
    browserStorage.setItem('vbn:v1:preferences', JSON.stringify({
      v: 1,
      data: { theme: 'dark', language: 'gl', recentViews: [] }
    }));
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadPreferences()).toEqual({ theme: 'light', language: 'gl', recentViews: [] });
    expect(browserStorage.getItem('vbn:v1:preferences')).toContain('"theme":"light"');
  });

  it('preserves user-defined favorite order in session fallback when writes exceed quota', () => {
    const fullStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); },
      removeItem: () => undefined
    };
    const storage = new LocalStorageAdapter(fullStorage);
    const favorites = [
      { type: 'stop' as const, targetId: 'stop-b', order: 0 },
      { type: 'stop' as const, targetId: 'stop-a', order: 1 }
    ];
    storage.saveFavorites(favorites);

    expect(storage.persisted).toBe(false);
    expect(storage.loadFavorites()).toEqual(favorites);
  });
});
