// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { setDocumentLanguage } from '../../src/i18n';
import { renderLocationStatus } from '../../src/ui/map/location-status';

describe('location status', () => {
  beforeEach(() => setDocumentLanguage('en'));

  it.each([
    ['no-nearby-stops', 'No nearby bus stops are shown.'],
    ['unavailable', 'Your location could not be used.'],
    ['outside-coverage', 'Your location is outside Vigo bus coverage.']
  ] as const)('announces %s accessibly without exposing coordinates', (status, message) => {
    const root = document.createElement('section');

    renderLocationStatus(root, status);

    const region = root.querySelector('[data-location-status]');
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent).toBe(message);
    expect(region?.textContent).not.toMatch(/42\.|8\.7/);
  });

  it('clears the announcement when no message is needed', () => {
    const root = document.createElement('section');
    renderLocationStatus(root, 'unavailable');
    renderLocationStatus(root, null);
    expect(root.querySelector('[data-location-status]')).toBeNull();
  });

  it.each(['unavailable', 'outside-coverage'] as const)(
    'suppresses %s on mobile',
    (status) => {
      const root = document.createElement('section');

      renderLocationStatus(root, status, { mobile: true });

      expect(root.querySelector('[data-location-status]')).toBeNull();
    }
  );

  it('retains the no-nearby message on mobile', () => {
    const root = document.createElement('section');

    renderLocationStatus(root, 'no-nearby-stops', { mobile: true });

    expect(root.querySelector('[data-location-status="no-nearby-stops"]')?.textContent)
      .toBe('No nearby bus stops are shown.');
  });

  it.each(['unavailable', 'outside-coverage'] as const)(
    'retains %s on non-mobile viewports',
    (status) => {
      const root = document.createElement('section');

      renderLocationStatus(root, status, { mobile: false });

      expect(root.querySelector(`[data-location-status="${status}"]`)).not.toBeNull();
    }
  );
});
