import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("public recovery manifest", () => {
  it("fails closed on admission failure and detects payload tampering", () => {
    const output = execFileSync(
      "python3",
      [resolve(repo, "scripts/public_recovery_manifest.py"), "selftest"],
      { cwd: repo, encoding: "utf8" },
    );
    expect(output).toContain("public recovery manifest selftest: PASS");
  });

  it("keeps the Oracle backup script syntactically valid", () => {
    expect(() =>
      execFileSync("bash", ["-n", resolve(repo, "harness/arena/public-recovery-backup-oracle.sh")]),
    ).not.toThrow();
  });
});
