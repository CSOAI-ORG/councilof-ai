// scripts/build-regulatory-inventory.mjs: the stamped inventory snapshot is never rewritten; an
// in-toto pick that moves becomes a new stamped version behind an unsigned discovery pointer, and
// the build-time binding /api/counters imports moves with it. Same discipline as the hub-cards
// index (#2865) and the mill receipt readiness (#2868); run by `npm run test:readers`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs, { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertNotStamped, bindingSource, checkBinding, checkCurrent, contentDigest, deriveInventory, readStamped,
  resolveCurrent, writeVersioned, DEFAULT_OUT, DERIVED_TYPE, VERSION_RECIPE,
} from "../build-regulatory-inventory.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const OTS_HEADER = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
/** Header-only detached proof committing to the file's sha256: enough for the byte binding. */
const fakeStamp = (path) => writeFileSync(path + ".ots", Buffer.concat([OTS_HEADER, Buffer.from([1, 8]),
  Buffer.from(sha(readFileSync(path)), "hex"), Buffer.from("pending-test")]), { flag: "wx" });
const NOW = new Date("2026-10-07T01:02:03.000Z");
const POINTER = "regulatory-inventory-latest.json";
const snapshot = (dir) => Object.fromEntries(readdirSync(dir).sort().map((f) => [f, sha(readFileSync(join(dir, f)))]));

/** An in-toto index with one statement per {axis: id16}. */
const index = (picks) => ({ statements: Object.entries(picks).map(([axis, id]) => ({ axis, file: `${axis}-${id}.intoto.json` })) });
const row = (axis, id) => ({ id: `intoto-${axis}`, path: `public/interop/crosswalk/intoto/${axis}-${id}.intoto.json`,
  asset_type: DERIVED_TYPE, evidence_state: "MEASURED_SOURCE_DERIVATION" });
const inventory = (picks) => ({
  schema: "csoai.regulatory-inventory/0.1",
  as_of: "2026-09-10",
  counts: { crosswalk_assets: Object.keys(picks).length + 1, gspc_axes: 22 },
  truth_boundaries: ["fixture"],
  authority_adapters: [{ id: "a1" }],
  crosswalk_assets: [...Object.entries(picks).map(([axis, id]) => row(axis, id)),
    { id: "intoto-index", path: "public/interop/crosswalk/intoto/index.json", asset_type: "CATALOG", evidence_state: "DERIVED_INDEX" }],
});
const OLD = { safety: "02444bfb68c77d04", swarm: "00dd606b98328b59" };
const NEW = { safety: "27e409242e4a5f76", swarm: "00dd606b98328b59" };

function stampedFixture() {
  const root = mkdtempSync(join(tmpdir(), "reg-inventory-ver-"));
  const out = join(root, "regulatory-inventory.json");
  writeFileSync(out, JSON.stringify(inventory(OLD), null, 2) + "\n");
  fakeStamp(out);
  return { root, out, binding: join(root, "_regulatory_inventory.ts") };
}

test("derivation moves only the in-toto rows; every hand-maintained field is carried byte-for-byte", () => {
  const base = inventory(OLD);
  const derived = deriveInventory(base, index(NEW));
  assert.deepEqual(derived.crosswalk_assets.map((r) => r.path), inventory(NEW).crosswalk_assets.map((r) => r.path));
  for (const key of ["schema", "as_of", "truth_boundaries", "authority_adapters"]) assert.deepEqual(derived[key], base[key], key);
  assert.equal(derived.counts.gspc_axes, 22);
  assert.equal(derived.counts.crosswalk_assets, derived.crosswalk_assets.length);
  assert.equal(contentDigest(deriveInventory(base, index(OLD))), contentDigest(base), "an unmoved index derives the same content");
  // A third axis appears: the count follows the array (the gate then fails closed on its pinned 14/25).
  const grown = deriveInventory(base, index({ ...NEW, jail: "0378db93b5e7ee2b" }));
  assert.equal(grown.counts.crosswalk_assets, 4);
  assert.deepEqual(grown.crosswalk_assets.map((r) => r.id), ["intoto-jail", "intoto-safety", "intoto-swarm", "intoto-index"]);
  assert.throws(() => deriveInventory(base, { statements: [] }), /no statements/);
  assert.throws(() => deriveInventory(base, { statements: [{ axis: "x", file: "../x.json" }] }), /malformed/);
});

