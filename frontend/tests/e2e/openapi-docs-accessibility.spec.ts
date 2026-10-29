import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { renderOpenApiDocument } from '../../../scripts/openapi-docs-template';

const basePath = process.env.VITE_BASE_PATH || '/';
const docsPath = `${basePath}docs/openapi/`;

test('OpenAPI documentation is semantic, keyboard navigable, and has visible focus', async ({ page }) => {
  await page.goto(docsPath);
  await expect(page).toHaveTitle(/OpenAPI documentation/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'OpenAPI source, read only' })).toBeVisible();
  await expect(page.getByText('YAML · read only')).toBeVisible();

  const skipLink = page.getByRole('link', { name: 'Skip to rendered documentation' });
  if (test.info().project.name === 'ios-safari') await skipLink.focus();
  else await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contract-content$/);
  await expect(page.getByRole('heading', { name: 'Municipal transit API contract', level: 1 })).toBeVisible();

  const navigationLinks = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');
  const linkCount = await navigationLinks.count();
  expect(linkCount).toBeGreaterThan(0);
  for (let index = 0; index < linkCount; index += 1) {
    const link = navigationLinks.nth(index);
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^#.+/);
    await link.focus();
    await expect(link).toBeFocused();
    await link.press('Enter');
    await expect(page.locator(`[id="${href!.slice(1)}"]`)).toBeVisible();
  }

  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});

test('documentation reflows at 320 CSS pixels and 200 percent text size', async ({ page }) => {
  await page.goto(docsPath);
  const viewports = [
    { width: 320, height: 760, enlargedText: false },
    { width: 320, height: 760, enlargedText: true },
    { width: 1280, height: 900, enlargedText: true }
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    if (viewport.enlargedText && !await page.locator('style[data-test-text-size]').count()) {
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await page.locator('style').last().evaluate((element) => element.setAttribute('data-test-text-size', 'true'));
    }
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      overflowingElements: [...document.querySelectorAll<HTMLElement>('*')]
        .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
        .slice(0, 8)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className} (${Math.round(element.getBoundingClientRect().right)}px): ${element.textContent?.trim().slice(0, 60)}`)
    }));
    expect(dimensions.documentWidth, JSON.stringify(dimensions.overflowingElements))
      .toBeLessThanOrEqual(dimensions.viewportWidth);
    await expect(page.getByRole('heading', { name: 'Operations', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Component schemas', level: 2 })).toBeVisible();
    await expect(page.locator('article.operation')).toHaveCount(1);
    await expect(page.locator('article.schema').first()).toBeVisible();
  }
});

test('empty contract sections retain accessible explanations', async ({ page }) => {
  await page.setContent(renderOpenApiDocument({
    openapi: '3.1.0',
    info: { title: 'Empty fixture', version: '1.0.0' },
    paths: {},
    components: { schemas: {} }
  }));
  await expect(page.getByText('No operations are defined in this contract.').first()).toBeVisible();
  await expect(page.getByText('No component schemas are defined in this contract.').first()).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
