import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('localized enlarged navigation reserves its actual height for every destination', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  for (const language of ['es', 'gl']) {
    await page.getByRole('button', { name: /^(Language|Idioma|Lingua)$/ }).click();
    await page.locator(`[data-language="${language}"]`).click();
    for (const viewport of [{ width: 320, height: 700 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      for (const destination of ['map', 'search', 'journeys', 'lines', 'saved']) {
        await page.locator(`.primary-nav [data-destination="${destination}"]`).click();
        await expect(page.getByRole('main')).toHaveAttribute('data-destination', destination);
        await expect.poll(async () => page.evaluate(() => {
          const nav = document.querySelector<HTMLElement>('.primary-nav')!.getBoundingClientRect();
          const map = document.querySelector<HTMLElement>('.map-base')!.getBoundingClientRect();
          const panel = document.querySelector<HTMLElement>('.destination-view')!;
          const box = panel.getBoundingClientRect();
          return map.bottom <= nav.top + 1
            && (panel.dataset.destination === 'map' || box.bottom <= nav.top + 1);
        })).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
  }
});

test('Saved opens above mobile navigation and Lines uses readable rounded controls', async ({ page }) => {
  await page.goto('/');
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.locator('.primary-nav [data-destination="saved"]').click();
    const saved = page.getByRole('main');
    await expect(saved.getByRole('tab')).toHaveCount(2);
    if (viewport.width < 600) {
      await expect.poll(async () => {
        const panel = await saved.boundingBox();
        const nav = await page.locator('.primary-nav').boundingBox();
        return Math.abs(panel!.y + panel!.height - nav!.y);
      }).toBeLessThan(1);
      const panel = await saved.boundingBox();
      const map = await page.locator('.map-base').boundingBox();
      const shell = await page.locator('.app-shell').boundingBox();
      expect(panel!.height).toBeCloseTo(shell!.height * 0.45, 0);
      expect(map!.y + map!.height).toBeLessThanOrEqual(panel!.y + 1);
    } else {
      const panel = await saved.boundingBox();
      expect(panel!.y).toBeLessThan(24);
    }
    const tab = saved.getByRole('tab').first();
    await expect(tab).toHaveCSS('border-radius', '999px');
    const savedAccessibility = await new AxeBuilder({ page }).include('.destination-view')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(savedAccessibility.violations).toEqual([]);
    await page.locator('.primary-nav [data-destination="lines"]').click();
    await expect(page.locator('.lines-results [data-line-row]').first()).toBeVisible();
    const search = page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ });
    await expect(page.locator('.lines-search')).toHaveCSS('border-radius', '999px');
    await expect(search).toHaveCSS('min-height', '48px');
    await search.fill('A');
    await expect(page.locator('.lines-results [data-line-row]').first()).toBeVisible();
    await expect(page.locator('.lines-results .line-list-item').first()).toHaveCSS('border-radius', '16px');
    expect(await page.getByRole('main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const linesAccessibility = await new AxeBuilder({ page }).include('.destination-view')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(linesAccessibility.violations).toEqual([]);
    await page.locator('.primary-nav [data-destination="search"]').click();
    await expect(page.locator('.search-field')).toHaveCSS('border-radius', '999px');
    await expect(page.getByRole('searchbox')).toHaveCSS('min-height', '48px');
    await expect(page.locator('.search-field svg')).toHaveAttribute('aria-hidden', 'true');
    expect(await page.getByRole('main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.locator('.primary-nav [data-destination="map"]').click();
  }
});
