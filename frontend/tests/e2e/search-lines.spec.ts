import { expect, test } from '@playwright/test';

test('keyboard flow searches a stop and browses lines without opening the map', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).pathname.endsWith('/stops')) {
        return new Response(JSON.stringify({
          datasetVersion: 'fixture',
          generatedAt: '2026-10-26T12:00:00Z',
          stops: [{ id: 'stop-fixture', code: '1001', municipalCode: 'm-1', vitrasaId: '1001', name: 'Fixture stop 01', lat: null, lon: null, lineIds: ['line-4a'] }]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'search');
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await expect.poll(() => pageErrors.length).toBe(0);
  await search.fill('Fixture stop 01');
  await expect(page.locator('[data-search-count]')).toHaveCount(0);
  await expect(page.locator('[data-stop-row]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Fixture stop 01', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('aside[aria-label="Details"] h2')).toBeFocused();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);

  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ })).toBeVisible();
  const lineSearch = page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ });
  await lineSearch.fill('4A');
  const line = page.locator('[data-line-row] button').first();
  await line.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
  await expect(page.locator('[data-route-pattern]')).not.toHaveCount(0);
  const stop = page.locator('[data-route-stop]').first();
  await expect(stop.locator('.stop-open')).not.toContainText(/stop-/i);
  const favorite = stop.locator('.favorite-toggle');
  await expect(favorite).toBeVisible();
  await favorite.click();
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
});
