import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH || '/';
const docsPath = `${basePath}docs/openapi/`;

test('Swagger UI exposes collapsible operations, schemas and read-only source without external requests', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto(docsPath);
  await expect(page).toHaveTitle(/OpenAPI documentation/);
  await expect(page.locator('.swagger-ui .opblock')).toHaveCount(1);
  await expect(page.locator('.swagger-ui section.models')).toBeVisible();
  await expect(page.locator('.swagger-ui select')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Application API contracts' })).toBeVisible();
  const skipLink = page.getByRole('link', { name: 'Skip to documentation' });
  if (test.info().project.name === 'ios-safari') await skipLink.focus();
  else await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contract-content')).toBeFocused();

  const operation = page.locator('.opblock-summary-control');
  await operation.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.opblock-body')).toBeVisible();
  await expect(page.getByRole('button', { name: /Try it out|Execute/ })).toHaveCount(0);
  await expect(page.locator('.swagger-ui')).toContainText('tipo');
  await operation.click();
  await expect(page.locator('.opblock-body')).toHaveCount(0);
  await page.getByText('OpenAPI YAML · read only', { exact: true }).click();
  await expect(page.getByLabel('Canonical OpenAPI YAML')).toBeVisible();
  await expect(page.getByLabel('Canonical OpenAPI YAML')).toContainText('openapi: 3.1.0');
  expect(externalRequests).toEqual([]);
});

test('Swagger UI reflows on mobile and enlarged text', async ({ page }) => {
  await page.goto(`${docsPath}autocomplete.html`);
  await expect(page.locator('.swagger-ui .opblock')).toHaveCount(1);
  await page.locator('.opblock-summary-control').click();
  for (const viewport of [
    { width: 320, height: 760, enlargedText: false },
    { width: 320, height: 760, enlargedText: true },
    { width: 1280, height: 900, enlargedText: true }
  ]) {
    await page.setViewportSize(viewport);
    if (viewport.enlargedText && !await page.locator('style[data-test-text-size]').count()) {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.locator('style').last().evaluate((element) => element.setAttribute('data-test-text-size', 'true'));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('.opblock-summary-control')).toBeVisible();
  }
});

test('Swagger portal meets accessibility checks with a contract loaded', async ({ page }) => {
  await page.goto(`${docsPath}autocomplete.html`);
  await expect(page.locator('.swagger-ui section.models')).toBeVisible();
  await page.getByRole('button', { name: 'AddressSuggestion', exact: true }).click();
  await expect(page.getByRole('button', { name: 'AddressSuggestion', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
