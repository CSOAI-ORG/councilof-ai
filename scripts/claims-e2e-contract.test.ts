// Keep this dependency-free suite inside the existing required Vitest scripts gate.
import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

it("claims E2E health eligibility and canonical title pass the offline regression suite", () => {
  const output = execFileSync(process.execPath, ["--test", "--test-reporter=tap",
    fileURLToPath(new URL("./claims-e2e-contract.node-test.mjs", import.meta.url))],
  { encoding: "utf8", timeout: 15000 });
  expect(output).toMatch(/# fail 0/);
}, 20000);
