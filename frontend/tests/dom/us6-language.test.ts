// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createSettingsMenu } from '../../src/ui/settings/settings-menu';
import type { StoragePort } from '../../src/application/ports';
import type { UserPreferences } from '../../src/domain/types';

describe('US6 language settings', () => {
  it('switches document language and persists the preference', () => {
    let preferences: UserPreferences = { theme: 'light', language: 'es', recentViews: [] };
    const storage: StoragePort = { persisted: true, loadFavorites: () => [], saveFavorites: () => undefined, loadPreferences: () => preferences, savePreferences: (value) => { preferences = value; } };
    const root = document.createElement('aside');
    createSettingsMenu(root, storage);
    root.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!.click();
    root.querySelector<HTMLButtonElement>('[data-language="gl"]')!.click();
    expect(document.documentElement.lang).toBe('gl');
    expect(preferences.language).toBe('gl');
  });
});
