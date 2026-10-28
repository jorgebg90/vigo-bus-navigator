import type { Page } from '@playwright/test';

export type MunicipalTestProfile = 'fixture' | 'local-live' | 'production';

const supportedLiveActions = new Set([
  'TRANSPORTE_LINEAS_ES',
  'TRANSPORTE_LINEAS_GA',
  'TRANSPORTE_LINEAS_SERVICIOS_ES',
  'TRANSPORTE_LINEAS_SERVICIOS_GA',
  'TRANSPORTE_PARADA_ID',
  'TRANSPORTE_LINEAS_PARADA',
  'TRANSPORTE-ESTIMACION-PARADA'
]);

export async function useMunicipalProfile(
  page: Page,
  options: {
    profile?: MunicipalTestProfile;
    allowLiveNetwork?: boolean;
  } = {}
): Promise<{ requests: string[] }> {
  const profile = options.profile ?? 'fixture';
  const allowLiveNetwork = options.allowLiveNetwork === true && profile === 'local-live';
  const requests: string[] = [];

  await page.route('https://datos.vigo.org/vci_api_app/api2.jsp**', async (route) => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get('tipo');
    requests.push(url.toString());

    if (allowLiveNetwork && action !== null && supportedLiveActions.has(action)) {
      await route.continue();
      return;
    }

    await route.abort('blockedbyclient');
  });

  return { requests };
}
