import { defineConfig } from "@playwright/test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  testDir: here,
  testMatch: /.*\.spec\.mjs$/,
  timeout: 30000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4817", browserName: "chromium" },
  webServer: { command: `node ${resolve(here, "server.mjs")}`, url: "http://127.0.0.1:4817/", reuseExistingServer: false, timeout: 20000 },
});
