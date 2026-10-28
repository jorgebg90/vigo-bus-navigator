import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './frontend/tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'VITE_PROFILE=production VITE_MUNICIPAL_PROFILE=fixture vite build --config frontend/vite.config.ts --mode test && vite preview --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false
    }
  ],
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'ios-safari', use: { ...devices['iPhone 13'], browserName: 'webkit' } }
  ]
});
