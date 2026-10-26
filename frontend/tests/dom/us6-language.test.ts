// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderLanguageSettings } from '../../src/ui/settings/language-settings';
import type { StoragePort } from '../../src/application/ports';
import type { UserPreferences } from '../../src/domain/types';

describe('US6 language settings', () => {
  it('switches document language and persists the preference', () => {
    let preferences: UserPreferences = { theme: 'system', language: 'es', recentViews: [] };
    const storage: StoragePort = { persisted: true, loadFavorites: () => [], saveFavorites: () => undefined, loadPreferences: () => preferences, savePreferences: (value) => { preferences = value; } };
    const root = document.createElement('aside');
    renderLanguageSettings(root, storage);
    const select = root.querySelector('select') as HTMLSelectElement;
    select.value = 'gl';
    select.dispatchEvent(new Event('change'));
    expect(document.documentElement.lang).toBe('gl');
    expect(preferences.language).toBe('gl');
  });
});
