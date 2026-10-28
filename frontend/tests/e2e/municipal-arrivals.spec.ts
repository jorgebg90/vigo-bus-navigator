import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';

test('default fixture profile renders synthetic arrivals without municipal requests', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Aeroporto de Peinador');
  await page.getByRole('button', { name: 'Aeroporto de Peinador', exact: true }).click();

  const panel = page.locator('aside[aria-label="Details"]');
  await expect(panel.locator('[data-arrivals-status]')).toHaveAttribute('data-freshness', 'current');
  await expect(panel.locator('[data-arrivals-status]')).toContainText(/Synthetic sample data|Datos de muestra sintéticos|Datos de mostra sintéticos/);
  await expect(panel.getByText('Synthetic Destination')).toBeVisible();
  expect(requests).toEqual([]);
});
