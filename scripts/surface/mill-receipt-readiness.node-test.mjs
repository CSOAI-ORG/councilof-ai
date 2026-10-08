// scripts/build-mill-receipt-readiness.mjs: the stamped snapshot is never rewritten; a changed
// readiness becomes a new stamped version behind an unsigned discovery pointer. Same discipline as
// the hub-cards index (#2865); run by `npm run test:readers` (scripts/surface/*.node-test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs, { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertNotStamped, checkCurrent, contentDigest, readStamped, resolveCurrent, writeVersioned, DEFAULT_OUT }
  from "../build-mill-receipt-readiness.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const OTS_HEADER = Buffer.from("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294", "hex");
/** Header-only detached proof committing to the file's sha256: enough for the byte binding. */
const fakeStamp = (path) => writeFileSync(path + ".ots", Buffer.concat([OTS_HEADER, Buffer.from([1, 8]),
  Buffer.from(sha(readFileSync(path)), "hex"), Buffer.from("pending-test")]), { flag: "wx" });
const docWith = (ids) => ({ schema: "csoai.mill-receipt-readiness/v2", derived_from: "fixture", truth_rule: "states stay separate",
  counts: { receipts: ids.length }, receipts: ids.map((id) => ({ id, card_url: `/interop/mill-cards-signed/${id}.json` })) });
const NOW = new Date("2026-10-07T01:02:03.000Z");
const snapshot = (dir) => Object.fromEntries(readdirSync(dir).sort().map((f) => [f, sha(readFileSync(join(dir, f)))]));
const POINTER = "mill-receipt-readiness-latest.json";

function stampedFixture() {
  const root = mkdtempSync(join(tmpdir(), "mill-readiness-ver-"));
  const out = join(root, "mill-receipt-readiness.json");
  writeFileSync(out, JSON.stringify(docWith(["a"]), null, 2) + "\n");
  fakeStamp(out);
  return { root, out };
}

