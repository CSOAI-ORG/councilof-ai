import { describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
describe("bounded public-source currentness", () => {
  it("requires Python/JS verdict parity, malformed-lock refusals and discriminating controls", () => {
    const temp = mkdtempSync(join(tmpdir(), "source-currentness-ci-"));
    try {
      const root = join(temp, "source");
      cpSync(join(repo, "harness/public-source-currentness"), root, { recursive: true });
      const commands = [
        ["python3", "-B", "tests/build_vectors.py"],
        ["python3", "-B", "tests/run_python.py"],
        ["python3", "-B", "tests/mutation_controls.py"],
        ["node", "tests/run_node.mjs"],
        ["node", "tests/test_worker.mjs"],
      ];
      for (const [command, ...args] of commands) {
        const run = spawnSync(command, args, { cwd: root, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024 });
        const output = `${run.stdout || ""}\n${run.stderr || ""}`;
        expect(run.error, output).toBeUndefined();
        expect(run.status, output).toBe(0);
      }
      const read = (name: string) => JSON.parse(readFileSync(join(root, "results", name), "utf8"));
      const py = read("run-result.json"), js = read("node-result.json");
      expect(py.contract_cases_passed).toBe(71);
      expect(py.invalid_operator_locks_rejected).toBe(9);
      expect(js.passed).toBe(71);
      expect(js.decision_sha256).toBe(py.decision_sha256);
      expect(py.decision_sha256).toBe("7bca61d08b199e480783b18c36b1da67e45be9c6b8b7e18bb05074ef14bc4163");
      expect(read("mutation-controls.json").every((x: { detected: boolean }) => x.detected)).toBe(true);
      expect(read("mutation-controls.json")).toHaveLength(3);
      expect(read("worker-tests.json").passed).toBe(17);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }, 90000);
});
