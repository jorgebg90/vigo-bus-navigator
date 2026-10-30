// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { createSettingsMenu } from '../../src/ui/settings/settings-menu';
import type { StoragePort } from '../../src/application/ports';
import type { UserPreferences } from '../../src/domain/types';
import { setDocumentLanguage, translateCurrent } from '../../src/i18n';

beforeEach(() => {
  document.body.replaceChildren();
  setDocumentLanguage('en');
  delete document.documentElement.dataset.theme;
});

describe('settings menu', () => {
  it('offers only Castellano and Galego and migrates an old English preference', () => {
    let preferences: UserPreferences = { theme: 'light', language: 'en', recentViews: [] };
    const storage: StoragePort = {
      persisted: true,
      loadFavorites: () => [],
      saveFavorites: () => undefined,
      loadPreferences: () => preferences,
      savePreferences: (value) => { preferences = value; }
    };
    const root = document.createElement('div');
    document.body.append(root);
    const menu = createSettingsMenu(root, storage);
    const trigger = root.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
    expect(trigger.getAttribute('aria-label')).toBe('Language');
    expect(trigger.textContent).toBe('');
    trigger.click();

    expect(root.querySelectorAll('[role="menuitemradio"][data-language]')).toHaveLength(2);
    expect(root.querySelectorAll('[role="menuitemradio"][data-theme]')).toHaveLength(0);
    expect([...root.querySelectorAll('[data-language]')].map((item) => item.textContent)).toEqual(['Castellano', 'Galego']);
    expect(preferences.language).toBe('es');
    expect(root.querySelector('[data-language="es"]')?.getAttribute('aria-checked')).toBe('true');
    expect(root.querySelector('[role="menuitem"][data-action="privacy"]')).toBeNull();
    expect(root.querySelector('[role="menuitem"][data-action="about"]')).toBeNull();

    root.querySelector<HTMLButtonElement>('[data-language="gl"]')!.click();
    expect(document.documentElement.lang).toBe('gl');
    expect(preferences.language).toBe('gl');
    expect(trigger.getAttribute('aria-label')).toBe(translateCurrent('language'));
    expect(document.documentElement.dataset.theme).not.toBe('dark');
    menu.destroy();
  });

  it('closes on Escape and restores focus to the trigger', () => {
    const storage: StoragePort = {
      persisted: true,
      loadFavorites: () => [],
      saveFavorites: () => undefined,
      loadPreferences: () => ({ theme: 'light', language: 'en', recentViews: [] }),
      savePreferences: () => undefined
    };
    const root = document.createElement('div');
    document.body.append(root);
    createSettingsMenu(root, storage);
    const trigger = root.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!;
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect((root.querySelector('[role="menu"]') as HTMLElement).hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it('wraps Tab focus while the menu is open', () => {
    const storage: StoragePort = {
      persisted: true,
      loadFavorites: () => [],
      saveFavorites: () => undefined,
      loadPreferences: () => ({ theme: 'light', language: 'en', recentViews: [] }),
      savePreferences: () => undefined
    };
    const root = document.createElement('div');
    document.body.append(root);
    createSettingsMenu(root, storage);
    root.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')!.click();
    const items = [...root.querySelectorAll<HTMLButtonElement>('[role="menu"] button')];
    items.at(-1)!.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);
  });
});
