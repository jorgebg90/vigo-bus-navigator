import { describe, expect, it } from 'vitest';
import { loadUserFavorites, toggleFavoriteForTarget } from '../../src/application/toggle-favorite';
import type { StoragePort } from '../../src/application/ports';
import type { UserPreferences } from '../../src/domain/types';

describe('toggle favorite use case', () => {
  it('adds and removes a favorite through StoragePort', () => {
    let favorites: StoragePort['loadFavorites'] extends () => infer T ? T : never = [];
    const preferences: UserPreferences = { theme: 'light', language: 'es', recentViews: [] };
    const storage: StoragePort = { persisted: false, loadFavorites: () => favorites, saveFavorites: (value) => { favorites = value; }, loadPreferences: () => preferences, savePreferences: () => undefined };
    expect(loadUserFavorites(storage)).toEqual([]);
    expect(toggleFavoriteForTarget(storage, { type: 'stop', targetId: 'stop-1' })).toHaveLength(1);
    expect(toggleFavoriteForTarget(storage, { type: 'stop', targetId: 'stop-1' })).toEqual([]);
    expect(storage.persisted).toBe(false);
  });

  it('preserves caller-defined order when adding a favorite', () => {
    let favorites: StoragePort['loadFavorites'] extends () => infer T ? T : never = [
      { type: 'stop', targetId: 'stop-b', order: 0 },
      { type: 'stop', targetId: 'stop-a', order: 1 }
    ];
    const preferences: UserPreferences = { theme: 'light', language: 'es', recentViews: [] };
    const storage: StoragePort = {
      persisted: true,
      loadFavorites: () => favorites,
      saveFavorites: (value) => { favorites = value; },
      loadPreferences: () => preferences,
      savePreferences: () => undefined
    };

    expect(toggleFavoriteForTarget(storage, { type: 'stop', targetId: 'stop-c' }).map((favorite) => favorite.targetId))
      .toEqual(['stop-b', 'stop-a', 'stop-c']);
  });
});
