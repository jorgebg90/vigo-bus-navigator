import { expect, test } from '@playwright/test';

test('splits mobile stop search between the map and scrollable results', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Aeroporto de Peinador');
  await expect(page.locator('[data-stop-row]')).toHaveCount(1);

  const searchPanel = page.locator('.destination-view[data-destination="search"]');
  const mapContainer = page.locator('.map-base .map-container');
  const searchBox = await searchPanel.boundingBox();
  const mapBox = await mapContainer.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(mapBox).not.toBeNull();
  expect(mapBox!.y + mapBox!.height).toBeLessThanOrEqual(searchBox!.y);
  expect(searchBox!.y + searchBox!.height).toBeCloseTo(844, 0);
  expect(searchBox!.height).toBeLessThanOrEqual(844 * 0.45);
});

test('keyboard flow searches a stop and browses lines without opening the map', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'search');
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await expect.poll(() => pageErrors.length).toBe(0);
  await search.fill('Aeroporto de Peinador');
  await expect(page.locator('[data-search-count]')).toHaveCount(0);
  await expect(page.locator('[data-stop-row]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('aside[aria-label="Details"] h2')).toBeFocused();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);

  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ })).toBeVisible();
  const lineSearch = page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ });
  await lineSearch.fill('A');
  const line = page.locator('[data-line-row] button').first();
  await line.focus();
  await expect(line).toBeFocused();
  await line.press('Enter');
  await expect(page.locator('[data-schedule-provenance="provisional-fixture"]')).toBeVisible();
  await expect(page.locator('[data-provisional-warning]').first()).toBeVisible();
  await expect(page.locator('[data-schedule-disclosure]')).toHaveJSProperty('open', false);
  await page.locator('[data-schedule-toggle]').click();
  await expect(page.locator('[data-line-departures] li')).toHaveText(['08:00', '08:15']);
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
  await expect(page.locator('[data-route-pattern]').first()).toBeVisible();
  await expect(page.locator('[data-route-provenance="bundled-catalog"]')).toContainText('2026-10-26');
  const stop = page.locator('[data-route-stop]').first();
  await expect(stop.locator('.stop-open')).not.toContainText(/stop-/i);
  const relatedLineIcon = stop.locator('[data-line-route]').first();
  await expect(relatedLineIcon).toBeVisible();
  const relatedLineCode = await relatedLineIcon.getAttribute('data-line-route');
  expect(relatedLineCode).toBeTruthy();
  await relatedLineIcon.click();
  await expect(page.locator('.line-view-header h1 .line-badge')).toHaveText(relatedLineCode ?? '');
});
