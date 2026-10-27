// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { renderMapAttribution } from '../../src/ui/privacy/privacy-view';

describe('map attribution', () => {
  it('retains required provider credits without a privacy entry', () => {
    const root = document.createElement('main');
    const attribution = renderMapAttribution(root);
    expect(attribution.textContent?.trim()).toBe('© OpenStreetMap contributors, © CARTO');
    expect(attribution.querySelectorAll('a')).toHaveLength(2);
    expect(attribution.textContent).not.toMatch(/privacy|privacidad|privacidade/i);
  });
});
