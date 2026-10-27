import { expect, test } from '@playwright/test';

test('Map opens the shared stop-arrivals panel from the accessible chooser', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.getByRole('dialog').locator('ul button').first().click();
  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('h2')).toBeFocused();
  await expect(panel.locator('[data-arrivals-status]')).toBeVisible();
  await expect(panel.locator('.favorite-toggle')).toBeVisible();
});

test('Saved opens and removes persisted favorites', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await page.locator('aside[aria-label="Details"] .favorite-toggle').click();
  await page.getByRole('button', { name: /Saved|Guardado|Gardado/ }).click();
  await expect(page.getByRole('tab', { name: /Favorites|Favoritos/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[role="tabpanel"] button[data-action="remove"]')).toBeVisible();
});

test('Search selects an unlocated stop over the persistent map', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).pathname.endsWith('/stops')) {
        return new Response(JSON.stringify({ datasetVersion: 'fixture', generatedAt: '2026-10-26T12:00:00Z', stops: [
          { id: 'stop-fixture', code: '1001', municipalCode: 'm-1', vitrasaId: '1001', name: 'Fixture stop', lat: null, lon: null, lineIds: ['line-4a'] }
        ] }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Fixture stop');
  await page.getByRole('button', { name: 'Fixture stop', exact: true }).click();
  await expect(page.locator('aside[aria-label="Details"] h2')).toBeFocused();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
});

test('Lines opens a published frequency table over the persistent map', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('4A');
  await page.locator('[data-line-row] button').first().click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
});
