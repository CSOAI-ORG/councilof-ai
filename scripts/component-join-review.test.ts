import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
describe("held specialist prediction joins", () => {
  it("runs all 90 contract, artifact receiver and mutation tests", () => {
    const r = spawnSync("python3", ["-B", "-m", "unittest", "discover", "-s", "harness/component-join-review", "-p", "test_join*.py", "-v"], {
      cwd: root, encoding: "utf8", timeout: 25_000, maxBuffer: 1024 * 1024,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });
    const output = `${r.stdout || ""}\n${r.stderr || ""}`;
    expect(r.error, output).toBeUndefined();
    expect(r.status, output).toBe(0);
    const count = /Ran (\d+) tests? in/.exec(output);
    expect(count, output).not.toBeNull();
    expect(Number(count?.[1]), output).toBeGreaterThanOrEqual(90);
  }, 30_000);
});
