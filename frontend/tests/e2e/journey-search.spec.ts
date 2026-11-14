import { expect, test } from '@playwright/test';
import { useMunicipalProfile } from './helpers/municipal-profile';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

declare global {
  interface Window {
    __autocompleteRequests?: Array<{ url: string; credentials: RequestCredentials | undefined; cache: RequestCache | undefined }>;
    __otpRequests?: Array<{ url: string; credentials: RequestCredentials | undefined; cache: RequestCache | undefined }>;
    __resolveOtp?: () => void;
  }
}

async function installPlannerFixture(page: import('@playwright/test').Page, otpPayload?: string, delayOtp = false): Promise<void> {
  const otp = otpPayload ?? await readFile('specs/example.json', 'utf8');
  await page.addInitScript(({ otp, delayOtp }) => {
    window.__autocompleteRequests = [];
    window.__otpRequests = [];
    const browserFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(requestUrl);
      if (url.origin === 'https://planificador-rutas.vigo.org') {
        window.__otpRequests?.push({ url: requestUrl, credentials: init?.credentials, cache: init?.cache });
        if (delayOtp) await new Promise<void>((resolve) => { window.__resolveOtp = resolve; });
        return new Response(otp, { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (url.origin !== 'https://planificador-rutas-api.vigo.org') return browserFetch(input, init);
      window.__autocompleteRequests?.push({ url: requestUrl, credentials: init?.credentials, cache: init?.cache });
      const query = url.searchParams.get('text') ?? '';
      return new Response(JSON.stringify({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: query.startsWith('Av.') ? [-8.7327, 42.22151] : [-8.71358, 42.23419] },
          properties: {
            gid: `custom:street:${query.startsWith('Av.') ? 456 : 123}`,
            layer: 'street', name: query, label: `${query}, Vigo`
          }
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };
  }, { otp, delayOtp });
}

test('plans municipal itineraries, selects alternatives and stops, and does not persist searches', async ({ page }) => {
  const { requests } = await useMunicipalProfile(page);
  await installPlannerFixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Plan a trip|Planificar viaje|Planificar viaxe/ }).click();
  await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'journeys');
  await expect(page.locator('[data-journey-mode="bus"]')).toBeVisible();
  await expect(page.locator('[data-journey-select]')).toHaveCount(0);

  const originInput = page.locator('[data-journey-address="origin"]');
  const destinationInput = page.locator('[data-journey-address="destination"]');
  await originInput.fill('Rúa do Príncipe');
  await page.getByRole('option', { name: /Rúa do Príncipe/ }).click();
  await destinationInput.fill('Av. de Madrid');
  await page.getByRole('option', { name: /Av\. de Madrid/ }).click();
  await expect(page.locator('[data-journey-endpoint="origin"]')).toHaveAttribute('data-journey-selected', 'true');
  await expect(page.locator('[data-journey-endpoint="destination"]')).toHaveAttribute('data-journey-selected', 'true');

  await page.getByRole('button', { name: /Swap origin and destination|Intercambiar origen y destino|Intercambiar orixe e destino/ }).click();
  await expect(page.locator('[data-journey-address="origin"]')).toHaveValue('Av. de Madrid, Vigo');
  await expect(page.locator('[data-journey-address="destination"]')).toHaveValue('Rúa do Príncipe, Vigo');
  await page.getByRole('button', { name: /Swap origin and destination|Intercambiar origen y destino|Intercambiar orixe e destino/ }).click();
  await page.locator('[data-journey-departure]').fill('2026-11-13T15:53');
  await page.locator('[data-journey-submit]').click();

  await expect(page.locator('[data-journey-option-select]')).toHaveCount(3);
  await expect(page.locator('[data-journey-directions]')).toContainText('4C');
  await expect(page.locator('[data-journey-directions] [data-journey-leg="WALK"]')).toHaveCount(2);
  expect(await page.locator('.destination-view').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-route', 'otp-0');
  await page.locator('[data-journey-option-select="otp-1"]').click();
  await expect(page.locator('[data-journey-directions]')).toContainText('11');
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-route', 'otp-1');
  const boardingStop = page.locator('[data-journey-directions] [data-journey-place]').first();
  const boardingName = await boardingStop.textContent();
  await boardingStop.click();
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-focused-place', boardingName!);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await expect(page.locator('.map-container')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-route', 'otp-1');
  await page.locator('[data-journey-more]').click();
  await expect(page.locator('[data-journey-option-select]')).toHaveCount(4);
  const otpRequests = await page.evaluate(() => window.__otpRequests ?? []);
  expect(otpRequests).toHaveLength(1);
  expect(otpRequests[0]).toMatchObject({ credentials: 'omit', cache: 'no-store' });
  const otpUrl = new URL(otpRequests[0].url);
  expect(otpUrl.searchParams.get('fromPlace')).toBe('42.23419,-8.71358');
  expect(otpUrl.searchParams.get('toPlace')).toBe('42.22151,-8.7327');
  expect(otpUrl.searchParams.get('time')).toBe('3:53 PM');
  await expect(page.locator('.journey-radius-note')).toHaveCount(0);
  await expect(page.locator('.journey-privacy-note summary')).toBeVisible();
  await expect(page.locator('.journey-privacy-note p')).not.toBeVisible();
  const autocompleteRequests = await page.evaluate(() => window.__autocompleteRequests ?? []);
  expect(autocompleteRequests).toHaveLength(2);
  expect(autocompleteRequests.map(({ url }) => new URL(url).searchParams.get('text'))).toEqual([
    'Rúa do Príncipe',
    'Av. de Madrid'
  ]);
  for (const request of autocompleteRequests) {
    expect(request).toMatchObject({ credentials: 'omit', cache: 'no-store' });
    const url = new URL(request.url);
    expect(url.pathname).toBe('/v1/autocomplete');
    expect(url.searchParams.get('layers')).toBe('venue,street');
    expect(url.searchParams.get('lang')).toBe('es');
  }
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /journey|origin|destination/i.test(key)))).toEqual([]);
  await expect(page.locator('.journey-privacy-note p')).toContainText(/autocomplete|autocompletado/);
  await expect(page.locator('.journey-privacy-note a').first()).toHaveAttribute('href', 'https://planificador-rutas-api.vigo.org/attribution');
  await expect(page.locator('.journey-privacy-note p')).toContainText('OpenStreetMap');
  await expect(page.locator('.journey-privacy-note p')).toContainText(/municipal/);
  const accessibility = await new AxeBuilder({ page }).include('.journey-results')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.evaluate(async () => {
    const requestUrls = (await Promise.all((await caches.keys()).map(async (key) => (
      (await (await caches.open(key)).keys()).map((request) => request.url)
    )))).flat();
    return requestUrls.some((url) => [
      'planificador-rutas.vigo.org', 'planificador-rutas-api.vigo.org'
    ].includes(new URL(url).hostname));
  })).toBe(false);

  await page.getByRole('button', { name: /Clear origin|Borrar origen|Borrar orixe/ }).click();
  await expect(page.locator('[data-journey-options]')).toHaveCount(0);
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-route', '');
});

