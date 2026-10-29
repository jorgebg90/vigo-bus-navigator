import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('fixture profile migrates saved items without making municipal requests', async ({ page }) => {
  const legacyRaw = JSON.stringify({ v: 1, data: [
    { type: 'line', targetId: 'legacy-line', order: 0 },
    { type: 'stop', targetId: 'legacy-stop', order: 1 }
  ] });
  await page.addInitScript((raw) => localStorage.setItem('vbn:v1:favorites', raw), legacyRaw);
  const { requests } = await useMunicipalProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Saved|Guardado/ }).click();

  await expect(page.getByText(/Unavailable: legacy-line|No disponible: legacy-line/)).toBeVisible();
  await expect(page.getByText(/Unavailable: legacy-stop|No disponible: legacy-stop/)).toBeVisible();
  const records = await page.evaluate(() => ({
    legacy: localStorage.getItem('vbn:v1:favorites'),
    current: JSON.parse(localStorage.getItem('vbn:v2:favorites') ?? '{"data":[]}').data
  }));
  expect(records.legacy).toBe(legacyRaw);
  expect(records.current).toEqual([
    { type: 'line', targetId: 'legacy-line', order: 0 },
    { type: 'stop', targetId: 'legacy-stop', order: 1 }
  ]);
  expect(requests).toEqual([]);
});

test('fixture E2E network helper blocks candidate traffic by default', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page, { profile: 'local-live', allowLiveNetwork: true });
  await page.goto('/');
  const blocked = await page.evaluate(async () => {
    try {
      await fetch('https://datos.vigo.org/vci_api_app/api2.jsp?tipo=TRANSPORTE_LINEA_GEOJSON&id=Route_1005');
      return false;
    } catch {
      return true;
    }
  });

  expect(blocked).toBe(true);
  expect(requests).toHaveLength(1);
  expect(new URL(requests[0]!).searchParams.get('tipo')).toBe('TRANSPORTE_LINEA_GEOJSON');
});
