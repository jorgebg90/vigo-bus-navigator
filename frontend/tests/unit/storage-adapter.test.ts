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

  it('migrates valid stop and legacy line favorites without changing the v1 source bytes', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 1, data: [
      { type: 'line', targetId: 'line-4a', order: 0 },
      { type: 'stop', targetId: 'stop-1', order: 1 }
    ] });
    browserStorage.setItem('vbn:v1:favorites', legacy);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([
      { type: 'line', targetId: 'line-4a', order: 0 },
      { type: 'stop', targetId: 'stop-1', order: 1 }
    ]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(JSON.parse(browserStorage.getItem('vbn:v2:favorites') ?? '{}')).toEqual({
      v: 2,
      data: [
        { type: 'line', targetId: 'line-4a', order: 0 },
        { type: 'stop', targetId: 'stop-1', order: 1 }
      ]
    });
  });

  it('prefers a valid v2 favorite record over the legacy v1 record', () => {
    const browserStorage = new FakeStorage();
    browserStorage.setItem('vbn:v1:favorites', JSON.stringify({ v: 1, data: [{ type: 'stop', targetId: 'old', order: 0 }] }));
    browserStorage.setItem('vbn:v2:favorites', JSON.stringify({ v: 2, data: [{ type: 'stop', targetId: 'new', order: 0 }] }));
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'stop', targetId: 'new', order: 0 }]);
  });

  it('does not migrate a partially invalid v1 record and preserves its bytes while recovering recognized entries in memory', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 1, data: [
      { type: 'line', targetId: 'line-4a', order: 0 },
      { type: 'stop', targetId: '', order: 1 }
    ] });
    browserStorage.setItem('vbn:v1:favorites', legacy);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'line', targetId: 'line-4a', order: 0 }]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(browserStorage.getItem('vbn:v2:favorites')).toBeNull();
  });

  it('does not migrate an unsupported v1 envelope even when records can be recovered', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 99, data: [{ type: 'line', targetId: 'legacy-line', order: 0 }] });
    browserStorage.setItem('vbn:v1:favorites', legacy);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'line', targetId: 'legacy-line', order: 0 }]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(browserStorage.getItem('vbn:v2:favorites')).toBeNull();
  });

  it('does not fall back to v1 or overwrite an unsupported v2 envelope', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 1, data: [{ type: 'stop', targetId: 'legacy', order: 0 }] });
    const unsupported = JSON.stringify({ v: 99, data: [{ type: 'stop', targetId: 'future', order: 0 }] });
    browserStorage.setItem('vbn:v1:favorites', legacy);
    browserStorage.setItem('vbn:v2:favorites', unsupported);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'stop', targetId: 'future', order: 0 }]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(browserStorage.getItem('vbn:v2:favorites')).toBe(unsupported);
  });

  it('keeps a removed migrated favorite removed after reopening', () => {
    const browserStorage = new FakeStorage();
    browserStorage.setItem('vbn:v1:favorites', JSON.stringify({ v: 1, data: [{ type: 'stop', targetId: 'stop-1', order: 0 }] }));
    const first = new LocalStorageAdapter(browserStorage);
    expect(first.loadFavorites()).toHaveLength(1);
    first.saveFavorites([]);

    const reopened = new LocalStorageAdapter(browserStorage);
    expect(reopened.loadFavorites()).toEqual([]);
    expect(JSON.parse(browserStorage.getItem('vbn:v2:favorites') ?? '{}').data).toEqual([]);
  });

  it('preserves malformed v2 bytes and recovers recognized records without falling back to v1', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 1, data: [{ type: 'stop', targetId: 'legacy', order: 0 }] });
    const malformedV2 = JSON.stringify({ v: 2, data: [{ type: 'stop', targetId: 'recoverable', order: 0 }, null] });
    browserStorage.setItem('vbn:v1:favorites', legacy);
    browserStorage.setItem('vbn:v2:favorites', malformedV2);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([{ type: 'stop', targetId: 'recoverable', order: 0 }]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(browserStorage.getItem('vbn:v2:favorites')).toBe(malformedV2);
  });

  it('preserves unparseable v2 bytes and never falls back to legacy data', () => {
    const browserStorage = new FakeStorage();
    const legacy = JSON.stringify({ v: 1, data: [{ type: 'stop', targetId: 'legacy', order: 0 }] });
    const malformedV2 = '{broken';
    browserStorage.setItem('vbn:v1:favorites', legacy);
    browserStorage.setItem('vbn:v2:favorites', malformedV2);
    const storage = new LocalStorageAdapter(browserStorage);

    expect(storage.loadFavorites()).toEqual([]);
    expect(browserStorage.getItem('vbn:v1:favorites')).toBe(legacy);
    expect(browserStorage.getItem('vbn:v2:favorites')).toBe(malformedV2);
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
      { type: 'line' as const, targetId: 'line-b', order: 0 },
      { type: 'stop' as const, targetId: 'stop-a', order: 1 }
    ];
    storage.saveFavorites(favorites);

    expect(storage.persisted).toBe(false);
    expect(storage.loadFavorites()).toEqual(favorites);
  });
});
