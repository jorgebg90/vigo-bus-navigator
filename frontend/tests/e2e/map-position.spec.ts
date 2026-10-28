import { expect, test } from '@playwright/test';

test('searching a located bundled stop focuses the map and opens its arrivals panel', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'WebGL map assertions are scoped to the stable desktop viewport.');
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Aeroporto de Peinador');
  await page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true }).click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'map');
  await expect(page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ })).toHaveAttribute('data-focused-stop', 'stop-2789');
  await expect(page.locator('aside[aria-label="Details"]')).toBeVisible();
});

test('uses exact bundled positions, excludes unlocated stops, and opens the visible-stop chooser', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'Map position assertions are scoped to the stable desktop viewport.');
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('data-stop-count', '1157');

  const coordinates = JSON.parse((await map.getAttribute('data-stop-coordinates')) ?? '[]') as number[][];
  expect(coordinates).toHaveLength(1157);
  expect(coordinates).toContainEqual([-8.63286469, 42.225956918]);
  expect(coordinates.every(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude))).toBe(true);

  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  const chooser = page.getByRole('dialog');
  await expect(chooser).toBeVisible();
  const firstStop = chooser.locator('ul button').first();
  await firstStop.click();
  await expect(page.locator('aside[aria-label="Details"]')).toBeVisible();
});
