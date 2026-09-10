import { defineConfig, devices } from "@playwright/test";

const PORT = 3400;
// Sandboxes with a preinstalled Chromium can point at it instead of downloading a matching build.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  fullyParallel: false,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", launchOptions: executablePath ? { executablePath } : {}, ...devices["Pixel 7"] },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testMatch: /desktop|a11y/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { GOODSPORT_NOW: "2026-09-10", COACH_PASSCODE: "e2e-passcode" },
  },
});
