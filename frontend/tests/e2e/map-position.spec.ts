import { expect, test } from '@playwright/test';

const fixtureStops = Array.from({ length: 30 }, (_, index) => ({
  id: `stop-${index + 1}`,
  code: `${1000 + index}`,
  municipalCode: `municipal-${index + 1}`,
  vitrasaId: `${1000 + index}`,
  name: `Fixture stop ${String(index + 1).padStart(2, '0')}`,
  lat: 42.24 + index * 0.00001,
  lon: -8.72 - index * 0.00001,
  lineIds: ['line-4a']
}));
fixtureStops[0].lat = 42.24;
fixtureStops[0].lon = -8.72;
fixtureStops[1].lat = 42.24;
fixtureStops[1].lon = -8.72;
const unlocated = {
  id: 'stop-unlocated', code: '1999', municipalCode: 'municipal-unlocated', vitrasaId: '1999',
  name: 'Unlocated stop', lat: null, lon: null, lineIds: ['line-4a']
};

test('search result for a located stop opens the map focused on it with its arrivals panel', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'WebGL map assertions are scoped to the stable desktop viewport.');
  await page.addInitScript((stops) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).pathname.endsWith('/stops')) {
        return new Response(JSON.stringify({ datasetVersion: 'fixture', generatedAt: '2026-10-26T12:00:00Z', stops }), {
          status: 200, headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(input, init);
    };
  }, fixtureStops);
  await page.goto('/');
  await page.getByRole('button', { name: /Search|Buscar/ }).click();
  await page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ }).fill('Fixture stop 05');
  await page.getByRole('button', { name: 'Fixture stop 05', exact: true }).click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'map');
  await expect(page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ })).toHaveAttribute('data-focused-stop', 'stop-5');
  await expect(page.locator('aside[aria-label="Details"]')).toBeVisible();
});

test('uses exact API positions, excludes unlocated stops, and opens a chooser for coincident stops', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || (page.viewportSize()?.width ?? 0) < 1024, 'Pixel-exact GeoJSON hit testing is scoped to the stable desktop WebGL viewport.');
  await page.addInitScript((stops) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).pathname.endsWith('/stops')) {
        return new Response(JSON.stringify({ datasetVersion: 'fixture', generatedAt: '2026-10-26T12:00:00Z', stops }), {
          status: 200, headers: { 'content-type': 'application/json' }
        });
      }
      return originalFetch(input, init);
    };
  }, [...fixtureStops, unlocated]);
  await page.goto('/');
  const map = page.getByRole('region', { name: /Interactive bus stop map|Mapa interactivo/ });
  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('data-stop-count', '30');

  const coordinates = JSON.parse((await map.getAttribute('data-stop-coordinates')) ?? '[]') as number[][];
  expect(coordinates).toEqual(fixtureStops.map((stop) => [stop.lon, stop.lat]));
  expect(coordinates).not.toContainEqual([null, null]);

  await page.getByRole('button', { name: /Recenter map|Centrar mapa/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  const chooser = page.getByRole('dialog', { name: /Stops here \(30\)|Paradas aquí \(30\)/ });
  await expect(chooser).toBeVisible();
  const coincidentRows = chooser.getByRole('button', { name: /Fixture stop 01|Fixture stop 02/ });
  await expect(coincidentRows).toHaveCount(2);
  const rowHeights = await chooser.getByRole('button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
  expect(rowHeights.every((height) => height >= 44)).toBe(true);
  await chooser.locator('[data-chooser-close]').click();
  const canvas = map.locator('canvas.maplibregl-canvas');
  const canvasBox = await canvas.boundingBox();
  expect(canvasBox).toBeTruthy();
  await canvas.click({ position: { x: canvasBox!.width / 2 + 21, y: canvasBox!.height / 2 } });
  await expect(page.getByRole('dialog', { name: /Stops here \(30\)|Paradas aquí \(30\)/ })).toBeVisible();
  await page.getByRole('button', { name: /Close|Cerrar/ }).click();
  await canvas.click({ position: { x: canvasBox!.width / 2 + 23, y: canvasBox!.height / 2 } });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
