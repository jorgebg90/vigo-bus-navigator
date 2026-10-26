import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('arrivals view is keyboard-operable, visible-focus, and WCAG 2.2 AA', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).waitFor();
  await page.keyboard.press('Tab');
  const firstFocused = page.locator(':focus');
  await expect(firstFocused).toBeVisible();
  const focusStyle = await firstFocused.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  });
  expect(focusStyle).toBe(true);

  await page.getByRole('button', { name: /4A/ }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /Parada|Stop/ }).first().focus();
  await page.keyboard.press('Enter');

  const status = page.getByRole('status');
  await expect(status).toBeVisible();
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('[data-arrivals-privacy]')).toBeVisible();

  const violations = await new AxeBuilder({ page })
    .include('#app')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(violations.violations).toEqual([]);

  const undersized = await page.locator('#app button:visible').evaluateAll((buttons) =>
    buttons.filter((button) => {
      const bounds = button.getBoundingClientRect();
      return bounds.width < 44 || bounds.height < 44;
    }).length
  );
  expect(undersized).toBe(0);
});