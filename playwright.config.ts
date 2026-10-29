import { defineConfig, devices } from '@playwright/test';

const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  testDir: './frontend/tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'VITE_PROFILE=production VITE_MUNICIPAL_PROFILE=fixture npm run build -- --mode test && tsx scripts/static-preview.ts',
      url: `http://127.0.0.1:4173${basePath}`,
      reuseExistingServer: false
    }
  ],
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'ios-safari', use: { ...devices['iPhone 13'], browserName: 'webkit' } }
  ]
});
