import { expect, test } from '@playwright/test';

test('arrival requests disclose only the selected public stop ID and use no analytics or geolocation', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    const state = window as unknown as { __arrivalRequests: string[]; __geoRequests: number };
    state.__arrivalRequests = [];
    state.__geoRequests = 0;
    const geolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => { state.__geoRequests += 1; },
        watchPosition: () => { state.__geoRequests += 1; return 1; },
        clearWatch: () => undefined
      }
    });
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (/\/stops\/\d+\/arrivals(?:\?.*)?$/.test(url)) {
        state.__arrivalRequests.push(url);
        return new Response(JSON.stringify({
          stopId: '1001', generatedAt: '2026-10-26T12:00:00Z', dataStatus: 'current',
          arrivals: [{ lineCode: '4A', destination: 'Bouzas', minutes: 3, eta: '2026-10-26T12:03:00Z' }]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
    void geolocation;
  });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __arrivalRequests: string[] }).__arrivalRequests.length)).toBe(1);

  const arrivalsUrl = await page.evaluate(() => (window as unknown as { __arrivalRequests: string[] }).__arrivalRequests[0]);
  const parsed = new URL(arrivalsUrl);
  expect(parsed.pathname).toMatch(/^\/stops\/\d+\/arrivals$/);
  expect(parsed.search).toBe('');
  expect(arrivalsUrl).not.toMatch(/favorite|recent|language|theme|account|location/i);
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