test('hands search stops and addresses to the planner without submitting and restores search context', async ({ page }) => {
  await useMunicipalProfile(page);
  await installPlannerFixture(page);
  await page.goto('/');
  for (const destination of ['map', 'lines', 'saved', 'journeys']) {
    await page.locator(`.primary-nav [data-destination="${destination}"]`).click();
    await page.locator('.primary-nav [data-destination="search"]').click();
    await expect(page.getByRole('main')).toHaveAttribute('data-destination', 'search');
    await expect(page.locator('[data-result-kind]')).toHaveCount(0);
  }
  expect(await page.evaluate(() => window.__autocompleteRequests?.length)).toBe(0);
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await search.fill('Aeroporto de Peinador');
  const stop = page.locator('[data-stop-row]').first();
  await stop.locator('[data-stop-origin]').focus();
  await stop.locator('[data-stop-origin]').press('Enter');
  await expect(page.locator('[data-journey-address="origin"]')).toHaveValue('Aeroporto de Peinador');
  await expect(page.locator('[data-journey-option-select]')).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('heading').first()).toBeFocused();
  await page.locator('.primary-nav [data-destination="search"]').click();
  await expect(search).toHaveValue('Aeroporto de Peinador');
  await search.fill('Av. de Madrid');
  await page.locator('[data-address-row] [data-address-destination]').click();
  await expect(page.locator('[data-journey-address="origin"]')).toHaveValue('Aeroporto de Peinador');
  await expect(page.locator('[data-journey-address="destination"]')).toHaveValue('Av. de Madrid, Vigo');
  await expect(page.locator('[data-journey-submit]')).toBeEnabled();
  expect(await page.evaluate(() => window.__otpRequests?.length)).toBe(0);
  expect(page.url()).not.toMatch(/Madrid|Peinador|query|origin|destination/);
  const stored = await page.evaluate(() => [...Object.values(localStorage), ...Object.values(sessionStorage)].join(' '));
  expect(stored).not.toMatch(/Madrid|Peinador/);
});

test('hands a selected line route stop to the planner without losing the other endpoint', async ({ page }) => {
  await useMunicipalProfile(page);
  await installPlannerFixture(page);
  await page.goto('/');
  await page.locator('.primary-nav [data-destination="journeys"]').click();
  await page.locator('[data-journey-address="destination"]').fill('Av. de Madrid');
  await page.getByRole('option', { name: /Av\. de Madrid/ }).click();
  await page.locator('.primary-nav [data-destination="lines"]').click();
  await page.getByRole('searchbox', { name: /Search lines|Buscar líneas|Buscar liñas/ }).fill('A');
  await page.getByRole('button', { name: 'A Synthetic line A', exact: true }).click();
  const stop = page.locator('[data-route-stop]').first();
  await expect(stop).toBeVisible();
  const stopName = await stop.locator('.stop-open').innerText();
  await stop.getByRole('button', { name: /Use as origin|Usar como origen|Usar como orixe/, exact: true }).click();
  await expect(page.locator('[data-journey-address="origin"]')).toHaveValue(stopName);
  await expect(page.locator('[data-journey-address="destination"]')).toHaveValue('Av. de Madrid, Vigo');
  expect(await page.evaluate(() => window.__otpRequests?.length)).toBe(0);
});

