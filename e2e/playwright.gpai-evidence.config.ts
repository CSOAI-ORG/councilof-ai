import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4182;
const baseURL = `http://127.0.0.1:${PORT}`;

/** Acceptance against this checkout's build and source snapshots; never a live paid API. */
export default defineConfig({
  testDir: "./tests",
  testMatch: "gpai-daily-evidence.spec.ts",
  outputDir: "../test-results/gpai-evidence",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: `node e2e/static-server.mjs dist/client ${PORT}`,
    cwd: ROOT,
    url: `${baseURL}/reports/daily-signal/index.html`,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
