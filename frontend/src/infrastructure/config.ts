export type Profile = 'local' | 'preview' | 'production';

export interface AppConfig {
  profile: Profile;
  arrivalsBaseUrl: string;
  basePath: string;
}

export function getAppConfig(env: Record<string, string | undefined> = import.meta.env): AppConfig {
  const requestedProfile = env.VITE_PROFILE ?? 'local';
  if (!['local', 'preview', 'production'].includes(requestedProfile)) {
    throw new Error('Invalid configuration: VITE_PROFILE must be local, preview, or production');
  }
  const profile = requestedProfile as Profile;
  const arrivalsBaseUrl = env.VITE_ARRIVALS_BASE_URL ?? (profile === 'local' ? 'http://localhost:8787' : undefined);
  if (!arrivalsBaseUrl) throw new Error(`Missing configuration: VITE_ARRIVALS_BASE_URL must name the arrivals Worker URL in ${profile}`);
  let parsed: URL;
  try {
    parsed = new URL(arrivalsBaseUrl);
  } catch {
    throw new Error('Invalid configuration: VITE_ARRIVALS_BASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid configuration: VITE_ARRIVALS_BASE_URL must use http(s)');
  }
  return {
    profile,
    arrivalsBaseUrl,
    basePath: env.VITE_BASE_PATH ?? env.BASE_URL ?? '/'
  };
}
