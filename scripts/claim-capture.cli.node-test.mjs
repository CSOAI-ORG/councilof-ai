import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "scripts/claim-capture.mjs");
const specDir = join(root, "public/spec/claim-maintenance");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

// The CURRENT reference is the one the version index names as latest. The maintained source is
// held to it byte for byte; every earlier reference is held to its own manifest and never to the
// source, because a published version is superseded, never edited (spec 12).
const latest = JSON.parse(readFileSync(join(specDir, "index.json"), "utf8")).latest;
const publicReference = join(specDir, `v${latest}`, "reference/claim-capture.mjs");
const referenceVersions = readdirSync(specDir)
  .filter((d) => /^v\d+\.\d+$/.test(d) && existsSync(join(specDir, d, "reference/manifest.json")))
  .sort();

test("published reference bytes match the maintained CLI source", () => {
  assert.equal(latest, "0.2", "the version index must name the version whose reference is current");
  assert.deepEqual(readFileSync(publicReference), readFileSync(source));
});

test("every published reference copy matches its own manifest", () => {
  assert.ok(referenceVersions.includes("v0.1") && referenceVersions.includes(`v${latest}`));
  for (const v of referenceVersions) {
    const manifest = JSON.parse(readFileSync(join(specDir, v, "reference/manifest.json"), "utf8"));
    const bytes = readFileSync(join(specDir, v, "reference/claim-capture.mjs"));
    assert.equal(sha256(bytes), manifest.files["claim-capture.mjs"].sha256, `${v} reference != its manifest`);
    assert.equal(bytes.length, manifest.files["claim-capture.mjs"].bytes, `${v} reference length != its manifest`);
  }
});

// Pinned as literals, not read from the manifest, so editing the v0.1 manifest cannot turn this
// green. These are the bytes deposited at 10.5281/zenodo.22901908 and pinned on 2026-09-23.
test("the v0.1 reference is frozen at the bytes its DOI and its manifest pin", () => {
  const bytes = readFileSync(join(specDir, "v0.1/reference/claim-capture.mjs"));
  assert.equal(sha256(bytes), "a634515bec5e8999d73bf55d2e2c8641351fe0070d40596afa4877f2f3e86f60");
  assert.equal(bytes.length, 19949);
});

test("the current reference's manifest names the reference it supersedes, by digest", () => {
  const m = JSON.parse(readFileSync(join(specDir, `v${latest}`, "reference/manifest.json"), "utf8"));
  assert.equal(m.supersedes?.path, "/spec/claim-maintenance/v0.1/reference/claim-capture.mjs");
  assert.equal(m.supersedes?.sha256, "a634515bec5e8999d73bf55d2e2c8641351fe0070d40596afa4877f2f3e86f60");
});

// The v0.1 bytes predate the symlink-safe entry check (d8d3c5af8), which is exactly why they are
// not run through a symlink here: that defect is part of what v0.1 published, and the fix ships
// in the current reference rather than being edited into the frozen one.
for (const [label, target] of [["source", source], ["public reference", publicReference]]) {
  test(`${label} runs verification when launched through a symlink`, () => {
    const dir = mkdtempSync(join(tmpdir(), "csoai-claim-cli-"));
    try {
      const link = join(dir, "claim-capture.mjs");
      const missing = join(dir, "missing.json");
      symlinkSync(target, link);
      assert.notEqual(link, realpathSync(link));
      const result = spawnSync(process.execPath, [link, "--verify", missing], {
        encoding: "utf8",
        timeout: 5000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 1, `silent or wrong CLI exit: ${result.stderr}`);
      assert.match(result.stderr, /REJECTED .*missing\.json: not parseable JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}
