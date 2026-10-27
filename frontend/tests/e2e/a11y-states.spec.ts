import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 700 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 }
];

test('primary destinations and open overlays have no WCAG 2.2 AA violations in light theme', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(url, location.href).pathname.endsWith('/stops')) {
        return new Response(JSON.stringify({
          datasetVersion: 'axe-fixture',
          generatedAt: '2026-10-26T12:00:00Z',
          stops: [
            { id: 'stop-1', code: '1001', municipalCode: 'm-1', vitrasaId: '1001', name: 'Central', lat: 42.2, lon: -8.7, lineIds: ['line-4a'] },
            { id: 'stop-2', code: '1002', municipalCode: 'm-2', vitrasaId: null, name: 'Search-only', lat: null, lon: null, lineIds: ['line-7'] }
          ]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return originalFetch(input, init);
    };
  });
  await page.goto('/');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const [destination, label] of [
      ['map', /Map|Mapa/], ['lines', /Lines|Líneas|Liñas/],
      ['search', /Search|Buscar/], ['saved', /Saved|Guardado|Gardado/]
    ] as const) {
      await page.getByRole('button', { name: label }).click();
      const violations = await new AxeBuilder({ page })
        .include('#app')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(violations.violations, `${viewport.width} ${destination}`).toEqual([]);
    }
  }
});

test('chooser and settings menu remain accessible while open', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Stops in view|Paradas en el mapa/ }).click();
  let violations = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.violations).toEqual([]);
  await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^(Language|Idioma)$/ }).click();
  violations = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.violations).toEqual([]);
});
