import { expect, test } from '@playwright/test';

test('loads the map-first shell and network catalog in production preview', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Map|Mapa/ })).toBeVisible();
  await expect(page.getByRole('region', { name: /Mapa interactivo|Interactive bus stop map/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('button')).toHaveCount(4);
});

test('keeps the line catalog available offline and clears the status on recovery', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: /Mapa interactivo|Interactive bus stop map/ })).toHaveAttribute('data-stop-count', /[1-9]\d*/);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open('vbn-api-catalog');
    return (await cache.keys()).map((request) => request.url);
  })).toEqual(expect.arrayContaining([expect.stringMatching(/\/lines$/), expect.stringMatching(/\/stops$/)]));

  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await expect(page.locator('.app-shell > [role="status"]')).toBeVisible();

  await context.setOffline(false);
  await expect(page.locator('.app-shell > [role="status"]')).toBeHidden();
});

test('shows offline status and stop state, keeps the map catalog, and clears the strip when online', async ({ page, context }) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: /Mapa interactivo|Interactive bus stop map/ });
  await expect(map).toBeVisible();
  const offlineStatus = page.locator('.app-shell > [role="status"]');
  await expect(offlineStatus).toBeHidden();

  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  await expect(offlineStatus).toBeVisible();
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect(page.locator('[data-arrivals-status]')).toHaveAttribute('data-freshness', 'offline');

  await context.setOffline(false);
  await expect(offlineStatus).toBeHidden();
  await expect(map).toHaveAttribute('data-stop-count', /[1-9]\d*/);
});
