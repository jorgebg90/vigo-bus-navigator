import { expect, test } from '@playwright/test';
import { openStopFromSearch } from './helpers/open-stop-from-search';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('reduced motion preserves map and panel information without animated movement', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'Camera movement assertions require stable desktop WebGL coordinates.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  await expect(map).toHaveAttribute('data-motion', 'instant');
  await page.getByRole('button', { name: /Recenter map|Centrar mapa/ }).click({ force: true });
  await expect(map).toHaveAttribute('data-fit-motion', 'instant');

  await openStopFromSearch(page);
  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('h2')).toBeVisible();
  expect(await page.locator('#app *').evaluateAll((elements) => elements.filter((element) => {
    const style = getComputedStyle(element);
    return style.animationDuration !== '0s' && style.animationDuration !== '0.01ms';
  }).filter((element) => element.matches('.skeleton, .panel-content-fade')).length)).toBe(0);
});

test('line loading and route feedback remain visible with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await useMunicipalProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  await page.evaluate(() => {
    const originalAll = Promise.all.bind(Promise);
    let delayPending = true;
    Object.defineProperty(Promise, 'all', {
      configurable: true,
      value: (values: Iterable<unknown>) => {
        const pending = originalAll(values);
        if (!delayPending) return pending;
        delayPending = false;
        return pending.then((result) => new Promise<unknown[]>((resolve) => {
          window.setTimeout(() => resolve(result), 650);
        }));
      }
    });
  });
  await page.getByRole('button', { name: 'A Synthetic line A' }).click();

  const loading = page.locator('[data-line-loading]');
  await expect(loading).toBeVisible({ timeout: 2_000 });
  await expect(loading).toHaveAttribute('role', 'status');
  const animationDurationMs = await loading.evaluate((element) => {
    const duration = getComputedStyle(element).animationDuration;
    return duration.endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1_000;
  });
  expect(animationDurationMs).toBeLessThanOrEqual(0.01);
  await expect(page.locator('.line-view')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]'))
    .toHaveAttribute('data-route-line', 'A');
});
