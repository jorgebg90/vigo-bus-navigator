import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('shows clearly labeled provisional fixture times and route data without contacting JSP', async ({ page }) => {
  test.setTimeout(120_000);
  const { requests } = await useMunicipalProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  const lineButton = page.getByRole('button', { name: 'A Synthetic line A' });
  await expect(lineButton).toBeVisible();
  await lineButton.click();

  await expect(page.locator('[data-schedule-provenance="provisional-fixture"]')).toContainText('Synthetic provisional schedule evaluation fixture');
  await expect(page.locator('[data-provisional-warning]').first()).toContainText(/Provisional data|Datos provisionales|Datos provisorios/);
  await expect(page.locator('[data-line-departures] li')).toHaveText(['08:00', '08:15']);
  await expect(page.locator('[data-line-departures]')).toHaveAttribute('aria-label', /Departures|Salidas|Saídas/);
  await expect(page.getByRole('heading', { name: /Departures|Salidas|Saídas/, exact: true })).toBeVisible();
  await expect(page.locator('[data-route-shape="Route_1005"]')).toBeVisible();
  await expect(page.locator('[data-route-shape] [data-provenance-source]')).toContainText('Synthetic provisional geometry evaluation fixture');
  await expect(page.locator('[data-route-shape-text-alternative]')).toContainText(/no verified stop-by-stop description|no hay una descripción verificada parada por parada|non hai unha descrición verificada parada a parada/);
  await expect(page.locator('[data-route-shape] svg')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('[data-trip-stop-sequence] [data-provenance-source]')).toContainText('Synthetic provisional trip-stop evaluation fixture');
  await expect(page.locator('[data-trip-stop-sequence] li')).toHaveText('Aeroporto de Peinador');
  await expect(page.getByRole('table')).toHaveCount(0);

  const weekday = page.locator('[data-day-type="weekday"]');
  const saturday = page.locator('[data-day-type="saturday"]');
  const sundayHoliday = page.locator('[data-day-type="sunday_holiday"]');
  await weekday.focus();
  await page.keyboard.press('ArrowRight');
  await expect(saturday).toBeFocused();
  await expect(saturday).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('End');
  await expect(sundayHoliday).toBeFocused();
  await page.keyboard.press('Home');
  await expect(weekday).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(saturday).toHaveAttribute('aria-selected', 'true');
  await expect(saturday).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'line-day-tab-saturday');

  for (const dayType of ['weekday', 'saturday', 'sunday_holiday']) {
    const tab = page.locator(`[data-day-type="${dayType}"]`);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-schedule-provenance="provisional-fixture"]')).toBeVisible();
    await expect(page.locator('[data-line-departures] li')).toHaveText(['08:00', '08:15']);
  }
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.line-view')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const violations = await new AxeBuilder({ page })
      .include('.line-view')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.violations, `line view at ${viewport.width}px`).toEqual([]);
  }
  expect(requests).toEqual([]);
});

test('uses only exact-day offline snapshot fixtures with visible source and capture date', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'A Synthetic line A' }).click();

  const direction = page.locator('[data-schedule-direction="pattern-3397b53165d9"]');
  await expect(direction).toBeVisible();
  for (const [dayType, interval] of [
    ['weekday', '12'],
    ['saturday', '20'],
    ['sunday_holiday', '30']
  ]) {
    await page.locator(`[data-day-type="${dayType}"]`).click();
    const snapshotSource = page.locator('[data-schedule-provenance="snapshot"]');
    await expect(snapshotSource).toContainText('Synthetic exact-day snapshot test fixture');
    await expect(snapshotSource).toContainText('2026-10-25');
    await expect(page.locator(`[data-schedule-direction="pattern-3397b53165d9"] td:nth-child(4)`)).toHaveText(interval);
    await expect(snapshotSource).not.toContainText(/JSP|live/i);
  }
  await expect(page.locator('[data-line-departures]')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('does not use an offline snapshot when source evidence is untrusted', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await page.goto('/?snapshotFixture=untrusted');
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'A Synthetic line A' }).click();

  await expect(page.locator('[data-schedule-status="snapshot-unavailable"]')).toBeVisible();
  await expect(page.locator('table')).toHaveCount(0);
  await expect(page.locator('[data-schedule-provenance="snapshot"]')).toHaveCount(0);
  expect(requests).toEqual([]);
});
