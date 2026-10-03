import { defineConfig, devices } from "@playwright/test";

const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const localBaseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: process.env.CODELINGS_CAPTURE_DIR ? [] : ["**/visual-qa.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: "html",
  use: {
    baseURL: deployedBaseURL || localBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "iphone", testMatch: /game\.spec\.ts/, use: { ...devices["iPhone 15"], browserName: "webkit" } },
    { name: "pixel", testMatch: /game\.spec\.ts/, use: { ...devices["Pixel 7"], browserName: "chromium" } },
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    {
      name: "webkit-mobile",
      testMatch: /(site|game)\.spec\.ts/,
      use: { browserName: "webkit" },
    },
  ],
  webServer: deployedBaseURL ? undefined : {
    // CI already built the artifact. Locally, reuse a running server before
    // invoking this command, so an explicit production smoke needs no rebuild.
    command: process.env.CI ? "npm run start" : "npm run build && npm run start",
    url: localBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
