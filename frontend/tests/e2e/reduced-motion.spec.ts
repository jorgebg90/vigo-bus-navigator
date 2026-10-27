import { expect, test } from '@playwright/test';

test('reduced motion preserves map and panel information without animated movement', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'Camera movement assertions require stable desktop WebGL coordinates.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  await expect(map).toHaveAttribute('data-motion', 'instant');
  await page.getByRole('button', { name: /Recenter map|Centrar mapa/ }).click({ force: true });
  await expect(map).toHaveAttribute('data-fit-motion', 'instant');

  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  const chooser = page.getByRole('dialog');
  await chooser.locator('ul button').first().click();
  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('h2')).toBeVisible();
  expect(await page.locator('#app *').evaluateAll((elements) => elements.filter((element) => {
    const style = getComputedStyle(element);
    return style.animationDuration !== '0s' && style.animationDuration !== '0.01ms';
  }).filter((element) => element.matches('.skeleton, .panel-content-fade')).length)).toBe(0);
});
