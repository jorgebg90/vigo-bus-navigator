import { expect, test } from '@playwright/test';
import { openApiContracts } from '../../../scripts/openapi-contracts';

const basePath = process.env.VITE_BASE_PATH || '/';
const appPath = basePath;
const docsPath = `${basePath}docs/openapi/`;

test('direct OpenAPI route serves the generated document before and under service-worker control', async ({ page, context }) => {
  const directResponse = await page.goto(docsPath);
  expect(directResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  await expect(page.locator('.swagger-ui .opblock')).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText('MapLibre');

  await page.goto(appPath);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const controlledResponse = await page.goto(docsPath);
  expect(controlledResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  for (const contract of openApiContracts.slice(1)) {
    await page.getByRole('navigation', { name: 'Application API contracts' })
      .getByRole('link', { name: contract.title, exact: true }).click();
    await expect(page.getByRole('heading', { name: contract.title, level: 1 })).toBeVisible();
    await expect(page.locator('.swagger-ui .opblock').first()).toBeVisible();
    await expect(page.locator('footer')).toContainText(contract.path);
  }

  await context.setOffline(true);
  for (const contract of openApiContracts.slice(1)) {
    const response = await page.goto(`${docsPath}${contract.page}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: contract.title, level: 1 })).toBeVisible();
    await expect(page.locator('.swagger-ui .opblock').first()).toBeVisible();
  }
  const offlineResponse = await page.goto(docsPath);
  expect(offlineResponse?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('MapLibre');
  await context.setOffline(false);
});
