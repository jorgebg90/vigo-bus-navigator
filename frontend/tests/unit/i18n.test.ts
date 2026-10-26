// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { setDocumentLanguage, translate } from '../../src/i18n';

describe('i18n', () => {
  it('translates and updates document language', () => {
    expect(translate('en', 'minutes', { minutes: 4 })).toBe('4 min');
    setDocumentLanguage('gl');
    expect(document.documentElement.lang).toBe('gl');
  });
});
