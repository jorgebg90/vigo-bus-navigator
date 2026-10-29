import { expect, test } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH || '/';
const appPath = basePath;
const docsPath = `${basePath}docs/openapi/`;

test('direct OpenAPI route serves the generated document before and under service-worker control', async ({ page, context }) => {
  const directResponse = await page.goto(docsPath);
  expect(directResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('MapLibre');

  await page.goto(appPath);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const controlledResponse = await page.goto(docsPath);
  expect(controlledResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  const offlineResponse = await page.goto(docsPath);
  expect(offlineResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('MapLibre');
  await context.setOffline(false);
});
