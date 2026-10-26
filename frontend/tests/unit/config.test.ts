import { describe, expect, it } from 'vitest';
import { getAppConfig } from '../../src/infrastructure/config';

describe('getAppConfig', () => {
  it('uses the local worker URL in the local profile', () => {
    const config = getAppConfig({ VITE_PROFILE: 'local' });
    expect(config.profile).toBe('local');
    expect(config.arrivalsBaseUrl).toBe('http://localhost:8787');
  });

  it('requires an explicit worker URL in production', () => {
    expect(() => getAppConfig({ VITE_PROFILE: 'production', BASE_URL: '/vigo-bus-navigator/' })).toThrow(/VITE_ARRIVALS_BASE_URL/);
  });

  it('uses the configured worker URL in production without leaking it elsewhere', () => {
    const config = getAppConfig({ VITE_PROFILE: 'production', VITE_ARRIVALS_BASE_URL: 'https://vigo-bus-proxy.workers.dev', BASE_URL: '/vigo-bus-navigator/' });
    expect(config.arrivalsBaseUrl).toBe('https://vigo-bus-proxy.workers.dev');
    expect(config.basePath).toBe('/vigo-bus-navigator/');
  });

  it('supports an explicit preview profile with its own Worker URL', () => {
    const config = getAppConfig({ VITE_PROFILE: 'preview', VITE_ARRIVALS_BASE_URL: 'https://preview.vigo-bus-proxy.workers.dev' });
    expect(config.profile).toBe('preview');
    expect(config.arrivalsBaseUrl).toBe('https://preview.vigo-bus-proxy.workers.dev');
  });

  it('rejects unknown profiles instead of silently selecting local', () => {
    expect(() => getAppConfig({ VITE_PROFILE: 'staging' })).toThrow(/VITE_PROFILE/);
  });

  it('rejects invalid arrivals base URLs without leaking secrets', () => {
    expect(() => getAppConfig({ VITE_ARRIVALS_BASE_URL: 'not a url' })).toThrow(/invalid/i);
    expect(() => getAppConfig({ VITE_ARRIVALS_BASE_URL: 'ftp://example.com' })).toThrow(/http/i);
  });
});
