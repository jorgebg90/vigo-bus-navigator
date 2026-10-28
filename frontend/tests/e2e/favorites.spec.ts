import { expect, test } from '@playwright/test';
import { openStopFromSearch } from './helpers/open-stop-from-search';

test('saves a stop from its panel, restores it after reload, and removes it from Saved', async ({ page }) => {
  await page.goto('/');
  await openStopFromSearch(page);
  const details = page.locator('aside[aria-label="Details"]');
  const toggle = details.locator('.favorite-toggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAccessibleName(/Save .* to favorites|Guardar .* en favoritos/);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName(/Remove .* from favorites|Quitar .* de favoritos/);

  await page.reload();
  await page.getByRole('button', { name: /Saved|Guardado/ }).click();
  const saved = page.getByRole('main');
  await expect(saved.getByRole('tab', { name: /Favorites|Favoritos/ })).toBeVisible();
  const savedStop = saved.locator('.stop-open').first();
  await expect(savedStop).toBeVisible();
  const favoriteId = await page.evaluate(() => JSON.parse(localStorage.getItem('vbn:v2:favorites') ?? '{"data":[]}').data[0].targetId as string);
  await savedStop.click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'map');
  await expect(page.locator('.map-container')).toHaveAttribute('data-focused-stop', favoriteId);
  const reopened = page.locator('aside[aria-label="Details"]');
  await expect(reopened.locator('.favorite-toggle')).toHaveAttribute('aria-pressed', 'true');
  await reopened.locator('.favorite-toggle').click();
  const savedButton = page.getByRole('button', { name: /Saved|Guardado/ });
  await savedButton.click();
  await expect(page.getByRole('main').getByRole('tab', { name: /Favorites|Favoritos/ })).toBeVisible();
  await expect(page.getByRole('main').locator('[data-action="remove"]')).toHaveCount(0);

    await page.getByRole('button', { name: /^Idioma$/ }).click();
  await page.getByRole('menuitemradio', { name: /Galego/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'gl');
  const storedPreferences = await page.evaluate(() => localStorage.getItem('vbn:v1:preferences'));
  expect(JSON.parse(storedPreferences ?? '{}').data.language).toBe('gl');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'gl');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /Gardado/ }).click();
  await page.getByRole('tab', { name: /Recentes/ }).click();
  await expect(page.getByRole('main').locator('.stop-open')).toBeVisible();
});
