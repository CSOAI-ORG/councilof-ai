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
        // e2e/static-server.mjs is committed and has no dependencies, so this step no longer
        // fetches a package from the npm registry. `npx --yes serve@14` did, and on
        // 2026-09-03/04 it hung eight deploys in a row on "Timed out waiting 120000ms from
        // config.webServer" — silently, because stdout was discarded. Both halves are fixed
        // here: no network on the gating path, and the server's output is piped so the next
        // failure names itself. 127.0.0.1 explicitly, so the readiness probe and the tests
        // agree on the interface it binds.
        command: `node e2e/static-server.mjs dist/client ${PORT}`,
        cwd: ROOT,
        url: `${base}/dashboard`,
        reuseExistingServer: true,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120_000,
      }
    : undefined,
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
