import { expect, test } from '@playwright/test';

test('keyboard users can choose a visible stop and return focus from its panel', async ({ page }) => {
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  const canvas = map.locator('canvas.maplibregl-canvas').first();
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');

  const stopsInView = page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ });
  await stopsInView.focus();
  await page.keyboard.press('Enter');
  const chooser = page.getByRole('dialog');
  await expect(chooser).toBeVisible();
  await expect(chooser).toHaveAttribute('aria-modal', 'true');
  const firstStop = chooser.locator('ul button').first();
  await expect(firstStop).toBeFocused();
  await page.keyboard.press('Enter');

  const panelHeading = page.locator('aside[aria-label="Details"] h2');
  await expect(panelHeading).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panelHeading).toHaveCount(0);
  await expect(stopsInView).toBeFocused();

  await stopsInView.click();
  await page.locator('.stop-chooser ul button').first().click();
  await expect(panelHeading).toBeFocused();
  await page.locator('.panel-close, [data-sheet-close]').click();
  await expect(panelHeading).toHaveCount(0);
  await expect(stopsInView).toBeFocused();
});
