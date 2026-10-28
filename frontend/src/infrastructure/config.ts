export type Profile = 'local' | 'preview' | 'production';

export interface AppConfig {
  profile: Profile;
  basePath: string;
}

export type MunicipalProfile = 'fixture' | 'local-live' | 'production';

export interface MunicipalProfileConfig {
  profile: MunicipalProfile;
  endpoint: 'https://datos.vigo.org/vci_api_app/api2.jsp';
  productionEnabled: boolean;
}

const municipalEndpoint = 'https://datos.vigo.org/vci_api_app/api2.jsp';

export function getMunicipalProfileConfig(
  env: Record<string, string | undefined> = import.meta.env
): MunicipalProfileConfig {
  if (Object.keys(env).some((key) => /^VITE_MUNICIPAL_(BASE_URL|HOST|ENDPOINT)$/.test(key))) {
    throw new Error('Invalid configuration: the municipal endpoint is fixed');
  }

  const requestedProfile = env.VITE_MUNICIPAL_PROFILE
    ?? (env.VITE_PROFILE === 'production' ? 'production' : 'fixture');
  if (!['fixture', 'local-live', 'production'].includes(requestedProfile)) {
    throw new Error('Invalid configuration: VITE_MUNICIPAL_PROFILE must be fixture, local-live, or production');
  }

  return {
    profile: requestedProfile as MunicipalProfile,
    endpoint: municipalEndpoint,
    productionEnabled: requestedProfile === 'production'
  };
}

export function getAppConfig(env: Record<string, string | undefined> = import.meta.env): AppConfig {
  if (env.VITE_ARRIVALS_BASE_URL !== undefined) {
    throw new Error('Invalid configuration: separately hosted transit backends are not supported');
  }
  const requestedProfile = env.VITE_PROFILE ?? 'local';
  if (!['local', 'preview', 'production'].includes(requestedProfile)) {
    throw new Error('Invalid configuration: VITE_PROFILE must be local, preview, or production');
  }
  const profile = requestedProfile as Profile;
  return {
    profile,
    basePath: env.VITE_BASE_PATH ?? env.BASE_URL ?? '/'
  };
}
