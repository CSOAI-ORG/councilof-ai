// node --test scripts/harness-x/render.test.mjs
// Render twice → byte-identical; render --check is clean; the manifest covers every target output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RENDER = join(REPO, "scripts/harness-x/render.mjs");
const sha = (p) => createHash("sha256").update(readFileSync(join(REPO, p))).digest("hex");
const render = (...a) => spawnSync(process.execPath, [RENDER, ...a], { encoding: "utf8" });
const snapshot = () => {
  const m = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const paths = [...m.files.map((f) => f.path), "distribution/MANIFEST.json"];
  return Object.fromEntries(paths.map((p) => [p, sha(p)]));
};

test("render twice is byte-identical", () => {
  assert.equal(render().status, 0);
  const a = snapshot();
  assert.equal(render().status, 0);
  const b = snapshot();
  assert.deepEqual(b, a);
  assert.ok(Object.keys(a).length > 40, `expected every artifact in the manifest, got ${Object.keys(a).length}`);
});

test("render --check is clean after render", () => {
  const r = render("--check");
  assert.equal(r.status, 0, r.stderr);
});

test("every declared target output is in the manifest", () => {
  const dist = JSON.parse(readFileSync(join(REPO, "council-os/distribution.json"), "utf8"));
  const m = JSON.parse(readFileSync(join(REPO, "distribution/MANIFEST.json"), "utf8"));
  const inManifest = new Set(m.files.map((f) => f.path));
  for (const row of dist.distribution) for (const p of row.output) assert.ok(inManifest.has(p), `${row.id}: ${p}`);
});
