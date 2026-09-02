import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root — Playwright runs webServer.command from the config's own directory (e2e/) otherwise,
 *  where `dist/client` does not exist, `serve` answers 404 and the readiness probe never passes. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Council OS shell smoke — runs against a BUILT dist/client (npm run build:client first).
 *
 * `npm run test:e2e:shell` locally or in CI. No /api/* functions exist on the static
 * server, so every pane is exercised in its honest no-data state; nothing here asserts a
 * number. BASE_URL points it at another origin (a preview, or https://councilof.ai) instead
 * of starting the local static server.
 */
const PORT = 4180;
const base = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: /dashboard-shell\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 45_000,
  use: {
    baseURL: base,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: local
    ? {
        // --no-clipboard: `serve` otherwise tries the system clipboard and can stall under a
        // piped stdout. 127.0.0.1 rather than localhost so the readiness probe and the tests
        // agree on the interface `serve` binds.
        command: `npx --yes serve@14 -s dist/client -l ${PORT} --no-clipboard`,
        cwd: ROOT,
        url: `${base}/dashboard`,
        reuseExistingServer: true,
        stdout: "ignore",
        stderr: "pipe",
        timeout: 120_000,
      }
    : undefined,
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