test("(a) a changed readiness writes a new stamped version and leaves the stamped snapshot byte-identical", () => {
  const { root, out } = stampedFixture();
  try {
    const before = snapshot(root);
    assert.throws(() => checkCurrent(out, docWith(["b"])), /stale.*--version/s);
    assert.deepEqual(snapshot(root), before, "the check mode wrote nothing on changed content");
    const result = writeVersioned(out, docWith(["b"]), { stamp: fakeStamp, now: NOW });
    assert.equal(result.state, "VERSIONED");
    assert.equal(result.file, `mill-receipt-readiness-2026-10-07-${contentDigest(docWith(["b"])).slice(0, 12)}.json`);
    const after = snapshot(root);
    assert.equal(after["mill-receipt-readiness.json"], before["mill-receipt-readiness.json"]);
    assert.equal(after["mill-receipt-readiness.json.ots"], before["mill-receipt-readiness.json.ots"]);
    assert.ok(after[`${result.file}.ots`], "the new version carries its own proof");
    const version = readStamped(root, result.file);
    assert.equal(version.doc.as_of, NOW.toISOString());
    assert.equal(version.doc.content_sha256, contentDigest(docWith(["b"])));
    assert.equal(version.doc.supersedes.index_url, "/interop/mill-receipt-readiness.json");
    const pointer = JSON.parse(readFileSync(join(root, POINTER), "utf8"));
    assert.equal(pointer.kind, "DISCOVERY_POINTER_ONLY");
    assert.equal(pointer.index_url, `/interop/${result.file}`);
    assert.equal(pointer.index_sha256, version.sha256);
    assert.equal(pointer.content_sha256, version.content_sha256);
    assert.deepEqual(pointer.versions.map((v) => v.index_url), ["/interop/mill-receipt-readiness.json", `/interop/${result.file}`]);
    // Version metadata is not content: the check now passes through the pointer and writes nothing.
    const settled = snapshot(root);
    assert.equal(checkCurrent(out, docWith(["b"])).file, result.file);
    assert.deepEqual(snapshot(root), settled);
    // Content that returns to an earlier stamped version re-points; no new file, no new proof.
    assert.equal(writeVersioned(out, docWith(["a"]), { stamp: fakeStamp, now: NOW }).state, "REPOINTED");
    assert.equal(JSON.parse(readFileSync(join(root, POINTER), "utf8")).index_url, "/interop/mill-receipt-readiness.json");
    assert.equal(Object.keys(snapshot(root)).length, Object.keys(settled).length);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(b) unchanged readiness writes nothing new, in check and --version modes", () => {
  const { root, out } = stampedFixture();
  try {
    const before = snapshot(root);
    assert.deepEqual(checkCurrent(out, docWith(["a"])), { state: "PRESERVED_STAMPED", file: "mill-receipt-readiness.json", count: 1 });
    assert.deepEqual(snapshot(root), before);
    let stamped = 0;
    assert.equal(writeVersioned(out, docWith(["a"]), { stamp: () => { stamped++; } }).state, "POINTER_WRITTEN");
    const withPointer = snapshot(root);
    assert.deepEqual(Object.keys(withPointer).filter((f) => !(f in before)), [POINTER]);
    assert.equal(writeVersioned(out, docWith(["a"]), { stamp: () => { stamped++; } }).state, "UNCHANGED");
    assert.equal(checkCurrent(out, docWith(["a"])).state, "PRESERVED_STAMPED");
    assert.deepEqual(snapshot(root), withPointer);
    assert.equal(stamped, 0, "nothing was stamped");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("(c) a stamped file cannot be edited, a failed stamp releases nothing, and in-place edits fail closed", () => {
  const { root, out } = stampedFixture();
  try {
    assert.throws(() => assertNotStamped(out), /never rewritten/);
    const v = writeVersioned(out, docWith(["b"]), { stamp: fakeStamp, now: NOW });
    assert.throws(() => assertNotStamped(join(root, v.file)), /never rewritten/);
    const before = snapshot(root);
    assert.throws(() => writeVersioned(out, docWith(["c"]), { stamp: () => { throw new Error("calendars down"); }, now: NOW }),
      /nothing was released/);
    assert.throws(() => writeVersioned(out, docWith(["c"]), { stamp: (p) => writeFileSync(p + ".ots", "not a proof"), now: NOW }),
      /nothing was released/);
    assert.deepEqual(snapshot(root), before);
    assert.throws(() => writeVersioned(out, docWith(["c"])), /needs a stamper/);
    // Editing stamped bytes in place is caught on the next run, in either mode.
    const versioned = join(root, v.file);
    writeFileSync(versioned, readFileSync(versioned, "utf8") + " ");
    assert.throws(() => checkCurrent(out, docWith(["b"])), /does not commit to the bytes/);
    assert.throws(() => writeVersioned(out, docWith(["b"]), { stamp: fakeStamp, now: NOW }), /does not commit to the bytes/);
    rmSync(join(root, POINTER));
    writeFileSync(out, readFileSync(out, "utf8") + " ");
    assert.throws(() => checkCurrent(out, docWith(["a"])), /does not commit to the bytes/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("nothing stamped at all fails closed with the recipe; --version then stamps a first version", () => {
  const root = mkdtempSync(join(tmpdir(), "mill-readiness-empty-"));
  try {
    const out = join(root, "mill-receipt-readiness.json");
    assert.throws(() => checkCurrent(out, docWith(["a"])), /no stamped mill receipt readiness.*--version/s);
    const v = writeVersioned(out, docWith(["a"]), { stamp: fakeStamp, now: NOW });
    assert.equal(v.state, "VERSIONED");
    assert.equal(readStamped(root, v.file).doc.supersedes, null);
    assert.equal(checkCurrent(out, docWith(["a"])).file, v.file);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("the pointer is bound to the file bytes AND to their content: each hash and the count are checked on their own", () => {
  const { root, out } = stampedFixture();
  try {
    const v = writeVersioned(out, docWith(["b"]), { stamp: fakeStamp, now: NOW });
    const pointerPath = join(root, POINTER);
    const pointer = JSON.parse(readFileSync(pointerPath, "utf8"));
    const legacy = readStamped(root, "mill-receipt-readiness.json");
    assert.equal(resolveCurrent(out).name, v.file);
    for (const [field, value] of [["index_sha256", legacy.sha256], ["content_sha256", legacy.content_sha256], ["count", 9]]) {
      assert.notEqual(pointer[field], value);
      writeFileSync(pointerPath, JSON.stringify({ ...pointer, [field]: value }, null, 2) + "\n");
      assert.throws(() => checkCurrent(out, docWith(["b"])), /disagrees with the bytes/, `${field} is not checked`);
      assert.throws(() => writeVersioned(out, docWith(["b"]), { stamp: fakeStamp, now: NOW }), /disagrees with the bytes/, `${field} is not checked in --version`);
    }
    for (const url of ["/interop/../secrets.json", "/interop/other.json", "/elsewhere/mill-receipt-readiness.json"]) {
      writeFileSync(pointerPath, JSON.stringify({ ...pointer, index_url: url }));
      assert.throws(() => checkCurrent(out, docWith(["b"])), /malformed/);
    }
    writeFileSync(pointerPath, JSON.stringify({ ...pointer, schema: "csoai.mill-receipt-readiness-pointer/0" }));
    assert.throws(() => checkCurrent(out, docWith(["b"])), /malformed/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a new version is create-only: a file that appears between the scan and the write is never overwritten", () => {
  const { root, out } = stampedFixture();
  const name = `mill-receipt-readiness-2026-10-07-${contentDigest(docWith(["b"])).slice(0, 12)}.json`;
  writeFileSync(join(root, name), "another writer's bytes\n");
  const realReaddir = fs.readdirSync;
  fs.readdirSync = (dir, ...rest) => realReaddir(dir, ...rest).filter((f) => f !== name);
  syncBuiltinESMExports();
  try {
    let stamped = 0;
    assert.throws(() => writeVersioned(out, docWith(["b"]), { stamp: (p) => { stamped++; fakeStamp(p); }, now: NOW }), { code: "EEXIST" });
    assert.equal(readFileSync(join(root, name), "utf8"), "another writer's bytes\n");
    assert.equal(stamped, 0, "nothing was stamped");
  } finally {
    fs.readdirSync = realReaddir;
    syncBuiltinESMExports();
    rmSync(root, { recursive: true, force: true });
  }
});

test("the committed pointer resolves to a stamped file whose proof commits to its bytes", () => {
  const current = resolveCurrent(DEFAULT_OUT);
  assert.ok(current, "a stamped readiness file is published");
  assert.equal(current.doc.counts.receipts, current.doc.receipts.length);
});