test('unified address search exposes error, retry, offline and local empty states', async ({ page }) => {
  await installPlannerFixture(page);
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    let failNext = true;
    window.fetch = async (input, init) => {
      const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (new URL(raw, location.href).origin === 'https://planificador-rutas-api.vigo.org' && failNext) {
        failNext = false;
        return new Response('{}', { status: 503 });
      }
      return originalFetch(input, init);
    };
  });
  await page.goto('/');
  await page.locator('.primary-nav [data-destination="search"]').click();
  const search = page.getByRole('searchbox', { name: /Search stops|Buscar paradas/ });
  await page.locator('[data-search-category="addresses"]').click();
  await search.fill('Av. de Madrid');
  await expect(page.locator('[data-address-results] [data-content-state="error"]')).toBeVisible();
  await page.locator('[data-address-results] button').click();
  await expect(page.locator('[data-address-row]')).toHaveCount(1);
  const violations = await new AxeBuilder({ page }).include('.destination-view')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.violations).toEqual([]);
  await page.context().setOffline(true);
  await search.fill('Urzaiz');
  await expect(page.locator('[data-address-results] [data-content-state="offline"]')).toBeVisible();
  await page.locator('[data-search-category="stops"]').click();
  await search.fill('no-matching-local-stop');
  await expect(page.locator('[data-content-state="empty"]')).toBeVisible();
  await page.locator('[data-clear-search]').click();
  await expect(search).toHaveValue('');
  await page.context().setOffline(false);
  await page.locator('[data-search-category="addresses"]').click();
  await search.fill('Av. de Madrid');
  await expect(page.locator('[data-address-row]')).toHaveCount(1);
});

test('discards a late itinerary after editing the requested departure', async ({ page }) => {
  await useMunicipalProfile(page);
  await installPlannerFixture(page, undefined, true);
  await page.goto('/');
  await page.getByRole('button', { name: /Plan a trip|Planificar viaje|Planificar viaxe/ }).click();
  await page.locator('[data-journey-address="origin"]').fill('Rúa do Príncipe');
  await page.getByRole('option', { name: /Rúa do Príncipe/ }).click();
  await page.locator('[data-journey-address="destination"]').fill('Av. de Madrid');
  await page.getByRole('option', { name: /Av\. de Madrid/ }).click();
  await page.locator('[data-journey-departure]').fill('2026-11-13T15:53');
  await page.locator('[data-journey-submit]').click();
  await expect(page.locator('[data-journey-data-status="loading"]')).toBeVisible();
  await page.locator('[data-journey-departure]').fill('2026-11-13T16:53');
  await page.evaluate(() => window.__resolveOtp?.());
  await expect(page.locator('[data-journey-options]')).toHaveCount(0);
  await expect(page.locator('[data-journey-data-status="loading"]')).toHaveCount(0);
  await expect(page.locator('.map-container')).toHaveAttribute('data-journey-route', '');
  await expect(page.locator('[data-journey-submit]')).toBeEnabled();
});

test('shows a planning failure and allows retry without losing endpoints', async ({ page }) => {
  await useMunicipalProfile(page);
  await installPlannerFixture(page, JSON.stringify({ error: { id: 500, msg: 'Unavailable' } }));
  await page.goto('/');
  await page.getByRole('button', { name: /Plan a trip|Planificar viaje|Planificar viaxe/ }).click();
  await page.locator('[data-journey-address="origin"]').fill('Rúa do Príncipe');
  await page.getByRole('option', { name: /Rúa do Príncipe/ }).click();
  await page.locator('[data-journey-address="destination"]').fill('Av. de Madrid');
  await page.getByRole('option', { name: /Av\. de Madrid/ }).click();
  await page.locator('[data-journey-submit]').click();
  await expect(page.locator('[data-journey-data-status="unavailable"]')).toBeVisible();
  await expect(page.locator('[data-journey-address="origin"]')).toHaveValue('Rúa do Príncipe, Vigo');
  await expect(page.locator('[data-journey-submit]')).toBeEnabled();
  await expect(page.locator('[data-journey-data-status="empty"]')).toHaveCount(0);
});

test('clears an endpoint from its field without exposing map-point selection', async ({ page }) => {
  await useMunicipalProfile(page);
  await installPlannerFixture(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Plan a trip|Planificar viaje|Planificar viaxe/ }).click();
  const originInput = page.locator('[data-journey-address="origin"]');
  await originInput.fill('Rúa do Príncipe');
  await page.getByRole('option', { name: /Rúa do Príncipe/ }).click();
  await page.getByRole('button', { name: /Clear origin|Borrar origen|Borrar orixe/ }).click();

  await expect(originInput).toHaveValue('');
  await expect(page.locator('[data-journey-endpoint="origin"]')).toHaveAttribute('data-journey-selected', 'false');
  await expect(page.locator('[data-journey-submit]')).toBeDisabled();
  await expect(page.locator('[data-journey-select]')).toHaveCount(0);
});
