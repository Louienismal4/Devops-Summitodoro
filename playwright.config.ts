import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run test:e2e:server",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: {
      ...process.env,
      NEXT_PUBLIC_MAP_STYLE_URL: "https://tiles.openfreemap.org/styles/liberty",
    },
  },
});
