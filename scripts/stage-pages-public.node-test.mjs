import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { includePublicPath, stagePagesPublic } from "./stage-pages-public.mjs";

test("filter excludes only the top-level proofs tree", () => {
  const root = "/repo/public";
  assert.equal(includePublicPath(root, root), true);
  assert.equal(includePublicPath(root + "/root.json", root), true);
  assert.equal(includePublicPath(root + "/proofs", root), false);
  assert.equal(includePublicPath(root + "/proofs/a.ots", root), false);
  assert.equal(includePublicPath(root + "/archive/proofs/readme.json", root), true);
  assert.equal(includePublicPath("/outside", root), false);
});

test("staging copies public bytes and never copies proofs", (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "csoai-stage-public-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const src = join(fixture, "public");
  const dest = join(fixture, "dist", "client");
  mkdirSync(join(src, "proofs"), { recursive: true });
  mkdirSync(join(src, "archive", "proofs"), { recursive: true });
  writeFileSync(join(src, "root.json"), '{"ok":true}\n');
  writeFileSync(join(src, "proofs", "old.ots"), "excluded");
  writeFileSync(join(src, "archive", "proofs", "note.json"), '{"historical":true}\n');
  stagePagesPublic(src, dest);
  assert.equal(readFileSync(join(dest, "root.json"), "utf8"), '{"ok":true}\n');
  assert.equal(existsSync(join(dest, "proofs")), false);
  assert.equal(
    readFileSync(join(dest, "archive", "proofs", "note.json"), "utf8"),
    '{"historical":true}\n',
  );
});

test("staging refuses overlapping source and destination", (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "csoai-stage-overlap-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const src = join(fixture, "public");
  mkdirSync(src, { recursive: true });
  assert.throws(() => stagePagesPublic(src, join(src, "dist")));
  assert.throws(() => stagePagesPublic(src, fixture));
});
