import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('shows JSP line catalogs and dated bundled stop discovery without exposing source rows', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const externalBackendRequests: string[] = [];
  page.on('request', (request) => {
    if (/127\.0\.0\.1:8787|workers\.dev|\/(?:lines|stops)(?:\/|$)/.test(request.url())) {
      externalBackendRequests.push(request.url());
    }
  });
  await page.goto('/');

  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('[data-line-row]').first()).toBeVisible();
  await expect(page.getByText('Synthetic line A')).toBeVisible();
  await expect(page.getByText('linea', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await expect(page.locator('[data-stop-discovery-source="bundled-catalog"]')).toContainText('2026-10-26');
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Aeroporto de Peinador');
  await page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true }).click();
  const servingLines = page.locator('[data-stop-serving-lines]');
  await expect(servingLines.locator('[data-serving-lines-source]')).toHaveCount(0);
  await expect(servingLines.getByText('Vigo municipal JSP')).toHaveCount(0);
  const servingLine = servingLines.locator('[data-serving-line="A"]');
  await expect(servingLine).toBeVisible();
  await expect(servingLine).toHaveCSS('border-radius', '0px');
  await expect(servingLine).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(servingLines.locator('[data-line-stop-detail="A"]')).toContainText('08:00, 08:15');
  await expect(servingLines.locator('[data-line-stop-source]')).toContainText('Synthetic provisional line-stop evaluation fixture');
  await expect(servingLines.locator('[data-provisional-warning]')).toBeVisible();
  const arrivalLineIcon = page.locator('[data-stop-arrivals] [data-arrival-line="A"]');
  await expect(arrivalLineIcon).toBeVisible();
  await arrivalLineIcon.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.destination-view')).toHaveAttribute('data-destination', 'lines');
  await expect(page.locator('.line-view h1')).toContainText('A');
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]'))
    .toHaveAttribute('data-route-line', 'A');
  expect(requests).toEqual([]);
  expect(externalBackendRequests).toEqual([]);
});
