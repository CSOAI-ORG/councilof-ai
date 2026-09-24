import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkQuarantine } from "./quarantined-ots-gate.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "csoai-ots-quarantine-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bytes = Buffer.from([0, 255, 2]);
  const source = "evidence/quarantine/ots/interop/old.json.ots";
  mkdirSync(join(root, "evidence/quarantine/ots/interop"), { recursive: true });
  mkdirSync(join(root, "public/interop/ots"), { recursive: true });
  writeFileSync(join(root, source), bytes);
  writeFileSync(join(root, "public/interop/ots/manifest.json"), JSON.stringify({ proofs: [] }));
  const doc = {
    schema: "csoai.ots-quarantine/0.1",
    counts: { quarantined: 1, interop_manifest_removed: 1 },
    entries: [{
      former_public_url: "/interop/old.json.ots",
      retained_repo_path: source,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    }],
  };
  const register = join(root, "public/interop/ots/quarantine-2026-09-24.json");
  writeFileSync(register, JSON.stringify(doc));
  return { root, source, register };
}

test("retained binary bytes and absence from the served tree agree with the register", (t) => {
  const { root } = fixture(t);
  assert.deepEqual(checkQuarantine(root), { quarantined: 1, interopManifestRemoved: 1 });
});

test("tampered bytes and resurfaced proof files fail closed", (t) => {
  const { root, source } = fixture(t);
  writeFileSync(join(root, source), Buffer.from([0, 255, 3]));
  assert.throws(() => checkQuarantine(root), /differ/);
  writeFileSync(join(root, source), Buffer.from([0, 255, 2]));
  writeFileSync(join(root, "public/interop/old.json.ots"), Buffer.from([0, 255, 2]));
  assert.throws(() => checkQuarantine(root), /still served/);
});

test("manifest and register omissions fail closed", (t) => {
  const { root, register } = fixture(t);
  writeFileSync(join(root, "public/interop/ots/manifest.json"), JSON.stringify({ proofs: [{ path: "/interop/old.json.ots" }] }));
  assert.throws(() => checkQuarantine(root), /still in current manifest/);
  writeFileSync(join(root, "public/interop/ots/manifest.json"), JSON.stringify({ proofs: [] }));
  const doc = JSON.parse(readFileSync(register, "utf8"));
  doc.entries = [];
  writeFileSync(register, JSON.stringify(doc));
  assert.throws(() => checkQuarantine(root), /count mismatch/);
});
