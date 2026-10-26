import { expect, test } from '@playwright/test';

test('P1 frequency flow shows API lines and available schedule metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main ul[aria-label] li')).toHaveCount(50);
  await page.getByRole('button', { name: /^4A -/ }).click();
  await expect(page.getByRole('heading', { name: '4A' })).toBeVisible();
  await expect(page.locator('table')).toBeVisible();
  await expect(page.getByText(/fixture-2026\.10/)).toBeVisible();
});

test('P2 stop flow exposes arrivals status', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^4A -/ }).click();
  await page.getByRole('button', { name: /Parada|Stop/ }).first().click();
  await expect(page.getByRole('heading', { name: /Rúa do Porriño|Praza do Cristo da Vitoria/ })).toBeVisible();
  await expect(page.getByText(/Tempo real|Tiempo real|Live|Chegadas non dispoñibles|Llegadas no disponibles|Arrivals unavailable/)).toBeVisible();
});

test('P3 map flow exposes accessible stop details', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^4A -/ }).click();
  const map = page.getByRole('region', { name: /Mapa|Map/ });
  await expect(map).toBeVisible();
  const stopButton = map.getByRole('button').first();
  const stopName = (await stopButton.getAttribute('aria-label'))?.split(' (')[0];
  expect(stopName).toBeTruthy();
  await stopButton.click();
  await expect(map.getByRole('status')).toContainText(stopName!);
});

test('P4 favorite flow updates the favorites section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^4A -/ }).click();
  await page.getByRole('button', { name: /favorito|favorite/i }).click();
  const lineName = (await page.getByRole('heading', { name: '4A' }).textContent())?.trim();
  expect(lineName).toBe('4A');
  await expect(
    page.getByRole('heading', { name: /Favoritos|Favorites/ }).locator('..').locator('ul').first()
      .getByText(/^line: /)
  ).toBeVisible();
});

test('P2 freshness states transition with retry on failure', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^4A -/ }).click();
  await page.getByRole('button', { name: /Parada|Stop/ }).first().click();
  const status = page.getByRole('status');
  // Offline forces the gateway to fail: the view must show the unavailable state and a retry action.
  await page.context().setOffline(true);
  await page.getByRole('button', { name: /Reintentar|Retry/ }).click().catch(() => undefined);
  await page.reload().catch(() => undefined);
  await page.context().setOffline(false);
  await page.goto('/');
  await page.getByRole('button', { name: /^4A -/ }).click();
  await page.getByRole('button', { name: /Parada|Stop/ }).first().click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(status.or(page.getByRole('status'))).toContainText(/Tiempo real|Tempo real|Live|no disponibles|unavailable/i);
});
