import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    { 
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        } 
      } 
    },
    { 
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] } 
    },
    { 
      name: 'webkit',
      use: { ...devices['Desktop Safari'] } 
    },
    { 
      name: 'edge',
      use: { 
        ...devices['Desktop Edge'],
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write'],
        } 
      }
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
