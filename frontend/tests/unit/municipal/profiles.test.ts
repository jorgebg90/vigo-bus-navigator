import { describe, expect, it } from 'vitest';
import { getMunicipalProfileConfig } from '../../../src/infrastructure/config';

describe('municipal integration profiles', () => {
  it('defaults to deterministic fixtures and a fixed municipal endpoint', () => {
    expect(getMunicipalProfileConfig({})).toEqual({
      profile: 'fixture',
      endpoint: 'https://datos.vigo.org/vci_api_app/api2.jsp',
      productionEnabled: false
    });
  });

  it('selects direct local-live and production profiles while keeping the fixed endpoint', () => {
    expect(getMunicipalProfileConfig({ VITE_MUNICIPAL_PROFILE: 'local-live' }).profile).toBe('local-live');
    expect(getMunicipalProfileConfig({ VITE_MUNICIPAL_PROFILE: 'production' }).productionEnabled).toBe(true);
    expect(getMunicipalProfileConfig({ VITE_PROFILE: 'production' }).profile).toBe('production');
  });

  it('rejects unknown profiles and caller-controlled municipal hosts', () => {
    expect(() => getMunicipalProfileConfig({ VITE_MUNICIPAL_PROFILE: 'preview' })).toThrow(/profile/i);
    expect(() => getMunicipalProfileConfig({
      VITE_MUNICIPAL_BASE_URL: 'https://attacker.example/api'
    })).toThrow(/fixed/i);
  });
});
