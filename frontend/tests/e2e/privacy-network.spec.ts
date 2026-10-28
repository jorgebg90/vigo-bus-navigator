import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('default fixture arrivals make no municipal request and use no analytics or geolocation', async ({ page }) => {
  const { requests: municipalRequests } = await useMunicipalProfile(page);
  await page.addInitScript(() => {
    const state = window as unknown as { __geoRequests: number };
    state.__geoRequests = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => { state.__geoRequests += 1; },
        watchPosition: () => { state.__geoRequests += 1; return 1; },
        clearWatch: () => undefined
      }
    });
  });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect(page.locator('[data-arrivals-status]')).toContainText(/Synthetic sample data|Datos de muestra sintéticos|Datos de mostra sintéticos/);
  expect(municipalRequests).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { __geoRequests: number }).__geoRequests)).toBe(0);
  expect(requests.some((url) => /analytics|doubleclick|adsystem|sponsor/i.test(url))).toBe(false);
  expect(requests.filter((url) => /basemaps\.cartocdn\.com/.test(url)).length).toBeGreaterThan(0);
});

test('does not expose a privacy page or link from Settings, map attribution, or stop details', async ({ page }) => {
  await page.goto('/');
    await page.getByRole('button', { name: /^(Language|Idioma)$/ }).click();
  await expect(page.locator('[role="menuitem"][data-action="privacy"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.map-attribution-strip a')).toHaveCount(2);
  await expect(page.locator('.map-attribution-strip')).not.toContainText(/Privacy|Privacidad|Privacidade/);

  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect(page.locator('aside[aria-label="Details"] [data-privacy-entry]')).toHaveCount(0);
  await expect(page.locator('aside[aria-label="Details"]')).not.toContainText(/Cloudflare|Vitrasa/);
});
