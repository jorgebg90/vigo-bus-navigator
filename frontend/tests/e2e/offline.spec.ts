import { expect, test } from '@playwright/test';

test('loads the catalog shell in production preview', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Vigo Bus Navigator' })).toBeVisible();
  await expect(page.locator('main ul[aria-label] li')).toHaveCount(50);
});

test('keeps catalog, favorite, stale notice, and dataset metadata offline', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /4A/ }).click();
  await page.getByRole('button', { name: /favorite|favorito/i }).click();
  await expect(page.getByRole('heading', { name: '4A' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cachedApiUrls = await page.evaluate(async () => {
    const cache = await caches.open('vbn-api-catalog');
    return (await cache.keys()).map((request) => request.url);
  });
  expect(cachedApiUrls.some((url) => url.endsWith('/lines'))).toBe(true);
  expect(cachedApiUrls.some((url) => url.endsWith('/stops'))).toBe(true);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('main ul[aria-label]')).toBeVisible();
  await expect(page.getByText(/offline|sin conexión/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /4A/ })).toBeVisible();
  await page.getByRole('button', { name: /4A/ }).first().click();
  await expect(page.getByText(/fixture-2026\.10/)).toBeVisible();
});
