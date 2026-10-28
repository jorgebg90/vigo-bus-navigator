import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('arrivals view is keyboard-operable, visible-focus, and WCAG 2.2 AA', async ({ page }) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: /Mapa interactivo|Interactive bus stop map/ });
  await expect(map).toBeVisible();
  await expect(map.locator('canvas.maplibregl-canvas')).toHaveAttribute('aria-hidden', 'true');
  const stopsInView = page.getByRole('button', { name: /Paradas en el mapa|Stops in view/ });
  await stopsInView.focus();
  const focusStyle = await stopsInView.evaluate((element) => getComputedStyle(element).outlineStyle !== 'none');
  expect(focusStyle).toBe(true);
  await page.keyboard.press('Enter');
  const chooser = page.getByRole('dialog');
  await expect(chooser).toBeVisible();
  await chooser.locator('ul button').first().focus();
  await page.keyboard.press('Enter');

  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('h2')).toBeFocused();
  const status = panel.locator('[data-arrivals-status]');
  await expect(status).toBeVisible();
  await expect(status).toHaveAttribute('aria-live', /polite|off/);
  await expect(panel.locator('[data-arrivals-privacy], [data-privacy-entry]')).toHaveCount(0);

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
  await page.keyboard.press('Escape');
  await expect(stopsInView).toBeFocused();
});

test('refreshes arrivals every 30 seconds only while visible and keeps focus stable', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await page.addInitScript(() => {
    const originalSetInterval = window.setInterval.bind(window);
    (window as Window & { __refreshTimerCount?: number }).__refreshTimerCount = 0;
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout !== 30_000 || typeof handler !== 'function') {
        return originalSetInterval(handler, timeout, ...args);
      }
      return originalSetInterval(() => {
        const state = window as unknown as Window & { __refreshTimerCount: number };
        state.__refreshTimerCount += 1;
        handler(...args);
      }, 1_000);
    }) as typeof window.setInterval;
  });
  const timerCount = () => page.evaluate(() => (window as Window & { __refreshTimerCount?: number }).__refreshTimerCount ?? 0);
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect(page.locator('[data-arrivals-status]')).toContainText(/Synthetic sample data|Datos de muestra sintéticos|Datos de mostra sintéticos/);
  const focusBefore = await page.evaluate(() => document.activeElement?.outerHTML);
  await expect.poll(timerCount, { timeout: 5_000 }).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.activeElement?.outerHTML)).toBe(focusBefore);

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(100);
  const countWhileHidden = await timerCount();
  await page.waitForTimeout(1_100);
  expect(await timerCount()).toBe(countWhileHidden);
  expect(requests).toEqual([]);
});