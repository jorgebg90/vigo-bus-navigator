import { expect, test } from '@playwright/test';

test('requests one mobile position, shows the marker, and keeps location out of storage and requests', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 42.25, longitude: -8.71, accuracy: 10 });
  await page.addInitScript(() => {
    const state = window as Window & { __geolocationRequests?: number };
    state.__geolocationRequests = 0;
    const browserGeolocation = navigator.geolocation;
    const getCurrentPosition = browserGeolocation.getCurrentPosition.bind(browserGeolocation);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) {
          state.__geolocationRequests = (state.__geolocationRequests ?? 0) + 1;
          getCurrentPosition(success, error, options);
        }
      }
    });
  });
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');

  const map = page.locator('.map-base [data-engine="maplibre-clustered-geojson"]');
  await expect(map).toHaveAttribute('data-location-visible', 'true');
  await expect(map).toHaveAttribute('data-location-centered', 'true');
  expect(await page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(1);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('42.25');
  expect(requests.some((url) => /42\.25|-8\.71/.test(url))).toBe(false);
});

test('does not request location on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    const state = window as Window & { __geolocationRequests?: number };
    state.__geolocationRequests = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: () => { state.__geolocationRequests = 1; } }
    });
  });
  await page.goto('/');
  await expect(page.locator('.map-base [data-engine="maplibre-clustered-geojson"]')).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(0);
});

test('hides a denied mobile location warning while keeping map and line browsing available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const state = window as Window & { __geolocationRequests?: number };
    state.__geolocationRequests = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(_success: PositionCallback, error: PositionErrorCallback) {
          state.__geolocationRequests = (state.__geolocationRequests ?? 0) + 1;
          error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        }
      }
    });
  });
  await page.goto('/');
  const status = page.locator('[data-location-status]');
  await expect.poll(() => page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(1);
  await expect(status).toHaveCount(0);
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await expect(page.locator('.destination-view')).toHaveAttribute('data-destination', 'lines');
  await page.getByRole('button', { name: /Map|Mapa/ }).click();
  await expect(status).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(1);
});

test('hides an unavailable mobile location warning', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const state = window as Window & { __geolocationRequests?: number };
    state.__geolocationRequests = 0;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(_success: PositionCallback, error: PositionErrorCallback) {
          state.__geolocationRequests = (state.__geolocationRequests ?? 0) + 1;
          error({ code: 2, message: 'unavailable', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
        }
      }
    });
  });
  await page.goto('/');

  await expect.poll(() => page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(1);
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.getByRole('button', { name: /Map|Mapa/ }).click();
  await expect(page.locator('[data-location-status]')).toHaveCount(0);
});

test('does not recenter when a pending mobile position arrives after leaving the map', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const state = window as Window & { __resolvePosition?: () => void };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback) {
          state.__resolvePosition = () => success({
            coords: {
              latitude: 42.25, longitude: -8.71, accuracy: 10,
              altitude: null, altitudeAccuracy: null, heading: null, speed: null,
              toJSON: () => ({ latitude: 42.25, longitude: -8.71, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null })
            },
            timestamp: Date.now(),
            toJSON: () => ({})
          });
        }
      }
    });
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { __resolvePosition?: () => void }).__resolvePosition))).toBe(true);
  const map = page.locator('.map-base [data-engine="maplibre-clustered-geojson"]');
  await expect(map).toBeVisible();
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.evaluate(() => (window as Window & { __resolvePosition?: () => void }).__resolvePosition?.());

  await expect(map).toHaveAttribute('data-location-visible', 'true');
  await expect(map).not.toHaveAttribute('data-location-centered', 'true');
  await page.getByRole('button', { name: /Map|Mapa/ }).click();
  await expect(map).not.toHaveAttribute('data-location-centered', 'true');
});

test('keeps the Vigo overview for a valid position outside coverage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 42.5, longitude: -8.71 });
  await page.addInitScript(() => {
    const state = window as Window & { __geolocationRequests?: number };
    state.__geolocationRequests = 0;
    const browserGeolocation = navigator.geolocation;
    const getCurrentPosition = browserGeolocation.getCurrentPosition.bind(browserGeolocation);
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback, error?: PositionErrorCallback, options?: PositionOptions) {
          state.__geolocationRequests = (state.__geolocationRequests ?? 0) + 1;
          getCurrentPosition(success, error, options);
        }
      }
    });
  });
  await page.goto('/');

  const map = page.locator('.map-base [data-engine="maplibre-clustered-geojson"]');
  await expect.poll(() => page.evaluate(() => (window as Window & { __geolocationRequests?: number }).__geolocationRequests)).toBe(1);
  await page.getByRole('button', { name: /Lines|Líneas|Liñas/ }).click();
  await page.getByRole('button', { name: /Map|Mapa/ }).click();
  await expect(page.locator('[data-location-status]')).toHaveCount(0);
  await expect(map).not.toHaveAttribute('data-location-visible', 'true');
  await expect(map).not.toHaveAttribute('data-location-centered', 'true');
});

test('keeps an in-coverage position centered when no bus stops are visible there', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 42.319, longitude: -8.601, accuracy: 10 });
  await page.goto('/');

  const map = page.locator('.map-base [data-engine="maplibre-clustered-geojson"]');
  await expect(map).toHaveAttribute('data-location-visible', 'true');
  await expect(map).toHaveAttribute('data-location-centered', 'true');
  await expect(page.locator('[data-location-status]')).toContainText(/No nearby bus stops are shown|Non se amosan paradas|No se muestran paradas/i);
});
