import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = process.env.SURFACE_BASE_URL || "http://127.0.0.1:4184";
export default defineConfig({
  testDir: "./tests",
  testMatch: "surface-sweep.spec.ts",
  fullyParallel: true,
  workers: 3,
  retries: 0,
  maxFailures: Number(process.env.SURFACE_MAX_FAILURES || 0),
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: process.env.SURFACE_OUTPUT_DIR || "../test-results/surface",
  reporter: [
    ["line"],
    [
      "json",
      {
        outputFile:
          process.env.SURFACE_REPORT || "test-results/surface-report.json",
      },
    ],
  ],
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
  },
  webServer: process.env.SURFACE_BASE_URL
    ? undefined
    : {
        command: "node e2e/static-server.mjs dist/client 4184",
        cwd: root,
        url: baseURL,
        reuseExistingServer: false,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 30_000,
      },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
