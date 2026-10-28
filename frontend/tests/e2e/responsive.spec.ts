import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 700 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 }
];

test('map shell reflows without overflow and keeps navigation, settings, map controls, and attribution usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.map-toolbar [data-stops-in-view]')).toHaveCount(0);
  await expect(page.locator('.map-toolbar [data-recenter]')).toHaveCount(1);
  await expect(page.locator('.map-toolbar [data-zoom="in"]')).toHaveCount(1);
  await expect(page.locator('.map-toolbar [data-zoom="out"]')).toHaveCount(1);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    const measurements = await page.evaluate(() => {
      const root = document.documentElement;
      const targets = [...document.querySelectorAll<HTMLElement>('.primary-nav button, .settings-trigger, .map-toolbar button')];
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        targets: targets.map((target) => {
          const box = target.getBoundingClientRect();
          return { width: box.width, height: box.height };
        })
      };
    });
    expect(measurements.scrollWidth).toBeLessThanOrEqual(measurements.clientWidth);
    expect(measurements.targets.length).toBeGreaterThan(4);
    expect(measurements.targets.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
    await expect(page.locator('.map-attribution-strip')).toContainText('OpenStreetMap contributors');
    await expect(page.locator('.map-attribution-strip')).toContainText('CARTO');
    await expect(page.locator('.map-attribution-strip')).not.toContainText(/Privacy|Privacidad|Privacidade/);
  }

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const reflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(reflow.scrollWidth).toBeLessThanOrEqual(reflow.clientWidth);
});
