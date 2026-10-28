import { expect, test } from '@playwright/test';

test('Map opens the shared stop-arrivals panel from the accessible chooser', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.getByRole('dialog').locator('ul button').first().click();
  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('h2').first()).toBeFocused();
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

test('Search selects a bundled stop over the persistent map', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Aeroporto de Peinador');
  await page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true }).click();
  await expect(page.locator('aside[aria-label="Details"] h2')).toBeFocused();
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
});

test('Lines opens a provisional fixture timetable over the persistent map', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  await page.locator('[data-line-row] button').first().click();
  await expect(page.locator('[data-schedule-provenance="provisional-fixture"]')).toBeVisible();
  await expect(page.locator('[data-provisional-warning]').first()).toBeVisible();
  await expect(page.locator('[data-line-departures] li')).toHaveText(['08:00', '08:15']);
  await expect(page.getByRole('tab', { name: /Saturday|Sábado/ })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toHaveCount(1);
});
