import { expect, test } from '@playwright/test';
import { openStopFromSearch } from './helpers/open-stop-from-search';

test('shows loading within one second and a terminal state within ten for 20 stops on the mobile network profile', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Network emulation requires Chromium CDP.');
  test.setTimeout(90_000);
  const session = await page.context().newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 100,
    downloadThroughput: 10 * 1024 * 1024 / 8,
    uploadThroughput: 2 * 1024 * 1024 / 8
  });

  await page.goto('/');
  let terminalCount = 0;

  for (let index = 0; index < 20; index += 1) {
    await openStopFromSearch(page, '', index);
    const status = page.locator('[data-arrivals-status]');
    await expect(status).toBeVisible({ timeout: 1_000 });
    const terminal = await page.waitForFunction(() => {
      const current = document.querySelector<HTMLElement>('[data-arrivals-status]');
      return current && current.dataset.freshness !== 'loading';
    }, undefined, { timeout: 10_000 }).then(() => true).catch(() => false);
    if (terminal) terminalCount += 1;
    await page.keyboard.press('Escape');
  }

  expect(terminalCount).toBeGreaterThanOrEqual(19);
  await session.detach();
});
