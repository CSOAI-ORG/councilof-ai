import { afterEach, describe, expect, it } from "vitest";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "eas_attest_root.mjs");
const temporary = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe("EAS root attestation fallback", () => {
  it("writes NOT_YET without resolving either optional EAS dependency when no key exists", () => {
    // Copy the script outside this repository so package resolution cannot fall
    // through to this checkout's node_modules. Reaching NOT_YET proves the SDK
    // imports are genuinely deferred, not merely installed in the test runner.
    const dir = mkdtempSync(join(tmpdir(), "eas-no-sdk-"));
    temporary.push(dir);
    mkdirSync(join(dir, "public", "interop"), { recursive: true });
    copyFileSync(SOURCE, join(dir, "eas_attest_root.mjs"));
    writeFileSync(join(dir, "public", "root.json"), JSON.stringify({
      as_of: "2026-09-04T00:00:00Z",
      did_intended: "did:web:csoai.org#board-attestation-1",
      merkle_root: "0".repeat(64),
    }) + "\n");

    const env = { ...process.env };
    delete env.EAS_ATTESTER_PRIVATE_KEY;
    const out = execFileSync(process.execPath, [join(dir, "eas_attest_root.mjs")], {
      cwd: dir,
      env,
      encoding: "utf8",
    });
    const record = JSON.parse(readFileSync(join(dir, "public", "interop", "eas-root-attestations.json"), "utf8"));

    expect(out).toContain("NOT_YET");
    expect(record.status).toBe("NOT_YET");
    expect(record.reason).toContain("no attester key");
    expect(record.attestations).toEqual([]);
  });
});
