// Runs the dependency-free Playwright install-parity suite inside the required Vitest scripts
// gate, the same way claims-e2e-contract.test.ts runs its suite. No network, no browser.
import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

it("workflows install the Playwright that package-lock.json pins, and only that one", () => {
  const output = execFileSync(process.execPath, ["--test", "--test-reporter=tap",
    fileURLToPath(new URL("./playwright-install-parity.node-test.mjs", import.meta.url))],
  { encoding: "utf8", timeout: 15000 });
  expect(output).toMatch(/# fail 0/);
}, 20000);
