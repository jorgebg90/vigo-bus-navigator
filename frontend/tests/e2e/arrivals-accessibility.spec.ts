import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    const originalSetInterval = window.setInterval.bind(window);
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      originalSetInterval(handler, timeout === 30_000 ? 1_000 : timeout, ...args)) as typeof window.setInterval;
    (window as Window & { __arrivalsRequestCount?: number }).__arrivalsRequestCount = 0;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (/\/stops\/\d+\/arrivals(?:\?.*)?$/.test(url)) {
        const state = window as unknown as Window & { __arrivalsRequestCount: number };
        state.__arrivalsRequestCount += 1;
        return new Response(JSON.stringify({
          stopId: '1234', generatedAt: '2026-10-26T12:00:00Z', dataStatus: 'current',
          arrivals: [{ lineCode: '4A', destination: 'Bouzas', minutes: 3, eta: '2026-10-26T12:03:00Z' }]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
  });
  const requestCount = () => page.evaluate(() => (window as Window & { __arrivalsRequestCount?: number }).__arrivalsRequestCount ?? 0);
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect.poll(requestCount).toBeGreaterThan(0);
  await expect(page.locator('[data-arrivals-status]')).not.toHaveAttribute('data-freshness', 'loading');
  const focusBefore = await page.evaluate(() => document.activeElement?.outerHTML);
  const countAfterSelection = await requestCount();
  await expect.poll(requestCount, { timeout: 5_000 }).toBeGreaterThan(countAfterSelection);
  expect(await page.evaluate(() => document.activeElement?.outerHTML)).toBe(focusBefore);

  const countAfterRefresh = await requestCount();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1_100);
  expect(await requestCount()).toBe(countAfterRefresh);
});