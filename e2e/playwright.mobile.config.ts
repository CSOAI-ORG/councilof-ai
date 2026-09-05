import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root — see playwright.shell.config.ts for why this is resolved rather than relative. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Mobile journey against a BUILT dist/client, on a real phone viewport (iPhone 13, 390x844).
 * BASE_URL points it at another origin instead of starting the local static server.
 */
const PORT = 4181;
const base = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: /(mobile-journey|contrast-aa)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 45_000,
  // devices["iPhone 13"] defaults to WebKit, which is not installed here (chromium only), and
  // the failure reads as a Playwright install problem rather than a browser choice. Chromium
  // with the same phone viewport is what CI has, and isMobile/hasTouch are Chromium-only anyway.
  use: {
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    baseURL: base,
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium-phone" }],
  webServer: local
    ? {
        command: `node e2e/static-server.mjs dist/client ${PORT}`,
        cwd: ROOT,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
