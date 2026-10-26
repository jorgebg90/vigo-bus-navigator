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
    storage.saveFavorites([{ type: 'line', targetId: 'l4a', order: 0 }]);
    expect(storage.persisted).toBe(false);
    expect(storage.loadFavorites()).toHaveLength(1);
  });
});
