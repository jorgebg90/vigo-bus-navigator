import { describe, expect, it } from 'vitest';
import type { StoragePort } from '../../src/application/ports';
import {
  loadUserPreferences,
  recordUserView,
  setPreferredLanguage
} from '../../src/application/update-user-preferences';
import type { UserPreferences } from '../../src/domain/types';

function createStorage(preferences: UserPreferences): StoragePort {
  let saved = preferences;
  return {
    persisted: false,
    loadFavorites: () => [],
    saveFavorites: () => undefined,
    loadPreferences: () => saved,
    savePreferences: (value) => { saved = value; }
  };
}

describe('update user preferences use cases', () => {
  const preferences: UserPreferences = {
    theme: 'light',
    language: 'es',
    recentViews: [{ type: 'stop', targetId: 'old', viewedAt: '2026-10-28T12:00:00.000Z' }]
  };

  it('loads the current preferences through the storage port', () => {
    const storage = createStorage(preferences);

    expect(loadUserPreferences(storage)).toEqual(preferences);
  });

  it('changes language without discarding other preferences', () => {
    const storage = createStorage(preferences);

    expect(setPreferredLanguage(storage, 'gl')).toEqual({
      ...preferences,
      language: 'gl'
    });
    expect(storage.loadPreferences()).toEqual({ ...preferences, language: 'gl' });
  });

  it('records a recent view through the storage port', () => {
    const storage = createStorage(preferences);
    const now = new Date('2026-10-28T13:00:00.000Z');

    expect(recordUserView(storage, { type: 'line', targetId: 'L4A' }, now)).toEqual([
      { type: 'line', targetId: 'L4A', viewedAt: now.toISOString() },
      preferences.recentViews[0]
    ]);
    expect(storage.loadPreferences().recentViews[0].targetId).toBe('L4A');
  });
});
