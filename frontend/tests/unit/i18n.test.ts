// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { setDocumentLanguage, translate } from '../../src/i18n';
import { defaultPreferences } from '../../src/domain/favorites';
import { applyTheme } from '../../src/ui/theme';

describe('i18n', () => {
  it('translates and updates document language', () => {
    expect(translate('en', 'minutes', { minutes: 4 })).toBe('4 min');
    setDocumentLanguage('gl');
    expect(document.documentElement.lang).toBe('gl');
  });

  it('defaults to Spanish and light theme when no profile preference exists', () => {
    expect(defaultPreferences().language).toBe('es');
    expect(defaultPreferences().theme).toBe('light');
  });

  it('forces light theme even when an old dark preference was active', () => {
    document.documentElement.dataset.theme = 'dark';
    applyTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
