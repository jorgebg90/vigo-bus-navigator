import { expect, type Page } from '@playwright/test';

export async function openStopFromSearch(page: Page, query = 'Aeroporto de Peinador', resultIndex = 0): Promise<void> {
  await page.locator('.primary-nav [data-destination="search"]').click();
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await search.fill(query);
  const result = page.locator('[data-stop-row] .stop-open').nth(resultIndex);
  await expect(result).toBeVisible();
  await result.click();
}
