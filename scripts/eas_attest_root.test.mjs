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

// Copy the script outside this repository so package resolution cannot fall
// through to this checkout's node_modules. Reaching NOT_YET proves the SDK
// imports are genuinely deferred, not merely installed in the test runner.
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "eas-no-sdk-"));
  temporary.push(dir);
  mkdirSync(join(dir, "public", "interop"), { recursive: true });
  copyFileSync(SOURCE, join(dir, "eas_attest_root.mjs"));
  writeFileSync(join(dir, "public", "root.json"), JSON.stringify({
    as_of: "2026-09-04T00:00:00Z",
    did_intended: "did:web:csoai.org#board-attestation-1",
    merkle_root: "0".repeat(64),
  }) + "\n");
  return dir;
}

function runWithoutKey(dir) {
  const env = { ...process.env };
  delete env.EAS_ATTESTER_PRIVATE_KEY;
  return execFileSync(process.execPath, [join(dir, "eas_attest_root.mjs")], { cwd: dir, env, encoding: "utf8" });
}

const logPath = (dir) => join(dir, "public", "interop", "eas-root-attestations.json");

describe("EAS root attestation fallback", () => {
  it("writes NOT_YET without resolving either optional EAS dependency when no key exists", () => {
    const dir = fixture();
    const out = runWithoutKey(dir);
    const record = JSON.parse(readFileSync(logPath(dir), "utf8"));

    expect(out).toContain("NOT_YET");
    expect(record.status).toBe("NOT_YET");
    expect(record.reason).toContain("no attester key");
    expect(record.attestations).toEqual([]);
  });

  // The log has a sibling .ots proving its exact bytes. Restating an unchanged NOT_YET with a
  // fresh as_of on every publish moved the bytes off that proof, and root-witness-release-gate
  // blocked every public-root run of 5–6 Oct 2026. Unchanged state must leave the bytes alone.
  it("leaves the log byte-identical when NOT_YET is already recorded", () => {
    const dir = fixture();
    const recorded = Buffer.from(JSON.stringify({
      kind: "csoai.eas-root-attestations/v0",
      chain: "base-mainnet",
      eas: "0x4200000000000000000000000000000000000021",
      schema: "bytes32 sha256,string as_of,string did",
      attestations: [],
      status: "NOT_YET",
      reason: "no attester key in GitHub secrets",
      as_of: "2026-09-30T05:05:39.513Z",
    }, null, 1) + "\n");
    writeFileSync(logPath(dir), recorded);

    const out = runWithoutKey(dir);
    expect(out).toContain("NOT_YET, unchanged since 2026-09-30T05:05:39.513Z");
    expect(readFileSync(logPath(dir)).equals(recorded)).toBe(true);
    runWithoutKey(dir);
    expect(readFileSync(logPath(dir)).equals(recorded)).toBe(true);
  });

  it("still records a real state change to NOT_YET and keeps every prior attestation", () => {
    const dir = fixture();
    const prior = { sha256: "11".repeat(32), uid: "0xabc", url: "https://base.easscan.org/attestation/view/0xabc" };
    writeFileSync(logPath(dir), JSON.stringify({ status: "ATTESTED", attestations: [prior], as_of: "2026-09-01T00:00:00Z" }, null, 1) + "\n");

    const out = runWithoutKey(dir);
    const record = JSON.parse(readFileSync(logPath(dir), "utf8"));
    expect(out).toContain("NOT_YET (fail closed, nothing attested)");
    expect(record.status).toBe("NOT_YET");
    expect(record.reason).toBe("no attester key in GitHub secrets");
    expect(record.as_of).not.toBe("2026-09-01T00:00:00Z");
    expect(record.attestations).toEqual([prior]);
  });
});
