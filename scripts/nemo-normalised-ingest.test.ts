import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function runPython(pattern: string, minimumTests: number) {
  const result = spawnSync("python3", ["-B", "-m", "unittest", "discover",
    "-s", "packages/evidence-fabric/tests", "-p", pattern, "-v"], {
    cwd: root, encoding: "utf8", timeout: 25_000, maxBuffer: 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  expect(result.error, output).toBeUndefined();
  expect(result.status, output).toBe(0);
  const matched = /Ran (\d+) tests? in/.exec(output);
  expect(matched, output).not.toBeNull();
  expect(Number(matched?.[1]), output).toBeGreaterThanOrEqual(minimumTests);
}

describe("Council-normalised NeMo evidence import", () => {
  it("rejects unknown decisions and detects weakened private implementations", () => {
    runPython("test_nemo_guardrails*.py", 43);
  }, 30_000);
  it("retains existing NVIDIA/global ingest and renderer contracts", () => {
    runPython("test_global_and_nvidia_ingest.py", 2);
  }, 30_000);
});