test("(a) a moved in-toto pick writes a new stamped version; the stamped snapshot stays byte-identical", () => {
  const { root, out, binding } = stampedFixture();
  try {
    const before = snapshot(root);
    assert.throws(() => checkCurrent(out, index(NEW), { binding }), /stale.*emit_intoto\.py.*--version/s);
    assert.deepEqual(snapshot(root), before, "the check mode wrote nothing on changed content");
    const result = writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding });
    assert.equal(result.state, "VERSIONED");
    assert.equal(result.file, `regulatory-inventory-2026-10-07-${contentDigest(inventory(NEW)).slice(0, 12)}.json`);
    const after = snapshot(root);
    assert.equal(after["regulatory-inventory.json"], before["regulatory-inventory.json"]);
    assert.equal(after["regulatory-inventory.json.ots"], before["regulatory-inventory.json.ots"]);
    assert.ok(after[`${result.file}.ots`], "the new version carries its own proof");
    const version = readStamped(root, result.file);
    assert.equal(version.doc.versioned_at, NOW.toISOString());
    assert.equal(version.doc.as_of, "2026-09-10", "as_of is content, carried from the base, never the clock");
    assert.equal(version.doc.content_sha256, contentDigest(inventory(NEW)));
    assert.equal(version.doc.supersedes.index_url, "/interop/regulatory-inventory.json");
    const pointer = JSON.parse(readFileSync(join(root, POINTER), "utf8"));
    assert.equal(pointer.kind, "DISCOVERY_POINTER_ONLY");
    assert.equal(pointer.index_url, `/interop/${result.file}`);
    assert.equal(pointer.index_sha256, version.sha256);
    assert.deepEqual(pointer.versions.map((v) => v.index_url), ["/interop/regulatory-inventory.json", `/interop/${result.file}`]);
    assert.equal(readFileSync(binding, "utf8"), bindingSource(version), "the counters binding moved with the pointer");
    // Version metadata is not content: the check now passes through the pointer and writes nothing.
    const settled = snapshot(root);
    assert.equal(checkCurrent(out, index(NEW), { binding }).name, result.file);
    assert.deepEqual(snapshot(root), settled);
    // An index that returns to an earlier stamped inventory re-points; no new file, no new proof.
    assert.equal(writeVersioned(out, index(OLD), { stamp: fakeStamp, now: NOW, binding }).state, "REPOINTED");
    assert.equal(JSON.parse(readFileSync(join(root, POINTER), "utf8")).index_url, "/interop/regulatory-inventory.json");
    assert.equal(Object.keys(snapshot(root)).length, Object.keys(settled).length);
    assert.equal(checkCurrent(out, index(OLD), { binding }).name, "regulatory-inventory.json");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(b) an unmoved index writes nothing new and stamps nothing, in check and --version modes", () => {
  const { root, out, binding } = stampedFixture();
  try {
    let stamped = 0;
    assert.equal(writeVersioned(out, index(OLD), { stamp: () => { stamped++; }, binding }).state, "POINTER_WRITTEN");
    const withPointer = snapshot(root);
    assert.equal(writeVersioned(out, index(OLD), { stamp: () => { stamped++; }, binding }).state, "UNCHANGED");
    assert.equal(checkCurrent(out, index(OLD), { binding }).name, "regulatory-inventory.json");
    assert.deepEqual(snapshot(root), withPointer);
    assert.equal(stamped, 0, "nothing was stamped");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(c) a stamped file cannot be edited, a failed stamp releases nothing, and in-place edits fail closed", () => {
  const { root, out, binding } = stampedFixture();
  try {
    assert.throws(() => assertNotStamped(out), /never rewritten/);
    const v = writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding });
    assert.throws(() => assertNotStamped(join(root, v.file)), /never rewritten/);
    const before = snapshot(root);
    const third = index({ ...NEW, jail: "0378db93b5e7ee2b" });
    assert.throws(() => writeVersioned(out, third, { stamp: () => { throw new Error("calendars down"); }, now: NOW, binding }), /nothing was released/);
    assert.throws(() => writeVersioned(out, third, { stamp: (p) => writeFileSync(p + ".ots", "not a proof"), now: NOW, binding }), /nothing was released/);
    assert.deepEqual(snapshot(root), before);
    assert.throws(() => writeVersioned(out, third, { binding }), /needs a stamper/);
    const versioned = join(root, v.file);
    writeFileSync(versioned, readFileSync(versioned, "utf8") + " ");
    assert.throws(() => checkCurrent(out, index(NEW), { binding }), /does not commit to the bytes/);
    assert.throws(() => writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding }), /does not commit to the bytes/);
    rmSync(join(root, POINTER));
    writeFileSync(out, readFileSync(out, "utf8") + " ");
    assert.throws(() => checkCurrent(out, index(OLD), { binding }), /does not commit to the bytes/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("nothing stamped fails closed with the recipe; --version then needs a reviewed --from base", () => {
  const root = mkdtempSync(join(tmpdir(), "reg-inventory-empty-"));
  try {
    const out = join(root, "regulatory-inventory.json");
    const binding = join(root, "_regulatory_inventory.ts");
    assert.throws(() => checkCurrent(out, index(OLD), { binding }), new RegExp(`no stamped regulatory inventory.*${VERSION_RECIPE.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "s"));
    assert.throws(() => writeVersioned(out, index(OLD), { stamp: fakeStamp, now: NOW, binding }), /no --from given/);
    const v = writeVersioned(out, index(OLD), { stamp: fakeStamp, now: NOW, binding, base: inventory(OLD) });
    assert.equal(v.state, "VERSIONED");
    assert.equal(readStamped(root, v.file).doc.supersedes, null);
    assert.equal(checkCurrent(out, index(OLD), { binding }).name, v.file);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("the pointer is bound to the bytes, the content and the asset count, each checked on its own", () => {
  const { root, out, binding } = stampedFixture();
  try {
    const v = writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding });
    const pointerPath = join(root, POINTER);
    const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
    const legacy = readStamped(root, "regulatory-inventory.json");
    assert.equal(resolveCurrent(out).name, v.file);
    for (const [field, value] of [["index_sha256", legacy.sha256], ["content_sha256", legacy.content_sha256], ["crosswalk_assets", 9]]) {
      assert.notEqual(pointer[field], value);
      writeFileSync(pointerPath, JSON.stringify({ ...pointer, [field]: value }, null, 2) + "\n");
      assert.throws(() => checkCurrent(out, index(NEW), { binding }), /disagrees with the bytes/, `${field} is not checked`);
      assert.throws(() => writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding }), /disagrees with the bytes/, `${field} is not checked in --version`);
    }
    for (const url of ["/interop/../secrets.json", "/interop/other.json", "/elsewhere/regulatory-inventory.json",
      "/interop/regulatory-inventory.pre-autoeat-fold-20261006.json"]) {
      writeFileSync(pointerPath, JSON.stringify({ ...pointer, index_url: url }));
      assert.throws(() => checkCurrent(out, index(NEW), { binding }), /malformed/);
    }
    writeFileSync(pointerPath, JSON.stringify({ ...pointer, schema: "csoai.regulatory-inventory-pointer/0" }));
    assert.throws(() => checkCurrent(out, index(NEW), { binding }), /malformed/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("the counters binding must import, name and digest exactly the file the pointer selects", () => {
  const { root, out, binding } = stampedFixture();
  try {
    const v = writeVersioned(out, index(NEW), { stamp: fakeStamp, now: NOW, binding });
    const current = resolveCurrent(out);
    assert.equal(checkBinding(current, binding), true);
    const good = readFileSync(binding, "utf8");
    const legacy = readStamped(root, "regulatory-inventory.json");
    for (const [what, bad] of [
      ["import", good.replace(`public/interop/${v.file}";\n\nexport`, `public/interop/regulatory-inventory.json";\n\nexport`)],
      ["path", good.replace(`REGULATORY_INVENTORY_PATH = "public/interop/${v.file}"`, `REGULATORY_INVENTORY_PATH = "public/interop/regulatory-inventory.json"`)],
      ["sha", good.replace(current.sha256, legacy.sha256)],
    ]) {
      assert.notEqual(bad, good, `${what} mutation applied`);
      writeFileSync(binding, bad);
      assert.throws(() => checkBinding(current, binding), /binds .* but the pointer selects/, `${what} is not checked`);
      assert.throws(() => checkCurrent(out, index(NEW), { binding }), /--version/, `${what} is not checked by the build mode`);
    }
    rmSync(binding);
    assert.throws(() => checkCurrent(out, index(NEW), { binding }), /missing/);
    // --version repairs a binding that drifted, without a new version or a new proof.
    assert.equal(writeVersioned(out, index(NEW), { stamp: () => assert.fail("no stamp"), binding }).state, "POINTER_WRITTEN");
    assert.equal(readFileSync(binding, "utf8"), good);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a new version is create-only: a file that appears between the scan and the write is never overwritten", () => {
  const { root, out, binding } = stampedFixture();
  const name = `regulatory-inventory-2026-10-07-${contentDigest(inventory(NEW)).slice(0, 12)}.json`;
  writeFileSync(join(root, name), "another writer's bytes\n");
  const realReaddir = fs.readdirSync;
  fs.readdirSync = (dir, ...rest) => realReaddir(dir, ...rest).filter((f) => f !== name);
  syncBuiltinESMExports();
  try {
    let stamped = 0;
    assert.throws(() => writeVersioned(out, index(NEW), { stamp: (p) => { stamped++; fakeStamp(p); }, now: NOW, binding }), { code: "EEXIST" });
    assert.equal(readFileSync(join(root, name), "utf8"), "another writer's bytes\n");
    assert.equal(stamped, 0, "nothing was stamped");
  } finally {
    fs.readdirSync = realReaddir;
    syncBuiltinESMExports();
    rmSync(root, { recursive: true, force: true });
  }
});

test("on this commit: the pointer resolves to a stamped file whose proof commits to its bytes, and it is current", () => {
  const current = checkCurrent();
  assert.equal(resolveCurrent(DEFAULT_OUT).name, current.name);
  assert.equal(current.doc.counts.crosswalk_assets, current.doc.crosswalk_assets.length);
  const snapshot = readStamped(join(DEFAULT_OUT, ".."), "regulatory-inventory.json");
  assert.equal(snapshot.doc.schema, "csoai.regulatory-inventory/0.1", "the 2026-09-10 snapshot is still published with its proof");
});
