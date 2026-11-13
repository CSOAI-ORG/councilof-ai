import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("Kaggle metadata publication preflight", () => {
  it("checks reviewed files before writing and retains post-write verification", () => {
    const run = spawnSync("python3", ["-B", "-m", "unittest", "discover", "-s", "scripts/hf", "-p", "test_publish_kaggle_preflight.py", "-v"], {
      cwd: root, encoding: "utf8", timeout: 25_000, maxBuffer: 1024 * 1024,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });
    const output = `${run.stdout || ""}\n${run.stderr || ""}`;
    expect(run.error, output).toBeUndefined();
    expect(run.status, output).toBe(0);
    const count = /Ran (\d+) tests? in/.exec(output);
    expect(count, output).not.toBeNull();
    expect(Number(count?.[1]), output).toBeGreaterThanOrEqual(12);
  }, 30_000);
});
