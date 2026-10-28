import { describe, expect, it } from 'vitest';
import { getAppConfig } from '../../src/infrastructure/config';

describe('getAppConfig', () => {
  it('uses the local profile without a separately deployed transit backend', () => {
    const config = getAppConfig({ VITE_PROFILE: 'local' });
    expect(config.profile).toBe('local');
    expect(config.basePath).toBe('/');
  });

  it('does not require a Worker URL in production', () => {
    const config = getAppConfig({ VITE_PROFILE: 'production', BASE_URL: '/vigo-bus-navigator/' });
    expect(config.profile).toBe('production');
    expect(config.basePath).toBe('/vigo-bus-navigator/');
  });

  it('supports an explicit preview profile without a service URL', () => {
    const config = getAppConfig({ VITE_PROFILE: 'preview' });
    expect(config.profile).toBe('preview');
  });

  it('rejects separately hosted Worker endpoint configuration', () => {
    expect(() => getAppConfig({
      VITE_PROFILE: 'production',
      VITE_ARRIVALS_BASE_URL: 'https://vigo-bus-proxy.workers.dev'
    })).toThrow(/separately hosted transit backends/);
  });

  it('rejects unknown profiles instead of silently selecting local', () => {
    expect(() => getAppConfig({ VITE_PROFILE: 'staging' })).toThrow(/VITE_PROFILE/);
  });
});
