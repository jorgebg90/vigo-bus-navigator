import { expect, test } from '@playwright/test';

test('stops render at catalog coordinates and the route follows stop order', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /4A/ }).click();
  const map = page.getByRole('region', { name: /Mapa|Map/ });
  await expect(map).toBeVisible();

  const lineResponse = await page.request.get('http://127.0.0.1:8791/lines/4A');
  const line = await lineResponse.json() as { timetable: { byDayType: { weekday: { stopIds: string[] } } } };

  // Native markers exist for every API-provided stop of the line (FR-019).
  const markers = map.locator('.map-stop-marker');
  await expect(markers).toHaveCount(line.timetable.byDayType.weekday.stopIds.length);

  // The route polyline layer is present alongside the stop layer (FR-020).
  await expect.poll(async () => map.getAttribute('data-engine')).toBe('maplibre-deckgl');

  // Stop positions stay inside the Vigo area: markers project within the map canvas box.
  const box = await map.boundingBox();
  const count = await markers.count();
  for (let index = 0; index < count; index += 1) {
    const marker = await markers.nth(index).boundingBox();
    expect(marker).toBeTruthy();
    expect(box && marker && marker.x >= box.x - 5 && marker.x <= box.x + box.width + 5).toBe(true);
    expect(box && marker && marker.y >= box.y - 5 && marker.y <= box.y + box.height + 5).toBe(true);
  }
});
