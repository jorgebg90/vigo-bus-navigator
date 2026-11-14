import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
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

test('primary navigation is a labeled bottom bar on phones and a labeled rail on larger screens', async ({ page }) => {
  await page.goto('/');
  for (const viewport of [...viewports, { width: 600, height: 800 }]) {
    await page.setViewportSize(viewport);
    const nav = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>('.primary-nav')!.getBoundingClientRect();
      const buttons = [...document.querySelectorAll<HTMLElement>('.primary-nav [data-destination]')];
      return {
        bar: { x: bar.x, y: bar.y, width: bar.width, height: bar.height },
        labels: buttons.map((button) => button.querySelector('.nav-label')?.textContent?.trim() ?? ''),
        visible: buttons.every((button) => {
          const box = button.getBoundingClientRect();
          return box.right <= innerWidth && box.bottom <= innerHeight && box.width >= 44 && box.height >= 44;
        })
      };
    });
    expect(nav.labels.every(Boolean)).toBe(true);
    expect(nav.labels).toHaveLength(5);
    expect(nav.visible).toBe(true);
    if (viewport.width < 600) {
      expect(nav.bar.y + nav.bar.height).toBeCloseTo(viewport.height, 0);
      expect(nav.bar.width).toBeCloseTo(viewport.width, 0);
    } else {
      expect(nav.bar.x).toBeLessThan(24);
      expect(nav.bar.height).toBeLessThan(viewport.height);
    }
  }
});
