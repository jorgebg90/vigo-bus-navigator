import { expect, test } from '@playwright/test';

test('keyboard users can search for a stop and return focus to the remaining map controls', async ({ page }) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  const canvas = map.locator('canvas.maplibregl-canvas').first();
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');

  const recenter = page.getByRole('button', { name: /Recenter map|Centrar mapa/ });
  await expect(page.locator('.map-toolbar [data-stops-in-view]')).toHaveCount(0);
  await expect(recenter).toBeVisible();
  await expect(page.locator('.map-toolbar [data-zoom="in"]')).toBeVisible();
  await expect(page.locator('.map-toolbar [data-zoom="out"]')).toBeVisible();
  await recenter.focus();
  await expect(recenter).toBeFocused();

  await page.locator('.primary-nav [data-destination="search"]').click();
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await search.fill('Aeroporto de Peinador');
  const result = page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true });
  await result.focus();
  await page.keyboard.press('Enter');

  const panelHeading = page.locator('aside[aria-label="Details"] h2');
  await expect(panelHeading).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panelHeading).toHaveCount(0);
  await expect(page.locator('main h1')).toBeFocused();
});
