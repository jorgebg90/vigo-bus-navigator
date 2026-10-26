import { describe, expect, it } from 'vitest';
import { toggleFavoriteForTarget } from '../../src/application/toggle-favorite';
import type { StoragePort } from '../../src/application/ports';
import type { UserPreferences } from '../../src/domain/types';

describe('toggle favorite use case', () => {
  it('adds and removes a favorite through StoragePort', () => {
    let favorites: StoragePort['loadFavorites'] extends () => infer T ? T : never = [];
    const preferences: UserPreferences = { theme: 'system', language: 'es', recentViews: [] };
    const storage: StoragePort = { persisted: false, loadFavorites: () => favorites, saveFavorites: (value) => { favorites = value; }, loadPreferences: () => preferences, savePreferences: () => undefined };
    expect(toggleFavoriteForTarget(storage, { type: 'line', targetId: 'l4a' })).toHaveLength(1);
    expect(toggleFavoriteForTarget(storage, { type: 'line', targetId: 'l4a' })).toEqual([]);
    expect(storage.persisted).toBe(false);
  });
});
